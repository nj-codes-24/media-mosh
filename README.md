<div align="center">
  <br />
  <!-- Placeholder for a stunning, glassmorphic banner image -->
  <!-- <img src="docs/banner.png" alt="Media Mosh Banner" width="100%" /> -->
  <h1>🎨 Media Mosh</h1>
  <p><strong>A zero-server, completely local-first AI media processing suite.</strong></p>
  
  <p>
    <a href="https://github.com/nj-codes-24/media-mosh/commits/main"><img src="https://img.shields.io/github/last-commit/nj-codes-24/media-mosh?style=flat-square&color=06b6d4" alt="Last Commit"></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react" alt="React"></a>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js"></a>
    <a href="https://onnxruntime.ai/"><img src="https://img.shields.io/badge/ONNX_Runtime-WebGPU-purple?style=flat-square" alt="ONNX"></a>
    <a href="https://ffmpegwasm.netlify.app/"><img src="https://img.shields.io/badge/FFmpeg-WASM-green?style=flat-square" alt="FFmpeg WASM"></a>
  </p>
</div>

---

## 🚀 Overview

**Media Mosh** is a tier-1, production-ready web application that brings heavy computational workloads directly to the browser. Built to push the boundaries of edge-computing, it leverages **WebAssembly (WASM)**, **WebGPU**, and **ONNX** to execute AI inference, video encoding, and image processing securely on the user's local machine—meaning zero server costs, absolute privacy, and instant reactivity.

Featuring a hyper-modern, glassmorphic UI, Media Mosh is designed to be as visually stunning as it is technologically complex.

---

## ✨ Features & Engineering Feats

- 🧠 **In-Browser AI Processing (ONNX & WebGPU):** 
  Executes complex machine learning models directly in the browser. Features like Semantic Background Removal and Whisper Audio Transcription dynamically leverage hardware-accelerated WebGPU when available, seamlessly falling back to WASM (CPU) on older devices.
- ⚡ **FFmpeg WASM Encoding:** 
  Splits, transcodes, and processes audio and video locally utilizing concurrent Web Workers, entirely bypassing the need for an external rendering server.
- 🔒 **Zero-Server Architecture (Privacy First):** 
  Your media never leaves your device. All processing happens securely within the client sandbox.
- 🛡️ **SSRF-Protected Proxy:** 
  Equipped with a highly secure, rate-limited, and chunk-streamed proxy endpoint to fetch CORS-blocked images. Mitigates OOM DoS vulnerabilities via strict byte-level stream cancellation.
- 💅 **Glassmorphic & Micro-Animated UI:** 
  A deeply immersive user experience crafted with `framer-motion` and custom CSS, providing highly responsive interactions and fluid layouts.

---

## 🏗️ System Architecture

Media Mosh is architected for extreme resilience and performance.

### Local Processing Pipeline
Media files are parsed into local Blob/Object URLs and funneled directly into dedicated `src/processors/`. 
- **Graceful Degradation:** The AI models attempt to initialize via the `webgpu` execution provider. If the client hardware lacks support, the system catches the initialization error and seamlessly degrades to the `wasm` provider.
- **Race-Condition Safety:** Heavy WASM processing (like FFmpeg) utilizes mutex locking during rapid multi-file encoding, preventing memory leaks and execution collisions.

### Workspace State Management
Instead of a monolithic "God Component," the UI is cleanly decoupled:
- Complex UI trees (`AudioPreview`, `PdfPreview`, `MediaDropzone`) are extracted and drill isolated state.
- Component lifecycle management strictly revokes massive Object URLs upon unmount to ensure a leak-free memory profile.

---

## 📸 Interface Preview

*(Coming soon: Placeholders for high-fidelity GIFs and Screenshots)*

| Audio Splitting & Transcription | AI Background Removal |
|:---:|:---:|
| <!-- <img src="docs/audio-preview.gif" width="400"/> --> *A sleek waveform player with real-time Whisper transcription.* | <!-- <img src="docs/bg-remove.png" width="400"/> --> *WebGPU accelerated segmentation using the ONNX runtime.* |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router), React 18
- **Styling:** TailwindCSS, Framer Motion, Lucide Icons
- **WebAssembly Core:** `@ffmpeg/ffmpeg`, `pdf.js`
- **AI Core:** `onnxruntime-web`, `@imgly/background-removal`, `@ricky0123/vad-web`
- **Languages:** TypeScript (Strict Mode Enabled)

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+`
- A browser with WebGPU support enabled (Chrome/Edge 113+) for optimal AI speeds.

### Installation

```bash
# Clone the repository
git clone https://github.com/nj-codes-24/media-mosh.git
cd media-mosh

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) to see the magic.

---

## 🤝 Contributing

We welcome contributions from the community! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for strict guidelines on code formatting, architectural rules, and our pull request process.

## 📄 License
This project is open-source and available under the MIT License.
