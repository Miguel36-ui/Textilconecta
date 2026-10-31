// Módulo: workshop
import { state } from '../state.js';
import { esc } from '../utils/escape.js';
import { showToast } from './toast.js';
import { renderAdminDashboard } from './admin.js';
import { CATALOG_PRODUCTS } from '../data/catalog.js';
import { renderCatalog } from './catalog.js';
import { renderRegistrationProductsList } from './registration.js';

const money = (amount) => `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

function renderWorkshopProducts(workshop) {
    const container = document.getElementById('workshop-products-list');
    const products = CATALOG_PRODUCTS.filter(product => workshop.productsCatalog?.[product.id]);

    if (products.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-400">Aún no tienes productos publicados.</p>';
        return;
    }

    container.innerHTML = products.map(product => {
        const prices = workshop.productsCatalog[product.id];
        const request = state.simulatorRequests.find(item => item.productId === product.id);
        const simulatorStatus = product.simulatorApproved
            ? 'Disponible en simulador'
            : request?.status === 'Rechazada'
                ? 'Solicitud 2D rechazada'
                : 'Pendiente de aprobación 2D';
        return `
            <form onsubmit="app.saveWorkshopProductPrices(event, '${product.id}')" class="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div class="mb-3 flex items-center gap-3">
                    <img src="${esc(product.image)}" alt="${esc(product.name)}" class="h-14 w-14 rounded-lg border border-slate-800 object-cover">
                    <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                            <h4 class="truncate text-xs font-bold text-white">${esc(product.name)}</h4>
                            ${product.custom ? `<span class="rounded px-1.5 py-0.5 text-[9px] font-bold ${
        product.simulatorApproved ? 'bg-emerald-500/20 text-emerald-300' : request?.status === 'Rechazada' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
    }">${esc(simulatorStatus)}</span>` : ''}
                        </div>
                        <p class="text-[10px] text-slate-400">${esc(product.category)} · ${esc(product.material)}</p>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
                    <label class="text-slate-400">Precio base MXN
                        <input id="ws-price-${product.id}" type="number" min="0.01" step="0.01" value="${prices.basePrice}" required class="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white">
                    </label>
                    <label class="text-slate-400">Desc. 20-49%
                        <input id="ws-disc20-${product.id}" type="number" min="0" max="100" step="0.1" value="${prices.disc20}" required class="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white">
                    </label>
                    <label class="text-slate-400">Desc. 50-99%
                        <input id="ws-disc50-${product.id}" type="number" min="0" max="100" step="0.1" value="${prices.disc50}" required class="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white">
                    </label>
                    <label class="text-slate-400">Desc. 100+%
                        <input id="ws-disc100-${product.id}" type="number" min="0" max="100" step="0.1" value="${prices.disc100}" required class="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white">
                    </label>
                </div>
                <button type="submit" class="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-indigo-500">Guardar precios</button>
            </form>
        `;
    }).join('');
}

export function saveWorkshopProductPrices(event, productId) {
    event.preventDefault();
    if (state.currentUser.type !== 'workshop') {
        showToast('Inicia sesión con tu empresa para modificar precios.', 'error');
        return;
    }

    const workshop = state.currentUser.data;
    const prices = workshop.productsCatalog?.[productId];
    if (!prices || !CATALOG_PRODUCTS.some(product => product.id === productId)) {
        showToast('No se encontró el producto asociado a tu empresa.', 'error');
        return;
    }

    const basePrice = Number(document.getElementById(`ws-price-${productId}`).value);
    const disc20 = Number(document.getElementById(`ws-disc20-${productId}`).value);
    const disc50 = Number(document.getElementById(`ws-disc50-${productId}`).value);
    const disc100 = Number(document.getElementById(`ws-disc100-${productId}`).value);
    if (!Number.isFinite(basePrice) || basePrice <= 0
        || [disc20, disc50, disc100].some(discount => !Number.isFinite(discount) || discount < 0 || discount > 100)) {
        showToast('Ingresa un precio mayor a cero y descuentos entre 0% y 100%.', 'error');
        return;
    }

    Object.assign(prices, { basePrice, disc20, disc50, disc100 });
    renderWorkshopDashboard();
    renderCatalog();
    showToast('Precios actualizados. Se aplicarán a las nuevas cotizaciones.');
}

export function addWorkshopProduct(event) {
    event.preventDefault();
    if (state.currentUser.type !== 'workshop') {
        showToast('Inicia sesión con tu empresa para publicar productos.', 'error');
        return;
    }

    const workshop = state.currentUser.data;
    const form = document.getElementById('workshop-product-form');
    const file = form.elements.image.files[0];
    if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
        showToast('Selecciona una imagen PNG, JPG o WebP de máximo 5 MB.', 'error');
        return;
    }

    const name = form.elements.name.value.trim();
    const category = form.elements.category.value;
    const description = form.elements.description.value.trim();
    const material = form.elements.material.value.trim();
    const basePrice = Number(form.elements.basePrice.value);
    const disc20 = Number(form.elements.disc20.value);
    const disc50 = Number(form.elements.disc50.value);
    const disc100 = Number(form.elements.disc100.value);
    if (!name || !['Industrial', 'Corporativo', 'Gastronomia', 'Deportivo'].includes(category)
        || !description || !material || !Number.isFinite(basePrice) || basePrice <= 0
        || [disc20, disc50, disc100].some(discount => !Number.isFinite(discount) || discount < 0 || discount > 100)) {
        showToast('Completa los datos del producto y revisa el precio y sus descuentos.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onerror = () => showToast('No se pudo leer la imagen seleccionada.', 'error');
    reader.onload = () => {
        if (state.currentUser.type !== 'workshop' || state.currentUser.data.id !== workshop.id) {
            showToast('La sesión de empresa cambió. Inicia sesión nuevamente para publicar el producto.', 'error');
            return;
        }
        if (typeof reader.result !== 'string' || !reader.result.startsWith('data:image/')) {
            showToast('No se pudo procesar la imagen seleccionada.', 'error');
            return;
        }

        const id = `prod-custom-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
        CATALOG_PRODUCTS.push({
            id, name, category, image: reader.result, desc: description, material, custom: true,
            workshopId: workshop.id, simulatorApproved: false
        });
        workshop.productsCatalog[id] = { basePrice, disc20, disc50, disc100 };
        state.simulatorRequests.unshift({
            id: `sim-request-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
            productId: id,
            workshopId: workshop.id,
            status: 'Pendiente',
            submittedAt: new Date().toISOString()
        });

        renderCatalog();
        renderAdminDashboard();
        renderRegistrationProductsList();
        renderWorkshopDashboard();
        form.reset();
        showToast(`"${name}" ya aparece en el catálogo y se solicitó su aprobación para el simulador 2D.`);
    };
    reader.readAsDataURL(file);
}

function getWorkshopOrderAmounts(order, workshop) {
    const breakdown = order.workshopBreakdown?.find(item => item.workshopId === workshop.id);
    const subtotal = breakdown?.subtotalProduccion ?? order.subtotalProduccion ?? order.total;
    const commissionRate = breakdown?.commissionRate ?? order.commissionRate ?? workshop.commissionRate ?? 0.05;
    const commission = breakdown?.commissionAmount ?? order.commissionAmount ?? subtotal * commissionRate;
    const payout = breakdown?.payoutAmount ?? order.payoutAmount ?? subtotal - commission;
    return { subtotal, commissionRate, commission, payout };
}

export function renderWorkshopDashboard() {
    if (state.currentUser.type !== 'workshop') return;

    const ws = state.currentUser.data;
    document.getElementById('workshop-panel-title').innerHTML = `<i class="fa-solid fa-industry text-teal-400"></i> Portal: ${esc(ws.name)}`;
    renderWorkshopProducts(ws);

    const myOrders = state.ordersData.filter(o =>
        o.workshopBreakdown?.some(item => item.workshopId === ws.id)
        || o.empresaId === ws.id
    );
    const totalPayout = myOrders.reduce((sum, order) => sum + getWorkshopOrderAmounts(order, ws).payout, 0);

    document.getElementById('ws-stat-orders').textContent = myOrders.length;
    document.getElementById('ws-stat-revenue').textContent = money(totalPayout);
    document.getElementById('ws-stat-quejas').textContent = `${ws.quejasCount} / 3 Quejas`;

    const tbody = document.getElementById('workshop-orders-table-body');
    tbody.innerHTML = '';

    if (myOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500">No hay órdenes asignadas aún para este taller.</td></tr>`;
        return;
    }

    myOrders.forEach(o => {
        const tr = document.createElement('tr');
        const amounts = getWorkshopOrderAmounts(o, ws);
        const workshopItems = o.items?.filter(item => item.workshopId === ws.id) || [];
        const productSummary = workshopItems.length
            ? workshopItems.map(item => `${esc(item.productName)} (${item.quantity} pzs)`).join('<br>')
            : `${esc(o.productoNombre)} (${o.cantidadTotal} pzs)`;
        const designSummary = workshopItems.length
            ? workshopItems.map(item => item.design
                ? `${esc(item.productName)}: ${esc(item.design.technique)}`
                : null).filter(Boolean).join(' · ')
            : o.design ? esc(o.design.technique) : '';
        tr.innerHTML = `
            <td class="p-3 font-mono font-bold text-indigo-400">${o.id}</td>
            <td class="p-3 font-bold text-white">${esc(o.cliente)}</td>
            <td class="p-3">${productSummary}${designSummary ? `<span class="block text-[10px] text-emerald-300">🎨 ${designSummary}</span>` : ''}</td>
            <td class="p-3 min-w-64">
                <span class="block text-slate-300">Subtotal del pedido: ${money(amounts.subtotal)}</span>
                <span class="block text-amber-300">Comisión TextilConecta (${(amounts.commissionRate * 100).toFixed(0)}%): -${money(amounts.commission)}</span>
                <strong class="block text-emerald-300">Total a depositar (estimado): ${money(amounts.payout)}</strong>
                <span class="block text-[10px] text-slate-500">Cálculo demostrativo; no representa un depósito real.</span>
            </td>
            <td class="p-3">
                <select onchange="app.updateOrderStatusFromAdmin('${o.id}', this.value)" class="bg-slate-950 border border-teal-500/50 rounded px-2 py-1 text-xs text-teal-300 font-bold focus:outline-none">
                    <option value="Recibido" ${o.estado === 'Recibido' ? 'selected' : ''}>1. Recibido</option>
                    <option value="Ponchado" ${o.estado === 'Ponchado' ? 'selected' : ''}>2. Ponchado</option>
                    <option value="Confección / Bordado" ${o.estado === 'Confección / Bordado' ? 'selected' : ''}>3. Confección / Bordado</option>
                    <option value="Control de Calidad" ${o.estado === 'Control de Calidad' ? 'selected' : ''}>4. Control de Calidad</option>
                    <option value="En camino" ${o.estado === 'En camino' ? 'selected' : ''}>5. En camino</option>
                    <option value="Entregado" ${o.estado === 'Entregado' ? 'selected' : ''}>6. Entregado</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

export function updateOrderStatusFromAdmin(orderId, newStatus) {
    const order = state.ordersData.find(o => o.id === orderId);
    const isAdmin = state.currentUser.type === 'admin';
    const isOwningWorkshop = state.currentUser.type === 'workshop'
        && (order?.empresaId === state.currentUser.data.id
            || order?.workshopBreakdown?.some(item => item.workshopId === state.currentUser.data.id));
    if (!isAdmin && !isOwningWorkshop) {
        showToast('No tienes permisos para modificar este pedido.', 'error');
        return;
    }

    if (order) {
        order.estado = newStatus;
        showToast(`Estatus del pedido #${orderId} actualizado a "${newStatus}"`);
        renderWorkshopDashboard();
        renderAdminDashboard();
    }
}
