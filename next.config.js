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
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    // ─── VERCEL BUILD FIX (Fixes Terser import.meta crash) ──────────────────
    // IMPORTANT: Exclude onnxruntime-web so its import.meta.url is NOT rewritten.
    // The generic javascript/auto rule breaks onnxruntime-web's internal
    // URL resolution, causing "url.replace is not a function" at runtime.
    config.module.rules.push({
      test: /\.m?js$/,
      exclude: /node_modules[\\/]onnxruntime/,
      type: "javascript/auto",
      resolve: {
        fullySpecified: false,
      },
    });

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
    config.module.rules.push({
      test: /Worker\.ts$/,
      use: [
        {
          loader: 'ts-loader',
          options: { transpileOnly: true },
        },
      ],
    });

    // ─── Browser / Client Build Rules ───────────────────────────────────────
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
        workerChunkLoading: 'import-scripts',
      };
    }

    // ─── Server Build Rules ──────────────────────────────────────────────────
    if (isServer) {
      config.externals.push({
        sharp: 'commonjs sharp',
        'onnxruntime-node': 'commonjs onnxruntime-node',
        'onnxruntime-web': 'commonjs onnxruntime-web',
        '@ffmpeg/ffmpeg': 'commonjs @ffmpeg/ffmpeg',
        '@ffmpeg/util': 'commonjs @ffmpeg/util',
      });
    }

    // ─── Prevent Webpack from statically resolving dynamic AI imports ────────
    config.module.rules.push({
      test: /node_modules[\\/]@xenova[\\/]transformers/,
      type: 'javascript/auto',
    });

    // Handle 'node:' protocol imports
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