// Módulo: checkout
import { state } from '../state.js';
import { showToast } from './toast.js';
import { CATALOG_PRODUCTS } from '../data/catalog.js';
import { switchTab } from './router.js';
import { actualizarCarritoUI } from './cart.js';
import { closeQuoteModal } from './quote.js';
import { executeOrderSearch } from './tracking.js';
import { openLoginModal } from './auth.js';

export function startCheckoutFlow() {
    if (!state.activeQuote.selectedWorkshopId) return;
    if (state.currentUser.type !== 'client') {
        state.pendingCustomerCheckout = true;
        openLoginModal('client');
        showToast('Inicia sesión o crea una cuenta de cliente para continuar con tu compra.', 'error');
        return;
    }
    closeQuoteModal();
    state.currentCheckoutStep = 1;
    state.activeQuote.createdOrderId = null;
    document.getElementById('checkout-modal').classList.remove('hidden');

    const prod = CATALOG_PRODUCTS.find(p => p.id === state.activeQuote.productId);
    const ws = state.workshopsData.find(w => w.id === state.activeQuote.selectedWorkshopId);

    document.getElementById('checkout-prod-name-display').textContent = state.activeQuote.isFromCart ? 'Compra Consolidada de Carrito' : prod.name;
    document.getElementById('checkout-workshop-name-display').textContent = `Taller: ${ws.name}`;
    document.getElementById('checkout-total-qty-display').textContent = `${state.activeQuote.quantity} pzs`;
    document.getElementById('target-qty-label').textContent = state.activeQuote.quantity;
    document.querySelectorAll('input[name="delivery-type"]').forEach(input => {
        input.checked = input.value === 'envio';
    });
    document.querySelectorAll('input[name="pay-method"]').forEach(input => {
        input.checked = input.value === 'card';
    });
    ['card-holder', 'card-number-input', 'card-exp-input', 'card-cvv-input']
        .forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('shipping-address-container').classList.remove('hidden');
    document.getElementById('req-cfdi').checked = true;
    document.getElementById('cfdi-fields').classList.remove('hidden');

    validateSizeSum();
    togglePaymentDetails();
    renderStepView();
}

export function closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.add('hidden');
}

export function validateSizeSum() {
    const ch = parseInt(document.getElementById('size-ch').value) || 0;
    const m = parseInt(document.getElementById('size-m').value) || 0;
    const g = parseInt(document.getElementById('size-g').value) || 0;
    const xg = parseInt(document.getElementById('size-xg').value) || 0;
    const xxg = parseInt(document.getElementById('size-xxg').value) || 0;

    const sum = ch + m + g + xg + xxg;
    state.activeQuote.sizeBreakdown = { CH: ch, M: m, G: g, XG: xg, XXG: xxg };
    const target = state.activeQuote.quantity;
    const msgBox = document.getElementById('size-validation-msg');

    if (sum === target) {
        msgBox.className = 'flex justify-between items-center text-xs p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300';
        msgBox.innerHTML = `<span><i class="fa-solid fa-circle-check mr-1"></i> Desglose válido (${sum} de ${target} pzs)</span>`;
        return true;
    } else {
        msgBox.className = 'flex justify-between items-center text-xs p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300';
        msgBox.innerHTML = `<span><i class="fa-solid fa-triangle-exclamation mr-1"></i> La suma (${sum}) no coincide con la cantidad total (${target})</span>`;
        return false;
    }
}

