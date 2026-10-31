// Estado global único. Los módulos lo importan y mutan sus propiedades.
import { SEED_WORKSHOPS, SEED_ORDERS, SEED_REPORTS } from './data/seed.js';

export const state = {
    currentUser: { type: 'guest', data: null }, // 'guest' | 'admin' | 'workshop' | 'client'
    clientsData: [],
    pendingCustomerCheckout: false,
    workshopsData: structuredClone(SEED_WORKSHOPS),
    ordersData: structuredClone(SEED_ORDERS),
    reportsData: structuredClone(SEED_REPORTS),
    simulatorRequests: [],
    carrito: [],
    activeQuote: { productId: null, quantity: 50, color: 'Negro Industrial', selectedWorkshopId: null,
                   sizeBreakdown: { CH: 10, M: 20, G: 10, XG: 10, XXG: 0 }, deliveryType: 'envio', paymentMethod: 'card' },
    garmentColor: '#111827',
    currentCategoryFilter: 'ALL',
    currentCheckoutStep: 1,
    // Mapa
    leafletMap: null, mapMarkers: [],
    // Simulador
    selectedSimProduct: 'prod-1', simCanvas: null, simCtx: null, simView: 'front',
    simLogoImg: new Image(), simLogoLoaded: false,
    simZoom: 1.2,
    simLogoState: { x: 200, y: 190, scale: 1.0, rotate: 0, isDragging: false },
};
