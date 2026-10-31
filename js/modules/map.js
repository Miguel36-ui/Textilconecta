// Módulo: map
import { state } from '../state.js';
import { esc } from '../utils/escape.js';
import { showToast } from './toast.js';

let registrationMap = null;
let registrationMarker = null;

export function initLeafletMap() {
    state.leafletMap = L.map('leaflet-map').setView([18.849, -97.103], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(state.leafletMap);
    renderMapMarkers('ALL');
}

export function initRegistrationMap() {
    if (registrationMap) return;

    const latInput = document.getElementById('reg-lat');
    const lngInput = document.getElementById('reg-lng');
    const lat = Number.parseFloat(latInput.value) || 18.849;
    const lng = Number.parseFloat(lngInput.value) || -97.103;

    registrationMap = L.map('registration-map').setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(registrationMap);
    registrationMarker = L.marker([lat, lng]).addTo(registrationMap);
    latInput.value = lat;
    lngInput.value = lng;

    registrationMap.on('click', (event) => setRegistrationLocation(event.latlng));
}

export function refreshRegistrationMap() {
    if (registrationMap) registrationMap.invalidateSize();
}

export function setRegistrationLocation(location) {
    const lat = Number(location.lat);
    const lng = Number(location.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        showToast('No se pudo determinar una ubicación válida.', 'error');
        return;
    }

    document.getElementById('reg-lat').value = lat.toFixed(6);
    document.getElementById('reg-lng').value = lng.toFixed(6);
    if (registrationMarker) registrationMarker.setLatLng([lat, lng]);
    if (registrationMap) registrationMap.setView([lat, lng], registrationMap.getZoom());
}

export function geolocateUser() {
    if (!navigator.geolocation) {
        showToast('Este navegador no permite obtener tu ubicación.', 'error');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        ({ coords }) => setRegistrationLocation({ lat: coords.latitude, lng: coords.longitude }),
        (error) => {
            const message = error.code === error.PERMISSION_DENIED
                ? 'Permite el acceso a tu ubicación en el navegador para usar esta función.'
                : 'No se pudo obtener tu ubicación. Selecciónala haciendo clic en el mapa.';
            showToast(message, 'error');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

export function renderMapMarkers(muni) {
    state.mapMarkers.forEach(m => state.leafletMap.removeLayer(m));
    state.mapMarkers = [];

    const filtered = state.workshopsData.filter(w => muni === 'ALL' || w.municipio === muni);

    filtered.forEach(w => {
        const isBaja = (w.status === 'Dada de Baja');
        const marker = L.marker([w.lat, w.lng]).addTo(state.leafletMap);

        marker.bindPopup(`
            <div class="p-1 space-y-1">
                <span class="font-bold text-white text-sm block">${esc(w.name)}</span>
                ${isBaja ? '<span class="text-xs text-rose-400 font-bold block">INACTIVA - DADA DE BAJA (3 QUEJAS)</span>' : '<span class="text-xs text-emerald-400 font-bold block"><i class="fa-solid fa-check-circle"></i> Taller Activo ('+w.municipio+')</span>'}
                <p class="text-[11px] text-slate-300"><strong>Tel:</strong> ${esc(w.phone)}</p>
            </div>
        `);
        state.mapMarkers.push(marker);
    });
}

export function filterMapMarkers() {
    renderMapMarkers(document.getElementById('map-municipio-filter').value);
}
