const FocusStorage = {
    methodsKey: 'orenji.focus.methods',
    sessionsKey: 'orenji.focus.sessions',
    tasksKey: 'orenji.focus.tasks',
    settingsKey: 'orenji.focus.settings',

    read(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : structuredClone(fallback);
        } catch (error) {
            console.warn('Falha ao carregar dados Focus', error);
            return structuredClone(fallback);
        }
    },

    write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    init() {
        if (!localStorage.getItem(this.methodsKey)) this.write(this.methodsKey, FocusInitialData.methods);
        if (!localStorage.getItem(this.sessionsKey)) this.write(this.sessionsKey, FocusInitialData.sessions);
        if (!localStorage.getItem(this.tasksKey)) this.write(this.tasksKey, FocusInitialData.tasks);
        if (!localStorage.getItem(this.settingsKey)) this.write(this.settingsKey, FocusInitialData.settings);
    },

    getMethods() { return this.read(this.methodsKey, FocusInitialData.methods); },
    saveMethods(methods) { this.write(this.methodsKey, methods); },
    getSessions() { return this.read(this.sessionsKey, FocusInitialData.sessions); },
    saveSessions(sessions) { this.write(this.sessionsKey, sessions); },
    getTasks() { return this.read(this.tasksKey, FocusInitialData.tasks); },
    saveTasks(tasks) { this.write(this.tasksKey, tasks); },
    getSettings() { return this.read(this.settingsKey, FocusInitialData.settings); },
    saveSettings(settings) { this.write(this.settingsKey, settings); }
};
