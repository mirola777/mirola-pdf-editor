<script>
  import { onMount } from 'svelte';
  import { t } from './stores/i18n.js';
  import { locale } from './stores/i18n.js';
  import { pdfStore, activePages } from './stores/pdfStore.js';
  import { toolStore } from './stores/toolStore.js';
  import { theme } from './stores/settingsStore.js';
  import { historyStore } from './stores/historyStore.js';
  import { readFileAsArrayBuffer } from './lib/fileUtils.js';
  import { loadPdfLib, getMetadata, savePdf, deletePages, rotatePagesInPdf, reorderPagesInPdf, flattenForm, extractPages, flattenAnnotationsIntoPdf } from './lib/pdfEngine.js';
  import { loadPdfDocument, renderPage, extractAllText } from './lib/pdfRenderer.js';
  import { downloadBytes, downloadText } from './lib/fileUtils.js';
  import { addImageToCanvas } from './lib/fabricManager.js';

  import Header from './components/Header.svelte';
  import Footer from './components/Footer.svelte';
  import Toolbar from './components/Toolbar.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import DropZone from './components/DropZone.svelte';
  import PdfViewer from './components/PdfViewer.svelte';
  import PageThumbnails from './components/PageThumbnails.svelte';

  import MergeModal from './components/modals/MergeModal.svelte';
  import SplitModal from './components/modals/SplitModal.svelte';
  import WatermarkModal from './components/modals/WatermarkModal.svelte';
  import MetadataModal from './components/modals/MetadataModal.svelte';
  import PageNumbersModal from './components/modals/PageNumbersModal.svelte';
  import CompressModal from './components/modals/CompressModal.svelte';
  import OcrModal from './components/modals/OcrModal.svelte';
  import SignatureModal from './components/modals/SignatureModal.svelte';
  import FindReplace from './components/tools/FindReplace.svelte';

  let tr = $derived($t);
  let store = $derived($pdfStore);
  let tools = $derived($toolStore);

  // Modals
  let showMerge = $state(false);
  let showSplit = $state(false);
  let showWatermark = $state(false);
  let showMetadata = $state(false);
  let showPageNumbers = $state(false);
  let showCompress = $state(false);
  let showOcr = $state(false);
  let showSignature = $state(false);
  let showFindReplace = $state(false);

  let pdfViewer;

  onMount(() => {
    theme.init();
    locale.init();
  });

  async function handleFileSelect(file) {
    pdfStore.setLoading(true);
    try {
      const bytes = await readFileAsArrayBuffer(file);
      const doc = await loadPdfLib(bytes);
      const metadata = await getMetadata(doc);
      pdfStore.loadFile(file, bytes, doc.getPageCount(), metadata);
      historyStore.clear();
    } catch (err) {
      pdfStore.setError('Failed to load PDF: ' + err.message);
    }
  }

  async function handleDownload() {
    if (!store.pdfBytes) return;

    // Save current fabric state
    if (pdfViewer) pdfViewer.saveFabricState();

    try {
      let bytes = store.pdfBytes;

      // Flatten text edits directly into the PDF (real PDF text, no image layers)
      const edits = [];
      for (let i = 0; i < store.pages.length; i++) {
        const page = store.pages[i];
        if (page.fabricJson && !page.deleted && !page.isBlank) {
          edits.push({ pageIndex: page.pageNum - 1, fabricJson: page.fabricJson });
        }
      }
      if (edits.length > 0) {
        bytes = await flattenAnnotationsIntoPdf(bytes, edits);
      }

      // Apply rotations
      const rotations = store.pages
        .map((p, i) => ({ pageIndex: i, rotation: p.rotation }))
        .filter(r => r.rotation !== 0);
      if (rotations.length > 0) {
        bytes = await rotatePagesInPdf(bytes, rotations);
      }

      // Apply deletions and reorder
      const activeIndices = store.pages
        .map((p, i) => ({ ...p, idx: i }))
        .filter(p => !p.deleted)
        .map(p => p.isBlank ? -1 : p.pageNum - 1)
        .filter(i => i >= 0);

      if (activeIndices.length < store.pages.filter(p => !p.isBlank).length) {
        bytes = await deletePages(bytes, activeIndices);
      }

      const name = store.fileName.replace('.pdf', '_edited.pdf');
      downloadBytes(bytes, name);
    } catch (err) {
      alert('Error saving: ' + err.message);
    }
  }

  async function handlePdfToImage() {
    if (!store.pdfBytes) return;
    try {
      const pdfDoc = await loadPdfDocument(store.pdfBytes);
      const canvas = document.createElement('canvas');
      await renderPage(pdfDoc, store.currentPage, canvas, 2);
      const link = document.createElement('a');
      link.download = `page_${store.currentPage}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  async function handlePdfToText() {
    if (!store.pdfBytes) return;
    try {
      const pdfDoc = await loadPdfDocument(store.pdfBytes);
      const pages = await extractAllText(pdfDoc);
      const text = pages.map(p => `--- Page ${p.pageNum} ---\n${p.text}`).join('\n\n');
      downloadText(text, store.fileName.replace('.pdf', '.txt'));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  async function handleFillForms() {
    // For now, form filling is handled via the PDF viewer itself
    alert('Form fields will be detected automatically when you open a PDF with forms. Click on form fields to fill them.');
  }

  async function handleFlattenForms() {
    if (!store.pdfBytes) return;
    try {
      const bytes = await flattenForm(store.pdfBytes);
      pdfStore.updatePdfBytes(bytes);
      pdfStore.setModified(true);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  function handleImageAdd() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const fc = pdfViewer?.getFabricCanvas();
        if (fc) {
          await addImageToCanvas(fc, reader.result, 100, 100);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  function handleSignatureApply(dataUrl) {
    const fc = pdfViewer?.getFabricCanvas();
    if (fc) {
      addImageToCanvas(fc, dataUrl, 100, 400, 200);
    }
  }

  // Keyboard shortcuts
  function handleKeyDown(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'z':
          e.preventDefault();
          historyStore.undo();
          break;
        case 'y':
          e.preventDefault();
          historyStore.redo();
          break;
        case 's':
          e.preventDefault();
          handleDownload();
          break;
        case 'f':
          e.preventDefault();
          showFindReplace = !showFindReplace;
          break;
      }
    }
    if (e.key === '+' || e.key === '=') {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        pdfStore.setZoom(store.zoom + 0.1);
      }
    }
    if (e.key === '-') {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        pdfStore.setZoom(store.zoom - 0.1);
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="app">
  <Header />

  {#if store.fileName}
    <Toolbar
      onSave={handleDownload}
      onDownload={handleDownload}
    />
  {/if}

  <main class="main">
    {#if !store.fileName && !store.isLoading}
      <DropZone onFileSelect={handleFileSelect} />
    {:else}
      {#if tools.thumbnailsOpen}
        <PageThumbnails />
      {/if}

      <PdfViewer bind:this={pdfViewer} />

      {#if tools.sidebarOpen}
        <Sidebar
          onMerge={() => showMerge = true}
          onSplit={() => showSplit = true}
          onWatermark={() => showWatermark = true}
          onMetadata={() => showMetadata = true}
          onPageNumbers={() => showPageNumbers = true}
          onCompress={() => showCompress = true}
          onOcr={() => showOcr = true}
          onSignature={() => showSignature = true}
          onPdfToImage={handlePdfToImage}
          onPdfToText={handlePdfToText}
          onFillForms={handleFillForms}
          onFlattenForms={handleFlattenForms}
          onFindReplace={() => showFindReplace = !showFindReplace}
          onImageAdd={handleImageAdd}
        />
      {/if}
    {/if}
  </main>

  <Footer />

  <!-- Modals -->
  {#if showMerge}
    <MergeModal onClose={() => showMerge = false} onMerged={(bytes) => { /* optionally load merged */ }} />
  {/if}

  {#if showSplit}
    <SplitModal onClose={() => showSplit = false} />
  {/if}

  {#if showWatermark}
    <WatermarkModal onClose={() => showWatermark = false} />
  {/if}

  {#if showMetadata}
    <MetadataModal onClose={() => showMetadata = false} />
  {/if}

  {#if showPageNumbers}
    <PageNumbersModal onClose={() => showPageNumbers = false} />
  {/if}

  {#if showCompress}
    <CompressModal onClose={() => showCompress = false} />
  {/if}

  {#if showOcr}
    <OcrModal onClose={() => showOcr = false} />
  {/if}

  {#if showSignature}
    <SignatureModal onClose={() => showSignature = false} onApply={handleSignatureApply} />
  {/if}

  {#if showFindReplace}
    <FindReplace onClose={() => showFindReplace = false} />
  {/if}
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  .main {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }
</style>
