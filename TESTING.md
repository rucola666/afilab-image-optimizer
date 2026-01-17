# Testing Guide for Image Optimizer

This project currently relies on manual testing. Follow the steps below to verify the application's functionality.

## Prerequisites

- Node.js installed (v18+ recommended)
- Dependencies installed (`npm install`)

## Running the Development Server

1. Open your terminal in the project directory.
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open the URL provided (usually `http://localhost:5173`) in your web browser.

## Manual Test Cases

### 1. Basic Image Upload & DPI
- **Action**: Drag and drop an image (JPG or PNG) onto the drop zone.
- **Expected Result**: 
  - The drop zone disappears/changes to editor view.
  - The original image preview is shown.
  - The original size and type are displayed correctly.
  - **New**: The "DPI" field shows a value (e.g., 72, 96, 300) or "N/A (72 default)".
  - Validation: Ensure the file inputs accept only images.

### 2. Optimization Process & DPI Result
- **Action**: Adjust the "Quality" slider and click "Applica Modifiche".
- **Expected Result**:
  - The "Result Preview" updates.
  - The new file size is calculated.
  - The "Savings" percentage is updated.
  - **New**: The Result DPI field updates.

### 3. Format Conversion
- **Action**: Change the "Format" dropdown (e.g., from JPG to WebP/PNG) and click "Applica Modifiche".
- **Expected Result**:
  - The output image should be in the selected format.
  - The download filename should have the validation extension.

### 4. Resizing & Aspect Ratio
- **Action**: 
  - Ensure the "Link" icon between Width and Height is active (blue/highlighted).
  - Change "Width".
- **Expected Result**: 
  - "Height" updates automatically to maintain ratio.
- **Action**: Click the "Link" icon to disable it, then change Width.
- **Expected Result**: 
  - Height does NOT change.
  - Final image has the exact dimensions entered (may look stretched if aspect ratio is broken).

### 5. Upscaling Warning
- **Action**: Increase the Width to LARGER than original (e.g., 1024px -> 2000px).
- **Expected Result**: 
  - A yellow warning message appears: "⚠ Attenzione: Stai upscalando!...".
- **Action**: Reduce Width below original (e.g. 500px).
- **Expected Result**: 
  - Warning DISAPPEARS.

### 6. Download & Renaming
- **Action**: Click the "Download" button.
- **Expected Result**:
  - The file downloads.
  - The output DPI in the interface says "72".
  - The dimensions stored in the file match the active inputs.

## Automated Testing (Future)
Currently, there are no automated unit or E2E tests. 
Potential tools to add:
- **Vitest**: For unit testing utility functions.
- **Playwright/Cypress**: For end-to-end browser testing.
