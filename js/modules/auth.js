// Módulo: auth
import { state } from '../state.js';
import { showToast } from './toast.js';
import { renderWorkshopDashboard } from './workshop.js';
import { switchTab } from './router.js';
import { esc } from '../utils/escape.js';

let isClientRegistrationMode = false;

export function openLoginModal(defaultRole = 'workshop') {
    const roleSelect = document.getElementById('login-role');
    roleSelect.value = defaultRole;
    toggleClientRegistrationMode(false);
    updateLoginRoleFields();
    document.getElementById('login-modal').classList.remove('hidden');
}

export function closeLoginModal() {
    document.getElementById('login-modal').classList.add('hidden');
    toggleClientRegistrationMode(false);
}

export function updateLoginRoleFields() {
    const role = document.getElementById('login-role').value;
    const isClient = role === 'client';
    const nameField = document.getElementById('client-name-field');
    const nameInput = document.getElementById('client-name');
    const modeToggle = document.getElementById('client-mode-toggle');
    const usernameLabel = document.getElementById('login-username-label');
    const helpText = document.getElementById('login-help-text');

    modeToggle.classList.toggle('hidden', !isClient);
    nameField.classList.toggle('hidden', !isClient || !isClientRegistrationMode);
    nameInput.required = isClient && isClientRegistrationMode;
    usernameLabel.textContent = role === 'workshop' ? 'RFC *' : role === 'admin' ? 'Usuario *' : 'Correo electrónico *';
    document.getElementById('login-username').placeholder = role === 'workshop' ? 'RFC de la empresa' : role === 'admin' ? 'Usuario de administración' : 'correo@ejemplo.com';
    helpText.textContent = role === 'workshop'
        ? 'Ingresa con el RFC y contraseña de tu empresa.'
        : role === 'admin'
            ? 'Acceso restringido al personal administrador.'
            : isClientRegistrationMode
                ? 'Se creará una cuenta de cliente para realizar y consultar compras.'
                : 'Inicia sesión con tu correo y contraseña de cliente.';
    document.getElementById('login-submit-label').textContent = isClientRegistrationMode ? 'Crear cuenta' : 'Ingresar';
    modeToggle.textContent = isClientRegistrationMode ? 'Ya tengo cuenta' : 'Crear cuenta';
}

export function toggleClientRegistrationMode(forceMode) {
    if (typeof forceMode === 'boolean') isClientRegistrationMode = forceMode;
    else isClientRegistrationMode = !isClientRegistrationMode;
    if (document.getElementById('login-role')) updateLoginRoleFields();
}

export function handleLoginSubmit(e) {
    e.preventDefault();
    const role = document.getElementById('login-role').value;
    const rawUsername = document.getElementById('login-username').value.trim();
    const username = role === 'client' ? rawUsername.toLowerCase() : rawUsername.toUpperCase();
    const password = document.getElementById('login-password').value.trim();

    if (role === 'admin') {
        if ((username === 'ADMIN' || username === 'ADMINISTRADOR') && password === 'admin123') {
            state.currentUser = { type: 'admin', data: { name: 'SuperAdmin Central' } };
            showToast('¡Sesión iniciada como SuperAdministrador!');
            closeLoginModal();
            updateUserStatusBar();
            switchTab('admin');
        } else {
            showToast('Credenciales de SuperAdministrador incorrectas.', 'error');
        }
    } else if (role === 'client') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
            showToast('Ingresa un correo electrónico válido.', 'error');
            return;
        }
        if (isClientRegistrationMode) {
            const name = document.getElementById('client-name').value.trim();
            if (state.clientsData.some(client => client.email === username)) {
                showToast('Ya existe una cuenta con ese correo electrónico.', 'error');
                return;
            }
            const client = { id: `client-${Date.now()}`, name, email: username, password };
            state.clientsData.push(client);
            state.currentUser = { type: 'client', data: client };
            showToast(`Cuenta de cliente creada. ¡Bienvenido, ${name}!`);
        } else {
            const client = state.clientsData.find(account => account.email === username && account.password === password);
            if (!client) {
                showToast('Correo o contraseña de cliente incorrectos. Si aún no tienes cuenta, créala desde aquí.', 'error');
                return;
            }
            state.currentUser = { type: 'client', data: client };
            showToast(`¡Bienvenido, ${client.name}!`);
        }
        closeLoginModal();
        updateUserStatusBar();
        if (state.pendingCustomerCheckout) {
            state.pendingCustomerCheckout = false;
            window.app.startCheckoutFlow();
        }
    } else if (role === 'workshop') {
        const workshop = state.workshopsData.find(w => w.rfc.toUpperCase() === username && w.password === password);
        if (workshop) {
            if (workshop.status === 'Dada de Baja') {
                showToast(`Acceso denegado: La empresa ${workshop.name} está dada de baja por acumulación de quejas.`, 'error');
                return;
            }
            state.currentUser = { type: 'workshop', data: workshop };
            showToast(`¡Bienvenido al Panel del Taller, ${workshop.name}!`);
            closeLoginModal();
            updateUserStatusBar();
            renderWorkshopDashboard();
            switchTab('workshop-panel');
        } else {
            showToast('Usuario (RFC) o contraseña de Taller incorrecta.', 'error');
        }
    }
}

