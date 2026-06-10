const HabitSettings = {
    init() {
        const form = document.querySelector('[data-settings-form]');
        if (!form) return;
        const settings = HabitStorage.getSettings();
        form.userName.value = settings.userName || '';
        form.theme.value = settings.theme || 'dark';
        form.themeSync.checked = isThemeSyncEnabled();
        form.addEventListener('submit', event => {
            event.preventDefault();
            setThemeSyncEnabled(form.themeSync.checked);
            HabitStorage.saveSettings({
                userName: form.userName.value.trim() || 'Orenji User',
                theme: form.theme.value
            });
            HabitTheme.apply(form.theme.value);
        });
    }
};
