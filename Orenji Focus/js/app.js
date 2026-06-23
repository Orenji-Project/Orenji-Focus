window.addEventListener('DOMContentLoaded', () => {
    FocusStorage.init();
    window.OrenjiShared?.init();
    window.OrenjiTasks?.init();
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
    if (document.body.dataset.page === 'tasks') window.OrenjiTasks?.mountAll();
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
    const focusModeSummary = document.querySelector('[data-focus-mode-summary]');

    const totalSeconds = () => Math.max(1, (mode === 'focus' ? selectedMethod.focusMinutes : selectedMethod.breakMinutes) * 60);

    const updateTimerDisplay = () => {
        FocusUI.setTimer(
            remaining,
            mode === 'focus' ? selectedMethod.name : 'Pausa curta',
            totalSeconds(),
            {
                completedCycles,
                totalCycles: Number(selectedMethod.cycles || 1)
            }
        );
    };

    const renderDashboardPanels = () => {
        FocusUI.renderCurrentTask();
        FocusUI.renderTodaySessions(selectedMethod, completedCycles);
        FocusUI.renderDashboardStats(selectedMethod, completedCycles);
    };

    const stopTimer = () => {
        clearInterval(intervalId);
        intervalId = null;
    };

    const resetTimer = () => {
        stopTimer();
        mode = 'focus';
        completedCycles = 0;
        remaining = selectedMethod.focusMinutes * 60;
        updateTimerDisplay();
        renderFocusModeSummary();
        renderDashboardPanels();
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
        FocusUI.renderSessionSummary();
        renderLinkedHabits();
        renderDashboardPanels();
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
        updateTimerDisplay();
        renderDashboardPanels();
    };

    function renderMethodOptions() {
        if (!methodSelect) return;
        methodSelect.innerHTML = methods().map(method => `
            <option value="${method.id}">${method.name} · ${method.focusMinutes}/${method.breakMinutes} · ${method.cycles} ciclo${Number(method.cycles) === 1 ? '' : 's'}</option>
        `).join('');
        methodSelect.value = selectedMethod.id;
        if (methodLabel) methodLabel.textContent = selectedMethod.name;
    }

    function renderHabitOptions() {
        if (!linkedHabitSelect) return;
        const habits = OrenjiShared.getHabits();
        linkedHabitSelect.innerHTML = [
            '<option value="">Sem habito ligado</option>',
            ...habits.map(habit => `<option value="${habit.id}">${habit.name}</option>`)
        ].join('');
        renderFocusModeSummary();
    }

    function renderFocusModeSummary() {
        if (!focusModeSummary) return;
        const linkedHabit = OrenjiShared.getHabits().find(habit => habit.id === linkedHabitSelect?.value);
        focusModeSummary.innerHTML = `
            <span>${selectedMethod.name}</span>
            <span>${selectedMethod.focusMinutes} min foco</span>
            <span>${linkedHabit?.name || 'Sem habito ligado'}</span>
        `;
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
        renderFocusModeSummary();
        renderDashboardPanels();
    });
    linkedHabitSelect?.addEventListener('change', () => {
        renderFocusModeSummary();
        renderDashboardPanels();
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
        OrenjiShared.saveFocusMethods([...methods(), nextMethod]);
        selectedMethod = nextMethod;
        form.reset();
        fields.focusMinutes.value = 25;
        fields.breakMinutes.value = 5;
        fields.cycles.value = 1;
        renderMethodOptions();
        resetTimer();
        renderLinkedHabits();
        renderDashboardPanels();
    });

    renderMethodOptions();
    renderHabitOptions();
    renderLinkedHabits();
    updateTimerDisplay();
    FocusUI.renderSessions();
    FocusUI.renderSessionSummary();
    renderFocusModeSummary();
    window.OrenjiTasks?.mountAll();
    renderDashboardPanels();
    document.addEventListener('orenji-tasks-updated', event => {
        if (!event.detail?.app || event.detail.app === 'focus') {
            renderDashboardPanels();
        }
    });
}
