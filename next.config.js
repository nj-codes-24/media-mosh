/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Stability Settings
  reactStrictMode: false,
  output: undefined,

  // 2. REQUIRED HEADERS: Keeps FFmpeg, WebCodecs, and AI tools working
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
  },

  webpack: (config, { isServer }) => {
    // ─── WASM Support (Required for FFmpeg & AI Processors) ─────────────────
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // ─── Web Worker Support ──────────────────────────────────────────────────
    // This is the critical fix: tells Webpack 5 how to bundle .ts worker files
    // when they are referenced via `new Worker(new URL('./file.ts', import.meta.url))`
    config.module.rules.push({
      // Match any file ending in Worker.ts or worker.ts
      test: /Worker\.ts$/,
      use: [
        {
          // Use ts-loader (or babel-loader) inside the worker bundle
          loader: 'ts-loader',
          options: {
            // Don't type-check workers — just transpile (faster)
            transpileOnly: true,
          },
        },
      ],
    });

    // ─── Browser / Client Build Rules ───────────────────────────────────────
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Ignore Node.js-only packages in the browser
        'onnxruntime-node': false,
        sharp: false,
        fs: false,
        path: false,
        crypto: false,
        // ─── PDFJS FIX: prevent crash on optional native canvas module ───
        canvas: false,
      };

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
      };

      // ── CRITICAL: Teach Webpack how to handle `new Worker(new URL(...))` ──
      // Without this, the worker URL resolves to undefined at runtime and the
      // Worker constructor throws immediately, making it look like the original
      // video is "returned instantly" (nothing was processed).
      config.output = {
        ...config.output,
        // Ensures worker chunks get a stable, loadable URL
        workerChunkLoading: 'import-scripts',
      };
    }

    // ─── Server Build Rules ──────────────────────────────────────────────────
    if (isServer) {
      config.externals.push({
        sharp: 'commonjs sharp',
        'onnxruntime-node': 'commonjs onnxruntime-node',
        '@ffmpeg/ffmpeg': 'commonjs @ffmpeg/ffmpeg',
        '@ffmpeg/util': 'commonjs @ffmpeg/util',
      });
    }

    // ─── Prevent Webpack from statically resolving dynamic AI imports ─────────
    // @xenova/transformers loads ONNX/WASM files dynamically at runtime.
    // Without this, Webpack tries to bundle them and throws "module not found".
    config.module.rules.push({
      test: /node_modules\/@xenova\/transformers/,
      type: 'javascript/auto',
    });

    // Handle 'node:' protocol imports used by newer ONNX runtime versions
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:path': require.resolve('path'),
      'node:fs': false,
      'node:url': false,
      'node:os': false,
      // ─── PDFJS FIX: prevent crash on optional native canvas module ───
      canvas: false,
    };

    return config;
  },
};

module.exports = nextConfig;