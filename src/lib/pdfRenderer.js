import * as pdfjsLib from 'pdfjs-dist';

let workerInitialized = false;

function initWorker() {
  if (workerInitialized) return;
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href;
  workerInitialized = true;
}

// Track active render tasks per canvas to prevent concurrent renders
const activeRenderTasks = new WeakMap();

export async function loadPdfDocument(data) {
  initWorker();
  // Always copy the ArrayBuffer so PDF.js worker transfer doesn't detach the original
  const copy = new Uint8Array(data).buffer;
  const loadingTask = pdfjsLib.getDocument({ data: copy });
  return await loadingTask.promise;
}

export async function renderPage(pdfDoc, pageNum, canvas, scale = 1.5, rotation = 0) {
  // Cancel any in-progress render on this canvas
  const prevTask = activeRenderTasks.get(canvas);
  if (prevTask) {
    try { prevTask.cancel(); } catch { /* already done */ }
    activeRenderTasks.delete(canvas);
  }

  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale, rotation });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const renderTask = page.render({
    canvasContext: ctx,
    viewport,
  });

  activeRenderTasks.set(canvas, renderTask);

  try {
    await renderTask.promise;
  } catch (err) {
    // RenderingCancelledException is expected when we cancel a previous render
    if (err?.name === 'RenderingCancelledException') {
      return null;
    }
    throw err;
  } finally {
    // Only clear if this is still the active task
    if (activeRenderTasks.get(canvas) === renderTask) {
      activeRenderTasks.delete(canvas);
    }
  }

  return { width: viewport.width, height: viewport.height };
}

export async function renderThumbnail(pdfDoc, pageNum, canvas, maxWidth = 150) {
  const page = await pdfDoc.getPage(pageNum);
  const unscaledViewport = page.getViewport({ scale: 1 });
  const scale = maxWidth / unscaledViewport.width;
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  return { width: viewport.width, height: viewport.height };
}

export async function getPageTextContent(pdfDoc, pageNum) {
  const page = await pdfDoc.getPage(pageNum);
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1 });

  return textContent.items.map(item => {
    const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
    return {
      text: item.str,
      x: tx[4],
      y: tx[5],
      width: item.width,
      height: item.height,
      fontName: item.fontName,
      fontSize: Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]),
    };
  });
}

export async function extractAllText(pdfDoc) {
  const pages = [];
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map(item => item.str).join(' ');
    pages.push({ pageNum: i, text });
  }
  return pages;
}

export async function getPageDimensions(pdfDoc, pageNum) {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1 });
  return { width: viewport.width, height: viewport.height };
}
