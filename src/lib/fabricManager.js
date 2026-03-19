import { Canvas, IText, Rect, Circle, Line, FabricImage, Group, Polygon } from 'fabric';

export function createFabricCanvas(canvasElement, width, height) {
  const fabricCanvas = new Canvas(canvasElement, {
    width,
    height,
    selection: true,
    preserveObjectStacking: true,
  });
  // Explicitly ensure no background (don't use 'transparent' which Fabric may render as white)
  fabricCanvas.backgroundColor = '';
  fabricCanvas.renderAll();
  return fabricCanvas;
}

export function setDrawingMode(fabricCanvas, enabled, options = {}) {
  fabricCanvas.isDrawingMode = enabled;
  if (enabled) {
    fabricCanvas.freeDrawingBrush.color = options.color || '#ff0000';
    fabricCanvas.freeDrawingBrush.width = options.width || 2;
  }
}

// Create a Fabric IText that represents an edited PDF text — movable, editable, styled to match
export function addPdfEditText(fabricCanvas, options = {}) {
  const text = new IText(options.text || '', {
    left: options.x || 0,
    top: options.y || 0,
    fontSize: options.fontSize || 16,
    fontFamily: options.fontFamily || 'Helvetica',
    fontWeight: options.fontWeight || 'normal',
    fontStyle: options.fontStyle || 'normal',
    fill: options.color || '#000000',
    editable: true,
    padding: 0,
    borderColor: '#3b82f6',
    cornerColor: '#3b82f6',
    cornerSize: 6,
    transparentCorners: false,
    customType: 'pdf-edit',
  });
  fabricCanvas.add(text);
  return text;
}

export function addTextBox(fabricCanvas, options = {}) {
  const text = new IText(options.text || 'Type here...', {
    left: options.x || 100,
    top: options.y || 100,
    fontSize: options.fontSize || 16,
    fontFamily: options.fontFamily || 'Helvetica',
    fill: options.color || '#000000',
    fontWeight: options.bold ? 'bold' : 'normal',
    fontStyle: options.italic ? 'italic' : 'normal',
    underline: options.underline || false,
    textAlign: options.align || 'left',
    editable: true,
    padding: 5,
    borderColor: '#3b82f6',
    cornerColor: '#3b82f6',
    cornerSize: 8,
    transparentCorners: false,
  });
  fabricCanvas.add(text);
  fabricCanvas.setActiveObject(text);
  return text;
}

export function addHighlight(fabricCanvas, x, y, width, height, color = '#ffff00') {
  const rect = new Rect({
    left: x,
    top: y,
    width,
    height,
    fill: color,
    opacity: 0.35,
    selectable: true,
    hoverCursor: 'move',
    borderColor: '#3b82f6',
    cornerColor: '#3b82f6',
    cornerSize: 8,
    transparentCorners: false,
    customType: 'highlight',
  });
  fabricCanvas.add(rect);
  fabricCanvas.sendObjectToBack(rect);
  return rect;
}

export function addShape(fabricCanvas, type, options = {}) {
  const defaults = {
    left: options.x || 100,
    top: options.y || 100,
    stroke: options.strokeColor || '#000000',
    strokeWidth: options.strokeWidth || 2,
    fill: options.fillColor || 'transparent',
    selectable: true,
    borderColor: '#3b82f6',
    cornerColor: '#3b82f6',
    cornerSize: 8,
    transparentCorners: false,
  };

  let shape;

  switch (type) {
    case 'rectangle':
      shape = new Rect({
        ...defaults,
        width: options.width || 150,
        height: options.height || 100,
      });
      break;

    case 'circle':
      shape = new Circle({
        ...defaults,
        radius: options.radius || 50,
      });
      break;

    case 'line':
      shape = new Line([
        defaults.left, defaults.top,
        defaults.left + (options.width || 150), defaults.top,
      ], {
        ...defaults,
        fill: undefined,
      });
      break;

    case 'arrow': {
      const x1 = defaults.left;
      const y1 = defaults.top;
      const x2 = x1 + (options.width || 150);
      const y2 = y1;
      const headLen = 15;
      const angle = Math.atan2(y2 - y1, x2 - x1);

      const line = new Line([x1, y1, x2, y2], {
        stroke: defaults.stroke,
        strokeWidth: defaults.strokeWidth,
      });

      const head = new Polygon([
        { x: x2, y: y2 },
        { x: x2 - headLen * Math.cos(angle - Math.PI / 6), y: y2 - headLen * Math.sin(angle - Math.PI / 6) },
        { x: x2 - headLen * Math.cos(angle + Math.PI / 6), y: y2 - headLen * Math.sin(angle + Math.PI / 6) },
      ], {
        fill: defaults.stroke,
        stroke: defaults.stroke,
        strokeWidth: 1,
      });

      shape = new Group([line, head], {
        left: x1,
        top: y1 - 10,
        selectable: true,
        borderColor: '#3b82f6',
        cornerColor: '#3b82f6',
        cornerSize: 8,
        transparentCorners: false,
      });
      break;
    }
  }

  if (shape) {
    fabricCanvas.add(shape);
    fabricCanvas.setActiveObject(shape);
  }
  return shape;
}

