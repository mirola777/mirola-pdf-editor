// OCR Web Worker using Tesseract.js
// This worker is loaded dynamically when the user activates OCR

import { createWorker } from 'tesseract.js';

let worker = null;

self.onmessage = async function(e) {
  const { type, data } = e.data;

  if (type === 'init') {
    worker = await createWorker(data.language || 'eng');
    self.postMessage({ type: 'ready' });
  }

  if (type === 'recognize') {
    if (!worker) {
      self.postMessage({ type: 'error', message: 'Worker not initialized' });
      return;
    }

    try {
      const result = await worker.recognize(data.imageData);
      self.postMessage({ type: 'result', text: result.data.text, pageNum: data.pageNum });
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message });
    }
  }

  if (type === 'terminate') {
    if (worker) await worker.terminate();
    self.close();
  }
};
