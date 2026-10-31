// Punto de entrada: carga parciales, registra acciones y arranca la app.
import * as auth from './modules/auth.js';
import * as workshop from './modules/workshop.js';
import * as router from './modules/router.js';
import * as registration from './modules/registration.js';
import * as catalog from './modules/catalog.js';
import * as simulator from './modules/simulator.js';
import * as cart from './modules/cart.js';
import * as quote from './modules/quote.js';
import * as checkout from './modules/checkout.js';
import * as tracking from './modules/tracking.js';
import * as admin from './modules/admin.js';
import * as map from './modules/map.js';
import * as toast from './modules/toast.js';

// Espacio de nombres para los atributos inline (onclick="app.fn()") del HTML.
window.app = Object.assign({}, auth, workshop, router, registration, catalog, simulator, cart, quote, checkout, tracking, admin, map, toast);

async function loadPartials() {
    const slots = [...document.querySelectorAll('[data-partial]')];
    await Promise.all(slots.map(async (el) => {
        const res = await fetch(el.dataset.partial);
        if (!res.ok) throw new Error(`No se pudo cargar ${el.dataset.partial}`);
        el.outerHTML = await res.text();
    }));
}

const MODALS = ['login-modal', 'cart-modal', 'quote-modal', 'checkout-modal', 'report-modal'];
const $ = (id) => document.getElementById(id);

function bindGlobalUI() {
    // Cerrar modales con Escape o clic en el fondo
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') MODALS.forEach((id) => $(id)?.classList.add('hidden'));
        if (e.key === 'Enter' && e.target.id === 'tracking-search-input') tracking.executeOrderSearch();
    });
    document.addEventListener('click', (e) => { if (MODALS.includes(e.target.id)) e.target.classList.add('hidden'); });

    document.addEventListener('change', (e) => {
        // Facturación CFDI: mostrar/ocultar campos
        if (e.target.id === 'req-cfdi') $('cfdi-fields').classList.toggle('hidden', !e.target.checked);
        // Entrega: ocultar dirección si es recolección y resaltar la opción elegida
        if (e.target.name === 'delivery-type') {
            $('shipping-address-container').classList.toggle('hidden', e.target.value === 'recoleccion');
            document.querySelectorAll('input[name="delivery-type"]').forEach((r) => {
                r.closest('label').className = r.checked
                    ? 'cursor-pointer border border-indigo-500 bg-indigo-950/20 p-3 rounded-xl flex items-start gap-3'
                    : 'cursor-pointer border border-slate-800 bg-slate-950 p-3 rounded-xl flex items-start gap-3';
            });
        }
    });

    // Formato de tarjeta: 4152 3138 9012 3456 · MM/AA · CVV numérico
    document.addEventListener('input', (e) => {
        const v = e.target.value;
        if (e.target.id === 'card-number-input') e.target.value = v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
        if (e.target.id === 'card-exp-input') { const d = v.replace(/\D/g, '').slice(0, 4); e.target.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; }
        if (e.target.id === 'card-cvv-input') e.target.value = v.replace(/\D/g, '').slice(0, 4);
        if (e.target.id === 'reg-card-number') e.target.value = v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
        if (e.target.id === 'reg-card-exp') { const d = v.replace(/\D/g, '').slice(0, 4); e.target.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; }
        if (e.target.id === 'reg-card-cvv') e.target.value = v.replace(/\D/g, '').slice(0, 4);
    });
}

async function init() {
    try { await loadPartials(); }
    catch (err) { document.body.insertAdjacentHTML('afterbegin', `<p style="padding:1rem;background:#7f1d1d;color:#fff">${err.message}. Abre el sitio con un servidor local (ver README), no con file://</p>`); return; }
    bindGlobalUI();
    catalog.renderCatalog();
    simulator.populateSimulatorProductSelector();
    registration.renderRegistrationProductsList();
    map.initLeafletMap();
    simulator.initSimulatorCanvas();
    admin.renderAdminDashboard();
    tracking.executeOrderSearch();
    cart.actualizarCarritoUI();
    auth.updateUserStatusBar();
}
init();
