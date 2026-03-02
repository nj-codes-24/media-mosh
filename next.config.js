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
    // ─── VERCEL BUILD FIX (Fixes Terser import.meta crash in ONNX WebGPU) ───
    config.module.rules.push({
      test: /\.m?js$/,
      type: "javascript/auto",
      resolve: {
        fullySpecified: false,
      },
    });

    // ─── FIX: Stop Webpack from transforming URL patterns in onnxruntime-web ──
    // onnxruntime-web uses `new URL('./file.wasm', import.meta.url)` to resolve
    // its WASM files at runtime. Without `parser.url: false`, Webpack replaces
    // the URL with a module object reference → "url.replace is not a function".
    // The javascript/auto rule above is still needed for Terser compatibility.
    config.module.rules.push({
      test: /node_modules[\\/]onnxruntime-web/,
      parser: {
        url: false,
      },
    });

    // ─── WASM Support (Required for FFmpeg & AI Processors) ─────────────────
    // IMPORTANT: Exclude onnxruntime-web's .wasm files from the asset/resource
    // rule. onnxruntime-web resolves its own WASM files at runtime via
    // import.meta.url. Treating them as asset/resource causes Webpack to turn
    // them into module objects, breaking "url.replace is not a function".
    config.module.rules.push({
      test: /\.wasm$/,
      exclude: /node_modules[\\/]onnxruntime/,
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