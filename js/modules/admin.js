// Módulo: admin
import { state } from '../state.js';
import { esc } from '../utils/escape.js';
import { showToast } from './toast.js';
import { renderCatalog } from './catalog.js';
import { renderMapMarkers } from './map.js';
import { CATALOG_PRODUCTS } from '../data/catalog.js';
import { populateSimulatorProductSelector } from './simulator.js';

function requireSuperAdmin() {
    if (state.currentUser.type === 'admin') return true;
    showToast('Esta acción requiere permisos de SuperAdministrador.', 'error');
    return false;
}

export function switchAdminTab(tabName) {
    if (!requireSuperAdmin()) return;
    const tabs = ['workshops', 'reports', 'orders', 'simulator-requests'];
    if (!tabs.includes(tabName)) {
        showToast('La sección administrativa solicitada no es válida.', 'error');
        return;
    }

    tabs.forEach(tab => {
        document.getElementById(`admin-sub-${tab}`).classList.add('hidden');
        document.getElementById(`admin-tab-${tab}`).className = 'px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition whitespace-nowrap';
    });

    document.getElementById(`admin-sub-${tabName}`).classList.remove('hidden');
    document.getElementById(`admin-tab-${tabName}`).className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white transition whitespace-nowrap';
}

function renderSimulatorRequests() {
    const pendingCount = state.simulatorRequests.filter(request => request.status === 'Pendiente').length;
    document.getElementById('admin-simulator-pending-count').textContent = pendingCount;

    const container = document.getElementById('admin-simulator-requests-list');
    const requests = [...state.simulatorRequests].sort((a, b) =>
        (a.status === 'Pendiente' ? 0 : 1) - (b.status === 'Pendiente' ? 0 : 1)
    );

    if (requests.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-400">No hay solicitudes de productos para el simulador.</p>';
        return;
    }

    container.innerHTML = requests.map(request => {
        const product = CATALOG_PRODUCTS.find(item => item.id === request.productId);
        const workshop = state.workshopsData.find(item => item.id === request.workshopId);
        if (!product) return '';

        const isPending = request.status === 'Pendiente';
        const statusClass = request.status === 'Aprobada'
            ? 'bg-emerald-500/20 text-emerald-300'
            : request.status === 'Rechazada'
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-amber-500/20 text-amber-300';
        return `
            <article class="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div class="flex gap-3">
                    <img src="${esc(product.image)}" alt="${esc(product.name)}" class="h-24 w-24 rounded-lg border border-slate-800 object-cover">
                    <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <h4 class="text-sm font-bold text-white">${esc(product.name)}</h4>
                            <span class="rounded px-2 py-0.5 text-[10px] font-bold ${statusClass}">${esc(request.status)}</span>
                        </div>
                        <p class="mt-1 text-[11px] text-slate-400">${esc(product.category)} · ${esc(product.material)}</p>
                        <p class="mt-2 text-xs text-slate-300">${esc(product.desc)}</p>
                        <p class="mt-2 text-[10px] text-slate-500">Empresa: ${esc(workshop?.name || 'Empresa no disponible')}</p>
                    </div>
                </div>
                ${isPending ? `
                    <div class="mt-4 flex justify-end gap-2">
                        <button onclick="app.reviewSimulatorProductRequest('${request.id}', 'Rechazada')" class="rounded-lg border border-rose-500/30 bg-rose-600/20 px-3 py-1.5 text-[11px] font-bold text-rose-300 hover:bg-rose-600/40">Rechazar</button>
                        <button onclick="app.reviewSimulatorProductRequest('${request.id}', 'Aprobada')" class="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500">Aprobar para simulador</button>
                    </div>
                ` : ''}
            </article>
        `;
    }).join('');
}

export function reviewSimulatorProductRequest(requestId, decision) {
    if (!requireSuperAdmin()) return;
    if (!['Aprobada', 'Rechazada'].includes(decision)) {
        showToast('La decisión para esta solicitud no es válida.', 'error');
        return;
    }

    const request = state.simulatorRequests.find(item => item.id === requestId && item.status === 'Pendiente');
    const product = request && CATALOG_PRODUCTS.find(item => item.id === request.productId);
    if (!request || !product) {
        showToast('La solicitud pendiente o su producto ya no están disponibles.', 'error');
        return;
    }

    request.status = decision;
    product.simulatorApproved = decision === 'Aprobada';
    if (decision === 'Aprobada') populateSimulatorProductSelector();
    renderCatalog();
    renderAdminDashboard();
    showToast(decision === 'Aprobada'
        ? `"${product.name}" fue aprobado para el simulador 2D.`
        : `La solicitud de "${product.name}" fue rechazada.`);
}

