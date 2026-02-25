# Deployment & Production Guide

## 🚀 Deployment Options

MediaProcessor is a static Next.js application that can be deployed to any hosting platform that supports modern web standards.

### ✅ Recommended: Vercel

**Why Vercel?**
- Zero-config deployment
- Automatic HTTPS
- Edge network CDN
- Built-in support for Next.js
- Free tier available

**Deploy Steps:**

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Build the project
npm run build

# 3. Deploy
vercel

# 4. Production deployment
vercel --prod
```

**Environment Configuration:**

No environment variables needed! Everything runs client-side.

### Alternative Platforms

#### Netlify

```bash
# Build command:
npm run build

# Publish directory:
.next

# Required headers in netlify.toml:
[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Embedder-Policy = "require-corp"
```

#### Cloudflare Pages

```bash
# Build command:
npm run build

# Build output directory:
.next

# Add _headers file in public/:
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

#### AWS S3 + CloudFront

```bash
# 1. Build
npm run build
npm run export  # If using static export

# 2. Upload to S3
aws s3 sync out/ s3://your-bucket-name

# 3. Configure CloudFront with headers
# Add response headers policy for COOP and COEP
```

## 🔧 Production Configuration

### Critical Headers

**Required for FFmpeg.wasm (SharedArrayBuffer support):**

```nginx
# Nginx
add_header Cross-Origin-Opener-Policy "same-origin";
add_header Cross-Origin-Embedder-Policy "require-corp";
```

```apache
# Apache
Header set Cross-Origin-Opener-Policy "same-origin"
Header set Cross-Origin-Embedder-Policy "require-corp"
```

```javascript
// Next.js (already in next.config.js)
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
      ],
    },
  ];
}
```

### Performance Headers

```nginx
# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

# Cache WASM files
location ~* \.wasm$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
  add_header Content-Type "application/wasm";
}
```

## 📊 Performance Optimization

### Build Optimization

```bash
# Production build with optimizations
npm run build

# Analyze bundle size
npm install -D @next/bundle-analyzer
```

**next.config.js:**

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... existing config
  
  // Enable SWC minification
  swcMinify: true,
  
  // Compress assets
  compress: true,
  
  // Image optimization
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },
});
```

### Code Splitting

**Dynamic imports for heavy processors:**

```typescript
// Instead of:
import { heavyProcessor } from '@/processors/heavy';

// Use:
const { heavyProcessor } = await import('@/processors/heavy');
```

### CDN Configuration

**FFmpeg WASM files:**

```typescript
// ffmpegHelper.ts
const baseURL = process.env.NODE_ENV === 'production'
  ? 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd'
  : 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
```

### Service Worker (PWA - Optional)

```javascript
// public/sw.js
const CACHE_NAME = 'media-processor-v1';

// Cache FFmpeg WASM files
const STATIC_ASSETS = [
  '/ffmpeg-core.wasm',
  '/ffmpeg-core.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});
```

## 🔍 Monitoring & Analytics

### Error Tracking

**Sentry Integration:**

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

### Performance Monitoring

**Web Vitals:**

```typescript
// app/layout.tsx
export function reportWebVitals(metric: any) {
  console.log(metric);
  
  // Send to analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_category: 'Web Vitals',
    });
  }
}
```

### Usage Analytics (Privacy-Friendly)

```typescript
// lib/analytics.ts
export const trackToolUsage = (toolId: string) => {
  // Use privacy-friendly analytics
  // e.g., Plausible, Simple Analytics
  if (window.plausible) {
    window.plausible('Tool Used', { props: { tool: toolId } });
  }
};
```

## 🔒 Security Hardening

### Content Security Policy

```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "media-src 'self' blob:",
            "worker-src 'self' blob:",
            "connect-src 'self' https://unpkg.com https://cdn.jsdelivr.net"
          ].join('; ')
        }
      ]
    }
  ];
}
```

### Rate Limiting (Client-Side)

```typescript
// lib/rateLimiter.ts
class RateLimiter {
  private requests: number[] = [];
  
