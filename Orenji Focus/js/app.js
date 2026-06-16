window.addEventListener('DOMContentLoaded', () => {
    FocusStorage.init();
    window.OrenjiShared?.init();
    FocusTheme.init();
    FocusSettings.init();

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === currentPage);
    });

    if (document.body.dataset.page === 'dashboard') initFocusDashboard();
});

function initFocusDashboard() {
    const methods = () => OrenjiShared.getFocusMethods();
    const getMethod = id => methods().find(method => method.id === id) || methods()[0];
    let selectedMethod = methods()[0];
    let mode = 'focus';
    let remaining = selectedMethod.focusMinutes * 60;
    let completedCycles = 0;
    let intervalId = null;

    const methodSelect = document.querySelector('[data-focus-method]');
    const linkedHabitSelect = document.querySelector('[data-linked-habit]');
    const methodLabel = document.querySelector('[data-method-label]');

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
            linkedHabitId: linkedHabitSelect?.value || '',
            completedAt: new Date().toISOString()
        };
        sessions.push(session);
        FocusStorage.saveSessions(sessions);
        if (session.linkedHabitId) OrenjiShared.completeHabitToday(session.linkedHabitId, session);
        FocusUI.renderSessions();
        renderLinkedHabits();
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

    function renderHabitOptions() {
        if (!linkedHabitSelect) return;
        const habits = OrenjiShared.getHabits();
        linkedHabitSelect.innerHTML = [
            '<option value="">Sem habito ligado</option>',
            ...habits.map(habit => `<option value="${habit.id}">${habit.name}</option>`)
        ].join('');
    }

    function renderLinkedHabits() {
        const target = document.querySelector('[data-focus-linked-habits]');
        if (!target) return;
        const habits = OrenjiShared.getLinkedHabitsForFocusMethod(selectedMethod.id);
        if (!habits.length) {
            target.innerHTML = '<p class="empty-state">Nenhum habito ligado a este metodo.</p>';
            return;
        }
        target.innerHTML = habits.map(habit => `
            <article class="mini-item">
                <strong>${habit.name}</strong>
                <span>${habit.methodName || 'Metodo de habito por definir'}</span>
            </article>
        `).join('');
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
        renderLinkedHabits();
    });
    document.querySelector('[data-focus-mode]')?.addEventListener('change', event => {
        document.body.classList.toggle('focus-mode', event.target.checked);
    });

    document.querySelector('[data-task-form]')?.addEventListener('submit', event => {
        event.preventDefault();
        const input = event.currentTarget.task;
        const tasks = FocusStorage.getTasks();
        tasks.unshift({ id: crypto.randomUUID(), title: input.value.trim(), completed: false, createdAt: new Date().toISOString() });
        FocusStorage.saveTasks(tasks);
        input.value = '';
        renderTasks();
    });

    function renderTasks() {
        FocusUI.renderTasks(id => {
            FocusStorage.saveTasks(FocusStorage.getTasks().map(task => task.id === id ? { ...task, completed: !task.completed } : task));
            renderTasks();
        }, id => {
            FocusStorage.saveTasks(FocusStorage.getTasks().filter(task => task.id !== id));
            renderTasks();
        });
    }

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
        OrenjiShared.saveFocusMethods([...methods(), nextMethod]);
        selectedMethod = nextMethod;
        form.reset();
        fields.focusMinutes.value = 25;
        fields.breakMinutes.value = 5;
        fields.cycles.value = 1;
        renderMethodOptions();
        resetTimer();
        renderLinkedHabits();
    });

    renderMethodOptions();
    renderHabitOptions();
    renderLinkedHabits();
    FocusUI.setTimer(remaining, selectedMethod.name);
    FocusUI.renderSessions();
    renderTasks();
}
