// Módulo: simulator
import { state } from '../state.js';
import { showToast } from './toast.js';
import { CATALOG_PRODUCTS } from '../data/catalog.js';
import { switchTab } from './router.js';
import { openQuoteModal, updateCustomQuoteColor } from './quote.js';

const simulatorAsset = (filename) => new URL(`../../assets/sim/${filename}`, import.meta.url).href;

// Mapeo de assets fotorrealistas
const GARMENT_ASSETS = {
    'prod-1': { front: simulatorAsset('polo-front.png'), back: simulatorAsset('polo-back.png') },
    'prod-2': { front: simulatorAsset('gabardina-front.png'), back: simulatorAsset('gabardina-back.png') },
    'prod-3': { front: simulatorAsset('chaleco-front.png'), back: simulatorAsset('chaleco-back.png') },
    'prod-4': { front: simulatorAsset('softshell-front.png'), back: simulatorAsset('softshell-back.png') },
    'prod-5': { front: simulatorAsset('gorra-front.png'), back: simulatorAsset('gorra-back.png') },
    'prod-6': { front: simulatorAsset('filipina-front.png'), back: simulatorAsset('filipina-back.png') },
    'prod-7': { front: simulatorAsset('overol-front.png'), back: simulatorAsset('overol-back.png') },
    'prod-8': { front: simulatorAsset('dryfit-front.png'), back: simulatorAsset('dryfit-back.png') },
    'prod-9': { front: simulatorAsset('hoodie-front.png'), back: simulatorAsset('hoodie-back.png') },
    'prod-10': { front: simulatorAsset('jeans-front.png'), back: simulatorAsset('jeans-back.png') }
};

const imageCache = {};
const failedImageSources = new Set();

function getGarmentImage(productId, view, callback) {
    const product = CATALOG_PRODUCTS.find(item => item.id === productId);
    const src = GARMENT_ASSETS[productId]?.[view]
        || (product?.custom && product.simulatorApproved ? product.image : null);
    if (!src) return callback(null);
    if (imageCache[src]) return callback(imageCache[src]);
    if (failedImageSources.has(src)) return callback(null);
    
    const img = new Image();
    img.onload = () => { imageCache[src] = img; callback(img); };
    img.onerror = () => {
        failedImageSources.add(src);
        console.error(`No se pudo cargar la imagen del producto para el simulador: ${productId}`);
        showToast('No se pudo cargar la imagen del producto para el simulador.', 'error');
        callback(null);
    };
    img.src = src;
}

