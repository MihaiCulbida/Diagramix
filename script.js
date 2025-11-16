const pageTitle = document.getElementById("page-title");
const modal = document.getElementById("rename-modal");
const cancelBtn = document.getElementById("cancel-btn");
const saveBtn = document.getElementById("save-btn");
const newTitleInput = document.getElementById("new-title");
const grid = document.getElementById("grid");
const gridContainer = document.getElementById("grid-container");
const deleteBtn = document.getElementById("delete-btn");
const undoBtn = document.getElementById("undo-btn");
const redoBtn = document.getElementById("redo-btn");
const selectionBox = document.getElementById("selection-box");
const gridToggleImg = document.getElementById("gridToggleImg");
const snapToggleImg = document.getElementById("snapToggleImg");
const addPageBtn = document.getElementById("add-page-btn");
const pageTabsContainer = document.getElementById("page-tabs-container");
const iconBox = document.querySelector('.icon-box');
const figuresImg = document.querySelector('.figure-img');
const binImg = document.querySelector('.bin-img');
const stepImgs = document.querySelectorAll('.steps-img');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const mainHeader = document.querySelector('.main-header');
const pageFooter = document.querySelector('.page-footer');
const shapeFillColor = document.getElementById('shape-fill-color');
const shapeTransparent = document.getElementById('shape-transparent');
const shapeStrokeColor = document.getElementById('shape-stroke-color');
const shapeStrokeWidth = document.getElementById('shape-stroke-width');
const strokeWidthValue = document.getElementById('stroke-width-value');
const textBoldBtn = document.getElementById('text-bold');
const textItalicBtn = document.getElementById('text-italic');
const textUnderlineBtn = document.getElementById('text-underline');
const textAlignLeft = document.getElementById('text-align-left');
const textAlignCenter = document.getElementById('text-align-center');
const textAlignRight = document.getElementById('text-align-right');
const textSize = document.getElementById('text-size');
const textSizeValue = document.getElementById('text-size-value');
const textColor = document.getElementById('text-color');
const textLineHeight = document.getElementById('text-line-height');
const lineHeightValue = document.getElementById('line-height-value');
const gridBtn = document.getElementById('grid-btn');
const overlay = document.getElementById('grid-box-overlay');
const gridBox = document.getElementById('grid-box');
const notesIcon = document.getElementById('notesIcon');
const notesBoxEl = document.getElementById('notesBox');
const closeNotesBtn = document.getElementById('closeNotes');
const notesText = document.getElementById('notesText');
const saveNotesBtn = document.getElementById('saveNotes');
const clearNotesBtn = document.getElementById('clearNotes');
const NOTES_KEY = 'bloc_notes';
const layerImgs = document.querySelectorAll('.layers-img');
const toggleIconBoxBtn = document.getElementById('toggleIconBox');
const shapeButtons = document.querySelectorAll('.shape-btn');

let snapToGrid = true;
let gridVisible = true;
const GRID_SIZE = 15;
let selectedShape = null;
let selectedShapes = new Set();
const DEFAULT_SIZE = 120;

let isPanning = false;
let panStart = {x: 0, y: 0};
let panOffset = {x: 0, y: 0};

let pages = [];
let currentPageId = null;

let history = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

function saveState() {
  const state = {
    content: grid.innerHTML,
    selectedShapes: Array.from(selectedShapes).map(s => s.dataset.shapeId || ''),
    timestamp: Date.now()
  };
  
  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1);
  }
  
  history.push(state);
  
  if (history.length > MAX_HISTORY) {
    history.shift();
  } else {
    historyIndex++;
  }
  
  updateUndoRedoButtons();
}

function restoreState(state) {
  if (!state) return;
  
  grid.innerHTML = state.content;
  
  grid.querySelectorAll('.placed-shape').forEach(shape => {
    reattachListeners(shape);
  });
  
  clearSelection();
  state.selectedShapes.forEach(id => {
    const shape = grid.querySelector(`[data-shape-id="${id}"]`);
    if (shape) {
      addToSelection(shape);
    }
  });
}

function undo() {
  if (historyIndex <= 0) return;
  
  historyIndex--;
  restoreState(history[historyIndex]);
  updateUndoRedoButtons();
}

function redo() {
  if (historyIndex >= history.length - 1) return;
  
  historyIndex++;
  restoreState(history[historyIndex]);
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  if (undoBtn) {
    undoBtn.disabled = historyIndex <= 0;
    undoBtn.style.opacity = historyIndex <= 0 ? '0.4' : '1';
  }
  if (redoBtn) {
    redoBtn.disabled = historyIndex >= history.length - 1;
    redoBtn.style.opacity = historyIndex >= history.length - 1 ? '0.4' : '1';
  }
}

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    undo();
  }
  else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault();
    redo();
  }
});

function generateId() {
  return 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function loadPages() {
  
  if (pages.length === 0) {
    const firstPage = {
      id: generateId(),
      name: 'Pagina 1',
      content: '',
      history: [],
      historyIndex: -1
    };
    pages.push(firstPage);
    currentPageId = firstPage.id;
    pageTitle.textContent = 'Pagina 1';
  } else {
    currentPageId = pages[0].id;
  }
  
  savePages();
  renderTabs();
  loadPage(currentPageId);
  saveState(); 
  updateUndoRedoButtons();
}

function getCurrentPage() {
  return pages.find(p => p.id === currentPageId);
}

function savePages() {
}
function savePage() {
  const page = getCurrentPage();
  if (page) {
    page.content = grid.innerHTML;
    page.name = pageTitle.textContent.trim();
    page.history = history;
    page.historyIndex = historyIndex;

  }
}

function loadPage(pageId) {
  savePage();
  
  currentPageId = pageId;
  const page = getCurrentPage();
  
  if (page) {
    grid.innerHTML = page.content;
    pageTitle.textContent = page.name;
    
    history = page.history || [];
    historyIndex = page.historyIndex !== undefined ? page.historyIndex : -1;
    
    grid.querySelectorAll('.placed-shape').forEach(shape => {
      reattachListeners(shape);
    });
    
    clearSelection();
    renderTabs();
    updateUndoRedoButtons();
  }
}

function deletePage(pageId) {
  if (pages.length === 1) {
    alert('Nu poți șterge ultima pagină!');
    return;
  }
  
  const index = pages.findIndex(p => p.id === pageId);
  if (index !== -1) {
    pages.splice(index, 1);
    
    if (currentPageId === pageId) {
      const newIndex = Math.max(0, index - 1);
      loadPage(pages[newIndex].id);
    }
    
    savePages();
    renderTabs();
  }
}

function renderTabs() {
  pageTabsContainer.innerHTML = '';
  
  pages.forEach(page => {
    const tab = document.createElement('div');
    tab.className = 'page-tab' + (page.id === currentPageId ? ' active' : '');
    
    const name = document.createElement('span');
    name.className = 'page-tab-name';
    name.textContent = page.name;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'page-tab-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      deletePage(page.id);
    };
    
    tab.appendChild(name);
    tab.appendChild(closeBtn);
    
    tab.onclick = () => loadPage(page.id);
    
    pageTabsContainer.appendChild(tab);
  });
}