export function renderAdminDashboard() {
    const wsTable = document.getElementById('admin-workshops-table-body');
    document.getElementById('admin-workshop-count').textContent = `${state.workshopsData.length} Empresas`;
    wsTable.innerHTML = '';

    state.workshopsData.forEach(w => {
        const tr = document.createElement('tr');
        const isBaja = (w.status === 'Dada de Baja');

        tr.innerHTML = `
            <td class="p-3 font-bold text-white">${esc(w.name)}<span class="block text-[10px] text-slate-500 font-normal">RFC: ${esc(w.rfc)}</span></td>
            <td class="p-3 font-mono font-bold text-indigo-400">${esc(w.rfc)}</td>
            <td class="p-3">${esc(w.municipio)}</td>
            <td class="p-3">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isBaja ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}">
                    ${w.status}
                </span>
            </td>
            <td class="p-3">
                <span class="font-extrabold ${w.quejasCount >= 3 ? 'text-rose-400 font-black' : w.quejasCount > 0 ? 'text-amber-400' : 'text-slate-400'}">
                    ${w.quejasCount} / 3 Quejas
                </span>
            </td>
            <td class="p-3 text-right">
                <div class="flex justify-end gap-2">
                    <button onclick="app.editWorkshop('${w.id}')" class="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded text-[11px] font-bold">Editar</button>
                    ${isBaja ? '<button onclick="app.reactivateWorkshop(\''+w.id+'\')" class="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded text-[11px] font-bold">Reactivar</button>' : ''}
                    <button onclick="app.deleteWorkshop('${w.id}')" class="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded text-[11px] font-bold">Eliminar</button>
                </div>
            </td>
        `;
        wsTable.appendChild(tr);
    });

    const repTable = document.getElementById('admin-reports-table-body');
    repTable.innerHTML = '';

    state.reportsData.forEach(r => {
        const ws = state.workshopsData.find(w => w.id === r.workshopId);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="p-3 font-mono font-bold text-rose-400">${r.id}</td>
            <td class="p-3 font-bold text-white">${esc(r.workshopName)}</td>
            <td class="p-3 text-slate-300">${esc(r.client)}</td>
            <td class="p-3 text-slate-400 max-w-xs truncate">${esc(r.desc)}</td>
            <td class="p-3 font-bold text-amber-400">${ws ? `${ws.quejasCount} / 3 Quejas` : 'Empresa eliminada'}</td>
            <td class="p-3 text-right">
                <button onclick="app.resolveReport('${r.id}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-bold">
                    Archivar
                </button>
            </td>
        `;
        repTable.appendChild(tr);
    });

    const ordTable = document.getElementById('admin-orders-table-body');
    ordTable.innerHTML = '';

    state.ordersData.forEach(o => {
        const tr = document.createElement('tr');
        const designSummary = o.items?.length
            ? o.items.map(item => item.design
                ? `${esc(item.productName)}: ${esc(item.design.technique)}`
                : null).filter(Boolean).join(' · ')
            : o.design ? esc(o.design.technique) : '';
        tr.innerHTML = `
            <td class="p-3 font-mono font-bold text-indigo-400">${o.id}</td>
            <td class="p-3 font-bold text-white">${esc(o.cliente)}</td>
            <td class="p-3">${esc(o.empresaNombre)}</td>
            <td class="p-3">${esc(o.productoNombre)} (${o.cantidadTotal} pzs)${designSummary ? ` · 🎨 ${designSummary}` : ''}</td>
            <td class="p-3 font-extrabold text-emerald-400">$${o.total.toFixed(2)}</td>
            <td class="p-3">
                <select onchange="app.updateOrderStatusFromAdmin('${o.id}', this.value)" class="bg-slate-950 border border-indigo-500/50 rounded px-2 py-1 text-xs text-indigo-300 font-bold focus:outline-none">
                    <option value="Recibido" ${o.estado === 'Recibido' ? 'selected' : ''}>1. Recibido</option>
                    <option value="Ponchado" ${o.estado === 'Ponchado' ? 'selected' : ''}>2. Ponchado</option>
                    <option value="Confección / Bordado" ${o.estado === 'Confección / Bordado' ? 'selected' : ''}>3. Confección / Bordado</option>
                    <option value="Control de Calidad" ${o.estado === 'Control de Calidad' ? 'selected' : ''}>4. Control de Calidad</option>
                    <option value="En camino" ${o.estado === 'En camino' ? 'selected' : ''}>5. En camino</option>
                    <option value="Entregado" ${o.estado === 'Entregado' ? 'selected' : ''}>6. Entregado</option>
                </select>
            </td>
        `;
        ordTable.appendChild(tr);
    });

    renderSimulatorRequests();
}

export function openNewReportModal() {
    if (!requireSuperAdmin()) return;
    const select = document.getElementById('rep-workshop-select');
    select.innerHTML = '';
    state.workshopsData.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w.id;
        opt.textContent = `${w.name} (${w.quejasCount}/3 Quejas actuales)`;
        select.appendChild(opt);
    });
    document.getElementById('report-modal').classList.remove('hidden');
}

export function closeReportModal() {
    document.getElementById('report-modal').classList.add('hidden');
}

export function handleCreateReport(e) {
    e.preventDefault();
    if (!requireSuperAdmin()) return;
    const wsId = document.getElementById('rep-workshop-select').value;
    const ws = state.workshopsData.find(w => w.id === wsId);
    const client = document.getElementById('rep-client').value;
    const desc = document.getElementById('rep-desc').value;

    ws.quejasCount += 1;

    if (ws.quejasCount >= 3) {
        ws.status = 'Dada de Baja';
        showToast(`¡ATENCIÓN! La empresa "${ws.name}" acumuló 3 quejas y ha sido DADA DE BAJA de la plataforma.`, 'error');
    } else {
        showToast(`Llamada de atención registrada a "${ws.name}". Total quejas: ${ws.quejasCount}/3`);
    }

    state.reportsData.unshift({
        id: `REP-${Math.floor(100 + Math.random() * 900)}`,
        workshopId: wsId,
        workshopName: ws.name,
        client: client,
        desc: desc,
        fecha: new Date().toISOString().split('T')[0]
    });

    renderAdminDashboard();
    renderMapMarkers('ALL');
    renderCatalog();
    closeReportModal();
}

export function reactivateWorkshop(workshopId) {
    if (!requireSuperAdmin()) return;
    const ws = state.workshopsData.find(w => w.id === workshopId);
    if (ws) {
        ws.status = 'Activo';
        ws.quejasCount = 0;
        renderAdminDashboard();
        renderMapMarkers('ALL');
        renderCatalog();
        showToast(`Empresa "${ws.name}" reactivada y contador de quejas reiniciado.`);
    }
}

export function editWorkshop(workshopId) {
    if (!requireSuperAdmin()) return;
    const workshop = state.workshopsData.find(w => w.id === workshopId);
    if (!workshop) {
        showToast('No se encontró la empresa que intentas editar.', 'error');
        return;
    }

    document.getElementById('admin-edit-workshop-id').value = workshop.id;
    document.getElementById('admin-edit-workshop-name').value = workshop.name;
    document.getElementById('admin-edit-workshop-municipio').value = workshop.municipio;
    document.getElementById('admin-edit-workshop-phone').value = workshop.phone;
    document.getElementById('admin-edit-workshop-address').value = workshop.address;
    document.getElementById('admin-edit-workshop-modal').classList.remove('hidden');
}

export function closeEditWorkshopModal() {
    document.getElementById('admin-edit-workshop-modal').classList.add('hidden');
}

export function saveWorkshopChanges(e) {
    e.preventDefault();
    if (!requireSuperAdmin()) return;
    const workshop = state.workshopsData.find(w => w.id === document.getElementById('admin-edit-workshop-id').value);
    if (!workshop) {
        showToast('No se encontró la empresa que intentas editar.', 'error');
        closeEditWorkshopModal();
        return;
    }

    workshop.name = document.getElementById('admin-edit-workshop-name').value.trim();
    workshop.municipio = document.getElementById('admin-edit-workshop-municipio').value.trim();
    workshop.phone = document.getElementById('admin-edit-workshop-phone').value.trim();
    workshop.address = document.getElementById('admin-edit-workshop-address').value.trim();

    renderAdminDashboard();
    renderMapMarkers('ALL');
    renderCatalog();
    closeEditWorkshopModal();
    showToast(`Datos de "${workshop.name}" actualizados.`);
}

export function deleteWorkshop(workshopId) {
    if (!requireSuperAdmin()) return;
    const workshop = state.workshopsData.find(w => w.id === workshopId);
    if (!workshop) {
        showToast('No se encontró la empresa que intentas eliminar.', 'error');
        return;
    }
    if (!window.confirm(`¿Eliminar a "${workshop.name}" de las empresas afiliadas? Se conservarán sus pedidos e incidencias históricos.`)) return;

    state.workshopsData = state.workshopsData.filter(w => w.id !== workshopId);
    renderAdminDashboard();
    renderMapMarkers('ALL');
    renderCatalog();
    showToast(`Empresa "${workshop.name}" eliminada. Su historial de pedidos e incidencias se conservó.`);
}

export function resolveReport(reportId) {
    if (!requireSuperAdmin()) return;
    state.reportsData = state.reportsData.filter(r => r.id !== reportId);
    renderAdminDashboard();
    showToast('Sanción o reporte archivado');
}
