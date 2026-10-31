// Módulo: quote
import { state } from '../state.js';
import { esc } from '../utils/escape.js';
import { CATALOG_PRODUCTS } from '../data/catalog.js';

export function openQuoteModal(productId) {
    state.activeQuote.productId = productId;
    state.activeQuote.selectedWorkshopId = null;
    state.activeQuote.design = null;
    state.activeQuote.color = 'Negro Industrial';
    document.getElementById('quote-color-select').value = 'Negro Industrial';
    toggleCustomQuoteColor();
    const product = CATALOG_PRODUCTS.find(p => p.id === productId);

    document.getElementById('modal-product-title').textContent = product.name;
    document.getElementById('modal-product-category').textContent = `Categoría: ${product.category} | Especificación: ${product.material}`;

    document.getElementById('modal-product-header-info').innerHTML = `
        <img src="${esc(product.image)}" alt="${esc(product.name)}" class="w-16 h-16 rounded-xl object-cover border border-slate-700">
        <div class="flex-1">
            <h4 class="font-bold text-white text-sm">${esc(product.name)}</h4>
            <p class="text-xs text-slate-400">${esc(product.desc)}</p>
        </div>
    `;

    document.getElementById('quote-modal').classList.remove('hidden');
    recalculateQuoteSuppliers();
}

export function toggleCustomQuoteColor() {
    const select = document.getElementById('quote-color-select');
    const isCustom = select.value === 'custom';
    const container = document.getElementById('quote-custom-color-container');
    container.classList.toggle('hidden', !isCustom);
    if (isCustom) updateCustomQuoteColor();
    else state.activeQuote.color = select.value;
}

export function updateCustomQuoteColor() {
    const color = document.getElementById('quote-custom-color').value.toUpperCase();
    document.getElementById('quote-custom-color-value').textContent = color;
    state.activeQuote.color = `Personalizado ${color}`;
}

export function getSelectedQuoteColor() {
    const select = document.getElementById('quote-color-select');
    return select.value === 'custom'
        ? `Personalizado ${document.getElementById('quote-custom-color').value.toUpperCase()}`
        : select.value;
}

export function closeQuoteModal() {
    document.getElementById('quote-modal').classList.add('hidden');
}

export function recalculateQuoteSuppliers() {
    const qty = parseInt(document.getElementById('quote-qty-input').value) || 10;
    state.activeQuote.quantity = qty;

    const container = document.getElementById('modal-workshops-cards');
    container.innerHTML = '';

    const suppliers = state.workshopsData.filter(w => w.productsCatalog && w.productsCatalog[state.activeQuote.productId]);
    document.getElementById('suppliers-count-badge').textContent = `${suppliers.filter(w=>w.status==='Activo').length} Talleres activos disponiendo precio`;

    suppliers.forEach(w => {
        const spec = w.productsCatalog[state.activeQuote.productId];
        const isBaja = (w.status === 'Dada de Baja');

        let discountPercent = 0;
        if (qty >= 100) discountPercent = spec.disc100;
        else if (qty >= 50) discountPercent = spec.disc50;
        else if (qty >= 20) discountPercent = spec.disc20;

        const unitPriceFinal = spec.basePrice * (1 - discountPercent / 100);
        const subtotal = unitPriceFinal * qty;
        const isSelected = (state.activeQuote.selectedWorkshopId === w.id);

        const card = document.createElement('div');
        card.className = `p-4 rounded-xl border transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
            isBaja ? 'bg-rose-950/20 border-rose-500/40 opacity-70' : isSelected ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/50' : 'bg-slate-950 border-slate-800'
        }`;

        card.innerHTML = `
            <div class="space-y-1">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-white text-sm">${esc(w.name)}</span>
                    ${isBaja ? '<span class="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">Dada de baja</span>' : ''}
                    <span class="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded"><i class="fa-solid fa-location-dot text-rose-400 mr-1"></i>${esc(w.municipio)}</span>
                </div>
                <p class="text-xs text-slate-400">Entrega estimada: <strong class="text-slate-200">${w.leadTime}</strong></p>
            </div>

            <div class="flex md:flex-col items-end justify-between w-full md:w-auto">
                <div class="text-right">
                    <span class="text-lg font-black text-emerald-400">$${unitPriceFinal.toFixed(2)} <span class="text-xs text-slate-400">MXN c/u</span></span>
                    <span class="block text-[10px] text-slate-400 font-semibold">Subtotal: $${subtotal.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                </div>
                ${isBaja ? '<button disabled class="mt-2 px-3 py-1 bg-slate-800 text-slate-500 font-bold text-xs rounded cursor-not-allowed">No Disponible</button>' : `
                    <button onclick="app.selectWorkshopForQuote('${w.id}')" class="mt-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}">
                        ${isSelected ? '<i class="fa-solid fa-check mr-1"></i> Seleccionado' : 'Seleccionar Taller'}
                    </button>
                `}
            </div>
        `;
        container.appendChild(card);
    });

    updateModalProceedButton();
}

export function selectWorkshopForQuote(id) {
    state.activeQuote.selectedWorkshopId = id;
    recalculateQuoteSuppliers();
}

export function updateModalProceedButton() {
    const btnPay = document.getElementById('modal-proceed-btn');
    const btnCart = document.getElementById('modal-cart-btn');

    if (state.activeQuote.selectedWorkshopId) {
        btnPay.disabled = false;
        btnPay.className = 'flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs uppercase rounded-xl transition shadow-lg shadow-emerald-600/30 cursor-pointer';

        btnCart.disabled = false;
        btnCart.className = 'flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl transition shadow-lg shadow-indigo-600/30 cursor-pointer';
    } else {
        btnPay.disabled = true;
        btnPay.className = 'flex-1 sm:flex-none px-5 py-2.5 bg-slate-800 text-slate-500 font-bold text-xs uppercase rounded-xl transition cursor-not-allowed';

        btnCart.disabled = true;
        btnCart.className = 'flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 text-slate-500 font-bold text-xs uppercase rounded-xl transition cursor-not-allowed';
    }
}
