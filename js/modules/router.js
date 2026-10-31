// Módulo: router
import { state } from '../state.js';
import { initRegistrationMap, refreshRegistrationMap } from './map.js';

export function switchTab(tabId) {
    if (tabId === 'admin' && state.currentUser.type !== 'admin') {
        window.app?.openLoginModal('admin');
        window.app?.showToast('El panel de administración solo está disponible para el SuperAdministrador.', 'error');
        return;
    }
    if (tabId === 'workshop-panel' && state.currentUser.type !== 'workshop') {
        window.app?.openLoginModal('workshop');
        window.app?.showToast('Inicia sesión con la cuenta de tu empresa para abrir este panel.', 'error');
        return;
    }

    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-600/30', 'text-white', 'border', 'border-indigo-500/40');
        btn.classList.add('text-slate-300');
    });

    const activeSection = document.getElementById(`section-${tabId}`);
    if (activeSection) activeSection.classList.remove('hidden');

    const activeNav = document.getElementById(`nav-${tabId}`);
    if (activeNav) {
        activeNav.classList.add('bg-indigo-600/30', 'text-white', 'border', 'border-indigo-500/40');
        activeNav.classList.remove('text-slate-300');
    }

    if (tabId === 'map' && state.leafletMap) {
        setTimeout(() => { state.leafletMap.invalidateSize(); }, 200);
    }
    if (tabId === 'register') {
        initRegistrationMap();
        setTimeout(refreshRegistrationMap, 200);
    }
}

export function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}