export function logout() {
    state.currentUser = { type: 'guest', data: null };
    state.pendingCustomerCheckout = false;
    updateUserStatusBar();
    switchTab('catalog');
    showToast('Has cerrado la sesión.');
}

export function updateUserStatusBar() {
    const bar = document.getElementById('user-status-bar');
    const navWorkshop = document.getElementById('nav-workshop-panel');
    const navAdmin = document.getElementById('nav-admin');
    const navAdminMobile = document.getElementById('nav-admin-mobile');
    const isAdmin = state.currentUser.type === 'admin';
    navAdmin?.classList.toggle('hidden', !isAdmin);
    navAdminMobile?.classList.toggle('hidden', !isAdmin);

    if (state.currentUser.type === 'admin') {
        bar.innerHTML = `
            <span class="bg-rose-600 text-white text-xs px-2.5 py-1 rounded font-bold flex items-center gap-1">
                <i class="fa-solid fa-user-shield"></i> Admin: Central
            </span>
            <button onclick="app.logout()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded font-semibold transition">
                Salir
            </button>
        `;
        navWorkshop.classList.add('hidden');
    } else if (state.currentUser.type === 'workshop') {
        bar.innerHTML = `
            <span class="bg-teal-600 text-white text-xs px-2.5 py-1 rounded font-bold flex items-center gap-1">
                <i class="fa-solid fa-industry"></i> Taller: ${state.currentUser.data.name}
            </span>
            <button onclick="app.logout()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded font-semibold transition">
                Salir
            </button>
        `;
        navWorkshop.classList.remove('hidden');
    } else if (state.currentUser.type === 'client') {
        bar.innerHTML = `
            <span class="bg-indigo-600 text-white text-xs px-2.5 py-1 rounded font-bold flex items-center gap-1">
                <i class="fa-solid fa-user"></i> Cliente: ${esc(state.currentUser.data.name)}
            </span>
            <button onclick="app.logout()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded font-semibold transition">
                Salir
            </button>
        `;
        navWorkshop.classList.add('hidden');
    } else {
        bar.innerHTML = `
            <button onclick="app.openLoginModal('client')" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-2.5 py-1 rounded font-semibold transition mr-1">
                <i class="fa-solid fa-user mr-1"></i> Acceso Cliente
            </button>
            <button onclick="app.openLoginModal('workshop')" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded font-semibold transition mr-1">
                <i class="fa-solid fa-industry mr-1"></i> Acceso Empresa
            </button>
        `;
        navWorkshop.classList.add('hidden');
    }
}

export function protectedAdminTab() {
    if (state.currentUser.type === 'admin') {
        switchTab('admin');
    } else {
        openLoginModal('admin');
        showToast('Se requieren credenciales de SuperAdministrador para acceder.', 'error');
    }
}

export function protectedWorkshopTab() {
    if (state.currentUser.type === 'workshop') {
        renderWorkshopDashboard();
        switchTab('workshop-panel');
    } else {
        openLoginModal('workshop');
        showToast('Inicia sesión con tu RFC y contraseña de taller.', 'error');
    }
}
