// Style is loaded via index.html link tag

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const editorContainer = document.getElementById('editor-container');
const originalPreview = document.getElementById('original-preview');
const resultPreview = document.getElementById('result-preview');
const processBtn = document.getElementById('process-btn');
const downloadBtn = document.getElementById('download-btn');

// Info fields
const originalDims = document.getElementById('original-dims');
const originalSize = document.getElementById('original-size');
const originalType = document.getElementById('original-type');
const resultDims = document.getElementById('result-dims');
const resultSize = document.getElementById('result-size');
const savings = document.getElementById('savings');

// Inputs
const formatSelect = document.getElementById('format-select');
const qualitySlider = document.getElementById('quality-slider');
const qualityValue = document.getElementById('quality-value');
const maxWidthInput = document.getElementById('max-width');
const maxHeightInput = document.getElementById('max-height');
const linkAspectData = document.getElementById('link-aspect');
const dpiWarning = document.getElementById('dpi-warning');

let currentFile = null;
let originalDimensions = { width: 0, height: 0 };
let currentAspectRatio = 0;
let isAspectLinked = true;
let originalDpiVal = 72;

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
});

qualitySlider.addEventListener('input', (e) => {
    qualityValue.textContent = Math.round(e.target.value * 100) + '%';
});

// Aspect Ratio Logic
linkAspectData.addEventListener('click', () => {
    isAspectLinked = !isAspectLinked;
    linkAspectData.classList.toggle('active', isAspectLinked);
});

maxWidthInput.addEventListener('input', () => {
    if (isAspectLinked && currentAspectRatio) {
        maxHeightInput.value = Math.round(maxWidthInput.value / currentAspectRatio);
    }
    checkEffectiveDpi();
});

maxHeightInput.addEventListener('input', () => {
    if (isAspectLinked && currentAspectRatio) {
        maxWidthInput.value = Math.round(maxHeightInput.value * currentAspectRatio);
    }
    checkEffectiveDpi();
});

function checkEffectiveDpi() {
    if (!originalDimensions.width) return;

    const targetW = parseInt(maxWidthInput.value);
    if (!targetW || isNaN(targetW)) return;

    // Simple Upscaling Check:
    // If we request more pixels than the original has, we are interpolating (losing quality).
    if (targetW > originalDimensions.width) {
        dpiWarning.classList.remove('hidden');
    } else {
        dpiWarning.classList.add('hidden');
    }
}

processBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    await optimizeImage();
});

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
    }

    currentFile = file;

    // Show Editor
    editorContainer.classList.remove('hidden');

    // Display Original Info
    originalSize.textContent = formatBytes(file.size);
    originalType.textContent = file.type;

    // Get DPI
    originalDpiVal = await getFileDPI(file, true); // true = returns number
    document.getElementById('original-dpi').textContent = originalDpiVal;

    const objectUrl = URL.createObjectURL(file);
    originalPreview.src = objectUrl;

    // Get dimensions
    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
        originalDimensions = { width: img.width, height: img.height };
        originalDims.textContent = `${img.width} x ${img.height}`;

        currentAspectRatio = img.width / img.height;

        // Set default max dimensions
        maxWidthInput.value = img.width;
        maxHeightInput.value = img.height;

        checkEffectiveDpi();
    };
}