function addNewPage() {
  savePage();
  
  const newPage = {
    id: generateId(),
    name: `Pagina ${pages.length + 1}`,
    content: '',
    history: [],
    historyIndex: -1
  };
  pages.push(newPage);
  
  currentPageId = newPage.id;
  grid.innerHTML = '';
  pageTitle.textContent = newPage.name;
  
  history = [];
  historyIndex = -1;
  
  clearSelection();
  renderTabs();
  updateUndoRedoButtons();
  
  saveState();
}

addPageBtn.addEventListener('click', addNewPage);

if (gridToggleImg) {
  gridToggleImg.style.cursor = 'pointer';
  gridToggleImg.addEventListener('click', (e) => {
    e.preventDefault();
    gridVisible = !gridVisible;
    
    if (gridVisible) {
      grid.classList.remove('hidden-grid');
      gridToggleImg.src = 'grid.png';
    } else {
      grid.classList.add('hidden-grid');
      gridToggleImg.src = 'grid-off.png';
    }
  });
}

if (snapToggleImg) {
  snapToggleImg.style.cursor = 'pointer';
  snapToggleImg.addEventListener('click', (e) => {
    e.preventDefault();
    snapToGrid = !snapToGrid;
    
    if (snapToGrid) {
      snapToggleImg.src = 'align.png';
    } else {
      snapToggleImg.src = 'align-off.png';
    }
  });
}

function snapToGridValue(value) {
  if (!snapToGrid) return value;
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

if (pageTitle) {
  pageTitle.addEventListener("click", () => {
    newTitleInput.value = pageTitle.textContent.trim();
    modal.style.display = "flex";
    newTitleInput.focus();
  });
}

function hideModal() {
  modal.style.display = "none";
}

if (cancelBtn) cancelBtn.onclick = hideModal;
if (saveBtn) {
  saveBtn.onclick = () => {
    const newName = newTitleInput.value.trim();
    if (newName) {
      pageTitle.textContent = newName;
      savePage();
      renderTabs();
    }
    hideModal();
  };
}

window.onclick = (e) => {
  if (e.target === modal) hideModal();
};

newTitleInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const newName = newTitleInput.value.trim();
    if (newName) {
      pageTitle.textContent = newName;
      savePage();
      renderTabs();
    }
    hideModal();
  }
});

let currentShapeStyles = {
  fill: '#ffffff',
  stroke: '#111111',
  strokeWidth: 2,
  transparent: false
};

let currentTextStyles = {
  bold: false,
  italic: false,
  underline: false,
  align: 'center',
  size: 14,
  color: '#111111',
  lineHeight: 1.4
};

if (shapeFillColor) {
  shapeFillColor.addEventListener('input', (e) => {
    currentShapeStyles.fill = e.target.value;
    applyStylesToSelectedShapes();
  });
}

if (shapeTransparent) {
  shapeTransparent.addEventListener('change', (e) => {
    currentShapeStyles.transparent = e.target.checked;
    applyStylesToSelectedShapes();
  });
}

if (shapeStrokeColor) {
  shapeStrokeColor.addEventListener('input', (e) => {
    currentShapeStyles.stroke = e.target.value;
    applyStylesToSelectedShapes();
  });
}

if (shapeStrokeWidth) {
  shapeStrokeWidth.addEventListener('input', (e) => {
    currentShapeStyles.strokeWidth = e.target.value;
    if (strokeWidthValue) strokeWidthValue.textContent = e.target.value + 'px';
    applyStylesToSelectedShapes();
  });
}

if (textBoldBtn) {
  textBoldBtn.addEventListener('click', () => {
    currentTextStyles.bold = !currentTextStyles.bold;
    textBoldBtn.classList.toggle('active');
    applyStylesToSelectedShapes();
  });
}

if (textItalicBtn) {
  textItalicBtn.addEventListener('click', () => {
    currentTextStyles.italic = !currentTextStyles.italic;
    textItalicBtn.classList.toggle('active');
    applyStylesToSelectedShapes();
  });
}

if (textUnderlineBtn) {
  textUnderlineBtn.addEventListener('click', () => {
    currentTextStyles.underline = !currentTextStyles.underline;
    textUnderlineBtn.classList.toggle('active');
    applyStylesToSelectedShapes();
  });
}

if (textAlignLeft) {
  textAlignLeft.addEventListener('click', () => {
    currentTextStyles.align = 'left';
    document.querySelectorAll('.text-align-btn').forEach(b => b.classList.remove('active'));
    textAlignLeft.classList.add('active');
    applyStylesToSelectedShapes();
  });
}

if (textAlignCenter) {
  textAlignCenter.addEventListener('click', () => {
    currentTextStyles.align = 'center';
    document.querySelectorAll('.text-align-btn').forEach(b => b.classList.remove('active'));
    textAlignCenter.classList.add('active');
    applyStylesToSelectedShapes();
  });
}

if (textAlignRight) {
  textAlignRight.addEventListener('click', () => {
    currentTextStyles.align = 'right';
    document.querySelectorAll('.text-align-btn').forEach(b => b.classList.remove('active'));
    textAlignRight.classList.add('active');
    applyStylesToSelectedShapes();
  });
}

if (textSize) {
  textSize.addEventListener('input', (e) => {
    currentTextStyles.size = e.target.value;
    if (textSizeValue) textSizeValue.textContent = e.target.value + 'px';
    applyStylesToSelectedShapes();
  });
}

if (textColor) {
  textColor.addEventListener('input', (e) => {
    currentTextStyles.color = e.target.value;
    applyStylesToSelectedShapes();
  });
}

if (textLineHeight) {
  textLineHeight.addEventListener('input', (e) => {
    currentTextStyles.lineHeight = e.target.value;
    if (lineHeightValue) lineHeightValue.textContent = e.target.value;
    applyStylesToSelectedShapes();
  });
}

function applyStylesToSelectedShapes() {
  selectedShapes.forEach(shape => {
    applyStylesToShape(shape);
  });
  savePage();
}

