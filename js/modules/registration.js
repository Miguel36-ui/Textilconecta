// Módulo: registration
import { state } from '../state.js';
import { showToast } from './toast.js';
import { CATALOG_PRODUCTS } from '../data/catalog.js';
import { updateUserStatusBar } from './auth.js';
import { renderWorkshopDashboard } from './workshop.js';
import { switchTab } from './router.js';
import { renderCatalog } from './catalog.js';
import { renderAdminDashboard } from './admin.js';
import { renderMapMarkers, setRegistrationLocation } from './map.js';
import { esc } from '../utils/escape.js';

export function handleWorkshopRegistration(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const rfc = document.getElementById('reg-rfc').value.toUpperCase();
    const password = document.getElementById('reg-password').value;
    const municipio = document.getElementById('reg-municipio').value;
    const phone = document.getElementById('reg-phone').value;
    const address = document.getElementById('reg-address').value;
    if (state.workshopsData.some(w => w.rfc.toUpperCase() === rfc)) { showToast('Ya existe un taller registrado con ese RFC', 'error'); return; }
    const commissionTerms = document.getElementById('reg-commission-terms');
    if (!commissionTerms.checked) {
        showToast('Debes aceptar la tarifa de intermediación del 5% para activar la cuenta.', 'error');
        commissionTerms.focus();
        return;
    }

    const paymentDetails = document.getElementById('registration-payment-details');
    if (paymentDetails.classList.contains('hidden')) {
        if (!CATALOG_PRODUCTS.some(p => document.getElementById(`reg-chk-${p.id}`).checked)) {
            showToast('Selecciona al menos un producto que fabrique tu taller', 'error');
            return;
        }

        paymentDetails.classList.remove('hidden');
        toggleRegistrationPaymentMethod();
        document.getElementById('registration-submit-button').innerHTML =
            '<i class="fa-solid fa-lock mr-2"></i> Confirmar suscripción y dar de alta (demo)';
        paymentDetails.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value;
    if (paymentMethod === 'card') {
        const cardNumber = document.getElementById('reg-card-number').value.replace(/\D/g, '');
        const expiration = document.getElementById('reg-card-exp').value.trim();
        const cvv = document.getElementById('reg-card-cvv').value.trim();
        if (!/^\d{16}$/.test(cardNumber)) {
            showToast('El número de tarjeta debe tener 16 dígitos.', 'error');
            return;
        }
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiration)) {
            showToast('Ingresa una fecha de vencimiento válida (MM/AA).', 'error');
            return;
        }
        if (!/^\d{3,4}$/.test(cvv)) {
            showToast('Ingresa un código de seguridad de 3 o 4 dígitos.', 'error');
            return;
        }
    } else if (paymentMethod === 'transfer' && !document.getElementById('reg-transfer-reference').value.trim()) {
        showToast('Ingresa la referencia de transferencia para continuar.', 'error');
        return;
    }

    const productsCatalog = {};
    let countSelected = 0;

    CATALOG_PRODUCTS.forEach(p => {
        if (document.getElementById(`reg-chk-${p.id}`).checked) {
            countSelected++;
            productsCatalog[p.id] = {
                basePrice: parseFloat(document.getElementById(`reg-price-${p.id}`).value) || 150,
                disc20: parseFloat(document.getElementById(`reg-disc20-${p.id}`).value) || 0,
                disc50: parseFloat(document.getElementById(`reg-disc50-${p.id}`).value) || 0,
                disc100: parseFloat(document.getElementById(`reg-disc100-${p.id}`).value) || 0
            };
        }
    });

    if (countSelected === 0) {
        showToast('Selecciona al menos un producto que fabrique tu taller', 'error');
        return;
    }

    const newWs = {
        id: `ws-${Date.now()}`, name: name, rfc: rfc, password: password, municipio: municipio, phone: phone, address: address,
        lat: parseFloat(document.getElementById('reg-lat').value) || 18.849, lng: parseFloat(document.getElementById('reg-lng').value) || -97.103, rating: 5.0, leadTime: '3 a 5 días hábiles', quejasCount: 0, status: 'Activo',
        productsCatalog: productsCatalog,
        commissionRate: 0.05,
        commissionTermsAcceptedAt: new Date().toISOString()
    };

    state.workshopsData.unshift(newWs);

    renderMapMarkers('ALL');
    renderAdminDashboard();
    renderCatalog();


    showToast(`Taller "${name}" dado de alta. Pago de suscripción simulado; no se realizó ningún cobro.`);
    const registrationForm = document.getElementById('workshop-reg-form');
    registrationForm.reset();
    document.getElementById('registration-payment-details').classList.add('hidden');
    document.getElementById('registration-submit-button').innerHTML =
        '<i class="fa-solid fa-paper-plane mr-2"></i> Continuar al pago de suscripción';
    toggleRegistrationPaymentMethod();
    setRegistrationLocation({ lat: 18.849, lng: -97.103 });
    selectAllRegProducts(false);

    state.currentUser = { type: 'workshop', data: newWs };
    updateUserStatusBar();
    renderWorkshopDashboard();
    switchTab('workshop-panel');
}

