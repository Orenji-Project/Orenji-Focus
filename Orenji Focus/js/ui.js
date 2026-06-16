const FocusUI = {
    formatMinutes(minutes) {
        return `${minutes} min`;
    },

    renderSessions() {
        const list = document.querySelector('[data-session-list]');
        const total = document.querySelector('[data-total-focus]');
        const sessions = FocusStorage.getSessions().sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
        if (total) total.textContent = this.formatMinutes(sessions.reduce((sum, session) => sum + Number(session.duration || 0), 0));
        if (!list) return;
        list.innerHTML = sessions.map(session => `
            <article class="session-item">
                <div>
                    <strong>${session.methodName || (session.type === 'focus' ? 'Foco' : 'Pausa')}</strong><br>
                    <span>${new Date(session.completedAt).toLocaleDateString('pt-PT')}${session.linkedHabitId ? ' · habit ligado' : ''}</span>
                </div>
                <strong>${this.formatMinutes(session.duration)}</strong>
            </article>
        `).join('');
    },

    renderTasks(onToggle, onRemove) {
        const list = document.querySelector('[data-task-list]');
        if (!list) return;
        const tasks = FocusStorage.getTasks();
        list.innerHTML = tasks.map(task => `
            <li class="list-item">
                <button class="button button-ghost" data-task-toggle="${task.id}">${task.completed ? 'Feita' : 'Fazer'}</button>
                <span class="${task.completed ? 'done' : ''}">${task.title}</span>
                <button class="icon-button" data-task-remove="${task.id}" aria-label="Remover tarefa">×</button>
            </li>
        `).join('');
        list.querySelectorAll('[data-task-toggle]').forEach(button => button.addEventListener('click', () => onToggle(button.dataset.taskToggle)));
        list.querySelectorAll('[data-task-remove]').forEach(button => button.addEventListener('click', () => onRemove(button.dataset.taskRemove)));
    },

    setTimer(seconds, timerTitle) {
        const display = document.querySelector('[data-timer-display]');
        const state = document.querySelector('[data-timer-state]');
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        if (display) display.textContent = `${mins}:${secs}`;
        if (state) state.textContent = timerTitle;
    }
};
