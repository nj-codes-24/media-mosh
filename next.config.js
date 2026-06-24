/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── 1. Build & Caching Optimization (Vercel) ───
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: false, // Prevents memory bloat during Vercel builds

  // Exclude heavy WASM and Node binaries from the serverless function trace.
  // Since this app processes everything on the client, the backend API
  // does not need to bundle FFmpeg or ONNX Node binaries, preventing the 50MB Vercel limit.
  outputFileTracingExcludes: {
    '*': [
      'node_modules/onnxruntime-node/**/*',
      'node_modules/@ffmpeg/core*/**/*',
      'node_modules/@imgly/**/*',
    ],
  },

  // ─── 2. Cross-Origin Headers for SharedArrayBuffer (FFmpeg Multi-threading) ───
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          // 'require-corp' is strictly required by Safari & Firefox for SharedArrayBuffer.
          // 'credentialless' works in Chromium, but breaks across other engines.
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
        ],
      },
      {
        // Cache heavy static assets (Models, WASM) for a full year
        source: '/models/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/pdfjs/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      }
    ];
  },

  // ─── 3. Webpack overrides for WASM & ONNX ───
  webpack: (config, { isServer }) => {
    // Enable WebAssembly experiments
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // VERCEL BUILD FIX: Prevents Terser from crashing on `import.meta` in ONNX WebGPU
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: { fullySpecified: false },
    });

    // ONNX Runtime Resolution Fix: Stop Webpack from transforming dynamic import.meta URLs
    config.module.rules.push({
      test: /node_modules[\\/]onnxruntime-web/,
      parser: { url: false },
    });

    // Native WASM Loading Rule
    // We exclude ONNX because it fetches its own WASM files at runtime.
    config.module.rules.push({
      test: /\.wasm$/,
      exclude: /node_modules[\\/]onnxruntime/,
      type: 'asset/resource',
    });

    // Ignore .onnx model files during Webpack bundling, they are loaded statically from /public
    config.module.rules.push({
      test: /\.onnx$/,
      type: 'asset/resource',
    });

    // Client-side execution fallbacks
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-node': false,
        sharp: false,
        fs: false,
        path: false,
        crypto: false,
        canvas: false,
      };

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
      };

      config.output = {
        ...config.output,
        workerChunkLoading: 'import-scripts', // Required for Web Workers in Next.js
      };
    }

    // Server-side exclusions
    if (isServer) {
      config.externals.push({
        sharp: 'commonjs sharp',
        'onnxruntime-node': 'commonjs onnxruntime-node',
        'onnxruntime-web': 'commonjs onnxruntime-web',
        '@ffmpeg/ffmpeg': 'commonjs @ffmpeg/ffmpeg',
        '@ffmpeg/util': 'commonjs @ffmpeg/util',
      });
    }

    // Handle 'node:' protocol imports for older packages
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:path': require.resolve('path'),
      'node:fs': false,
      'node:url': false,
      'node:os': false,
      canvas: false,
    };

    return config;
  },
};

module.exports = nextConfig;