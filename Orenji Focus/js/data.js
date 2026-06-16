const FocusInitialData = {
    methods: [
        { id: 'focus-pomodoro-25', name: 'Pomodoro 25/5', focusMinutes: 25, breakMinutes: 5, cycles: 4, description: 'Blocos curtos para estudar com pausas frequentes.', isDefault: true },
        { id: 'focus-pomodoro-50', name: 'Pomodoro longo 50/10', focusMinutes: 50, breakMinutes: 10, cycles: 2, description: 'Sessões maiores para trabalho mais profundo.', isDefault: true },
        { id: 'focus-flowtime', name: 'Flowtime', focusMinutes: 45, breakMinutes: 8, cycles: 1, description: 'Começa com intenção e ajusta o ritmo ao teu estado.', isDefault: true },
        { id: 'focus-52-17', name: '52/17', focusMinutes: 52, breakMinutes: 17, cycles: 1, description: 'Alterna um bloco intenso com uma pausa generosa.', isDefault: true },
        { id: 'focus-deep-work', name: 'Deep Work', focusMinutes: 90, breakMinutes: 20, cycles: 1, description: 'Tempo protegido para tarefas cognitivamente exigentes.', isDefault: true },
        { id: 'focus-ultradian', name: 'Ciclo ultradiano 90/20', focusMinutes: 90, breakMinutes: 20, cycles: 1, description: 'Segue ciclos naturais de energia e recuperação.', isDefault: true }
    ],
    sessions: [
        { id: 'seed-session-1', type: 'focus', duration: 25, completedAt: '2026-05-28T10:00:00.000Z' }
    ],
    tasks: [
        { id: 'seed-task-1', title: 'Rever apontamentos de matematica', completed: false, createdAt: '2026-05-28T09:30:00.000Z' },
        { id: 'seed-task-2', title: 'Preparar bloco de estudo', completed: true, createdAt: '2026-05-28T09:35:00.000Z' }
    ],
    settings: {
        studentName: 'Orenji Student',
        theme: 'dark'
    }
};
