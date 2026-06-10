const FocusSettings = {
    init() {
        const form = document.querySelector('[data-settings-form]');
        if (!form) return;
        const settings = FocusStorage.getSettings();
        form.studentName.value = settings.studentName || '';
        form.theme.value = settings.theme || 'dark';
        form.themeSync.checked = isThemeSyncEnabled();
        form.addEventListener('submit', event => {
            event.preventDefault();
            setThemeSyncEnabled(form.themeSync.checked);
            FocusStorage.saveSettings({
                studentName: form.studentName.value.trim() || 'Orenji Student',
                theme: form.theme.value
            });
            FocusTheme.apply(form.theme.value);
        });
    }
};
