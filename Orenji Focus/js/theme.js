const FocusTheme = {
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
                const settings = FocusStorage.getSettings();
                const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
                FocusStorage.saveSettings({ ...FocusStorage.getSettings(), theme: nextTheme });
                this.apply(nextTheme);
            });
        });
    }
};