export function populateSimulatorProductSelector() {
    const select = document.getElementById('sim-product-select');
    select.innerHTML = '';
    CATALOG_PRODUCTS.filter(p => !p.custom || p.simulatorApproved).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name} (${p.category})`;
        select.appendChild(opt);
    });
    select.value = state.selectedSimProduct;
}

export function launchSimulatorForProduct(productId) {
    const product = CATALOG_PRODUCTS.find(item => item.id === productId);
    if (!product || (product.custom && !product.simulatorApproved)) {
        showToast('Este producto aún no está aprobado para el simulador 2D.', 'error');
        return;
    }
    state.selectedSimProduct = productId;
    const select = document.getElementById('sim-product-select');
    if (select) select.value = productId;
    switchTab('simulator');
    changeSimulatorProduct();
    showToast(`Simulador cargado con: ${product.name}`);
}

export function changeSimulatorProduct() {
    state.selectedSimProduct = document.getElementById('sim-product-select').value;
    const product = CATALOG_PRODUCTS.find(item => item.id === state.selectedSimProduct);
    if (product?.custom && state.simView === 'back') state.simView = 'front';
    updateSimBadge();
    drawSimulatorCanvas();
}

export function setSimulatorView(view) {
    const product = CATALOG_PRODUCTS.find(item => item.id === state.selectedSimProduct);
    if (product?.custom && view === 'back') {
        showToast('Este producto cuenta con una sola imagen; solo está disponible la vista cargada por la empresa.', 'error');
        return;
    }

    state.simView = view;
    const frontBtn = document.getElementById('view-front-btn');
    const backBtn = document.getElementById('view-back-btn');
    
    if (view === 'front') {
        frontBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-indigo-600 text-white shadow';
        backBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-slate-800 text-slate-400 hover:text-white';
    } else {
        backBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-indigo-600 text-white shadow';
        frontBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-slate-800 text-slate-400 hover:text-white';
    }
    
    updateSimBadge();
    drawSimulatorCanvas();
}

export function setSimulatorZoom(value) {
    const zoom = Number(value) / 100;
    if (!Number.isFinite(zoom)) return;
    state.simZoom = Math.min(1.6, Math.max(1, zoom));
    const slider = document.getElementById('sim-zoom-range');
    const label = document.getElementById('sim-zoom-value');
    if (slider) slider.value = String(Math.round(state.simZoom * 100));
    if (label) label.textContent = `${Math.round(state.simZoom * 100)}%`;
    drawSimulatorCanvas();
}

function updateSimBadge() {
    const currentProd = CATALOG_PRODUCTS.find(p => p.id === state.selectedSimProduct);
    const badge = document.getElementById('sim-view-badge');
    if (badge && currentProd) {
        badge.textContent = currentProd.custom
            ? `Producto: ${currentProd.name} | Imagen de referencia de la empresa`
            : `Producto: ${currentProd.name} | Vista: ${state.simView === 'front' ? 'Frontal' : 'Trasera'}`;
    }

    const frontButton = document.getElementById('view-front-btn');
    if (frontButton) {
        frontButton.className = state.simView === 'front'
            ? 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-indigo-600 text-white shadow'
            : 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-slate-800 text-slate-400 hover:text-white';
    }

    const backButton = document.getElementById('view-back-btn');
    if (backButton && currentProd?.custom) {
        backButton.disabled = true;
        backButton.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-slate-900 text-slate-600 cursor-not-allowed';
    } else if (backButton) {
        backButton.disabled = false;
        backButton.className = state.simView === 'back'
            ? 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-indigo-600 text-white shadow'
            : 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-slate-800 text-slate-400 hover:text-white';
    }
}

export function initSimulatorCanvas() {
    state.simCanvas = document.getElementById('simCanvas');
    state.simCtx = state.simCanvas.getContext('2d');
    loadPresetLogo('shield');

    state.simCanvas.addEventListener('pointerdown', (e) => {
        const rect = state.simCanvas.getBoundingClientRect();
        const scaleX = state.simCanvas.width / rect.width;
        const scaleY = state.simCanvas.height / rect.height;
        const screenX = (e.clientX - rect.left) * scaleX;
        const screenY = (e.clientY - rect.top) * scaleY;
        const mouseX = state.simCanvas.width / 2 + (screenX - state.simCanvas.width / 2) / state.simZoom;
        const mouseY = state.simCanvas.height / 2 + (screenY - state.simCanvas.height / 2) / state.simZoom;
        if (Math.hypot(mouseX - state.simLogoState.x, mouseY - state.simLogoState.y) < 70 * state.simLogoState.scale) {
            state.simLogoState.isDragging = true;
        }
    });

    state.simCanvas.addEventListener('pointermove', (e) => {
        if (state.simLogoState.isDragging) {
            const rect = state.simCanvas.getBoundingClientRect();
            const scaleX = state.simCanvas.width / rect.width;
            const scaleY = state.simCanvas.height / rect.height;
            const screenX = (e.clientX - rect.left) * scaleX;
            const screenY = (e.clientY - rect.top) * scaleY;
            state.simLogoState.x = state.simCanvas.width / 2 + (screenX - state.simCanvas.width / 2) / state.simZoom;
            state.simLogoState.y = state.simCanvas.height / 2 + (screenY - state.simCanvas.height / 2) / state.simZoom;
            drawSimulatorCanvas();
        }
    });

    window.addEventListener('pointerup', () => { state.simLogoState.isDragging = false; });
    drawSimulatorCanvas();
}

export function drawSimulatorCanvas() {
    if (!state.simCtx) return;
    const ctx = state.simCtx;
    const canvas = state.simCanvas;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const p = state.selectedSimProduct;
    const view = state.simView;

    getGarmentImage(p, view, (img) => {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(state.simZoom, state.simZoom);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        if (img) {
            ctx.save();
            const product = CATALOG_PRODUCTS.find(item => item.id === p);
            if (product?.custom) {
                const imageWidth = img.naturalWidth || img.width || canvas.width;
                const imageHeight = img.naturalHeight || img.height || canvas.height;
                const imageRatio = imageWidth / imageHeight;
                const width = Math.min(canvas.width, canvas.height * imageRatio);
                const height = width / imageRatio;
                ctx.drawImage(img, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
            } else {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }

            if (state.garmentColor && !product?.custom) {
                ctx.globalCompositeOperation = 'multiply';
                ctx.fillStyle = state.garmentColor;
                ctx.globalCompositeOperation = 'source-in'; 
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.globalCompositeOperation = 'multiply';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
            ctx.restore();
        }

        if (state.simLogoLoaded) {
            const tech = document.getElementById('technique-select')?.value || '';
            const w = 75 * state.simLogoState.scale;
            
            ctx.save();
            ctx.translate(state.simLogoState.x, state.simLogoState.y);
            ctx.rotate((state.simLogoState.rotate * Math.PI) / 180);
            
            if (tech.includes('Bordado')) { 
                ctx.shadowColor = 'rgba(0,0,0,.7)'; 
                ctx.shadowBlur = 4; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2; 
            } else if (tech.includes('Sublimación')) {
                ctx.globalCompositeOperation = 'multiply';
            } else {
                ctx.globalAlpha = tech.includes('Vinil') ? 0.98 : 0.90;
            }
            
            ctx.drawImage(state.simLogoImg, -w / 2, -w / 2, w, w);
            ctx.restore();

            ctx.save();
            ctx.translate(state.simLogoState.x, state.simLogoState.y);
            ctx.rotate((state.simLogoState.rotate * Math.PI) / 180);
            ctx.strokeStyle = '#10b981'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
            ctx.strokeRect(-w / 2 - 4, -w / 2 - 4, w + 8, w + 8);
            ctx.restore();
        }

        ctx.restore();
    });
}

export function loadPresetLogo(type) {
    let svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>`;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    state.simLogoImg.onload = function() {
        state.simLogoLoaded = true;
        drawSimulatorCanvas();
    };
    state.simLogoImg.src = URL.createObjectURL(blob);
}

