import { writable, derived } from 'svelte/store';

const translations = {
  en: {
    appName: "Mirola's PDF Editor",
    dropTitle: "Drop your PDF here",
    dropSub: "Click to browse or drag & drop",
    dropFormats: "Supports PDF files up to 100MB",
    orText: "or",
    browseFiles: "Browse Files",

    // Toolbar
    undo: "Undo",
    redo: "Redo",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    fitWidth: "Fit Width",
    fitPage: "Fit Page",
    save: "Save",
    download: "Download",
    print: "Print",

    // Tools
    toolSelect: "Select",
    toolTextEdit: "Edit Text",
    toolTextAdd: "Add Text",
    toolHighlight: "Highlight",
    toolDraw: "Draw",
    toolShapes: "Shapes",
    toolImage: "Add Image",
    toolSignature: "Signature",
    toolStamp: "Stamp",
    toolNote: "Sticky Note",
    toolEraser: "Eraser",

    // Sidebar sections
    sectionTools: "Tools",
    sectionPages: "Pages",
    sectionText: "Text",
    sectionAnnotations: "Annotations",
    sectionInsert: "Insert",
    sectionPageOps: "Page Operations",

    // Page operations
    mergePdf: "Merge PDFs",
    splitPdf: "Split PDF",
    rotatePage: "Rotate Page",
    rotateAll: "Rotate All",
    deletePage: "Delete Page",
    restorePage: "Restore",
    insertBlank: "Insert Blank Page",
    extractPages: "Extract Pages",
    reorderPages: "Reorder Pages",

    // Text settings
    fontFamily: "Font",
    fontSize: "Size",
    fontColor: "Color",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    alignLeft: "Align Left",
    alignCenter: "Center",
    alignRight: "Align Right",
    alignJustify: "Justify",

    // Drawing
    penColor: "Pen Color",
    penWidth: "Pen Width",
    penOpacity: "Opacity",

    // Shapes
    rectangle: "Rectangle",
    circle: "Circle",
    arrow: "Arrow",
    line: "Line",
    strokeColor: "Stroke",
    fillColor: "Fill",
    strokeWidth: "Width",

    // Highlight colors
    yellow: "Yellow",
    green: "Green",
    pink: "Pink",
    blue: "Blue",

    // Stamps
    stampApproved: "Approved",
    stampDraft: "Draft",
    stampConfidential: "Confidential",
    stampReviewed: "Reviewed",
    stampCustom: "Custom",

    // Modals
    mergeTitle: "Merge PDFs",
    mergeDesc: "Combine multiple PDF files into one",
    mergeAdd: "Add Files",
    mergeStart: "Merge",
    splitTitle: "Split PDF",
    splitDesc: "Extract pages from your PDF",
    splitByPages: "By page ranges",
    splitEvery: "Every N pages",
    splitIndividual: "Individual pages",
    splitStart: "Split",
    watermarkTitle: "Add Watermark",
    watermarkText: "Watermark Text",
    watermarkOpacity: "Opacity",
    watermarkAngle: "Angle",
    watermarkSize: "Size",
    watermarkColor: "Color",
    watermarkAllPages: "Apply to all pages",
    watermarkApply: "Apply Watermark",
    metadataTitle: "Document Metadata",
    metadataAuthor: "Author",
    metadataSubject: "Subject",
    metadataKeywords: "Keywords",
    metadataSave: "Save Metadata",
    pageNumbersTitle: "Add Page Numbers",
    pageNumbersPosition: "Position",
    pageNumbersFormat: "Format",
    pageNumbersStart: "Start Number",
    pageNumbersApply: "Apply",
    compressTitle: "Compress PDF",
    compressQuality: "Quality",
    compressStart: "Compress",
    ocrTitle: "OCR - Extract Text",
    ocrLanguage: "Language",
    ocrStart: "Extract Text",
    ocrProgress: "Processing...",
    signatureTitle: "Add Signature",
    signatureDraw: "Draw",
    signatureUpload: "Upload Image",
    signatureClear: "Clear",
    signatureApply: "Apply Signature",

    // Find & Replace
    findReplace: "Find & Replace",
    findPlaceholder: "Search text...",
    replacePlaceholder: "Replace with...",
    findNext: "Next",
    findPrev: "Previous",
    replaceOne: "Replace",
    replaceAll: "Replace All",
    matchesFound: "matches found",

    // Status
    pageOf: "of",
    modified: "Modified",
    ready: "Ready",
    loading: "Loading...",
    processing: "Processing...",
    fileSize: "Size",

    // Footer
    madeWith: "Made with",
    by: "by",
    footerDesc: "Free online PDF editor",
    privacy: "Your files never leave your browser",

    // Conversion
    pdfToImage: "PDF to Images",
    exportFormat: "Format",
    exportDpi: "DPI",
    exportAll: "Export All Pages",
    exportCurrent: "Export Current Page",
    compressPdf: "Compress PDF",
    ocrExtract: "OCR Extract",
    pdfToText: "PDF to Text",
    copyToClipboard: "Copy to Clipboard",
    downloadTxt: "Download .txt",

    // Forms
    fillForms: "Fill Forms",
    flattenForms: "Flatten Forms",
    formFields: "Form Fields",
    noForms: "No form fields detected",

    // Page numbers
    posTopLeft: "Top Left",
    posTopCenter: "Top Center",
    posTopRight: "Top Right",
    posBottomLeft: "Bottom Left",
    posBottomCenter: "Bottom Center",
    posBottomRight: "Bottom Right",

    // Headers & Footers
    headersFooters: "Headers & Footers",

    // General
    apply: "Apply",
    cancel: "Cancel",
    close: "Close",
    delete: "Delete",
    language: "Language",
    confirmDelete: "Are you sure?",
    noFileLoaded: "No file loaded",
    dropHere: "Drop PDF here",

    // Keyboard shortcuts
    shortcuts: "Keyboard Shortcuts",
  },
  es: {
    appName: "Mirola's PDF Editor",
    dropTitle: "Arrastra tu PDF aqui",
    dropSub: "Haz clic para buscar o arrastra y suelta",
    dropFormats: "Soporta archivos PDF hasta 100MB",
    orText: "o",
    browseFiles: "Buscar Archivos",

    toolSelect: "Seleccionar",
    toolTextEdit: "Editar Texto",
    toolTextAdd: "Agregar Texto",
    toolHighlight: "Resaltar",
    toolDraw: "Dibujar",
    toolShapes: "Formas",
    toolImage: "Agregar Imagen",
    toolSignature: "Firma",
    toolStamp: "Sello",
    toolNote: "Nota Adhesiva",
    toolEraser: "Borrador",

    undo: "Deshacer",
    redo: "Rehacer",
    zoomIn: "Acercar",
    zoomOut: "Alejar",
    fitWidth: "Ajustar Ancho",
    fitPage: "Ajustar Pagina",
    save: "Guardar",
    download: "Descargar",
    print: "Imprimir",

    sectionTools: "Herramientas",
    sectionPages: "Paginas",
    sectionText: "Texto",
    sectionAnnotations: "Anotaciones",
    sectionInsert: "Insertar",
    sectionPageOps: "Operaciones de Pagina",

    mergePdf: "Unir PDFs",
    splitPdf: "Dividir PDF",
    rotatePage: "Rotar Pagina",
    rotateAll: "Rotar Todo",
    deletePage: "Eliminar Pagina",
    restorePage: "Restaurar",
    insertBlank: "Insertar Pagina en Blanco",
    extractPages: "Extraer Paginas",
    reorderPages: "Reordenar Paginas",

    fontFamily: "Fuente",
    fontSize: "Tamano",
    fontColor: "Color",
    bold: "Negrita",
    italic: "Cursiva",
    underline: "Subrayado",
    alignLeft: "Alinear Izquierda",
    alignCenter: "Centrar",
    alignRight: "Alinear Derecha",
    alignJustify: "Justificar",

    penColor: "Color del Lapiz",
    penWidth: "Grosor",
    penOpacity: "Opacidad",

    rectangle: "Rectangulo",
    circle: "Circulo",
    arrow: "Flecha",
    line: "Linea",
    strokeColor: "Borde",
    fillColor: "Relleno",
    strokeWidth: "Grosor",

    yellow: "Amarillo",
    green: "Verde",
    pink: "Rosa",
    blue: "Azul",

    stampApproved: "Aprobado",
    stampDraft: "Borrador",
    stampConfidential: "Confidencial",
    stampReviewed: "Revisado",
    stampCustom: "Personalizado",

    mergeTitle: "Unir PDFs",
    mergeDesc: "Combina multiples archivos PDF en uno",
    mergeAdd: "Agregar Archivos",
    mergeStart: "Unir",
    splitTitle: "Dividir PDF",
    splitDesc: "Extrae paginas de tu PDF",
    splitByPages: "Por rango de paginas",
    splitEvery: "Cada N paginas",
    splitIndividual: "Paginas individuales",
    splitStart: "Dividir",
    watermarkTitle: "Agregar Marca de Agua",
    watermarkText: "Texto de Marca de Agua",
    watermarkOpacity: "Opacidad",
    watermarkAngle: "Angulo",
    watermarkSize: "Tamano",
    watermarkColor: "Color",
    watermarkAllPages: "Aplicar a todas las paginas",
    watermarkApply: "Aplicar Marca de Agua",
    metadataTitle: "Metadatos del Documento",
    metadataAuthor: "Autor",
    metadataSubject: "Asunto",
    metadataKeywords: "Palabras Clave",
    metadataSave: "Guardar Metadatos",
    pageNumbersTitle: "Agregar Numeros de Pagina",
    pageNumbersPosition: "Posicion",
    pageNumbersFormat: "Formato",
    pageNumbersStart: "Numero Inicial",
    pageNumbersApply: "Aplicar",
    compressTitle: "Comprimir PDF",
    compressQuality: "Calidad",
    compressStart: "Comprimir",
    ocrTitle: "OCR - Extraer Texto",
    ocrLanguage: "Idioma",
    ocrStart: "Extraer Texto",
    ocrProgress: "Procesando...",
    signatureTitle: "Agregar Firma",
    signatureDraw: "Dibujar",
    signatureUpload: "Subir Imagen",
    signatureClear: "Limpiar",
    signatureApply: "Aplicar Firma",

    findReplace: "Buscar y Reemplazar",
    findPlaceholder: "Buscar texto...",
    replacePlaceholder: "Reemplazar con...",
    findNext: "Siguiente",
    findPrev: "Anterior",
    replaceOne: "Reemplazar",
    replaceAll: "Reemplazar Todo",
    matchesFound: "coincidencias",

    pageOf: "de",
    modified: "Modificado",
    ready: "Listo",
    loading: "Cargando...",
    processing: "Procesando...",
    fileSize: "Tamano",

    madeWith: "Hecho con",
    by: "por",
    footerDesc: "Editor de PDF online gratuito",
    privacy: "Tus archivos nunca salen de tu navegador",

    pdfToImage: "PDF a Imagenes",
    exportFormat: "Formato",
    exportDpi: "DPI",
    exportAll: "Exportar Todas",
    exportCurrent: "Exportar Actual",
    compressPdf: "Comprimir PDF",
    ocrExtract: "Extraer OCR",
    pdfToText: "PDF a Texto",
    copyToClipboard: "Copiar al Portapapeles",
    downloadTxt: "Descargar .txt",

    fillForms: "Rellenar Formularios",
    flattenForms: "Aplanar Formularios",
    formFields: "Campos de Formulario",
    noForms: "No se detectaron campos de formulario",

    posTopLeft: "Arriba Izquierda",
    posTopCenter: "Arriba Centro",
    posTopRight: "Arriba Derecha",
    posBottomLeft: "Abajo Izquierda",
    posBottomCenter: "Abajo Centro",
    posBottomRight: "Abajo Derecha",

    headersFooters: "Encabezados y Pies",

    apply: "Aplicar",
    cancel: "Cancelar",
    close: "Cerrar",
    delete: "Eliminar",
    language: "Idioma",
    confirmDelete: "Estas seguro?",
    noFileLoaded: "Sin archivo cargado",
    dropHere: "Suelta el PDF aqui",
    shortcuts: "Atajos de Teclado",
  },
  pt: {
    appName: "Mirola's PDF Editor",
    dropTitle: "Solte seu PDF aqui",
    dropSub: "Clique para buscar ou arraste e solte",
    dropFormats: "Suporta arquivos PDF ate 100MB",
    orText: "ou",
    browseFiles: "Buscar Arquivos",

    toolSelect: "Selecionar",
    toolTextEdit: "Editar Texto",
    toolTextAdd: "Adicionar Texto",
    toolHighlight: "Destacar",
    toolDraw: "Desenhar",
    toolShapes: "Formas",
    toolImage: "Adicionar Imagem",
    toolSignature: "Assinatura",
    toolStamp: "Carimbo",
    toolNote: "Nota Adesiva",
    toolEraser: "Borracha",

    undo: "Desfazer",
    redo: "Refazer",
    zoomIn: "Ampliar",
    zoomOut: "Reduzir",
    fitWidth: "Ajustar Largura",
    fitPage: "Ajustar Pagina",
    save: "Salvar",
    download: "Baixar",
    print: "Imprimir",

    sectionTools: "Ferramentas",
    sectionPages: "Paginas",
    sectionText: "Texto",
    sectionAnnotations: "Anotacoes",
    sectionInsert: "Inserir",
    sectionPageOps: "Operacoes de Pagina",

    mergePdf: "Mesclar PDFs",
    splitPdf: "Dividir PDF",
    rotatePage: "Girar Pagina",
    rotateAll: "Girar Tudo",
    deletePage: "Excluir Pagina",
    restorePage: "Restaurar",
    insertBlank: "Inserir Pagina em Branco",
    extractPages: "Extrair Paginas",
    reorderPages: "Reordenar Paginas",

    fontFamily: "Fonte",
    fontSize: "Tamanho",
    fontColor: "Cor",
    bold: "Negrito",
    italic: "Italico",
    underline: "Sublinhado",

    penColor: "Cor da Caneta",
    penWidth: "Espessura",
    penOpacity: "Opacidade",

    rectangle: "Retangulo",
    circle: "Circulo",
    arrow: "Seta",
    line: "Linha",
    strokeColor: "Borda",
    fillColor: "Preenchimento",
    strokeWidth: "Espessura",

    mergeTitle: "Mesclar PDFs",
    mergeDesc: "Combine varios arquivos PDF em um",
    mergeAdd: "Adicionar Arquivos",
    mergeStart: "Mesclar",
    splitTitle: "Dividir PDF",
    splitDesc: "Extraia paginas do seu PDF",
    splitStart: "Dividir",
    watermarkTitle: "Adicionar Marca d'Agua",
    watermarkApply: "Aplicar Marca d'Agua",
    compressTitle: "Comprimir PDF",
    compressStart: "Comprimir",
    ocrTitle: "OCR - Extrair Texto",
    ocrStart: "Extrair Texto",
    signatureTitle: "Adicionar Assinatura",
    signatureApply: "Aplicar Assinatura",
    metadataTitle: "Metadados do Documento",
    metadataSave: "Salvar Metadados",

    findReplace: "Buscar e Substituir",
    findPlaceholder: "Buscar texto...",
    replacePlaceholder: "Substituir por...",
    findNext: "Proximo",
    findPrev: "Anterior",
    replaceOne: "Substituir",
    replaceAll: "Substituir Tudo",
    matchesFound: "correspondencias",

    pageOf: "de",
    modified: "Modificado",
    ready: "Pronto",
    loading: "Carregando...",
    processing: "Processando...",

    madeWith: "Feito com",
    by: "por",
    footerDesc: "Editor de PDF online gratuito",
    privacy: "Seus arquivos nunca saem do seu navegador",

    apply: "Aplicar",
    cancel: "Cancelar",
    close: "Fechar",
    delete: "Excluir",
    language: "Idioma",
    shortcuts: "Atalhos de Teclado",
  },
  fr: {
    appName: "Mirola's PDF Editor",
    dropTitle: "Deposez votre PDF ici",
    dropSub: "Cliquez pour parcourir ou glissez-deposez",
    dropFormats: "Supporte les fichiers PDF jusqu'a 100 Mo",
    orText: "ou",
    browseFiles: "Parcourir",

    toolSelect: "Selectionner",
    toolTextEdit: "Modifier Texte",
    toolTextAdd: "Ajouter Texte",
    toolHighlight: "Surligner",
    toolDraw: "Dessiner",
    toolShapes: "Formes",
    toolImage: "Ajouter Image",
    toolSignature: "Signature",
    toolStamp: "Tampon",
    toolNote: "Note",
    toolEraser: "Gomme",

    undo: "Annuler",
    redo: "Retablir",
    zoomIn: "Zoom Avant",
    zoomOut: "Zoom Arriere",
    fitWidth: "Ajuster Largeur",
    fitPage: "Ajuster Page",
    save: "Enregistrer",
    download: "Telecharger",
    print: "Imprimer",

    sectionTools: "Outils",
    sectionPages: "Pages",
    sectionText: "Texte",
    sectionAnnotations: "Annotations",
    sectionInsert: "Inserer",
    sectionPageOps: "Operations de Page",

    mergePdf: "Fusionner PDFs",
    splitPdf: "Diviser PDF",
    rotatePage: "Pivoter Page",
    rotateAll: "Pivoter Tout",
    deletePage: "Supprimer Page",
    restorePage: "Restaurer",
    insertBlank: "Inserer Page Vide",
    extractPages: "Extraire Pages",
    reorderPages: "Reordonner Pages",

    fontFamily: "Police",
    fontSize: "Taille",
    fontColor: "Couleur",
    bold: "Gras",
    italic: "Italique",
    underline: "Souligne",

    penColor: "Couleur du Stylo",
    penWidth: "Epaisseur",
    penOpacity: "Opacite",

    rectangle: "Rectangle",
    circle: "Cercle",
    arrow: "Fleche",
    line: "Ligne",
    strokeColor: "Bordure",
    fillColor: "Remplissage",
    strokeWidth: "Epaisseur",

    mergeTitle: "Fusionner PDFs",
    mergeDesc: "Combiner plusieurs fichiers PDF",
    mergeAdd: "Ajouter Fichiers",
    mergeStart: "Fusionner",
    splitTitle: "Diviser PDF",
    splitDesc: "Extraire des pages de votre PDF",
    splitStart: "Diviser",
    watermarkTitle: "Ajouter Filigrane",
    watermarkApply: "Appliquer Filigrane",
    compressTitle: "Compresser PDF",
    compressStart: "Compresser",
    ocrTitle: "OCR - Extraire Texte",
    ocrStart: "Extraire Texte",
    signatureTitle: "Ajouter Signature",
    signatureApply: "Appliquer Signature",
    metadataTitle: "Metadonnees du Document",
    metadataSave: "Enregistrer Metadonnees",

    findReplace: "Rechercher et Remplacer",
    findPlaceholder: "Rechercher...",
    replacePlaceholder: "Remplacer par...",
    findNext: "Suivant",
    findPrev: "Precedent",
    replaceOne: "Remplacer",
    replaceAll: "Tout Remplacer",
    matchesFound: "correspondances",

    pageOf: "de",
    modified: "Modifie",
    ready: "Pret",
    loading: "Chargement...",
    processing: "Traitement...",

    madeWith: "Fait avec",
    by: "par",
    footerDesc: "Editeur PDF en ligne gratuit",
    privacy: "Vos fichiers ne quittent jamais votre navigateur",

    apply: "Appliquer",
    cancel: "Annuler",
    close: "Fermer",
    delete: "Supprimer",
    language: "Langue",
    shortcuts: "Raccourcis Clavier",
  },
};

function detectLanguage() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('pdf-editor-lang');
    if (saved && translations[saved]) return saved;
  }
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language || navigator.languages?.[0] || 'en';
    const code = browserLang.slice(0, 2).toLowerCase();
    if (translations[code]) return code;
  }
  return 'en';
}

function createI18nStore() {
  const initial = detectLanguage();
  const { subscribe, set } = writable(initial);

  return {
    subscribe,
    setLang(lang) {
      if (translations[lang]) {
        set(lang);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('pdf-editor-lang', lang);
        }
        if (typeof document !== 'undefined') {
          document.documentElement.lang = lang;
        }
      }
    },
    init() {
      let current;
      subscribe(v => current = v)();
      if (typeof document !== 'undefined') {
        document.documentElement.lang = current;
      }
    }
  };
}

export const locale = createI18nStore();

export const t = derived(locale, ($locale) => {
  const strings = translations[$locale] || translations.en;
  return (key) => strings[key] || translations.en[key] || key;
});

export const availableLocales = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Espanol', flag: '🇪🇸' },
  { code: 'pt', label: 'Portugues', flag: '🇧🇷' },
  { code: 'fr', label: 'Francais', flag: '🇫🇷' },
];