// DPI Utility Functions
async function getFileDPI(file, returnNumber = false) {
    if (!file) return returnNumber ? 72 : 'N/A';
    try {
        const buffer = await file.arrayBuffer();
        const arr = new Uint8Array(buffer);
        let dpi = 72;

        if (file.type === 'image/jpeg') {
            // 1. Check for JFIF (APP0)
            for (let i = 0; i < Math.min(arr.length - 8, 4096); i++) {
                if (arr[i] === 0xFF && arr[i + 1] === 0xE0 &&
                    arr[i + 6] === 0x4A && arr[i + 7] === 0x46 && arr[i + 8] === 0x49 && arr[i + 9] === 0x46) {
                    const units = arr[i + 11];
                    const xDensity = (arr[i + 12] << 8) + arr[i + 13];
                    if (units === 1) dpi = xDensity;
                    else if (units === 2) dpi = Math.round(xDensity * 2.54);
                    else dpi = xDensity; // Fallback
                    if (returnNumber) return dpi || 72;
                    return dpi;
                }
            }
            // 2. Check for Exif (APP1)
            for (let i = 0; i < Math.min(arr.length - 8, 4096); i++) {
                if (arr[i] === 0xFF && arr[i + 1] === 0xE1) {
                    if (arr[i + 4] === 0x45 && arr[i + 5] === 0x78 && arr[i + 6] === 0x69 && arr[i + 7] === 0x66) {
                        const tiffStart = i + 10;
                        const littleEndian = arr[tiffStart] === 0x49 && arr[tiffStart + 1] === 0x49;
                        const getShort = (o) => littleEndian ? arr[o] + (arr[o + 1] << 8) : (arr[o] << 8) + arr[o + 1];
                        const getLong = (o) => littleEndian ? arr[o] + (arr[o + 1] << 8) + (arr[o + 2] << 16) + (arr[o + 3] << 24) : (arr[o] << 24) + (arr[o + 1] << 16) + (arr[o + 2] << 8) + arr[o + 3];

                        const ifdOffset = getLong(tiffStart + 4);
                        const numEntries = getShort(tiffStart + ifdOffset);

                        let xRes = null;
                        let resUnit = 2;

                        for (let j = 0; j < numEntries; j++) {
                            const entryOffset = tiffStart + ifdOffset + 2 + (j * 12);
                            const tag = getShort(entryOffset);
                            if (tag === 0x011A) {
                                const offsetVal = getLong(entryOffset + 8);
                                const num = getLong(tiffStart + offsetVal);
                                const den = getLong(tiffStart + offsetVal + 4);
                                xRes = den !== 0 ? Math.round(num / den) : 0;
                            } else if (tag === 0x0128) {
                                resUnit = getShort(entryOffset + 8);
                            }
                        }
                        if (xRes) {
                            dpi = (resUnit === 3) ? Math.round(xRes * 2.54) : xRes;
                            if (returnNumber) return dpi || 72;
                            return dpi;
                        }
                    }
                }
            }
        } else if (file.type === 'image/png') {
            let offset = 8;
            while (offset < arr.length) {
                const length = (arr[offset] << 24) + (arr[offset + 1] << 16) + (arr[offset + 2] << 8) + arr[offset + 3];
                const type = String.fromCharCode(arr[offset + 4], arr[offset + 5], arr[offset + 6], arr[offset + 7]);
                if (type === 'pHYs') {
                    const pixelsPerUnitX = (arr[offset + 8] << 24) + (arr[offset + 9] << 16) + (arr[offset + 10] << 8) + arr[offset + 11];
                    const unit = arr[offset + 16];
                    if (unit === 1) dpi = Math.round(pixelsPerUnitX * 0.0254);
                    if (returnNumber) return dpi || 72;
                    return dpi;
                }
                offset += 12 + length;
                if (type === 'IEND') break;
            }
        }
    } catch (e) {
        console.warn('Error reading DPI:', e);
    }
    return returnNumber ? 72 : '72 (Default)';
}

async function optimizeImage() {
    const btnText = processBtn.querySelector('.btn-text');
    btnText.textContent = 'Processing...';
    processBtn.disabled = true;

    try {
        let targetW = parseInt(maxWidthInput.value);
        let targetH = parseInt(maxHeightInput.value);

        // Validation: If inputs are invalid, fallback to original dimensions
        if (!targetW || !targetH || isNaN(targetW) || isNaN(targetH)) {
            if (originalDimensions && originalDimensions.width) {
                targetW = originalDimensions.width;
                targetH = originalDimensions.height;
                maxWidthInput.value = targetW;
                maxHeightInput.value = targetH;
            } else {
                const img = await createImageBitmap(currentFile);
                targetW = img.width;
                targetH = img.height;
                img.close();
                maxWidthInput.value = targetW;
                maxHeightInput.value = targetH;
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');

        const bmp = await createImageBitmap(currentFile);
        ctx.drawImage(bmp, 0, 0, targetW, targetH);
        bmp.close();

        let fileType = formatSelect.value;
        let quality = parseFloat(qualitySlider.value);

        // Export via Canvas (handling resize + format)
        let blob = await new Promise(resolve => canvas.toBlob(resolve, fileType, quality));

        if (!blob) throw new Error('Blob generation failed.');

        const compressedFile = new File([blob], currentFile.name, { type: fileType });

        // Update Result UI
        const resultUrl = URL.createObjectURL(compressedFile);
        resultPreview.src = resultUrl;

        // Get new dims
        const img = new Image();
        img.src = resultUrl;
        img.onload = () => {
            resultDims.textContent = `${img.width} x ${img.height}`;
        };

        resultSize.textContent = formatBytes(compressedFile.size);
        document.getElementById('result-dpi').textContent = "72";

        // Savings
        const savingPercent = ((currentFile.size - compressedFile.size) / currentFile.size * 100).toFixed(1);
        savings.textContent = (compressedFile.size < currentFile.size)
            ? `-${savingPercent}%`
            : '+0% (Optimized)';

        // Update Download Link
        downloadBtn.href = resultUrl;
        let ext = 'jpg';
        if (fileType === 'image/webp') ext = 'webp';
        if (fileType === 'image/png') ext = 'png';

        const originalName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || currentFile.name;
        downloadBtn.download = `${originalName}_web-quality.${ext}`;

    } catch (error) {
        console.error(error);
        alert('Error during optimization: ' + error.message);
    } finally {
        const btnText = processBtn.querySelector('.btn-text');
        btnText.textContent = 'Apply Changes';
        processBtn.disabled = false;
    }
}