function applyStylesToShape(shape) {
  const svg = shape.querySelector('svg');
  const textDiv = shape.querySelector('.shape-text');
  
if (svg) {
    if (shape.classList.contains('line-type')) {
      const pathElements = svg.querySelectorAll('path');
      const polygonElements = svg.querySelectorAll('polygon');
      
      pathElements.forEach(el => {
        el.setAttribute('stroke', currentShapeStyles.stroke);
        el.setAttribute('stroke-width', currentShapeStyles.strokeWidth);
      });
      
      polygonElements.forEach(el => {
        el.setAttribute('fill', currentShapeStyles.stroke);
      });
    } else {
      const svgElements = svg.querySelectorAll('rect, polygon, path');
      const lineElements = svg.querySelectorAll('line'); 
      
      svgElements.forEach(el => {
        if (currentShapeStyles.transparent) {
          el.setAttribute('fill', 'transparent');
        } else {
          el.setAttribute('fill', currentShapeStyles.fill);
        }
        el.setAttribute('stroke', currentShapeStyles.stroke);
        el.setAttribute('stroke-width', currentShapeStyles.strokeWidth);
      });

      lineElements.forEach(el => {
        el.setAttribute('stroke', currentShapeStyles.stroke);
        el.setAttribute('stroke-width', currentShapeStyles.strokeWidth);
      });
    }
  }
  
if (textDiv) {
    textDiv.style.fontWeight = currentTextStyles.bold ? 'bold' : 'normal';
    textDiv.style.fontStyle = currentTextStyles.italic ? 'italic' : 'normal';
    textDiv.style.textDecoration = currentTextStyles.underline ? 'underline' : 'none';
    textDiv.style.textAlign = currentTextStyles.align;
    textDiv.style.fontSize = currentTextStyles.size + 'px';
    textDiv.style.color = currentTextStyles.color;
    textDiv.style.lineHeight = currentTextStyles.lineHeight;
    
    if (currentTextStyles.align === 'left') {
      textDiv.style.justifyContent = 'flex-start';
      textDiv.style.alignItems = 'center';
    } else if (currentTextStyles.align === 'right') {
      textDiv.style.justifyContent = 'flex-end';
      textDiv.style.alignItems = 'center'; 
    } else {
      textDiv.style.justifyContent = 'center';
      textDiv.style.alignItems = 'center';
    }
    
    if (shape.classList.contains('text-only')) {
      shape.style.display = 'flex';
      if (currentTextStyles.align === 'left') {
        shape.style.justifyContent = 'flex-start';
      } else if (currentTextStyles.align === 'right') {
        shape.style.justifyContent = 'flex-end';
      } else {
        shape.style.justifyContent = 'center';
      }
    }
  }
}

function openBox() {
  if (!gridBox) return;
  gridBox.style.display = 'block';
  gridBox.hidden = false;
  gridBox.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    gridBox.getBoundingClientRect();
    gridBox.classList.add('open');
  });
}

function closeBox() {
  if (!gridBox) return;
  gridBox.classList.remove('open');
  gridBox.setAttribute('aria-hidden', 'true');
  const onEnd = (ev) => {
    if (ev && ev.target !== gridBox) return;
    gridBox.hidden = true;
    gridBox.removeEventListener('transitionend', onEnd);
  };
  gridBox.addEventListener('transitionend', onEnd);
  
  setTimeout(() => {
    if (!gridBox.classList.contains('open')) {
      gridBox.hidden = true;
    }
  }, 500);
}


gridContainer.addEventListener('pointerdown', (e) => {
  if (!e.ctrlKey || e.button !== 0) {
    return;
  }
  
  if (e.target.classList.contains('placed-shape') || 
      e.target.closest('.placed-shape')) {
    return;
  }
  
  isPanning = true;
  panStart.x = e.clientX - panOffset.x;
  panStart.y = e.clientY - panOffset.y;
  gridContainer.style.cursor = 'grabbing';
  e.preventDefault();
  e.stopPropagation();
});

document.addEventListener('pointerup', (e) => {
  if (isPanning) {
    isPanning = false;
    gridContainer.style.cursor = '';
  }
});

