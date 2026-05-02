// Theme toggling
const themeToggleBtn = document.getElementById('themeToggle');
const body = document.body;

// Check local storage for theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    if (!themeToggleBtn) return;
    const icon = themeToggleBtn.querySelector('i');
    if (theme === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// API Config
const API_URL = 'http://localhost:8000';

function getAuthHeaders() {
    const selectedModel = localStorage.getItem('selectedModel') || 'llama3-70b-8192';
    return {
        'Content-Type': 'application/json',
        'X-Model-Name': selectedModel
    };
}
