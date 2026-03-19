import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export async function loadPdfLib(bytes) {
  return await PDFDocument.load(bytes, { ignoreEncryption: true });
}

export async function getMetadata(pdfDoc) {
  return {
    title: pdfDoc.getTitle() || '',
    author: pdfDoc.getAuthor() || '',
    subject: pdfDoc.getSubject() || '',
    keywords: (pdfDoc.getKeywords() || ''),
    creator: pdfDoc.getCreator() || '',
    producer: pdfDoc.getProducer() || '',
  };
}

export async function setMetadata(pdfDoc, metadata) {
  if (metadata.title) pdfDoc.setTitle(metadata.title);
  if (metadata.author) pdfDoc.setAuthor(metadata.author);
  if (metadata.subject) pdfDoc.setSubject(metadata.subject);
  if (metadata.keywords) pdfDoc.setKeywords([metadata.keywords]);
  if (metadata.creator) pdfDoc.setCreator(metadata.creator);
}

export async function savePdf(pdfDoc) {
  return await pdfDoc.save();
}

export async function mergePdfs(pdfBytesList) {
  const merged = await PDFDocument.create();
  for (const bytes of pdfBytesList) {
    const doc = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach(page => merged.addPage(page));
  }
  return await merged.save();
}

export async function splitPdf(pdfBytes, ranges) {
  const source = await PDFDocument.load(pdfBytes);
  const results = [];

  for (const range of ranges) {
    const newDoc = await PDFDocument.create();
    const indices = range.map(p => p - 1);
    const pages = await newDoc.copyPages(source, indices);
    pages.forEach(page => newDoc.addPage(page));
    results.push({
      name: `pages_${range[0]}-${range[range.length - 1]}.pdf`,
      bytes: await newDoc.save(),
    });
  }

  return results;
}

export async function extractPages(pdfBytes, pageNumbers) {
  const source = await PDFDocument.load(pdfBytes);
  const newDoc = await PDFDocument.create();
  const indices = pageNumbers.map(p => p - 1);
  const pages = await newDoc.copyPages(source, indices);
  pages.forEach(page => newDoc.addPage(page));
  return await newDoc.save();
}

export async function rotatePagesInPdf(pdfBytes, pageRotations) {
  const doc = await PDFDocument.load(pdfBytes);
  const pages = doc.getPages();

  for (const { pageIndex, rotation } of pageRotations) {
    if (pageIndex < pages.length) {
      pages[pageIndex].setRotation(degrees(rotation));
    }
  }

  return await doc.save();
}

export async function deletePages(pdfBytes, pageIndicesToKeep) {
  const source = await PDFDocument.load(pdfBytes);
  const newDoc = await PDFDocument.create();
  const pages = await newDoc.copyPages(source, pageIndicesToKeep);
  pages.forEach(page => newDoc.addPage(page));
  return await newDoc.save();
}

export async function insertBlankPageInPdf(pdfBytes, afterIndex, width = 595, height = 842) {
  const doc = await PDFDocument.load(pdfBytes);
  doc.insertPage(afterIndex + 1, [width, height]);
  return await doc.save();
}

export async function reorderPagesInPdf(pdfBytes, newOrder) {
  const source = await PDFDocument.load(pdfBytes);
  const newDoc = await PDFDocument.create();
  const pages = await newDoc.copyPages(source, newOrder);
  pages.forEach(page => newDoc.addPage(page));
  return await newDoc.save();
}

export async function addTextToPdf(pdfBytes, pageIndex, text, x, y, options = {}) {
  const doc = await PDFDocument.load(pdfBytes);
  const page = doc.getPages()[pageIndex];
  const font = await doc.embedFont(options.fontName || StandardFonts.Helvetica);

  const color = options.color ? hexToRgb(options.color) : rgb(0, 0, 0);

  page.drawText(text, {
    x,
    y: page.getHeight() - y,
    size: options.fontSize || 16,
    font,
    color,
    opacity: options.opacity || 1,
    rotate: options.rotate ? degrees(options.rotate) : undefined,
  });

  return await doc.save();
}

export async function addImageToPdf(pdfBytes, pageIndex, imageBytes, x, y, width, height, isJpeg = false) {
  const doc = await PDFDocument.load(pdfBytes);
  const page = doc.getPages()[pageIndex];

  const image = isJpeg
    ? await doc.embedJpg(imageBytes)
    : await doc.embedPng(imageBytes);

  page.drawImage(image, {
    x,
    y: page.getHeight() - y - height,
    width,
    height,
  });

  return await doc.save();
}

export async function addWatermark(pdfBytes, text, options = {}) {
  const doc = await PDFDocument.load(pdfBytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();

  const fontSize = options.fontSize || 60;
  const opacity = options.opacity || 0.15;
  const angle = options.angle || -45;
  const color = options.color ? hexToRgb(options.color) : rgb(0.5, 0.5, 0.5);

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color,
      opacity,
      rotate: degrees(angle),
    });
  }

  return await doc.save();
}

export async function addPageNumbers(pdfBytes, options = {}) {
  const doc = await PDFDocument.load(pdfBytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const startNum = options.startNumber || 1;
  const position = options.position || 'bottom-center';
  const fontSize = options.fontSize || 12;
  const color = options.color ? hexToRgb(options.color) : rgb(0, 0, 0);
  const format = options.format || 'number';

  pages.forEach((page, i) => {
    const { width, height } = page.getSize();
    const num = startNum + i;
    let label;
    if (format === 'roman') label = toRoman(num);
    else if (format === 'page-of') label = `${num} / ${pages.length}`;
    else label = `${num}`;

    const textWidth = font.widthOfTextAtSize(label, fontSize);
    let x, y;

    if (position.includes('top')) y = height - 30;
    else y = 20;

    if (position.includes('left')) x = 40;
    else if (position.includes('right')) x = width - textWidth - 40;
    else x = (width - textWidth) / 2;

    page.drawText(label, { x, y, size: fontSize, font, color });
  });

  return await doc.save();
}

export async function getFormFields(pdfBytes) {
  try {
    const doc = await PDFDocument.load(pdfBytes);
    const form = doc.getForm();
    const fields = form.getFields();
    return fields.map(f => ({
      name: f.getName(),
      type: f.constructor.name.replace('PDF', '').replace('Field', ''),
    }));
  } catch {
    return [];
  }
}

export async function fillFormFields(pdfBytes, fieldValues) {
  const doc = await PDFDocument.load(pdfBytes);
  const form = doc.getForm();

  for (const [name, value] of Object.entries(fieldValues)) {
    try {
      const field = form.getTextField(name);
      field.setText(value);
    } catch {
      // skip non-text fields
    }
  }

  return await doc.save();
}

export async function flattenForm(pdfBytes) {
  const doc = await PDFDocument.load(pdfBytes);
  const form = doc.getForm();
  form.flatten();
  return await doc.save();
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

function toRoman(num) {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) { result += syms[i]; num -= vals[i]; }
  }
  return result;
}