document.addEventListener('pointermove', (e) => {
  if (isPanning) {
    e.preventDefault();
    panOffset.x = e.clientX - panStart.x;
    panOffset.y = e.clientY - panStart.y;

    if (grid) {
      grid.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px)`;
      grid.style.willChange = 'transform';
    }

    return; 
  }

});

shapeButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const shape = btn.dataset.shape;
    if (selectedShape === shape) {
      selectedShape = null;
      btn.classList.remove('active');
    } else {
      shapeButtons.forEach(b => b.classList.remove('active'));
      selectedShape = shape;
      btn.classList.add('active');
    }
  });

  btn.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('shape', btn.dataset.shape);
    e.dataTransfer.effectAllowed = 'copy';
  });
});

function createShape(type) {
  const shape = document.createElement('div');
  shape.className = 'placed-shape';
  shape.dataset.shape = type;
  shape.dataset.shapeId = 'shape_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  if (type === 'text') {
    shape.classList.add('text-only');
    shape.style.width = '150px';
    shape.style.height = '40px';
    shape.innerHTML = '<div class="shape-text" contenteditable="false">Text</div>';
    
    const textDiv = shape.querySelector('.shape-text');
    
    ['nw','ne','se','sw'].forEach(dir => {
      const handle = document.createElement('div');
      handle.className = 'resize-handle ' + dir;
      handle.dataset.dir = dir;
      shape.appendChild(handle);
    });
    
    setupTextInteraction(shape, textDiv);
    setupDragging(shape, textDiv);
    setupResizing(shape);
    
    return shape;
  }
  
if (type === 'arrow' || type === 'line') {
  shape.classList.add('line-type');
  shape.style.width = '200px';
  shape.style.height = '20px';
  shape.style.pointerEvents = 'none';
  
  const points = [
    {x: 15, y: 10},
    {x: 215, y: 10}
  ];
  shape.dataset.points = JSON.stringify(points);
  
  updateLineSVG(shape, type);
  setupLineInteraction(shape, type);
  
  return shape;
}
  
  let w = DEFAULT_SIZE;
  let h = DEFAULT_SIZE * 0.6;
  
  if (type === 'rhombus') {
    w = h = DEFAULT_SIZE * 0.8;
  } else if (type === 'document') {
    h = DEFAULT_SIZE * 0.75;
  }
  
  shape.style.width = w + 'px';
  shape.style.height = h + 'px';

  let svg = '';
  if (type === 'terminator') {
    svg = '<svg viewBox="0 0 48 32" preserveAspectRatio="none"><rect x="2" y="2" width="44" height="28" rx="14" fill="white" stroke="#111" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
  } else if (type === 'rect') {
    svg = '<svg viewBox="0 0 48 32" preserveAspectRatio="none"><rect x="2" y="2" width="44" height="28" fill="white" stroke="#111" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
  } else if (type === 'rhombus') {
    svg = '<svg viewBox="0 0 40 40" preserveAspectRatio="none"><polygon points="20,2 38,20 20,38 2,20" fill="white" stroke="#111" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
  } else if (type === 'document') {
    svg = '<svg viewBox="0 0 48 40" preserveAspectRatio="none"><path d="M 2 2 L 46 2 L 46 34 Q 36 30, 24 34 Q 12 38, 2 34 Z" fill="white" stroke="#111" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
  } else if (type === 'hexagon') {
    svg = '<svg viewBox="0 0 48 32" preserveAspectRatio="none"><polygon points="10,2 38,2 46,16 38,30 10,30 2,16" fill="white" stroke="#111" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
  } else if (type === 'paralelogram') {
    svg = '<svg viewBox="0 0 48 32" preserveAspectRatio="none"><polygon points="8,2 46,2 40,30 2,30" fill="white" stroke="#111" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
  } else if (type === 'file') {
  svg = '<svg viewBox="0 0 48 32" preserveAspectRatio="none"><rect x="2" y="2" width="44" height="28" rx="2" fill="white" stroke="#111" stroke-width="2" vector-effect="non-scaling-stroke"/><line x1="8" y1="2" x2="8" y2="30" stroke="#111" stroke-width="2" vector-effect="non-scaling-stroke"/><line x1="40" y1="2" x2="40" y2="30" stroke="#111" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
  }

  shape.innerHTML = svg + '<div class="shape-text" contenteditable="false"></div>';

  const textDiv = shape.querySelector('.shape-text');
  
  textDiv.style.fontSize = currentTextStyles.size + 'px';
  textDiv.style.color = currentTextStyles.color;
  textDiv.style.textAlign = currentTextStyles.align;
  textDiv.style.lineHeight = currentTextStyles.lineHeight;

  ['nw','ne','se','sw'].forEach(dir => {
    const handle = document.createElement('div');
    handle.className = 'resize-handle ' + dir;
    handle.dataset.dir = dir;
    shape.appendChild(handle);
  });

['n','e','s','w'].forEach(dir => {
  const handle = document.createElement('div');
  handle.className = 'resize-handle ' + dir;
  handle.dataset.dir = dir;
  shape.appendChild(handle);
});

  setupTextInteraction(shape, textDiv);
  setupDragging(shape, textDiv);
  setupResizing(shape);

  return shape;
}

function reattachListeners(shape) {
  const textDiv = shape.querySelector('.shape-text');
  const type = shape.dataset.shape;
  
  if (type === 'arrow' || type === 'line') {
    setupLineInteraction(shape, type);
  } else if (textDiv) {
    setupTextInteraction(shape, textDiv);
    setupDragging(shape, textDiv);
    setupResizing(shape);
  }
}

function updateLineSVG(shape, type) {
  const points = JSON.parse(shape.dataset.points);
  const isArrow = type === 'arrow';

  const currentStroke = currentShapeStyles.stroke;
  const currentStrokeWidth = currentShapeStyles.strokeWidth;
  
  const minX = Math.min(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxX = Math.max(...points.map(p => p.x));
  const maxY = Math.max(...points.map(p => p.y));
  
  const padding = 15;
  const width = Math.max(maxX - minX + padding * 2, 20);
  const height = Math.max(maxY - minY + padding * 2, 20);
  
  let pathD = `M ${points[0].x - minX + padding} ${points[0].y - minY + padding}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x - minX + padding} ${points[i].y - minY + padding}`;
  }
  
const lastPoint = points[points.length - 1];
const secondLast = points[points.length - 2] || points[0];
const angle = Math.atan2(lastPoint.y - secondLast.y, lastPoint.x - secondLast.x);
const arrowSize = 10;

let arrowPath = '';
let adjustedPathD = pathD; 

if (isArrow) {
  const stopX = lastPoint.x - minX + padding - arrowSize * Math.cos(angle) * 0.7;
  const stopY = lastPoint.y - minY + padding - arrowSize * Math.sin(angle) * 0.7;
  
  adjustedPathD = `M ${points[0].x - minX + padding} ${points[0].y - minY + padding}`;
  for (let i = 1; i < points.length - 1; i++) {
    adjustedPathD += ` L ${points[i].x - minX + padding} ${points[i].y - minY + padding}`;
  }
  adjustedPathD += ` L ${stopX} ${stopY}`;
  
  const lastX = lastPoint.x - minX + padding;
  const lastY = lastPoint.y - minY + padding;
  const ax1 = lastX - arrowSize * Math.cos(angle - Math.PI / 6);
  const ay1 = lastY - arrowSize * Math.sin(angle - Math.PI / 6);
  const ax2 = lastX - arrowSize * Math.cos(angle + Math.PI / 6);
  const ay2 = lastY - arrowSize * Math.sin(angle + Math.PI / 6);
  arrowPath = `<polygon points="${lastX},${lastY} ${ax1},${ay1} ${ax2},${ay2}" fill="${currentStroke}"/>`;
}
  
  shape.style.width = width + 'px';
  shape.style.height = height + 'px';
  
shape.innerHTML = `<svg viewBox="0 0 ${width} ${height}" style="overflow: visible; width: 100%; height: 100%;">
  <path d="${isArrow ? adjustedPathD : pathD}" fill="none" stroke="${currentStroke}" stroke-width="${currentStrokeWidth}" vector-effect="non-scaling-stroke"/>
  ${arrowPath}
</svg>`;
  
  shape.querySelectorAll('.line-point, .line-segment').forEach(p => p.remove());

  [0, points.length - 1].forEach(idx => {
    const point = points[idx];
    const dot = document.createElement('div');
    dot.className = 'line-point';
    dot.dataset.index = idx;
    dot.style.left = (point.x - minX + padding) + 'px';
    dot.style.top = (point.y - minY + padding) + 'px';
    shape.appendChild(dot);
  });

  for (let i = 1; i < points.length - 1; i++) {
    const point = points[i];
    const dot = document.createElement('div');
    dot.className = 'line-segment';
    dot.dataset.index = i;
    dot.style.left = (point.x - minX + padding) + 'px';
    dot.style.top = (point.y - minY + padding) + 'px';
    shape.appendChild(dot);
  }
}
function setupLineInteraction(shape, type) {
  shape.style.pointerEvents = 'auto';
  
  shape.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('line-point')) return;
    
    if (!e.ctrlKey && !selectedShapes.has(shape)) {
      clearSelection();
    }
    
    addToSelection(shape);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = shape.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    const startLeft = rect.left - gridRect.left;
    const startTop = rect.top - gridRect.top;
    
    e.stopPropagation();
    
    function onMove(ev) {
      ev.preventDefault();
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      
      const newLeft = snapToGridValue(startLeft + dx);
      const newTop = snapToGridValue(startTop + dy);
      shape.style.left = newLeft + 'px';
      shape.style.top = newTop + 'px';
    }
    
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      saveState(); 
      savePage();
    }
    
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
  
shape.addEventListener('dblclick', (e) => {
  if (e.target.classList.contains('line-point') || e.target.classList.contains('line-segment')) {
    return;
  }
  
  if (!shape.classList.contains('line-type')) {
    return;
  }
  
  if (e.target !== shape && e.target.tagName !== 'svg' && e.target.tagName !== 'path' && e.target.tagName !== 'polygon') {
    return;
  }
  
  e.stopPropagation();
  
  const rect = shape.getBoundingClientRect();
  const points = JSON.parse(shape.dataset.points);
  const minX = Math.min(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const padding = 15;
  
  const clickX = e.clientX - rect.left - padding + minX;
  const clickY = e.clientY - rect.top - padding + minY;
  const newPoint = {x: clickX, y: clickY};
  
  let insertIndex = 1;
  let minDist = Infinity;
  
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dist = distanceToSegment(newPoint, p1, p2);
    if (dist < minDist) {
      minDist = dist;
      insertIndex = i + 1;
    }
  }
  
  points.splice(insertIndex, 0, newPoint);
  shape.dataset.points = JSON.stringify(points);
  updateLineSVG(shape, type);
  setupPointDragging(shape, type);
  saveState();
  savePage();
});
  
  setupPointDragging(shape, type);
}

function setupPointDragging(shape, type) {
  shape.querySelectorAll('.line-point, .line-segment').forEach(dot => {
    dot.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const idx = parseInt(dot.dataset.index);
      let points = JSON.parse(shape.dataset.points);
      
      if (e.button === 2 && dot.classList.contains('line-segment')) {
        e.preventDefault();
        if (points.length > 2) {
          points.splice(idx, 1);
          shape.dataset.points = JSON.stringify(points);
          updateLineSVG(shape, type);
          setupPointDragging(shape, type);
          saveState();
          savePage();
        }
        return;
      }
      
      const gridRect = grid.getBoundingClientRect();
      const shapeRect = shape.getBoundingClientRect();
      
      const initialShapeLeft = shapeRect.left - gridRect.left;
      const initialShapeTop = shapeRect.top - gridRect.top;
      
      const oldMinX = Math.min(...points.map(p => p.x));
      const oldMinY = Math.min(...points.map(p => p.y));
      
      const startX = e.clientX;
      const startY = e.clientY;
      const initialPointX = points[idx].x;
      const initialPointY = points[idx].y;
      
      function onMove(ev) {
        ev.preventDefault();
        
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        
        points[idx].x = initialPointX + dx;
        points[idx].y = initialPointY + dy;
        
        const newMinX = Math.min(...points.map(p => p.x));
        const newMinY = Math.min(...points.map(p => p.y));
        
        const deltaMinX = newMinX - oldMinX;
        const deltaMinY = newMinY - oldMinY;
        
        const padding = 15;
        shape.style.left = (initialShapeLeft + deltaMinX) + 'px';
        shape.style.top = (initialShapeTop + deltaMinY) + 'px';
        
        shape.dataset.points = JSON.stringify(points);
        updateLineSVG(shape, type);
        setupPointDragging(shape, type);
      }
      
      function onUp() {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        saveState();
        savePage();
      }
      
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
    
    if (dot.classList.contains('line-segment')) {
      dot.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });
    }
  });
}

function distanceToSegment(point, p1, p2) {
  const A = point.x - p1.x;
  const B = point.y - p1.y;
  const C = p2.x - p1.x;
  const D = p2.y - p1.y;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq != 0) param = dot / lenSq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = p1.x;
    yy = p1.y;
  } else if (param > 1) {
    xx = p2.x;
    yy = p2.y;
  } else {
    xx = p1.x + param * C;
    yy = p1.y + param * D;
  }
  
  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

function setupTextInteraction(shape, textDiv) {
  shape.addEventListener('dblclick', (e) => {
    if (!e.target.classList.contains('resize-handle') && !e.target.classList.contains('line-point')) {
      e.stopPropagation();
      textDiv.contentEditable = 'true';
      textDiv.focus();
    }
  });

  textDiv.addEventListener('blur', () => {
    textDiv.contentEditable = 'false';
    savePage();
  });

  textDiv.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      textDiv.blur();
    }
  });
  
  textDiv.addEventListener('pointerdown', (e) => {
    if (textDiv.contentEditable === 'true') {
      e.stopPropagation();
    }
  });
}

function setupDragging(shape, textDiv) {
  shape.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('resize-handle')) return;
    if (textDiv && textDiv.contentEditable === 'true') return;
    
    if (!e.ctrlKey && !selectedShapes.has(shape)) {
      clearSelection();
    }
    
    addToSelection(shape);
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    const gridRect = grid.getBoundingClientRect();
    const initialPositions = new Map();
    
    selectedShapes.forEach(s => {
      const rect = s.getBoundingClientRect();
      initialPositions.set(s, {
        left: rect.left - gridRect.left,
        top: rect.top - gridRect.top
      });
    });
    
    e.stopPropagation();
    
    function onMove(ev) {
      ev.preventDefault();
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      
      selectedShapes.forEach(s => {
        const initial = initialPositions.get(s);
        if (initial) {
          const newLeft = snapToGridValue(initial.left + dx);
          const newTop = snapToGridValue(initial.top + dy);
          s.style.left = newLeft + 'px';
          s.style.top = newTop + 'px';
        }
      });
    }
    
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      saveState();
      savePage();
    }
    
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
}

function setupResizing(shape) {
  shape.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const dir = handle.dataset.dir;
      const sx = e.clientX;
      const sy = e.clientY;
      const startRect = shape.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();

      function onMove(ev) {
        ev.preventDefault();
        const dx = ev.clientX - sx;
        const dy = ev.clientY - sy;
        let newW = startRect.width;
        let newH = startRect.height;
        let newL = startRect.left - gridRect.left;
        let newT = startRect.top - gridRect.top;

        if (dir === 'se') {
          newW = Math.max(30, startRect.width + dx);
          newH = Math.max(30, startRect.height + dy);
        } else if (dir === 'sw') {
          newW = Math.max(30, startRect.width - dx);
          newH = Math.max(30, startRect.height + dy);
          if (newW >= 30) newL = startRect.left + dx - gridRect.left;
        } else if (dir === 'ne') {
          newW = Math.max(30, startRect.width + dx);
          newH = Math.max(30, startRect.height - dy);
          if (newH >= 30) newT = startRect.top + dy - gridRect.top;
        } else if (dir === 'nw') {
          newW = Math.max(30, startRect.width - dx);
          newH = Math.max(30, startRect.height - dy);
          if (newW >= 30) newL = startRect.left + dx - gridRect.left;
          if (newH >= 30) newT = startRect.top + dy - gridRect.top;
        } else if (dir === 'n') {
          const oldH = newH;
          newH = Math.max(30, startRect.height - dy);
          const deltaH = oldH - newH;
          newT = newT + deltaH;
        } else if (dir === 's') {
          newH = Math.max(30, startRect.height + dy);
        } else if (dir === 'e') {
          newW = Math.max(30, startRect.width + dx);
        } else if (dir === 'w') {
          const oldW = newW;
          newW = Math.max(30, startRect.width - dx);
          const deltaW = oldW - newW;
          newL = newL + deltaW;
        }

        shape.style.width = newW + 'px';
        shape.style.height = newH + 'px';
        shape.style.left = newL + 'px';
        shape.style.top = newT + 'px';
      }

      function onUp() {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        saveState();
        savePage();
      }

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
  });
}

function addToSelection(shape) {
  selectedShapes.add(shape);
  shape.classList.add('placed-selected');
  
  updateStyleControls(shape);
}

function updateStyleControls(shape) {
  const svg = shape.querySelector('svg');
  const textDiv = shape.querySelector('.shape-text');
  
if (svg) {
    if (shape.classList.contains('line-type')) {
      const pathElement = svg.querySelector('path');
      if (pathElement) {
        const stroke = pathElement.getAttribute('stroke');
        const strokeWidth = pathElement.getAttribute('stroke-width');
        
        if (shapeStrokeColor) shapeStrokeColor.value = stroke || '#111111';
        if (shapeStrokeWidth) {
          shapeStrokeWidth.value = strokeWidth || 2;
          if (strokeWidthValue) strokeWidthValue.textContent = (strokeWidth || 2) + 'px';
        }
      }
    } else {
      const svgElement = svg.querySelector('rect, polygon, path');
      if (svgElement) {
        const fill = svgElement.getAttribute('fill');
        const stroke = svgElement.getAttribute('stroke');
        const strokeWidth = svgElement.getAttribute('stroke-width');
        
        if (shapeFillColor) shapeFillColor.value = fill === 'transparent' ? '#ffffff' : fill;
        if (shapeTransparent) shapeTransparent.checked = fill === 'transparent';
        if (shapeStrokeColor) shapeStrokeColor.value = stroke || '#111111';
        if (shapeStrokeWidth) {
          shapeStrokeWidth.value = strokeWidth || 2;
          if (strokeWidthValue) strokeWidthValue.textContent = (strokeWidth || 2) + 'px';
        }
      }
    }
  }
  
  if (textDiv) {
    const isBold = textDiv.style.fontWeight === 'bold';
    const isItalic = textDiv.style.fontStyle === 'italic';
    const isUnderline = textDiv.style.textDecoration === 'underline';
    const align = textDiv.style.textAlign || 'center';
    const size = parseInt(textDiv.style.fontSize) || 14;
    const color = textDiv.style.color || '#111111';
    const lineHeight = parseFloat(textDiv.style.lineHeight) || 1.4;
    
    if (textBoldBtn) textBoldBtn.classList.toggle('active', isBold);
    if (textItalicBtn) textItalicBtn.classList.toggle('active', isItalic);
    if (textUnderlineBtn) textUnderlineBtn.classList.toggle('active', isUnderline);
    
    document.querySelectorAll('.text-align-btn').forEach(b => b.classList.remove('active'));
    if (align === 'left' && textAlignLeft) textAlignLeft.classList.add('active');
    else if (align === 'right' && textAlignRight) textAlignRight.classList.add('active');
    else if (textAlignCenter) textAlignCenter.classList.add('active');
    
    if (textSize) {
      textSize.value = size;
      if (textSizeValue) textSizeValue.textContent = size + 'px';
    }
    if (textColor) textColor.value = rgbToHex(color);
    if (textLineHeight) {
      textLineHeight.value = lineHeight;
      if (lineHeightValue) lineHeightValue.textContent = lineHeight;
    }
  }
}

function rgbToHex(rgb) {
  if (rgb.startsWith('#')) return rgb;
  const match = rgb.match(/\d+/g);
  if (!match) return '#111111';
  return '#' + match.map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

function removeFromSelection(shape) {
  selectedShapes.delete(shape);
  shape.classList.remove('placed-selected');
}

function clearSelection() {
  selectedShapes.forEach(shape => {
    shape.classList.remove('placed-selected');
  });
  selectedShapes.clear();
}

let isSelecting = false;
let selectionStart = {x: 0, y: 0};

if (grid) {
  grid.addEventListener('pointerdown', (e) => {
    if (e.target !== grid) return;
    if (selectedShape) return;
    if (e.ctrlKey) return;  
    
    isSelecting = true;
    const rect = grid.getBoundingClientRect();
    selectionStart.x = e.clientX - rect.left;
    selectionStart.y = e.clientY - rect.top;
    
    selectionBox.style.left = selectionStart.x + 'px';
    selectionBox.style.top = selectionStart.y + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';
    
    if (!e.ctrlKey) {
      clearSelection();
    }
    
    e.stopPropagation();
  });
}

document.addEventListener('pointermove', (e) => {
  if (!isSelecting) return;
  
  const rect = grid.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;
  
  const x = Math.min(selectionStart.x, currentX);
  const y = Math.min(selectionStart.y, currentY);
  const w = Math.abs(currentX - selectionStart.x);
  const h = Math.abs(currentY - selectionStart.y);
  
  selectionBox.style.left = x + 'px';
  selectionBox.style.top = y + 'px';
  selectionBox.style.width = w + 'px';
  selectionBox.style.height = h + 'px';
  
  const selRect = {left: x, top: y, right: x + w, bottom: y + h};
  
  grid.querySelectorAll('.placed-shape').forEach(shape => {
    const shapeRect = shape.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    const shapeLeft = shapeRect.left - gridRect.left;
    const shapeTop = shapeRect.top - gridRect.top;
    const shapeRight = shapeLeft + shapeRect.width;
    const shapeBottom = shapeTop + shapeRect.height;
    
    const intersects = !(shapeRight < selRect.left || 
                        shapeLeft > selRect.right || 
                        shapeBottom < selRect.top || 
                        shapeTop > selRect.bottom);
    
    if (intersects) {
      addToSelection(shape);
    } else if (!e.ctrlKey) {
      removeFromSelection(shape);
    }
  });
});

document.addEventListener('pointerup', (e) => {
  if (isSelecting) {
    isSelecting = false;
    selectionBox.style.display = 'none';
  }
});

if (grid) {
  grid.addEventListener('click', (e) => {
    if (!selectedShape || e.target !== grid) {
      return;
    }

    const rect = grid.getBoundingClientRect();
    const x = snapToGridValue(e.clientX - rect.left);
    const y = snapToGridValue(e.clientY - rect.top);
    const shape = createShape(selectedShape);
    const w = parseFloat(shape.style.width);
    const h = parseFloat(shape.style.height);
    shape.style.left = (x - w/2) + 'px';
    shape.style.top = (y - h/2) + 'px';
    grid.appendChild(shape);
    
    saveState();
    selectedShape = null;
    shapeButtons.forEach(b => b.classList.remove('active'));
    savePage();
  });

  grid.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  grid.addEventListener('drop', (e) => {
    e.preventDefault();
    const shapeType = e.dataTransfer.getData('shape');
    if (!shapeType) return;
    
    const rect = grid.getBoundingClientRect();
    const x = snapToGridValue(e.clientX - rect.left);
    const y = snapToGridValue(e.clientY - rect.top);
    const shape = createShape(shapeType);
    const w = parseFloat(shape.style.width);
    const h = parseFloat(shape.style.height);
    shape.style.left = (x - w/2) + 'px';
    shape.style.top = (y - h/2) + 'px';
    grid.appendChild(shape);
    saveState();
    savePage();
  });
}

document.addEventListener('keydown', (e) => {
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapes.size > 0) {
    const hasEditableText = Array.from(selectedShapes).some(shape => {
      const textDiv = shape.querySelector('.shape-text');
      return textDiv && textDiv.contentEditable === 'true';
    });
    
    if (!hasEditableText) {
      e.preventDefault();
      selectedShapes.forEach(shape => shape.remove());
      selectedShapes.clear();
      saveState();
      savePage();
    }
  }
});

loadPages();

let clipboard = [];

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedShapes.size > 0) {
    const hasEditableText = Array.from(selectedShapes).some(shape => {
      const textDiv = shape.querySelector('.shape-text');
      return textDiv && textDiv.contentEditable === 'true';
    });
    
    if (!hasEditableText) {
      e.preventDefault();
      clipboard = [];
      selectedShapes.forEach(shape => {
        clipboard.push({
          html: shape.outerHTML,
          left: parseFloat(shape.style.left) || 0,
          top: parseFloat(shape.style.top) || 0
        });
      });
    }
  }
  
  if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard.length > 0) {
    const hasEditableText = Array.from(selectedShapes).some(shape => {
      const textDiv = shape.querySelector('.shape-text');
      return textDiv && textDiv.contentEditable === 'true';
    });
    
    if (!hasEditableText) {
      e.preventDefault();
      clearSelection();
      
      clipboard.forEach(item => {
        const temp = document.createElement('div');
        temp.innerHTML = item.html;
        const shape = temp.firstChild;
        
        shape.dataset.shapeId = 'shape_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        shape.style.left = (item.left + 20) + 'px';
        shape.style.top = (item.top + 20) + 'px';
        
        grid.appendChild(shape);
        reattachListeners(shape);
        addToSelection(shape);
      });
      
      saveState();
      savePage();
    }
  }
});

function loadNotes() {
  const stored = localStorage.getItem(NOTES_KEY);
  if (stored !== null && notesText) {
    notesText.value = stored;
  }
}

function saveNotes() {
  if (!notesText) return;
  const val = notesText.value;
  if (val.trim() === '') {
    localStorage.removeItem(NOTES_KEY);
  } else {
    localStorage.setItem(NOTES_KEY, val);
  }
}

function clearNotes() {
  if (!notesText) return;
  notesText.value = '';
  localStorage.removeItem(NOTES_KEY);
}

loadNotes();

if (notesIcon && notesBoxEl) {
  notesIcon.addEventListener('click', (e) => {
    e.preventDefault();
    const isHidden = !notesBoxEl.style.display || notesBoxEl.style.display === 'none';
    notesBoxEl.style.display = isHidden ? 'flex' : 'none';
    if (isHidden && notesText) {
      loadNotes();
      notesText.focus();
    }
  });
}

if (closeNotesBtn && notesBoxEl) {
  closeNotesBtn.addEventListener('click', () => {
    notesBoxEl.style.display = 'none';
  });
}

if (saveNotesBtn) {
  saveNotesBtn.addEventListener('click', () => {
    saveNotes();
  });
}

if (clearNotesBtn) {
  clearNotesBtn.addEventListener('click', () => {
    clearNotes();
  });
}

(function enableNotesDrag() {
  if (!notesBoxEl) return;
  const header = notesBoxEl.querySelector('.notes-header');
  if (!header) return;

  header.style.cursor = 'move';

  header.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button')) return;

    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = notesBoxEl.getBoundingClientRect();
    const startLeft = rect.left;
    const startTop = rect.top;

    try { header.setPointerCapture(e.pointerId); } catch (err) {}

    function onMove(ev) {
      ev.preventDefault();
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      const newLeft = Math.max(0, Math.min(window.innerWidth - rect.width, startLeft + dx));
      const newTop = Math.max(0, Math.min(window.innerHeight - rect.height, startTop + dy));

      notesBoxEl.style.left = newLeft + 'px';
      notesBoxEl.style.top = newTop + 'px';
    }

    function onUp(ev) {
      try { header.releasePointerCapture(e.pointerId); } catch (err) {}
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
})();

(function setupThemeIconToggle() {
  const KEY = 'bloc_theme_icon_src';

  function normalizeName(src) {
    if (!src) return '';
    return src.split('/').pop().split('?')[0].toLowerCase();
  }

  const changeEl = document.getElementById('changeTheme');

  const fallbackImgs = Array.from(document.querySelectorAll('img')).filter(img => {
    const name = normalizeName(img.getAttribute('src'));
    return name === 'sun.png' || name === 'moon.png';
  });

  const imgEl = changeEl || fallbackImgs[0];
  if (!imgEl) return;

  const saved = localStorage.getItem(KEY);
  const base = (imgEl.getAttribute('src') || '').replace(/[^/]*$/, '');
  if (saved) {
    const newSrc = saved.includes('/') ? saved : (base + saved);
    imgEl.src = newSrc;
    const savedName = normalizeName(saved);

    document.documentElement.classList.toggle('body-dark', savedName === 'sun.png');
  } else {
    imgEl.src = base + 'moon.png';
    document.documentElement.classList.remove('body-dark');
  }

  imgEl.style.cursor = 'pointer';
  imgEl.addEventListener('click', (e) => {
    e.preventDefault();
    const src = imgEl.getAttribute('src') || '';
    const baseLocal = src.includes('/') ? src.slice(0, src.lastIndexOf('/') + 1) : '';
    const name = normalizeName(src);
    const newName = (name === 'moon.png') ? 'sun.png' : 'moon.png';
    const newSrc = baseLocal + newName;
    imgEl.src = newSrc;
    const isDark = newName === 'sun.png';
    
    document.documentElement.classList.toggle('body-dark', isDark);
    try { localStorage.setItem(KEY, newName); } catch (err) {}
  });
})();

if (figuresImg) {
  figuresImg.addEventListener('click', (e) => {
    e.preventDefault();
    const open = gridBox && gridBox.classList.contains('open');
    if (open) closeBox(); else openBox();
  });
}

if (binImg) {
  binImg.style.cursor = 'pointer';
  binImg.addEventListener('click', (e) => {
    e.preventDefault();
    if (selectedShapes && selectedShapes.size > 0) {
      selectedShapes.forEach(s => {
        if (s && s.parentElement) s.parentElement.removeChild(s);
      });
      clearSelection();
      saveState();
      savePage();
    }
  });
}

if (stepImgs && stepImgs.length) {
  stepImgs.forEach(img => {
    img.style.cursor = 'pointer';
    const src = (img.getAttribute('src') || '').split('/').pop();
    if (src.includes('step-back')) {
      img.addEventListener('click', (e) => { e.preventDefault(); if (typeof undo === 'function') undo(); });
    } else if (src.includes('step-forward')) {
      img.addEventListener('click', (e) => { e.preventDefault(); if (typeof redo === 'function') redo(); });
    }
  });
}

if (layerImgs && layerImgs.length) {
  layerImgs.forEach(img => {
    img.style.cursor = 'pointer';
    const src = (img.getAttribute('src') || '').split('/').pop();
    
    if (src.includes('layer2')) {
      img.addEventListener('click', (e) => {
        e.preventDefault();
        if (selectedShapes.size > 0) {
          selectedShapes.forEach(shape => {
            const prev = shape.previousElementSibling;
            if (prev && prev.classList.contains('placed-shape')) {
              grid.insertBefore(shape, prev);
            }
          });
          saveState();
          savePage();
        }
      });
    } else if (src.includes('layer1')) {
      img.addEventListener('click', (e) => {
        e.preventDefault();
        if (selectedShapes.size > 0) {
          const shapesArray = Array.from(selectedShapes).reverse();
          shapesArray.forEach(shape => {
            const next = shape.nextElementSibling;
            if (next && next.classList.contains('placed-shape')) {
              grid.insertBefore(next, shape);
            }
          });
          saveState();
          savePage();
        }
      });
    }
  });
}

function enforceDarkMode() {
  if (document.body.classList.contains('body-dark')) {
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundColor;
      
      if (bg === 'rgb(255, 255, 255)' || bg === 'rgba(255, 255, 255, 1)' || bg === '#ffffff' || bg === '#fff') {
        el.style.backgroundColor = '#2a2a2a';
      }
      
      ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'].forEach(prop => {
        const borderColor = style[prop];
        if (borderColor === 'rgb(255, 255, 255)' || borderColor === 'rgba(255, 255, 255, 1)') {
          el.style[prop] = '#3a3a3a';
        }
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', enforceDarkMode);
const observer = new MutationObserver(enforceDarkMode);
observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

setInterval(enforceDarkMode, 500);

let isFullscreen = false;

if (fullscreenBtn) {
  fullscreenBtn.style.cursor = 'pointer';
  
  fullscreenBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isFullscreen = !isFullscreen;
    
    if (isFullscreen) {
      if (mainHeader) {
        mainHeader.style.display = 'none';
        mainHeader.style.visibility = 'hidden';
        mainHeader.style.opacity = '0';
        mainHeader.style.height = '0';
        mainHeader.style.overflow = 'hidden';
      }
      if (pageFooter) {
        pageFooter.style.display = 'none';
        pageFooter.style.visibility = 'hidden';
        pageFooter.style.opacity = '0';
        pageFooter.style.height = '0';
        pageFooter.style.overflow = 'hidden';
      }
      if (iconBox) iconBox.style.display = 'none';
      if (gridBox) {
      closeBox();
      gridBox.style.display = 'none';
      }
      
      if (gridContainer) {
        gridContainer.style.top = '0';
        gridContainer.style.bottom = '0';
      }
      
      const miniBox = document.createElement('div');
      miniBox.id = 'mini-fullscreen-box';
      const isDark = document.documentElement.classList.contains('body-dark');
      const bgColor = isDark ? '#333' : '#f0f0f0';
      miniBox.style.cssText = `position: fixed; top: 8px; right: 20px; width: 30px; height: 30px; background: ${bgColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10000; box-shadow: 0 2px 10px rgba(0,0,0,0.3);`;
      
      const miniImg = document.createElement('img');
      miniImg.src = 'fullscreen-off.png';
      miniImg.style.cssText = `width: 18px; height: 18px; ${isDark ? 'filter: invert(1);' : ''}`;
      miniBox.appendChild(miniImg);
      
      miniBox.addEventListener('click', () => {
        fullscreenBtn.click();
      });
      
      document.body.appendChild(miniBox);
    } else {
      if (mainHeader) {
        mainHeader.style.display = '';
        mainHeader.style.visibility = '';
        mainHeader.style.opacity = '';
        mainHeader.style.height = '';
        mainHeader.style.overflow = '';
      }
      if (pageFooter) {
        pageFooter.style.display = '';
        pageFooter.style.visibility = '';
        pageFooter.style.opacity = '';
        pageFooter.style.height = '';
        pageFooter.style.overflow = '';
      }
      if (iconBox) iconBox.style.display = '';
      
      if (gridContainer) {
        gridContainer.style.top = '';
        gridContainer.style.bottom = '';
      }
      
      const miniBox = document.getElementById('mini-fullscreen-box');
      if (miniBox) miniBox.remove();
    }
  });
}

if (toggleIconBoxBtn && iconBox) {
  toggleIconBoxBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isVisible = !iconBox.classList.contains('icon-box-closed');
    
    if (isVisible) {
      iconBox.classList.add('icon-box-closed');
    } else {
      iconBox.classList.remove('icon-box-closed');
    }
  });
}
