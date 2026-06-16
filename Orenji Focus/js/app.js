window.addEventListener('DOMContentLoaded', () => {
    FocusStorage.init();
    FocusTheme.init();
    FocusSettings.init();

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === currentPage);
    });

    if (document.body.dataset.page === 'dashboard') initFocusDashboard();
    if (document.body.dataset.page === 'sessions') {
        FocusUI.renderSessions();
        FocusUI.renderSessionSummary();
    }
    if (document.body.dataset.page === 'tasks') initFocusTasks();
});

function initFocusDashboard() {
    const methods = () => FocusStorage.getMethods();
    const getMethod = id => methods().find(method => method.id === id) || methods()[0];
    let selectedMethod = methods()[0];
    let mode = 'focus';
    let remaining = selectedMethod.focusMinutes * 60;
    let completedCycles = 0;
    let intervalId = null;

    const methodSelect = document.querySelector('[data-focus-method]');
    const methodLabel = document.querySelector('[data-method-label]');
    const focusModeSummary = document.querySelector('[data-focus-mode-summary]');

    const stopTimer = () => {
        clearInterval(intervalId);
        intervalId = null;
    };

    const resetTimer = () => {
        stopTimer();
        mode = 'focus';
        completedCycles = 0;
        remaining = selectedMethod.focusMinutes * 60;
        FocusUI.setTimer(remaining, selectedMethod.name);
        renderFocusModeSummary();
    };

    const saveCompletedSession = () => {
        if (mode !== 'focus') return;
        const sessions = FocusStorage.getSessions();
        const session = {
            id: crypto.randomUUID(),
            type: 'focus',
            duration: selectedMethod.focusMinutes,
            methodId: selectedMethod.id,
            methodName: selectedMethod.name,
            completedAt: new Date().toISOString()
        };
        sessions.push(session);
        FocusStorage.saveSessions(sessions);
        FocusUI.renderSessions();
        FocusUI.renderSessionSummary();
    };

    const tick = () => {
        remaining -= 1;
        if (remaining <= 0) {
            saveCompletedSession();
            completedCycles += mode === 'focus' ? 1 : 0;
            if (mode === 'focus' && completedCycles >= Number(selectedMethod.cycles || 1)) {
                stopTimer();
                resetTimer();
                return;
            }
            mode = mode === 'focus' ? 'break' : 'focus';
            remaining = mode === 'focus' ? selectedMethod.focusMinutes * 60 : selectedMethod.breakMinutes * 60;
            if (remaining <= 0) {
                mode = 'focus';
                remaining = selectedMethod.focusMinutes * 60;
            }
            stopTimer();
        }
        FocusUI.setTimer(remaining, selectedMethod.name);
    };

    function renderMethodOptions() {
        if (!methodSelect) return;
        methodSelect.innerHTML = methods().map(method => `
            <option value="${method.id}">${method.name} · ${method.focusMinutes}/${method.breakMinutes} · ${method.cycles} ciclo${Number(method.cycles) === 1 ? '' : 's'}</option>
        `).join('');
        methodSelect.value = selectedMethod.id;
        if (methodLabel) methodLabel.textContent = 'Método de foco:';
    }

    function renderFocusModeSummary() {
        if (!focusModeSummary) return;
        focusModeSummary.innerHTML = `
            <span>${selectedMethod.name}</span>
            <span>${selectedMethod.focusMinutes} min foco</span>
            <span>${selectedMethod.breakMinutes} min pausa</span>
            <span>${selectedMethod.cycles} ciclo${Number(selectedMethod.cycles) === 1 ? '' : 's'}</span>
        `;
    }

    document.querySelector('[data-timer-start]')?.addEventListener('click', () => {
        if (!intervalId) intervalId = setInterval(tick, 1000);
    });
    document.querySelector('[data-timer-pause]')?.addEventListener('click', () => {
        stopTimer();
    });
    document.querySelector('[data-timer-reset]')?.addEventListener('click', () => {
        resetTimer();
    });
    methodSelect?.addEventListener('change', event => {
        selectedMethod = getMethod(event.target.value);
        renderMethodOptions();
        resetTimer();
        renderFocusModeSummary();
    });
    document.querySelector('[data-focus-mode]')?.addEventListener('change', event => {
        document.body.classList.toggle('focus-mode', event.target.checked);
    });

    document.querySelector('[data-custom-focus-form]')?.addEventListener('submit', event => {
        event.preventDefault();
        const form = event.currentTarget;
        const fields = form.elements;
        const nextMethod = {
            id: `focus-custom-${crypto.randomUUID()}`,
            name: fields.name.value.trim(),
            focusMinutes: Number(fields.focusMinutes.value),
            breakMinutes: Number(fields.breakMinutes.value),
            cycles: Number(fields.cycles.value),
            description: 'Metodo de foco personalizado.',
            isDefault: false
        };
        FocusStorage.saveMethods([...methods(), nextMethod]);
        selectedMethod = nextMethod;
        form.reset();
        fields.focusMinutes.value = 25;
        fields.breakMinutes.value = 5;
        fields.cycles.value = 1;
        renderMethodOptions();
        resetTimer();
    });

    renderMethodOptions();
    FocusUI.setTimer(remaining, selectedMethod.name);
    FocusUI.renderSessions();
    FocusUI.renderSessionSummary();
    renderFocusModeSummary();
}

function initFocusTasks() {
    const root = document.querySelector('[data-tasks-component]');
    if (!root) return;
    root.classList.add('tasks-component');
    root.innerHTML = `
        <div class="section-header compact">
            <h2>Tarefas Focus</h2>
            <p>Organiza tarefas de foco guardadas localmente nesta app.</p>
        </div>
        <form class="tasks-form inline-form" data-focus-task-form>
            <input type="text" name="title" placeholder="Nova tarefa" required>
            <button class="button" type="submit">Adicionar</button>
        </form>
        <ul class="item-list tasks-list" data-task-list></ul>
    `;

    const render = () => FocusUI.renderTasks(
        id => {
            FocusStorage.saveTasks(FocusStorage.getTasks().map(task => {
                if (task.id !== id) return task;
                const completed = !task.completed;
                return { ...task, completed, completedAt: completed ? new Date().toISOString() : '' };
            }));
            render();
        },
        id => {
            FocusStorage.saveTasks(FocusStorage.getTasks().filter(task => task.id !== id));
            render();
        }
    );

    root.querySelector('[data-focus-task-form]')?.addEventListener('submit', event => {
        event.preventDefault();
        const form = event.currentTarget;
        const title = form.elements.title.value.trim();
        if (!title) return;
        FocusStorage.saveTasks([
            { id: crypto.randomUUID(), title, completed: false, createdAt: new Date().toISOString(), completedAt: '' },
            ...FocusStorage.getTasks()
        ]);
        form.reset();
        render();
    });

    render();
}
