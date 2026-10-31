// Módulo: tracking
import { state } from '../state.js';
import { esc } from '../utils/escape.js';

export function executeOrderSearch() {
    const searchInput = document.getElementById('tracking-search-input').value.trim().toUpperCase();
    const container = document.getElementById('tracking-display-area');

    if (!searchInput) {
        container.innerHTML = `
            <div class="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-3">
                <div class="w-16 h-16 bg-indigo-600/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto text-2xl border border-indigo-500/30">
                    <i class="fa-solid fa-barcode"></i>
                </div>
                <h3 class="text-base font-bold text-white">Búsqueda de Pedido por Número de Rastreo</h3>
                <p class="text-xs text-slate-400 max-w-md mx-auto">
                    Ingresa tu código o folio único de rastreo en la casilla superior para consultar exclusivamente el estatus de tu paquete.
                </p>
                <button onclick="app.quickDemoSearch('TC-2026-9812')" class="inline-block text-xs text-indigo-400 hover:underline pt-2 font-semibold">
                    <i class="fa-solid fa-circle-play mr-1"></i> Probar con Folio Demo: TC-2026-9812
                </button>
            </div>
        `;
        return;
    }

    const matchedOrder = state.ordersData.find(o => o.id.toUpperCase() === searchInput);

    if (!matchedOrder) {
        container.innerHTML = `
            <div class="bg-rose-950/30 p-8 rounded-2xl border border-rose-500/40 text-center space-y-3">
                <div class="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto text-2xl border border-rose-500/30">
                    <i class="fa-solid fa-circle-exclamation"></i>
                </div>
                <h3 class="text-base font-bold text-rose-200">No se encontró ningún pedido con el folio "${esc(searchInput)}"</h3>
                <p class="text-xs text-slate-400 max-w-md mx-auto">
                    Verifica que el número de rastreo ingresado coincida exactamente con la confirmación enviada.
                </p>
            </div>
        `;
        return;
    }

    const STAGES = [
        { key: 'Recibido', label: '1. Recibido', desc: 'Insumos confirmados' },
        { key: 'Ponchado', label: '2. Ponchado', desc: 'Matriz de bordado lista' },
        { key: 'Confección / Bordado', label: '3. Confección', desc: 'En línea de maquila' },
        { key: 'Control de Calidad', label: '4. Calidad', desc: 'Inspección técnica' },
        { key: 'En camino', label: '5. En Camino', desc: 'Ruta de entrega regional' },
        { key: 'Entregado', label: '6. Entregado', desc: 'Firma de conformidad' }
    ];

    const currentIndex = STAGES.findIndex(s => s.key === matchedOrder.estado);

    let html = `
        <div class="bg-slate-950 p-5 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
                <span class="text-[10px] text-slate-500 uppercase font-bold block">Folio Consultado</span>
                <span class="text-lg font-black text-indigo-400">${matchedOrder.id}</span>
                <span class="block text-xs text-slate-400 mt-1">${matchedOrder.cliente}</span>
            </div>
            <div>
                <span class="text-[10px] text-slate-500 uppercase font-bold block">Taller Responsable</span>
                <span class="text-sm font-bold text-white">${matchedOrder.empresaNombre}</span>
                <span class="block text-xs text-emerald-400 mt-1">${matchedOrder.productoNombre} (${matchedOrder.cantidadTotal} pzs)</span>
            </div>
            <div>
                <span class="text-[10px] text-slate-500 uppercase font-bold block">Estatus Actual</span>
                <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 mt-1">
                    ${matchedOrder.estado}
                </span>
            </div>
        </div>

        <div class="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-300">Línea del Tiempo de Producción</h4>
            
            <div class="grid grid-cols-1 sm:grid-cols-6 gap-3">
    `;

    STAGES.forEach((stg, idx) => {
        let statusClass = 'bg-slate-900 border-slate-800 text-slate-600';
        let iconClass = 'fa-circle-notch text-slate-600';

        if (idx < currentIndex) {
            statusClass = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300';
            iconClass = 'fa-circle-check text-emerald-400';
        } else if (idx === currentIndex) {
            statusClass = 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/40 text-white font-bold';
            iconClass = 'fa-spinner fa-spin text-indigo-400';
        }

        html += `
            <div class="p-3 rounded-xl border ${statusClass} space-y-1">
                <div class="flex items-center gap-1.5 text-xs">
                    <i class="fa-solid ${iconClass}"></i>
                    <span class="font-bold">${stg.label}</span>
                </div>
                <p class="text-[10px] opacity-80 leading-tight">${stg.desc}</p>
            </div>
        `;
    });

    html += `</div></div>`;
    container.innerHTML = html;
}

export function quickDemoSearch(code) {
    document.getElementById('tracking-search-input').value = code;
    executeOrderSearch();
}
