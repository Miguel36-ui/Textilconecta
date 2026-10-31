// Módulo: catalog
import { state } from '../state.js';
import { CATALOG_PRODUCTS } from '../data/catalog.js';
import { esc } from '../utils/escape.js';

export function filterCategory(cat, btn) {
    state.currentCategoryFilter = cat;
    document.querySelectorAll('.cat-filter').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white');
        btn.classList.add('bg-slate-800', 'text-slate-300');
    });
    btn?.classList.add('bg-indigo-600', 'text-white');
    btn?.classList.remove('bg-slate-800', 'text-slate-300');
    renderCatalog();
}

export function renderCatalog() {
    const grid = document.getElementById('product-grid');
    const search = document.getElementById('catalog-search').value.toLowerCase();
    grid.innerHTML = '';

    const filtered = CATALOG_PRODUCTS.filter(p => {
        const matchCat = (state.currentCategoryFilter === 'ALL' || p.category === state.currentCategoryFilter);
        const matchSearch = p.name.toLowerCase().includes(search) || p.desc.toLowerCase().includes(search);
        return matchCat && matchSearch;
    });

    filtered.forEach(p => {
        const activeSuppliers = state.workshopsData.filter(w => w.status === 'Activo' && w.productsCatalog && w.productsCatalog[p.id]).length;

        const card = document.createElement('div');
        card.className = 'bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col hover:border-indigo-500/50 transition group shadow-lg';
        card.innerHTML = `
            <div class="relative h-48 overflow-hidden bg-slate-950">
                <img src="${esc(p.image)}" alt="${esc(p.name)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90">
                <span class="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-700 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                    ${esc(p.category)}
                </span>
                <span class="absolute bottom-3 right-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded">
                    <i class="fa-solid fa-industry mr-1"></i> ${activeSuppliers} Talleres
                </span>
            </div>
            <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                    <h3 class="font-bold text-white text-base leading-snug group-hover:text-indigo-400 transition">${esc(p.name)}</h3>
                    <p class="text-xs text-slate-400 mt-1 line-clamp-2">${esc(p.desc)}</p>
                    <span class="block text-[10px] text-slate-500 mt-2 font-mono"><i class="fa-solid fa-layer-group text-slate-400 mr-1"></i> ${esc(p.material)}</span>
                </div>

                <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    ${p.custom
        ? (p.simulatorApproved
            ? `<button onclick="app.launchSimulatorForProduct('${p.id}')" class="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/30 transition text-center">
                        <i class="fa-solid fa-pen-nib mr-1"></i> Simular 2D
                    </button>`
            : '<span class="flex-1 text-center text-[10px] text-amber-300">En revisión para simulador</span>')
        : `<button onclick="app.launchSimulatorForProduct('${p.id}')" class="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/30 transition text-center">
                        <i class="fa-solid fa-pen-nib mr-1"></i> Simular 2D
                    </button>`}
                    <button onclick="app.openQuoteModal('${p.id}')" class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition text-center">
                        <i class="fa-solid fa-cart-plus mr-1"></i> Comprar / Carrito
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}
