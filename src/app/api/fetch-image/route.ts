import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// SECURITY: URL validation to prevent SSRF attacks
// ---------------------------------------------------------------------------

/** Only allow HTTP(S) schemes — blocks file://, data:, ftp://, etc. */
const ALLOWED_SCHEMES = ['http:', 'https:'];

/**
 * Returns true if the hostname resolves to a private/reserved IP range.
 * We check the hostname string itself (covers most cases for literal IPs)
 * and common DNS names that resolve to loopback.
 */
function isPrivateHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  // Loopback
  if (lower === 'localhost' || lower === '127.0.0.1' || lower === '::1' || lower === '[::1]') {
    return true;
  }

  // Strip brackets from IPv6
  const bare = lower.replace(/^\[|\]$/g, '');

  // IPv4 private ranges
  if (/^10\./.test(bare)) return true;                          // 10.0.0.0/8
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(bare)) return true;    // 172.16.0.0/12
  if (/^192\.168\./.test(bare)) return true;                    // 192.168.0.0/16
  if (/^169\.254\./.test(bare)) return true;                    // Link-local (AWS IMDS)
  if (/^0\./.test(bare)) return true;                           // 0.0.0.0/8
  if (/^127\./.test(bare)) return true;                         // 127.0.0.0/8

  // IPv6 private
  if (bare.startsWith('fc') || bare.startsWith('fd')) return true;  // Unique local
  if (bare.startsWith('fe80')) return true;                          // Link-local

  // Metadata service endpoints
  if (bare === 'metadata.google.internal') return true;

  return false;
}

/**
 * Validates and sanitises a user-supplied URL.
 * Throws descriptive errors for invalid input.
 */
function validateUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('Invalid URL format.');
  }

  if (!ALLOWED_SCHEMES.includes(parsed.protocol)) {
    throw new Error(`Unsupported URL scheme "${parsed.protocol}". Only HTTP and HTTPS are allowed.`);
  }

  if (isPrivateHostname(parsed.hostname)) {
    throw new Error('URLs pointing to private or internal network addresses are not allowed.');
  }

  return parsed;
}

/** Maximum time (ms) to wait for the remote server to respond. */
const FETCH_TIMEOUT_MS = 10_000;

/** Maximum response body size (bytes) — 25 MB */
const MAX_BODY_BYTES = 25 * 1024 * 1024;

async function safeFetch(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'MediaMosh/1.0 ImageFetcher' },
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // Validate the user-supplied URL before making any request
    const validatedUrl = validateUrl(rawUrl);

    const response = await safeFetch(validatedUrl.href);
    if (!response.ok) {
      throw new Error(`Remote server returned ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';

    // 1. IF IT'S ALREADY AN IMAGE, RETURN IT DIRECTLY
    if (contentType.startsWith('image/')) {
      const blob = await response.blob();
      if (blob.size > MAX_BODY_BYTES) {
        throw new Error('Image exceeds the 25 MB size limit.');
      }
      return new NextResponse(blob, {
        headers: {
          'Content-Type': blob.type,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 2. IF IT IS A WEBPAGE, SCAN FOR THE MAIN IMAGE (Open Graph)
    if (contentType.includes('text/html')) {
      const html = await response.text();
      
      let imageUrl: string | null = null;
      const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || 
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      
      if (ogMatch && ogMatch[1]) {
        imageUrl = ogMatch[1];
      }
      
      if (!imageUrl) {
        return NextResponse.json(
          { error: 'Could not find a main image on this page. Try right-clicking the image and choosing "Copy image address".' }, 
          { status: 400 }
        );
      }

      // Sometimes websites use relative URLs. Make it absolute.
      if (imageUrl.startsWith('/')) {
        imageUrl = `${validatedUrl.protocol}//${validatedUrl.host}${imageUrl}`;
      }

      // Validate the extracted image URL (prevents SSRF via OG tag injection)
      const validatedImageUrl = validateUrl(imageUrl);

      const imageResponse = await safeFetch(validatedImageUrl.href);
      if (!imageResponse.ok) throw new Error('Failed to fetch the extracted image from the webpage.');
      
      const imageContentType = imageResponse.headers.get('content-type') || '';
      if (!imageContentType.startsWith('image/')) {
        throw new Error('The extracted link was not a valid image.');
      }

      const blob = await imageResponse.blob();
      if (blob.size > MAX_BODY_BYTES) {
        throw new Error('Image exceeds the 25 MB size limit.');
      }

      return new NextResponse(blob, {
        headers: {
          'Content-Type': blob.type,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 3. IF IT'S NEITHER
    return NextResponse.json(
      { error: 'Unsupported link. Please provide an image link or a webpage with a preview image.' }, 
      { status: 400 }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process URL';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}