export function togglePaymentDetails() {
    const method = document.querySelector('input[name="pay-method"]:checked')?.value;
    const container = document.getElementById('card-fields-container');
    if (method === 'card') {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

export function nextCheckoutStep() {
    if (state.currentCheckoutStep === 1 && !validateSizeSum()) return;

    if (state.currentCheckoutStep === 2) {
        const delivery = document.querySelector('input[name="delivery-type"]:checked')?.value;
        if (delivery === 'envio' && (!document.getElementById('ship-street').value.trim() || !/^\d{5}$/.test(document.getElementById('ship-cp').value.trim()))) {
            showToast('Completa la calle y un C.P. de 5 dígitos', 'error'); return;
        }
        if (document.getElementById('req-cfdi').checked && !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i.test(document.getElementById('cfdi-rfc').value.trim())) {
            showToast('El RFC de facturación no es válido', 'error'); return;
        }
    }

    if (state.currentCheckoutStep === 3) {
        const method = document.querySelector('input[name="pay-method"]:checked')?.value;
        if (method === 'card') {
            const holder = document.getElementById('card-holder').value.trim();
            const num = document.getElementById('card-number-input').value.trim();
            const exp = document.getElementById('card-exp-input').value.trim();
            const cvv = document.getElementById('card-cvv-input').value.trim();

            if (!holder || !num || !exp || !cvv) {
                showToast('Por favor ingresa todos los datos solicitados de tu tarjeta bancaria', 'error');
                return;
            }
            if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) {
                showToast('Fecha de expiración inválida (MM/AA)', 'error');
                return;
            }
            if (!/^\d{16}$/.test(num.replace(/\s/g, ''))) {
                showToast('El número de tarjeta debe tener al menos 16 dígitos válidos', 'error');
                return;
            }
            if (!/^\d{3,4}$/.test(cvv)) {
                showToast('Ingresa un código de seguridad de 3 o 4 dígitos.', 'error');
                return;
            }
        }
        generateTicketData();
    }

    if (state.currentCheckoutStep < 4) {
        state.currentCheckoutStep++;
        renderStepView();
    }
}

export function prevCheckoutStep() {
    if (state.currentCheckoutStep > 1) {
        state.currentCheckoutStep--;
        renderStepView();
    }
}

export function renderStepView() {
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`checkout-step-${i}`).classList.add('hidden');
        document.getElementById(`step-indicator-${i}`).className = 'py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-500';
    }

    for (let i = 1; i <= state.currentCheckoutStep; i++) {
        const ind = document.getElementById(`step-indicator-${i}`);
        ind.className = (i === state.currentCheckoutStep) ? 'py-1.5 rounded-lg border border-indigo-500/60 bg-indigo-600/30 text-indigo-300 font-bold' : 'py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-400 font-semibold';
    }

    document.getElementById(`checkout-step-${state.currentCheckoutStep}`).classList.remove('hidden');

    const prevBtn = document.getElementById('checkout-prev-btn');
    const nextBtn = document.getElementById('checkout-next-btn');

    if (state.currentCheckoutStep === 1) prevBtn.classList.add('hidden');
    else prevBtn.classList.remove('hidden');

    if (state.currentCheckoutStep === 4) {
        document.getElementById('checkout-modal-footer').classList.add('hidden');
    } else {
        document.getElementById('checkout-modal-footer').classList.remove('hidden');
        nextBtn.innerHTML = state.currentCheckoutStep === 3 ? 'Pagar Ahora <i class="fa-solid fa-lock ml-1"></i>' : 'Siguiente <i class="fa-solid fa-arrow-right ml-1"></i>';
    }
}

