(() => {
    'use strict'

    const getStoredTheme = () => localStorage.getItem('theme')
    const setStoredTheme = theme => localStorage.setItem('theme', theme)

    const getPreferredTheme = () => {
        const storedTheme = getStoredTheme()
        if (storedTheme) {
            return storedTheme
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    const setTheme = theme => {
        if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-bs-theme', 'dark')
        } else {
            document.documentElement.setAttribute('data-bs-theme', theme)
        }
    }

    const updateThemeIcon = (theme) => {
        const darkModeIcon = document.querySelector('.dark-mode-icon');
        const lightModeIcon = document.querySelector('.light-mode-icon');
        
        if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            darkModeIcon.classList.add('d-none');
            lightModeIcon.classList.remove('d-none');
        } else {
            darkModeIcon.classList.remove('d-none');
            lightModeIcon.classList.add('d-none');
        }
    }

    const setActiveTheme = (theme) => {
        document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
            element.classList.remove('active');
            if (element.getAttribute('data-bs-theme-value') === theme) {
                element.classList.add('active');
            }
        });
    }

    // Initialize theme
    document.addEventListener('DOMContentLoaded', () => {
        const storedTheme = getStoredTheme() || 'auto';
        setTheme(storedTheme);
        updateThemeIcon(storedTheme);
        setActiveTheme(storedTheme);

        // Theme change handlers
        document.querySelectorAll('[data-bs-theme-value]').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const theme = toggle.getAttribute('data-bs-theme-value');
                setStoredTheme(theme);
                setTheme(theme);
                updateThemeIcon(theme);
                setActiveTheme(theme);
            });
        });

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            const storedTheme = getStoredTheme() || 'auto';
            if (storedTheme === 'auto') {
                updateThemeIcon('auto');
            }
        });
    });
})();
