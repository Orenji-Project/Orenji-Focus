const HabitStorage = {
    habitsKey: 'orenji.habit.habits',
    settingsKey: 'orenji.habit.settings',

    read(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : structuredClone(fallback);
        } catch (error) {
            console.warn('Falha ao carregar dados Habit', error);
            return structuredClone(fallback);
        }
    },

    write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    init() {
        if (!localStorage.getItem(this.habitsKey)) this.write(this.habitsKey, HabitInitialData.habits);
        if (!localStorage.getItem(this.settingsKey)) this.write(this.settingsKey, HabitInitialData.settings);
    },

    getHabits() { return this.read(this.habitsKey, HabitInitialData.habits); },
    saveHabits(habits) { this.write(this.habitsKey, habits); },
    getSettings() { return this.read(this.settingsKey, HabitInitialData.settings); },
    saveSettings(settings) { this.write(this.settingsKey, settings); }
};