export function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            state.simLogoImg.onload = function() {
                state.simLogoLoaded = true;
                drawSimulatorCanvas();
                showToast('Logo personalizado cargado al simulador');
            };
            state.simLogoImg.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    }
}

export function updateLogoTransform() {
    state.simLogoState.scale = parseFloat(document.getElementById('logo-scale-range').value) / 100;
    state.simLogoState.rotate = parseInt(document.getElementById('logo-rotate-range').value);
    document.getElementById('scale-val-txt').textContent = `${Math.round(state.simLogoState.scale * 100)}%`;
    document.getElementById('rotate-val-txt').textContent = `${state.simLogoState.rotate}°`;
    drawSimulatorCanvas();
}

export function resetLogoPosition() {
    state.simLogoState.x = 200; state.simLogoState.y = 190;
    state.simLogoState.scale = 1.0; state.simLogoState.rotate = 0;
    document.getElementById('logo-scale-range').value = 100;
    document.getElementById('logo-rotate-range').value = 0;
    updateLogoTransform();
}

export function calculateEmbroiderEstimate() {
    const tech = document.getElementById('technique-select').value;
    const isEmb = tech.includes('Bordado');
    document.getElementById('stitch-count').textContent = isEmb ? '~6,800 puntadas HD' : 'N/A (Estampado)';
    document.getElementById('setup-cost').textContent = !isEmb ? 'No aplica' : (state.activeQuote.quantity >= 50 ? 'GRATIS (+50 pzs)' : 'Se cotiza aparte (< 50 pzs)');
    drawSimulatorCanvas();
}

export function saveSimulatorDesign() {
    const product = CATALOG_PRODUCTS.find(p => p.id === state.selectedSimProduct);
    if (!product) {
        showToast('No se encontró la prenda seleccionada en el catálogo.', 'error');
        return;
    }

    const design = {
        productId: product.id,
        productName: product.name,
        view: state.simView,
        technique: document.getElementById('technique-select').value,
        logo: state.simLogoLoaded ? state.simLogoImg.src : null,
        x: state.simLogoState.x, y: state.simLogoState.y, scale: state.simLogoState.scale, rotate: state.simLogoState.rotate,
        color: state.garmentColor,
        preview: state.simCanvas.toDataURL('image/png')
    };

    openQuoteModal(product.id);
    state.activeQuote.design = design;

    const colorPicker = document.getElementById('quote-custom-color');
    const colorSelect = document.getElementById('quote-color-select');
    if (/^#[0-9a-f]{6}$/i.test(design.color)) {
        colorPicker.value = design.color;
        colorSelect.value = 'custom';
        updateCustomQuoteColor();
    }

    showToast(`Diseño listo para cotizar: ${product.name}, vista ${state.simView === 'front' ? 'frontal' : 'trasera'}, ${design.technique}.`);
}

const PRINT_ZONES = {
    chest:       { view: 'front', x: 200, y: 190, scale: 1.0 },
    'left-chest':{ view: 'front', x: 150, y: 155, scale: 0.45 },
    'back-top':  { view: 'back',  x: 200, y: 145, scale: 1.0 },
    'back-center':{ view: 'back', x: 200, y: 235, scale: 1.6 },
};

export function setPrintZone(zone) {
    const z = PRINT_ZONES[zone];
    if (!z) return;
    setSimulatorView(z.view);
    state.simLogoState.x = z.x; state.simLogoState.y = z.y;
    document.getElementById('logo-scale-range').value = Math.round(z.scale * 100);
    document.getElementById('logo-rotate-range').value = 0;
    updateLogoTransform();
}

export function setGarmentColor(hex) {
    state.garmentColor = hex;
    drawSimulatorCanvas();
}