// Datos semilla de demostración (reemplazar por API/BD real)
export const SEED_WORKSHOPS = [
    {
        id: 'ws-1', name: 'Bordados e Industriales San Miguel', rfc: 'BSM120405HQ8', password: 'taller123', municipio: 'Orizaba', phone: '272 725 1122', address: 'Av. Cri-Cri #840, Col. Centro, Orizaba', lat: 18.849, lng: -97.103, rating: 4.9, leadTime: '3 a 5 días hábiles',
        quejasCount: 0, status: 'Activo',
        productsCatalog: {
            'prod-1': { basePrice: 165, disc20: 5, disc50: 10, disc100: 15 },
            'prod-2': { basePrice: 280, disc20: 4, disc50: 8, disc100: 12 },
            'prod-3': { basePrice: 120, disc20: 5, disc50: 10, disc100: 18 },
            'prod-5': { basePrice: 85,  disc20: 6, disc50: 12, disc100: 20 },
            'prod-8': { basePrice: 110, disc20: 5, disc50: 10, disc100: 15 }
        }
    },
    {
        id: 'ws-2', name: 'Confecciones y Bordados de Córdoba', rfc: 'CBC180920K91', password: 'taller123', municipio: 'Córdoba', phone: '271 714 8890', address: 'Calle 9 #1210, Col. San José, Córdoba', lat: 18.894, lng: -96.935, rating: 4.8, leadTime: '4 a 6 días hábiles',
        quejasCount: 1, status: 'Activo',
        productsCatalog: {
            'prod-1': { basePrice: 158, disc20: 4, disc50: 8, disc100: 14 },
            'prod-4': { basePrice: 520, disc20: 5, disc50: 10, disc100: 15 },
            'prod-6': { basePrice: 340, disc20: 5, disc50: 12, disc100: 16 },
            'prod-9': { basePrice: 260, disc20: 6, disc50: 10, disc100: 18 }
        }
    }
];

export const SEED_ORDERS = [
    {
        id: 'TC-2026-9812', cliente: 'Uniforme Seguro S.A.', empresaId: 'ws-1', empresaNombre: 'Bordados e Industriales San Miguel', productoId: 'prod-1', productoNombre: 'Playera Polo Piqué Executive', cantidadTotal: 50, total: 8793.00, subtotalProduccion: 7425.00, commissionRate: 0.05, commissionAmount: 371.25, payoutAmount: 7053.75, workshopBreakdown: [{ workshopId: 'ws-1', subtotalProduccion: 7425.00, commissionRate: 0.05, commissionAmount: 371.25, payoutAmount: 7053.75 }], metodoPago: 'Tarjeta Bancaria', estado: 'Confección / Bordado', fecha: '2026-10-22', tallas: { CH: 10, M: 20, G: 10, XG: 10, XXG: 0 }
    }
];

export const SEED_REPORTS = [
    { id: 'REP-101', workshopId: 'ws-2', workshopName: 'Confecciones y Bordados de Córdoba', client: 'Comercializadora Altas Montañas', desc: 'Retraso de 2 días sobre la fecha pactada.', fecha: '2026-10-15' }
];
