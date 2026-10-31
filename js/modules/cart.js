// Módulo: cart
import { state } from '../state.js';
import { esc } from '../utils/escape.js';
import { showToast } from './toast.js';
import { CATALOG_PRODUCTS } from '../data/catalog.js';
import { closeQuoteModal, getSelectedQuoteColor } from './quote.js';
import { startCheckoutFlow } from './checkout.js';

export function openCartModal() {
    actualizarCarritoUI();
    document.getElementById('cart-modal').classList.remove('hidden');
}

export function closeCartModal() {
    document.getElementById('cart-modal').classList.add('hidden');
}

export function agregarAlCarritoDesdeCotizacion() {
    if (!state.activeQuote.selectedWorkshopId) return;

    const prod = CATALOG_PRODUCTS.find(p => p.id === state.activeQuote.productId);
    const ws = state.workshopsData.find(w => w.id === state.activeQuote.selectedWorkshopId);
    const qty = parseInt(document.getElementById('quote-qty-input').value) || 50;
    const color = getSelectedQuoteColor();

    const spec = ws.productsCatalog[state.activeQuote.productId];
    let discountPercent = 0;
    if (qty >= 100) discountPercent = spec.disc100;
    else if (qty >= 50) discountPercent = spec.disc50;
    else if (qty >= 20) discountPercent = spec.disc20;

    const unitPriceFinal = spec.basePrice * (1 - discountPercent / 100);
    const subtotal = unitPriceFinal * qty;

    state.carrito.push({
        id: 'cart-item-' + Date.now(),
        productId: prod.id,
        productName: prod.name,
        productImage: prod.image,
        workshopId: ws.id,
        workshopName: ws.name,
        color: color,
        quantity: qty,
        unitPrice: unitPriceFinal,
        subtotal: subtotal,
        design: state.activeQuote.design || null
    });

    actualizarCarritoUI();
    closeQuoteModal();
    showToast(`Añadido al carrito: ${qty}x ${prod.name} (${color}).`);
}

export function actualizarCarritoUI() {
    const badgeCount = document.getElementById('cart-badge-count');
    const badgeMobile = document.getElementById('cart-badge-count-mobile');
    if (badgeCount) badgeCount.textContent = state.carrito.length;
    if (badgeMobile) badgeMobile.textContent = state.carrito.length;

    const list = document.getElementById('cart-items-list');
    const emptyMsg = document.getElementById('cart-empty-msg');
    const grandTotalSpan = document.getElementById('cart-grand-total');
    const payBtn = document.getElementById('cart-pay-all-btn');

    if (!list) return;

    if (state.carrito.length === 0) {
        list.innerHTML = '';
        emptyMsg.classList.remove('hidden');
        grandTotalSpan.textContent = '$0.00 MXN';
        payBtn.disabled = true;
        payBtn.classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }

    emptyMsg.classList.add('hidden');
    payBtn.disabled = false;
    payBtn.classList.remove('opacity-50', 'cursor-not-allowed');

    let totalSum = 0;
    list.innerHTML = '';

    state.carrito.forEach((item, index) => {
        totalSum += item.subtotal;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3';
        itemDiv.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${esc(item.design?.preview || item.productImage)}" alt="${esc(item.design ? `Diseño de ${item.productName}` : item.productName)}" class="w-12 h-12 rounded-lg object-cover border border-slate-800">
                <div>
                    <h4 class="text-xs font-bold text-white">${esc(item.productName)}</h4>
                    <p class="text-[11px] text-slate-400">Taller: ${esc(item.workshopName)} | Color: ${esc(item.color)}</p>
                    ${item.design ? `<span class="block text-[10px] text-emerald-300">Diseño adjunto · ${esc(item.design.technique)} · vista ${item.design.view === 'back' ? 'trasera' : 'frontal'}</span>` : ''}
                    <span class="text-[11px] text-indigo-400 font-semibold">Cantidad: ${item.quantity} pzs ($${item.unitPrice.toFixed(2)} MXN c/u)</span>
                </div>
            </div>
            <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                <span class="text-sm font-extrabold text-emerald-400">$${item.subtotal.toLocaleString('es-MX', {minimumFractionDigits: 2})} MXN</span>
                <button onclick="app.eliminarDelCarrito(${index})" class="text-slate-500 hover:text-rose-400 p-1 transition" title="Eliminar artículo">
                    <i class="fa-solid fa-trash-can text-sm"></i>
                </button>
            </div>
        `;
        list.appendChild(itemDiv);
    });

    grandTotalSpan.textContent = `$${totalSum.toLocaleString('es-MX', {minimumFractionDigits: 2})} MXN`;
}

export function eliminarDelCarrito(index) {
    state.carrito.splice(index, 1);
    actualizarCarritoUI();
    showToast('Artículo eliminado del carrito');
}

export function vaciarCarrito() {
    state.carrito = [];
    actualizarCarritoUI();
    showToast('El state.carrito se ha vaciado');
}

export function procederPagoDesdeCarrito() {
    if (state.carrito.length === 0) return;
    closeCartModal();

    const grandTotal = state.carrito.reduce((sum, item) => sum + item.subtotal, 0);
    const totalItems = state.carrito.reduce((sum, item) => sum + item.quantity, 0);
    const firstItem = state.carrito[0];

    state.activeQuote = {
        productId: firstItem.productId,
        quantity: totalItems,
        color: state.carrito.map(item => `${item.productName}: ${item.color}`).join(', '),
        selectedWorkshopId: firstItem.workshopId,
        sizeBreakdown: { CH: Math.round(totalItems*0.2), M: Math.round(totalItems*0.4), G: Math.round(totalItems*0.2), XG: Math.round(totalItems*0.2), XXG: 0 },
        cartTotalSum: grandTotal,
        cartItems: state.carrito.map(item => ({
            productId: item.productId,
            productName: item.productName,
            workshopId: item.workshopId,
            workshopName: item.workshopName,
            color: item.color,
            quantity: item.quantity,
            subtotal: item.subtotal,
            design: item.design || null
        })),
        isFromCart: true
    };

    startCheckoutFlow();
}