  canMakeRequest(limit: number, windowMs: number): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < windowMs);
    
    if (this.requests.length < limit) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }
}

export const processingRateLimiter = new RateLimiter();
```

## 🧪 Testing in Production

### Smoke Tests

```typescript
// tests/smoke.test.ts
describe('Production Smoke Tests', () => {
  it('should load FFmpeg', async () => {
    const { ffmpegHelper } = await import('@/lib/ffmpegHelper');
    await ffmpegHelper.load();
    expect(ffmpegHelper.isLoaded()).toBe(true);
  });
  
  it('should process image', async () => {
    const { CanvasHelper } = await import('@/lib/canvasHelper');
    // ... test processing
  });
});
```

### Load Testing

```bash
# Using Artillery
npm install -g artillery

# Create config
cat > load-test.yml << EOF
config:
  target: 'https://your-domain.com'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'Load homepage'
    flow:
      - get:
          url: '/'
EOF

# Run test
artillery run load-test.yml
```

## 📱 Progressive Web App

### manifest.json

```json
{
  "name": "MediaProcessor",
  "short_name": "MediaProc",
  "description": "Professional client-side media processing",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Offline Support

```javascript
// service-worker.js
const RUNTIME_CACHE = 'runtime-cache-v1';

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    return; // Don't cache API calls
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((response) => {
        return caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 📈 Scaling Considerations

### Database (Optional - for analytics)

If you want to track usage:

```typescript
// Using Vercel KV or Upstash Redis
import { kv } from '@vercel/kv';

export async function trackToolUsage(toolId: string) {
  await kv.incr(`tool:${toolId}:usage`);
}
```

### Edge Functions (Optional)

For future server-side features:

```typescript
// app/api/process/route.ts
export const config = {
  runtime: 'edge',
};

export async function POST(request: Request) {
  // Optional server-side processing
  // for tools that can't run client-side
}
```

## 🐛 Debugging Production Issues

### Source Maps

```javascript
// next.config.js
module.exports = {
  productionBrowserSourceMaps: true, // Enable for debugging
};
```

### Logging

```typescript
// lib/logger.ts
export const logger = {
  error: (message: string, error: Error) => {
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      Sentry.captureException(error);
    } else {
      console.error(message, error);
    }
  },
  
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
};
```

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] CORS headers configured
- [ ] WASM files accessible
- [ ] Error tracking setup
- [ ] Analytics configured (optional)
- [ ] Performance monitoring enabled
- [ ] Security headers configured
- [ ] SEO metadata complete
- [ ] Social media preview images
- [ ] Favicon and PWA icons
- [ ] robots.txt configured
- [ ] sitemap.xml generated
- [ ] HTTPS enabled
- [ ] CDN configured
- [ ] Compression enabled
- [ ] Bundle size optimized
- [ ] Smoke tests passing
- [ ] Load tests completed
- [ ] Cross-browser testing done
- [ ] Mobile testing done
- [ ] Accessibility audit passed

## 🎯 Post-Deployment

### Monitoring

1. **Set up uptime monitoring** (e.g., UptimeRobot, Pingdom)
2. **Configure alerts** for errors and performance issues
3. **Track Core Web Vitals** in production
4. **Monitor bundle size** on each deploy

### Optimization

1. **Review analytics** to see which tools are popular
2. **Optimize loading** for frequently used tools
3. **Add caching** for static assets
4. **Consider WebGPU** for supported tools

### Maintenance

1. **Update dependencies** monthly
2. **Review error logs** weekly
3. **Monitor performance metrics** daily
4. **Test new features** in staging first

---

**Deployment Resources:**

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Platform](https://vercel.com)
- [FFmpeg.wasm Guide](https://ffmpegwasm.netlify.app)
- [Web.dev Performance](https://web.dev/performance/)

Ready to deploy! 🚀
