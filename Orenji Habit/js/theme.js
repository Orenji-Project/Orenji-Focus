if (!window.loadThemeColors) {
    window.loadThemeColors = () => {
        try {
            return JSON.parse(localStorage.getItem('orenji.theme.colors')) || {};
        } catch (error) {
            return {};
        }
    };
}

if (!window.saveThemeColors) {
    window.saveThemeColors = theme => localStorage.setItem('orenji.theme.colors', JSON.stringify(theme));
}

if (!window.applyThemeColors) {
    window.applyThemeColors = theme => {
        const root = document.documentElement;
        const colors = {
            background: theme.background || '#020617',
            backgroundEnd: theme.backgroundEnd || theme.background || '#111827',
            header: theme.header || theme.background || '#0f172a',
            primary: theme.primary || '#f97316',
            primaryStrong: theme.primaryStrong || '#fb923c',
            accent: theme.accent || '#22c55e',
            danger: theme.danger || '#f43f5e',
            warning: theme.warning || '#facc15'
        };
        const hexToRgb = hex => {
            const value = hex.replace('#', '');
            const full = value.length === 3 ? value.split('').map(char => char + char).join('') : value;
            const parsed = Number.parseInt(full, 16);
            return `${(parsed >> 16) & 255}, ${(parsed >> 8) & 255}, ${parsed & 255}`;
        };
        const isLight = colors.background.toLowerCase() !== '#020617';
        document.body.classList.toggle('light', isLight);
        root.style.setProperty('--background', colors.background);
        root.style.setProperty('--background-end', colors.backgroundEnd);
        root.style.setProperty('--header-bg', colors.header);
        root.style.setProperty('--header-text', isLight ? '#172033' : '#e2e8f0');
        root.style.setProperty('--header-text-muted', isLight ? '#64748b' : '#94a3b8');
        root.style.setProperty('--panel-bg', isLight ? 'rgba(255,255,255,0.78)' : 'rgba(15,23,42,0.78)');
        root.style.setProperty('--panel-alt-bg', isLight ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.08)');
        root.style.setProperty('--text', isLight ? '#172033' : '#e2e8f0');
        root.style.setProperty('--text-muted', isLight ? '#64748b' : '#94a3b8');
        root.style.setProperty('--primary', colors.primary);
        root.style.setProperty('--primary-strong', colors.primaryStrong);
        root.style.setProperty('--primary-rgb', hexToRgb(colors.primary));
        root.style.setProperty('--accent', colors.accent);
        root.style.setProperty('--danger', colors.danger);
        root.style.setProperty('--warning', colors.warning);
        root.style.setProperty('--border', isLight ? 'rgba(15,23,42,0.1)' : 'rgba(255,255,255,0.1)');
        root.style.setProperty('--border-strong', isLight ? 'rgba(15,23,42,0.18)' : 'rgba(255,255,255,0.18)');
        root.style.setProperty('--card-shadow', isLight ? '0 18px 42px rgba(15,23,42,0.08)' : '0 22px 50px rgba(0,0,0,0.22)');
        root.style.setProperty('--grid-gap', '1rem');
    };
}

if (!window.isThemeSyncEnabled) {
    window.isThemeSyncEnabled = () => localStorage.getItem('orenji.theme.sync') === 'true';
}

if (!window.setThemeSyncEnabled) {
    window.setThemeSyncEnabled = enabled => localStorage.setItem('orenji.theme.sync', String(Boolean(enabled)));
}

const HabitTheme = {
    apply(theme) {
        const current = loadThemeColors();
        const nextTheme = theme === 'light'
            ? {
                ...current,
                background: '#f7f4e9',
                header: '#fff8e8',
                primary: '#f7941d',
                primaryStrong: '#e56f13',
                accent: '#6fa24a',
                danger: '#d9483b',
                warning: '#d99a19',
                texture: 'solid',
                shape: 'soft',
                shadow: 'soft'
            }
            : {
                ...current,
                background: '#020617',
                header: '#0f172a',
                primary: '#5b96ff',
                primaryStrong: '#3b82f6',
                accent: '#22c55e',
                danger: '#f43f5e',
                warning: '#facc15',
                texture: 'glass',
                shape: 'rounded',
                shadow: 'soft'
            };

        saveThemeColors(nextTheme);
        applyThemeColors(nextTheme);
    },

    init() {
        applyThemeColors(loadThemeColors());
        document.querySelectorAll('[data-theme-toggle]').forEach(button => {
            button.addEventListener('click', () => {
                const settings = HabitStorage.getSettings();
                const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
                HabitStorage.saveSettings({ ...HabitStorage.getSettings(), theme: nextTheme });
                this.apply(nextTheme);
            });
        });
    }
};
