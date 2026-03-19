<script>
  import { t } from '../stores/i18n.js';
  import { pdfStore } from '../stores/pdfStore.js';
  import { toolStore } from '../stores/toolStore.js';

  let {
    onMerge, onSplit, onWatermark, onMetadata,
    onPageNumbers, onCompress, onOcr, onSignature,
    onPdfToImage, onPdfToText, onFillForms, onFlattenForms,
    onFindReplace, onImageAdd,
  } = $props();

  let tr = $derived($t);
  let store = $derived($pdfStore);
  let tools = $derived($toolStore);

  let openSections = $state({ text: true, annotations: false, pages: true, insert: false, convert: false, forms: false });

  function toggleSection(key) {
    openSections = { ...openSections, [key]: !openSections[key] };
  }

  const highlightColors = [
    { color: '#ffff00', key: 'yellow' },
    { color: '#4ade80', key: 'green' },
    { color: '#f472b6', key: 'pink' },
    { color: '#60a5fa', key: 'blue' },
  ];

  const stamps = ['approved', 'draft', 'confidential', 'reviewed'];

  const shapeTypes = [
    { type: 'rectangle', key: 'rectangle' },
    { type: 'circle', key: 'circle' },
    { type: 'arrow', key: 'arrow' },
    { type: 'line', key: 'line' },
  ];
</script>

