import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';

    // 1. IF IT'S ALREADY AN IMAGE, RETURN IT DIRECTLY
    if (contentType.startsWith('image/')) {
      const blob = await response.blob();
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
      
      // Use Regex to find the <meta property="og:image" content="..."> tag
      let imageUrl = null;
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

      // Sometimes websites use relative URLs (e.g., "/assets/pic.jpg"). We need to make it absolute.
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      }

      // Fetch the extracted image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) throw new Error('Failed to fetch the extracted image from the webpage');
      
      const imageContentType = imageResponse.headers.get('content-type') || '';
      if (!imageContentType.startsWith('image/')) {
          throw new Error('The extracted link was not a valid image');
      }

      const blob = await imageResponse.blob();
      return new NextResponse(blob, {
        headers: {
          'Content-Type': blob.type,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 3. IF IT'S NEITHER (e.g., a PDF or Video link)
    return NextResponse.json(
      { error: 'Unsupported link. Please provide an image link or a webpage with a preview image.' }, 
      { status: 400 }
    );

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process URL' }, { status: 500 });
  }
}