export function toggleRegistrationPaymentMethod() {
    const method = document.querySelector('input[name="payment_method"]:checked')?.value;
    const cardFields = document.getElementById('registration-card-fields');
    const transferFields = document.getElementById('registration-transfer-fields');
    const detailsVisible = !document.getElementById('registration-payment-details').classList.contains('hidden');
    const useCard = method === 'card';

    cardFields.classList.toggle('hidden', !useCard);
    transferFields.classList.toggle('hidden', useCard);
    ['reg-card-holder', 'reg-card-number', 'reg-card-exp', 'reg-card-cvv']
        .forEach(id => { document.getElementById(id).required = useCard && detailsVisible; });
    document.getElementById('reg-transfer-reference').required = method === 'transfer' && detailsVisible;
}

export function renderRegistrationProductsList() {
    const container = document.getElementById('reg-products-container');
    container.innerHTML = '';

    CATALOG_PRODUCTS.forEach(p => {
        const div = document.createElement('div');
        div.className = 'bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3';
        div.innerHTML = `
            <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="reg-chk-${p.id}" onchange="app.toggleRegProductInputs('${p.id}')" class="accent-sky-500 rounded w-4 h-4">
                    <span class="font-bold text-xs text-white">${esc(p.name)}</span>
                    <span class="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">${esc(p.category)}</span>
                </label>
            </div>

            <div id="reg-inputs-${p.id}" class="hidden grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60 text-xs">
                <div>
                    <label class="block text-[10px] text-slate-400 mb-1">Precio Base Unitario *</label>
                    <input type="number" id="reg-price-${p.id}" value="160" min="1" step="0.01" oninput="app.updateRegistrationPriceEstimate('${p.id}')" class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold">
                    <p id="reg-net-${p.id}" class="mt-1 text-[10px] text-emerald-300"></p>
                </div>
                <div>
                    <label class="block text-[10px] text-slate-400 mb-1">Desc % (20-49 pzs)</label>
                    <input type="number" id="reg-disc20-${p.id}" value="5" min="0" max="100" step="0.1" oninput="app.updateRegistrationPriceEstimate('${p.id}')" class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sky-400">
                </div>
                <div>
                    <label class="block text-[10px] text-slate-400 mb-1">Desc % (50-99 pzs)</label>
                    <input type="number" id="reg-disc50-${p.id}" value="10" min="0" max="100" step="0.1" oninput="app.updateRegistrationPriceEstimate('${p.id}')" class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sky-400">
                </div>
                <div>
                    <label class="block text-[10px] text-slate-400 mb-1">Desc % (100+ pzs)</label>
                    <input type="number" id="reg-disc100-${p.id}" value="15" min="0" max="100" step="0.1" oninput="app.updateRegistrationPriceEstimate('${p.id}')" class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sky-400">
                </div>
                <p id="reg-net-discounts-${p.id}" class="text-[10px] text-slate-400 sm:col-span-4"></p>
            </div>
        `;
        container.appendChild(div);
        updateRegistrationPriceEstimate(p.id);
    });
}

export function updateRegistrationPriceEstimate(productId) {
    const readPercent = (id) => {
        const value = Number.parseFloat(document.getElementById(id).value);
        return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
    };
    const basePrice = Number.parseFloat(document.getElementById(`reg-price-${productId}`).value);
    const netLabel = document.getElementById(`reg-net-${productId}`);
    const discountLabel = document.getElementById(`reg-net-discounts-${productId}`);

    if (!Number.isFinite(basePrice) || basePrice < 0) {
        netLabel.textContent = 'Ingresa un precio base válido.';
        discountLabel.textContent = '';
        return;
    }

    const money = (amount) => amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    const fee = basePrice * 0.05;
    const net = basePrice - fee;
    netLabel.textContent = `Base: ${money(basePrice)} · Comisión (5%): -${money(fee)} · Recibes: ${money(net)} por pieza`;

    const discounts = [
        ['20-49 pzs', readPercent(`reg-disc20-${productId}`)],
        ['50-99 pzs', readPercent(`reg-disc50-${productId}`)],
        ['100+ pzs', readPercent(`reg-disc100-${productId}`)]
    ];
    discountLabel.textContent = `Neto estimado con descuentos: ${discounts.map(([range, discount]) =>
        `${range}: ${money(basePrice * (1 - discount / 100) * 0.95)}`
    ).join(' · ')}`;
}

export function toggleRegProductInputs(id) {
    const chk = document.getElementById(`reg-chk-${id}`).checked;
    document.getElementById(`reg-inputs-${id}`).classList.toggle('hidden', !chk);
}

export function selectAllRegProducts(select) {
    CATALOG_PRODUCTS.forEach(p => {
        document.getElementById(`reg-chk-${p.id}`).checked = select;
        toggleRegProductInputs(p.id);
    });
}

export function useDefaultCoords() {
    setRegistrationLocation({ lat: 18.849, lng: -97.103 });
}
