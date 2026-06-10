const OrenjiShared = {
    focusMethodsKey: 'orenji.shared.focusMethods',
    habitMethodsKey: 'orenji.shared.habitMethods',
    linksKey: 'orenji.shared.links',
    habitsKey: 'orenji.habit.habits',

    defaultFocusMethods: [
        { id: 'focus-pomodoro-25', name: 'Pomodoro 25/5', focusMinutes: 25, breakMinutes: 5, cycles: 4, description: 'Blocos curtos para estudar com pausas frequentes.', isDefault: true },
        { id: 'focus-pomodoro-50', name: 'Pomodoro longo 50/10', focusMinutes: 50, breakMinutes: 10, cycles: 2, description: 'Sessões maiores para trabalho mais profundo.', isDefault: true },
        { id: 'focus-flowtime', name: 'Flowtime', focusMinutes: 45, breakMinutes: 8, cycles: 1, description: 'Começa com intenção e ajusta o ritmo ao teu estado.', isDefault: true },
        { id: 'focus-52-17', name: '52/17', focusMinutes: 52, breakMinutes: 17, cycles: 1, description: 'Alterna um bloco intenso com uma pausa generosa.', isDefault: true },
        { id: 'focus-deep-work', name: 'Deep Work', focusMinutes: 90, breakMinutes: 20, cycles: 1, description: 'Tempo protegido para tarefas cognitivamente exigentes.', isDefault: true },
        { id: 'focus-ultradian', name: 'Ciclo ultradiano 90/20', focusMinutes: 90, breakMinutes: 20, cycles: 1, description: 'Segue ciclos naturais de energia e recuperação.', isDefault: true }
    ],

    defaultHabitMethods: [
        { id: 'habit-streak', name: 'Streak', frequency: 'Diario', objective: 'Nao quebrar a corrente', description: 'Marca o habito todos os dias para manter a sequencia.', isDefault: true },
        { id: 'habit-stacking', name: 'Habit stacking', frequency: 'Diario', objective: 'Associar a uma rotina existente', description: 'Liga o novo habito a algo que ja fazes.', isDefault: true },
        { id: 'habit-two-minutes', name: 'Regra dos 2 minutos', frequency: 'Diario', objective: 'Comecar pequeno', description: 'Reduz o habito a uma versao tao simples que seja facil iniciar.', isDefault: true },
        { id: 'habit-implementation', name: 'Intencao de implementacao', frequency: 'Planeado', objective: 'Definir quando e onde', description: 'Formula o habito como: quando X acontecer, eu faco Y.', isDefault: true },
        { id: 'habit-cue-routine-reward', name: 'Cue-routine-reward', frequency: 'Diario', objective: 'Criar ciclo de recompensa', description: 'Define gatilho, rotina e recompensa para reforcar o comportamento.', isDefault: true }
    ],

    read(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : structuredClone(fallback);
        } catch (error) {
            console.warn('Falha ao carregar dados partilhados Orenji', error);
            return structuredClone(fallback);
        }
    },

    write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    mergeDefaults(key, defaults) {
        const saved = this.read(key, []);
        const custom = saved.filter(item => !defaults.some(defaultItem => defaultItem.id === item.id));
        this.write(key, [...defaults, ...custom]);
    },

    init() {
        this.mergeDefaults(this.focusMethodsKey, this.defaultFocusMethods);
        this.mergeDefaults(this.habitMethodsKey, this.defaultHabitMethods);
        if (!localStorage.getItem(this.linksKey)) this.write(this.linksKey, { focusHabitCompletions: [] });
    },

    getFocusMethods() {
        return this.read(this.focusMethodsKey, this.defaultFocusMethods);
    },

    saveFocusMethods(methods) {
        this.write(this.focusMethodsKey, methods);
    },

    getHabitMethods() {
        return this.read(this.habitMethodsKey, this.defaultHabitMethods);
    },

    saveHabitMethods(methods) {
        this.write(this.habitMethodsKey, methods);
    },

    getHabits() {
        if (window.HabitStorage) return HabitStorage.getHabits();
        return this.read(this.habitsKey, []);
    },

    saveHabits(habits) {
        if (window.HabitStorage) {
            HabitStorage.saveHabits(habits);
            return;
        }
        this.write(this.habitsKey, habits);
    },

    getLinks() {
        return this.read(this.linksKey, { focusHabitCompletions: [] });
    },

    saveLinks(links) {
        this.write(this.linksKey, links);
    },

    today() {
        return new Date().toISOString().slice(0, 10);
    },

    getLinkedHabitsForFocusMethod(methodId) {
        return this.getHabits().filter(habit => habit.linkedFocusMethodId === methodId);
    },

    completeHabitToday(habitId, session) {
        const today = this.today();
        let completed = false;
        const habits = this.getHabits().map(habit => {
            if (habit.id !== habitId) return habit;
            const completions = habit.completions || [];
            if (completions.includes(today)) return habit;
            completed = true;
            return { ...habit, completions: [...completions, today] };
        });
        this.saveHabits(habits);

        if (completed) {
            const links = this.getLinks();
            links.focusHabitCompletions = [
                {
                    id: crypto.randomUUID(),
                    habitId,
                    sessionId: session.id,
                    methodId: session.methodId,
                    completedAt: session.completedAt
                },
                ...(links.focusHabitCompletions || [])
            ];
            this.saveLinks(links);
        }

        return completed;
    }
};

window.OrenjiShared = OrenjiShared;
