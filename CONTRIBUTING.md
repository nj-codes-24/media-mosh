# Contributing to Media Mosh

Welcome to the **Media Mosh** repository! We are thrilled to have you here. This document outlines the process, conventions, and engineering standards for contributing to this project. 

As a completely client-side, WASM/WebGPU accelerated media processing suite, we hold our codebase to extremely high standards of performance, security, and architectural hygiene.

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18.x` or higher
- `npm` `v9.x` or higher
- A modern browser with WebGPU support enabled (Chrome/Edge 113+, Firefox Nightly) for AI processing.

### Local Development Setup

1. **Fork and Clone:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/media-mosh.git
   cd media-mosh
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000` to view the application.

---

## 🏗️ Architectural Guidelines

Before making changes, please understand the core tenets of our architecture:

1. **Local-First Processing:** 
   Media Mosh is built around zero-server privacy. **Do not** introduce dependencies or features that upload user files to external servers. All AI, FFmpeg, and PDF operations must execute locally via WebAssembly, WebGL, or WebGPU (`onnxruntime-web`).
   
2. **Graceful Degradation:**
   If a user's device does not support WebGPU, your feature must safely fallback to WASM (CPU) processing. 

3. **Memory Management:**
   Media files can be massive. You must proactively manage memory:
   - Always revoke Object URLs (`URL.revokeObjectURL`).
   - Terminate Web Workers and FFmpeg instances when a component unmounts.
   - Avoid unbounded buffering in any proxy routes.

---

## 💅 Code Standards & Naming Conventions

We recently completed a major refactor to modularize the codebase. Please adhere to the following standards:

### 1. Component Structure
- **UI Components:** Place inside `src/components/`.
- **Workspace UI:** All UI specific to the primary processing view belongs in `src/components/workspace/` (e.g., `AudioPreview.tsx`, `MediaDropzone.tsx`).
- **One Feature Per Component:** Avoid creating "God Components." Extract sub-components for specific functionalities.
- **Naming:** Use `PascalCase` for React components (`MyComponent.tsx`). Use `camelCase` for utilities and hooks (`useFFmpeg.ts`, `canvasHelper.ts`).

### 2. Error Handling
- Never reject Promises with raw strings (e.g., `reject("Failed")`).
- Always use native `Error` objects: `reject(new Error("Failed to process file"))`.
- Handle errors gracefully in the UI without unmounting the primary workspace.

### 3. Hygiene
- **No stray logs:** Strip all `console.log`, `console.warn`, and `TODO` comments before submitting a PR.
- Production bundles must be completely clean of debug artifacts.

---

## 🔒 Security Practices

- **API Proxy Security:** Our only backend route is an image-fetching proxy to bypass CORS. If modifying this route, ensure it maintains the strict SSRF validation and streaming byte-limits (max 25MB) to prevent OOM DoS attacks.
- **No `eval` or `dangerouslySetInnerHTML`:** Strict adherence to XSS prevention. 

---

## 🔄 Pull Request Process

1. **Branching Strategy:**
   - Prefix your branches: `feature/`, `bugfix/`, `refactor/`, `docs/`.
   - Example: `feature/add-heic-support`

2. **Commit Messages:**
   We follow [Conventional Commits](https://www.conventionalcommits.org/).
   - `feat: [description]` for new features
   - `fix: [description]` for bug fixes
   - `refactor: [description]` for code structure changes
   - `docs: [description]` for documentation

3. **PR Submission:**
   - Push to your fork and submit a PR against the `main` branch.
   - Include a clear description of the problem solved or feature added.
   - If UI changes are involved, include before/after screenshots.
   - Ensure `npm run build` passes locally with zero warnings.

Thank you for contributing to the future of localized, edge-computing media processing!