export function generateTicketData() {
    const orderId = `TC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const ws = state.workshopsData.find(w => w.id === state.activeQuote.selectedWorkshopId);
    const prod = CATALOG_PRODUCTS.find(p => p.id === state.activeQuote.productId);
    const qty = state.activeQuote.quantity;
    const shippingCost = document.querySelector('input[name="delivery-type"]:checked')?.value === 'recoleccion' ? 0 : 180;

    let total = 0;
    if (state.activeQuote.isFromCart && state.activeQuote.cartTotalSum) {
        total = state.activeQuote.cartTotalSum * 1.16 + shippingCost;
    } else {
        const spec = ws.productsCatalog[state.activeQuote.productId];
        let discountPercent = 0;
        if (qty >= 100) discountPercent = spec.disc100;
        else if (qty >= 50) discountPercent = spec.disc50;
        else if (qty >= 20) discountPercent = spec.disc20;

        const unitFinal = spec.basePrice * (1 - discountPercent / 100);
        const subtotal = unitFinal * qty;
        total = subtotal * 1.16 + shippingCost;
    }

    const cartItems = state.activeQuote.cartItems || [];
    const orderItems = state.activeQuote.isFromCart
        ? cartItems
        : [{
            productId: prod.id,
            productName: prod.name,
            workshopId: ws.id,
            workshopName: ws.name,
            color: state.activeQuote.color,
            quantity: qty,
            subtotal: total / 1.16 - shippingCost / 1.16,
            design: state.activeQuote.design || null
        }];
    const workshopSubtotals = new Map();
    orderItems.forEach(item => {
        workshopSubtotals.set(item.workshopId, (workshopSubtotals.get(item.workshopId) || 0) + item.subtotal);
    });
    const workshopBreakdown = [...workshopSubtotals].map(([workshopId, subtotalProduccion]) => {
        const workshop = state.workshopsData.find(item => item.id === workshopId);
        const commissionRate = Number.isFinite(workshop?.commissionRate) ? workshop.commissionRate : 0.05;
        const commissionAmount = subtotalProduccion * commissionRate;
        return {
            workshopId,
            subtotalProduccion,
            commissionRate,
            commissionAmount,
            payoutAmount: subtotalProduccion - commissionAmount
        };
    });
    const subtotalProduccion = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const commissionAmount = workshopBreakdown.reduce((sum, item) => sum + item.commissionAmount, 0);

    const method = document.querySelector('input[name="pay-method"]:checked')?.value;
    const isCard = (method === 'card');

    document.getElementById('ticket-folio-txt').textContent = `#${orderId}`;
    document.getElementById('ticket-date-txt').textContent = new Date().toLocaleDateString('es-MX');
    document.getElementById('ticket-workshop-txt').textContent = state.activeQuote.isFromCart
        ? [...new Set(cartItems.map(item => item.workshopName))].join(', ')
        : ws.name;
    document.getElementById('ticket-product-txt').textContent = state.activeQuote.isFromCart
        ? cartItems.map(item => `${item.productName} x ${item.quantity}${item.design ? ` (${item.design.technique})` : ''}`).join('; ')
        : `${prod.name} x ${qty} pzs`;
    document.getElementById('ticket-color-txt').textContent = state.activeQuote.isFromCart
        ? cartItems.map(item => `${item.productName}: ${item.color}`).join('; ')
        : state.activeQuote.color;
    document.getElementById('ticket-payment-txt').textContent = isCard ? 'Tarjeta (demostración)' : 'SPEI (demostración)';
    document.getElementById('ticket-total-txt').textContent = `$${total.toLocaleString('es-MX', {minimumFractionDigits: 2})} MXN`;

    const newOrder = {
        id: orderId,
        cliente: document.getElementById('cfdi-razon')?.value || state.currentUser.data.name,
        empresaId: ws.id,
        empresaNombre: ws.name,
        productoId: prod ? prod.id : 'multi',
        productoNombre: state.activeQuote.isFromCart ? 'Pedido Consolidado de Carrito' : prod.name,
        color: state.activeQuote.color,
        items: orderItems,
        workshopBreakdown,
        subtotalProduccion,
        commissionRate: subtotalProduccion ? commissionAmount / subtotalProduccion : 0,
        commissionAmount,
        payoutAmount: subtotalProduccion - commissionAmount,
        cantidadTotal: qty,
        total: total,
        metodoPago: isCard ? 'Tarjeta Bancaria' : 'SPEI Banxico',
        estado: 'Recibido',
        fecha: new Date().toISOString().split('T')[0],
        tallas: { ...state.activeQuote.sizeBreakdown },
        entrega: shippingCost ? 'Envío local' : 'Recolección en taller',
        design: state.activeQuote.isFromCart ? null : state.activeQuote.design
    };

    state.ordersData.unshift(newOrder);
    state.activeQuote.createdOrderId = orderId;
    
    if (state.activeQuote.isFromCart) {
        state.carrito = [];
        actualizarCarritoUI();
    }
}

export function finishCheckoutAndTrack() {
    closeCheckoutModal();
    switchTab('tracking');
    if (state.activeQuote.createdOrderId) {
        document.getElementById('tracking-search-input').value = state.activeQuote.createdOrderId;
        executeOrderSearch();
    }
}