<aside class="sidebar">
  <div class="sidebar-scroll">
    <!-- Text Settings -->
    {#if tools.activeTool === 'text-edit' || tools.activeTool === 'text-add'}
      <section class="section">
        <button class="section-header" onclick={() => toggleSection('text')}>
          <span>{tr('sectionText')}</span>
          <svg class="chevron" class:open={openSections.text} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {#if openSections.text}
          <div class="section-body">
            <label class="field">
              <span class="field-label">{tr('fontFamily')}</span>
              <select value={tools.textSettings.fontFamily} onchange={(e) => toolStore.updateTextSettings({ fontFamily: e.target.value })}>
                <option value="Helvetica">Helvetica</option>
                <option value="Times-Roman">Times Roman</option>
                <option value="Courier">Courier</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </select>
            </label>
            <div class="field-row">
              <label class="field" style="flex:1">
                <span class="field-label">{tr('fontSize')}</span>
                <input type="number" min="8" max="120" value={tools.textSettings.fontSize} onchange={(e) => toolStore.updateTextSettings({ fontSize: +e.target.value })} />
              </label>
              <label class="field">
                <span class="field-label">{tr('fontColor')}</span>
                <input type="color" value={tools.textSettings.color} oninput={(e) => toolStore.updateTextSettings({ color: e.target.value })} />
              </label>
            </div>
            <div class="toggle-row">
              <button class="btn-icon btn-sm" class:active={tools.textSettings.bold} onclick={() => toolStore.updateTextSettings({ bold: !tools.textSettings.bold })} title={tr('bold')}>
                <strong>B</strong>
              </button>
              <button class="btn-icon btn-sm" class:active={tools.textSettings.italic} onclick={() => toolStore.updateTextSettings({ italic: !tools.textSettings.italic })} title={tr('italic')}>
                <em>I</em>
              </button>
              <button class="btn-icon btn-sm" class:active={tools.textSettings.underline} onclick={() => toolStore.updateTextSettings({ underline: !tools.textSettings.underline })} title={tr('underline')}>
                <u>U</u>
              </button>
            </div>
          </div>
        {/if}
      </section>
    {/if}

    <!-- Drawing Settings -->
    {#if tools.activeTool === 'draw'}
      <section class="section">
        <div class="section-header"><span>{tr('toolDraw')}</span></div>
        <div class="section-body">
          <div class="field-row">
            <label class="field">
              <span class="field-label">{tr('penColor')}</span>
              <input type="color" value={tools.drawSettings.color} oninput={(e) => toolStore.updateDrawSettings({ color: e.target.value })} />
            </label>
            <label class="field" style="flex:1">
              <span class="field-label">{tr('penWidth')}</span>
              <input type="range" min="1" max="20" value={tools.drawSettings.width} oninput={(e) => toolStore.updateDrawSettings({ width: +e.target.value })} />
            </label>
          </div>
          <label class="field">
            <span class="field-label">{tr('penOpacity')}</span>
            <input type="range" min="0.1" max="1" step="0.1" value={tools.drawSettings.opacity} oninput={(e) => toolStore.updateDrawSettings({ opacity: +e.target.value })} />
          </label>
        </div>
      </section>
    {/if}

    <!-- Shape Settings -->
    {#if tools.activeTool === 'shapes'}
      <section class="section">
        <div class="section-header"><span>{tr('toolShapes')}</span></div>
        <div class="section-body">
          <div class="shape-grid">
            {#each shapeTypes as shape}
              <button class="btn-ghost btn-sm" class:active={tools.shapeSettings.type === shape.type} onclick={() => toolStore.updateShapeSettings({ type: shape.type })}>
                {tr(shape.key)}
              </button>
            {/each}
          </div>
          <div class="field-row">
            <label class="field">
              <span class="field-label">{tr('strokeColor')}</span>
              <input type="color" value={tools.shapeSettings.strokeColor} oninput={(e) => toolStore.updateShapeSettings({ strokeColor: e.target.value })} />
            </label>
            <label class="field">
              <span class="field-label">{tr('fillColor')}</span>
              <input type="color" value={tools.shapeSettings.fillColor === 'transparent' ? '#ffffff' : tools.shapeSettings.fillColor} oninput={(e) => toolStore.updateShapeSettings({ fillColor: e.target.value })} />
            </label>
          </div>
          <label class="field">
            <span class="field-label">{tr('strokeWidth')}</span>
            <input type="range" min="1" max="10" value={tools.shapeSettings.strokeWidth} oninput={(e) => toolStore.updateShapeSettings({ strokeWidth: +e.target.value })} />
          </label>
        </div>
      </section>
    {/if}

    <!-- Highlight Colors -->
    {#if tools.activeTool === 'highlight'}
      <section class="section">
        <div class="section-header"><span>{tr('toolHighlight')}</span></div>
        <div class="section-body">
          <div class="color-row">
            {#each highlightColors as hc}
              <button
                class="color-swatch"
                class:active={tools.highlightColor === hc.color}
                style="background: {hc.color}"
                onclick={() => toolStore.setHighlightColor(hc.color)}
                title={tr(hc.key)}
              ></button>
            {/each}
          </div>
        </div>
      </section>
    {/if}

    <!-- Stamp Selection -->
    {#if tools.activeTool === 'stamp'}
      <section class="section">
        <div class="section-header"><span>{tr('toolStamp')}</span></div>
        <div class="section-body">
          <div class="stamp-grid">
            {#each stamps as s}
              <button class="btn-ghost btn-sm" class:active={tools.stampType === s} onclick={() => toolStore.setStampType(s)}>
                {tr('stamp' + s.charAt(0).toUpperCase() + s.slice(1))}
              </button>
            {/each}
          </div>
        </div>
      </section>
    {/if}

    <!-- Page Operations -->
    <section class="section">
      <button class="section-header" onclick={() => toggleSection('pages')}>
        <span>{tr('sectionPageOps')}</span>
        <svg class="chevron" class:open={openSections.pages} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {#if openSections.pages}
        <div class="section-body">
          <button class="btn btn-ghost" onclick={onMerge} style="width:100%">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6L12 2 16 6"/><path d="M12 2v10"/><path d="M8 18L12 22 16 18"/><path d="M12 22V12"/></svg>
            {tr('mergePdf')}
          </button>
          <button class="btn btn-ghost" onclick={onSplit} disabled={!store.fileName} style="width:100%">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 12H22"/><path d="M2 12H7"/></svg>
            {tr('splitPdf')}
          </button>
          <div class="btn-row">
            <button class="btn btn-ghost btn-sm" onclick={() => pdfStore.rotatePage(store.currentPage - 1, 90)} disabled={!store.fileName}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6"/><path d="M21 13a9 9 0 11-3-7.7L21 8"/></svg>
              {tr('rotatePage')}
            </button>
            <button class="btn btn-ghost btn-sm" onclick={() => pdfStore.rotateAll(90)} disabled={!store.fileName}>
              {tr('rotateAll')}
            </button>
          </div>
          <button class="btn btn-ghost" onclick={() => pdfStore.deletePage(store.currentPage - 1)} disabled={!store.fileName} style="width:100%">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            {tr('deletePage')}
          </button>
          <button class="btn btn-ghost" onclick={() => pdfStore.insertBlankPage(store.currentPage - 1)} disabled={!store.fileName} style="width:100%">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            {tr('insertBlank')}
          </button>
        </div>
      {/if}
    </section>

    <!-- Insert -->
    <section class="section">
      <button class="section-header" onclick={() => toggleSection('insert')}>
        <span>{tr('sectionInsert')}</span>
        <svg class="chevron" class:open={openSections.insert} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {#if openSections.insert}
        <div class="section-body">
          <button class="btn btn-ghost" onclick={onImageAdd} disabled={!store.fileName} style="width:100%">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            {tr('toolImage')}
          </button>
          <button class="btn btn-ghost" onclick={onSignature} disabled={!store.fileName} style="width:100%">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 17c1-1 3-4 5-4s3 3 5 3 3-2 5-2 3 1 5 1"/><path d="M2 21h20"/></svg>
            {tr('toolSignature')}
          </button>
          <button class="btn btn-ghost" onclick={onWatermark} disabled={!store.fileName} style="width:100%">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            {tr('watermarkTitle')}
          </button>
          <button class="btn btn-ghost" onclick={onFindReplace} disabled={!store.fileName} style="width:100%">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            {tr('findReplace')}
          </button>
          <button class="btn btn-ghost" onclick={onPageNumbers} disabled={!store.fileName} style="width:100%">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3"/><path d="M12 4v16"/><path d="M9 20h6"/></svg>
            {tr('pageNumbersTitle')}
          </button>
          <button class="btn btn-ghost" onclick={onMetadata} disabled={!store.fileName} style="width:100%">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            {tr('metadataTitle')}
          </button>
        </div>
      {/if}
    </section>

    <!-- Convert & Export -->
    <section class="section">
      <button class="section-header" onclick={() => toggleSection('convert')}>
        <span>Export & Convert</span>
        <svg class="chevron" class:open={openSections.convert} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {#if openSections.convert}
        <div class="section-body">
          <button class="btn btn-ghost" onclick={onPdfToImage} disabled={!store.fileName} style="width:100%">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            {tr('pdfToImage')}
          </button>
          <button class="btn btn-ghost" onclick={onCompress} disabled={!store.fileName} style="width:100%">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {tr('compressPdf')}
          </button>
          <button class="btn btn-ghost" onclick={onOcr} disabled={!store.fileName} style="width:100%">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
            {tr('ocrExtract')}
          </button>
          <button class="btn btn-ghost" onclick={onPdfToText} disabled={!store.fileName} style="width:100%">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            {tr('pdfToText')}
          </button>
        </div>
      {/if}
    </section>

    <!-- Forms -->
    <section class="section">
      <button class="section-header" onclick={() => toggleSection('forms')}>
        <span>{tr('formFields')}</span>
        <svg class="chevron" class:open={openSections.forms} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {#if openSections.forms}
        <div class="section-body">
          <button class="btn btn-ghost" onclick={onFillForms} disabled={!store.fileName} style="width:100%">
            {tr('fillForms')}
          </button>
          <button class="btn btn-ghost" onclick={onFlattenForms} disabled={!store.fileName} style="width:100%">
            {tr('flattenForms')}
          </button>
        </div>
      {/if}
    </section>
  </div>
</aside>

<style>
  .sidebar {
    width: 260px;
    min-width: 260px;
    background: var(--bg-secondary);
    border-left: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sidebar-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .section {
    margin-bottom: 4px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    background: none;
    color: var(--text-primary);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .section-header:hover { background: var(--bg-hover); }

  .chevron {
    color: var(--text-muted);
    transition: transform 0.2s ease;
  }
  .chevron.open { transform: rotate(180deg); }

  .section-body {
    padding: 6px 4px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .field-label {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 500;
  }

  .field-row {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }

  .toggle-row {
    display: flex;
    gap: 4px;
  }

  .btn-row {
    display: flex;
    gap: 4px;
  }

  .color-row {
    display: flex;
    gap: 6px;
  }

  .color-swatch {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .color-swatch:hover { transform: scale(1.15); }
  .color-swatch.active { border-color: var(--text-primary); box-shadow: 0 0 0 2px var(--bg-secondary); }

  .shape-grid, .stamp-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
  }

  .btn-ghost.active {
    background: var(--accent-light);
    color: var(--accent);
    border-color: var(--accent);
  }

  @media (max-width: 768px) {
    .sidebar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      max-height: 50vh;
      border-left: none;
      border-top: 1px solid var(--border-color);
      z-index: 50;
    }
  }
</style>
