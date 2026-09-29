tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#0ea5e9", // vibrant cyan
                "primary-container": "#0369a1",
                secondary: "#f43f5e", // neon pink accent
                background: "#0f172a", // deep navy dark background
                surface: "#1e293b",
                "surface-variant": "#334155",
                "on-surface": "#f8fafc",
                "on-surface-variant": "#cbd5e1",
                "on-primary": "#ffffff",
                "surface-container-lowest": "rgba(30, 41, 59, 0.6)",
                "surface-container-low": "rgba(51, 65, 85, 0.7)",
                "surface-container-high": "rgba(71, 85, 105, 0.8)",
                "outline-variant": "#475569"
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif']
            }
        }
    }
};

// Application logic for Admin Controls & Modals
document.addEventListener('DOMContentLoaded', () => {
    // Inject Toast Container
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-4 right-4 z-[100] flex flex-col gap-2';
    document.body.appendChild(toastContainer);

    window.showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-emerald-500' : (type === 'error' ? 'bg-rose-500' : 'bg-primary');
        toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg font-medium transform transition-all duration-300 translate-x-full opacity-0 flex items-center gap-2`;
        
        const icon = type === 'success' ? 'check_circle' : (type === 'error' ? 'error' : 'info');
        toast.innerHTML = `<span class="material-symbols-outlined">${icon}</span> ${message}`;
        
        document.getElementById('toast-container').appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
        });

        // Animate out and remove after 3s
        setTimeout(() => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // Make all buttons functional
    document.querySelectorAll('button').forEach(btn => {
        // If the button has no click event or is just a dummy alert, replace it
        btn.addEventListener('click', (e) => {
            const text = btn.innerText.trim().toLowerCase();
            if (text.includes('new calculation') || text.includes('calculate')) {
                showToast('Initializing new payroll calculation cycle...', 'success');
            } else if (text.includes('payslip') || text.includes('export')) {
                showToast('Generating and exporting payslips...', 'info');
            } else if (text.includes('view all')) {
                showToast('Loading full activity history...', 'info');
            } else if (text.includes('admin') || text.includes('manage')) {
                showToast('Opening Admin Console...', 'success');
            } else {
                // Generic action
                const btnAction = btn.innerText.trim() || 'Action';
                if(btnAction.length > 0 && !btnAction.includes('add') && !btnAction.includes('more_vert')) {
                   showToast(`Triggered: ${btnAction}`, 'info');
                } else {
                   showToast(`Action triggered successfully.`, 'success');
                }
            }
        });
    });
});
