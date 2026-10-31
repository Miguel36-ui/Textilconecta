// Notificaciones flotantes (usa textContent: seguro por diseño)
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const bg = type === 'error' ? 'bg-rose-900/90 border-rose-500 text-rose-100' : 'bg-slate-900/95 border-emerald-500 text-emerald-300';
    toast.className = `pointer-events-auto px-4 py-3 rounded-xl border ${bg} backdrop-blur-md shadow-xl text-xs font-bold flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0`;
    const icon = document.createElement('i');
    icon.className = `fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`;
    const text = document.createElement('span');
    text.textContent = message;
    toast.append(icon, text);
    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
    setTimeout(() => { toast.classList.add('opacity-0', 'translate-y-2'); setTimeout(() => toast.remove(), 300); }, 3500);
}
