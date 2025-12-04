# Project Specification: Client-Side PDF Tools

## 1. Role & Objective
**Role**: Act as a Senior Frontend Architect and UI/UX Designer specialized in high-performance web applications.
**Objective**: Develop a modern, privacy-first PDF manipulation tool that runs entirely in the browser (Client-Side).
**Constraint**: NO server-side processing. All PDF operations must be performed locally using JavaScript/WebAssembly.

## 2. Tech Stack Specification
* **Core Framework**: Vue 3 (Composition API, `<script setup>`)
* **Language**: TypeScript (Strict mode)
* **Build Tool**: Vite
* **Styling**: Tailwind CSS (v3.0+)
* **Icons**: Lucide-vue-next or Heroicons
* **PDF Engine**: `pdf-lib` (for PDF manipulation)
* **Concurrency**: Native Web Workers (to prevent main thread blocking)
* **State Management**: Pinia (for managing app state and theme)

## 3. UI/UX Design System
* **Aesthetic**: "Modern Minimalist" (Clean, spacious, utilizing whitespace). Similar to Vercel or Stripe dashboard aesthetics.
* **Theme**: Dual support for **Light Mode** and **Dark Mode**.
    * *Implementation*: Use Tailwind's `dark:` modifier.
    * *Default*: Auto-detect system preference, with a manual toggle in the navbar.
* **Responsiveness**: Fully responsive layout (Mobile, Tablet, Desktop).
* **Feedback**:
    * Loading spinners/Progress bars during PDF processing.
    * Toast notifications for success/errors (e.g., "File encrypted", "Merge complete").

## 4. Core Features & Functional Requirements

### Feature A: PDF Splitter
* **Input**: User uploads a single PDF file via Drag & Drop or File Picker.
* **Interaction**:
    * Parse the PDF and render thumbnails for each page (render low-res thumbnails using `pdf.js` for preview if necessary, or simple page number boxes if performance is tight).
    * Allow users to select specific pages to extract.
* **Output**: Download a new PDF containing only the selected pages.

### Feature B: PDF Merger
* **Input**: User uploads multiple PDF files.
* **Interaction**:
    * Display files as a sortable list or grid.
    * Allow users to drag and drop to reorder the sequence.
    * Allow deleting an uploaded file before merging.
* **Output**: Download a single merged PDF file respecting the user's defined order.

### Feature C: Image to PDF Converter
* **Input**: User uploads image files (JPG, PNG).
* **Interaction**:
    * Display image previews.
    * Allow reordering images.
    * *Option*: Fit image to page OR Standard A4 size with margins.
* **Output**: Download a single PDF where each image occupies one page.

## 5. Technical Implementation Strategy (Critical)

### 5.1 Performance & Threading (The "Web Worker" Requirement)
* **Problem**: PDF manipulation (especially binary parsing and repacking) is CPU-intensive. Running this on the main thread will freeze the UI, causing a bad user experience.
* **Solution**:
    * Create a dedicated Web Worker file (e.g., `pdf.worker.ts`).
    * Move all `pdf-lib` operations (`load`, `copyPages`, `addPage`, `save`) inside this worker.
    * The main Vue component should only handle UI state and communicate with the worker via messaging (postMessage).

### 5.2 Memory Management
* **Problem**: Large PDFs can cause Browser OOM (Out of Memory) crashes.
* **Strategy**:
    * Avoid keeping the full Base64 string of files in the Reactive State.
    * Use `ArrayBuffer` or `Blob` references.
    * Implement a check for file size limits (e.g., warn user if total size > 500MB, though browser limits vary).

### 5.3 Error Handling (Edge Cases)
* **Encrypted PDFs**:
    * When loading a PDF, wrap the `PDFDocument.load()` in a try-catch block.
    * If the error indicates "Encrypted" or "Password Required", prompt the user via a UI modal to enter the password, then retry.
* **Corrupt Files**: Gracefully handle invalid files with a user-friendly error toast.

## 6. Development Step-by-Step Plan

### Phase 1: Scaffolding
1.  Initialize Vue 3 + Vite + TypeScript project.
2.  Install Tailwind CSS and configure `tailwind.config.js` for dark mode (`class` strategy).
3.  Set up the basic Layout (Navbar with Theme Toggle, Main Content Area, Footer).

### Phase 2: The Logic Core (Web Worker)
1.  Setup the Web Worker infrastructure.
2.  Implement `pdf-lib` logic inside the worker for:
    * `mergePdfs(arrays: ArrayBuffer[])`
    * `splitPdf(pdfBuffer: ArrayBuffer, pageIndices: number[])`
    * `imagesToPdf(images: ArrayBuffer[])`

### Phase 3: Feature Implementation
1.  **Merge View**: File upload zone, list rendering, drag-and-drop logic, "Merge" button triggering the worker.
2.  **Split View**: File upload, page grid generation, selection logic, "Extract" button.
3.  **IMG2PDF View**: Image upload, reordering, conversion logic.

### Phase 4: Polish
1.  Add transitions/animations for file list items.
2.  Ensure Dark Mode looks consistent (checking contrasts).
3.  Test with a 100MB+ PDF file to ensure UI remains responsive.

---

**Output Requirement**:
Please generate the project structure and the core code for the **Web Worker implementation** and the **Vue Composable** used to interact with it, as these are the most complex parts.