export function addStickyNote(fabricCanvas, x, y, text = '') {
  const bg = new Rect({
    width: 150,
    height: 100,
    fill: '#fef08a',
    rx: 4,
    ry: 4,
    shadow: '2px 2px 5px rgba(0,0,0,0.2)',
  });

  const noteText = new IText(text || 'Note...', {
    fontSize: 12,
    fontFamily: 'Arial',
    fill: '#713f12',
    left: 8,
    top: 8,
    width: 134,
    editable: true,
  });

  const group = new Group([bg, noteText], {
    left: x || 100,
    top: y || 100,
    selectable: true,
    borderColor: '#3b82f6',
    cornerColor: '#3b82f6',
    cornerSize: 8,
    transparentCorners: false,
    subTargetCheck: true,
    customType: 'sticky-note',
  });

  fabricCanvas.add(group);
  fabricCanvas.setActiveObject(group);
  return group;
}

export function addStamp(fabricCanvas, text, x, y, color = '#ef4444') {
  const stampText = new IText(text.toUpperCase(), {
    fontSize: 32,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    fill: 'transparent',
    stroke: color,
    strokeWidth: 2,
    left: x || 100,
    top: y || 100,
    padding: 10,
    borderColor: '#3b82f6',
    cornerColor: '#3b82f6',
    cornerSize: 8,
    transparentCorners: false,
    angle: -15,
    opacity: 0.7,
    editable: false,
    customType: 'stamp',
  });

  fabricCanvas.add(stampText);
  fabricCanvas.setActiveObject(stampText);
  return stampText;
}

export async function addImageToCanvas(fabricCanvas, imageUrl, x, y, maxWidth = 200) {
  return new Promise((resolve) => {
    FabricImage.fromURL(imageUrl, {
      crossOrigin: 'anonymous',
    }).then((img) => {
      const scale = maxWidth / img.width;
      img.set({
        left: x || 100,
        top: y || 100,
        scaleX: scale,
        scaleY: scale,
        borderColor: '#3b82f6',
        cornerColor: '#3b82f6',
        cornerSize: 8,
        transparentCorners: false,
      });
      fabricCanvas.add(img);
      fabricCanvas.setActiveObject(img);
      resolve(img);
    });
  });
}

// Parse PDF font name into family, weight, style
export function parsePdfFont(fontName) {
  if (!fontName) return { fontFamily: 'Helvetica', fontWeight: 'normal', fontStyle: 'normal' };
  const lower = fontName.toLowerCase();
  const fontWeight = lower.includes('bold') ? 'bold' : 'normal';
  const fontStyle = (lower.includes('italic') || lower.includes('oblique')) ? 'italic' : 'normal';
  let fontFamily = 'Helvetica';
  if (lower.includes('times')) fontFamily = 'Times New Roman';
  else if (lower.includes('courier') || lower.includes('mono')) fontFamily = 'Courier New';
  else if (lower.includes('arial')) fontFamily = 'Arial';
  else if (lower.includes('georgia')) fontFamily = 'Georgia';
  else if (lower.includes('verdana')) fontFamily = 'Verdana';
  return { fontFamily, fontWeight, fontStyle };
}

// Find text item at a given position from stored text items list
export function findTextAtPosition(textItems, x, y) {
  if (!textItems || !textItems.length) return null;

  for (const item of textItems) {
    if (item.fontSize < 4) continue;
    const top = item.y - item.fontSize * 0.82;
    const left = item.x;
    const width = item.width || item.text.length * item.fontSize * 0.6;
    const height = item.fontSize * 1.3;
    const pad = 4;

    if (x >= left - pad && x <= left + width + pad &&
        y >= top - pad && y <= top + height + pad) {
      return item;
    }
  }
  return null;
}

export function deleteSelected(fabricCanvas) {
  const active = fabricCanvas.getActiveObjects();
  if (active.length) {
    active.forEach(obj => fabricCanvas.remove(obj));
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
  }
}

export function serializeCanvas(fabricCanvas) {
  // Temporarily remove background image (PDF render) before serializing
  // so we don't store the entire page image in JSON
  const bg = fabricCanvas.backgroundImage;
  fabricCanvas.backgroundImage = null;
  const json = fabricCanvas.toJSON(['customType', 'editId']);
  json._canvasWidth = fabricCanvas.width;
  json._canvasHeight = fabricCanvas.height;
  fabricCanvas.backgroundImage = bg;
  return JSON.stringify(json);
}

export function deserializeCanvas(fabricCanvas, json) {
  if (!json) return;
  fabricCanvas.loadFromJSON(json, () => {
    fabricCanvas.renderAll();
  });
}

export function clearCanvas(fabricCanvas) {
  fabricCanvas.clear();
  fabricCanvas.backgroundColor = '';
  fabricCanvas.renderAll();
}

export function canvasToImageBytes(fabricCanvas) {
  return fabricCanvas.toDataURL({ format: 'png', multiplier: 2 });
}

