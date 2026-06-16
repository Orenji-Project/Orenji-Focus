const FocusUI = {
    formatMinutes(minutes) {
        return `${minutes} min`;
    },

    formatDateKey(date) {
        return date.toISOString().slice(0, 10);
    },

    startOfWeek(date) {
        const next = new Date(date);
        const day = (next.getDay() + 6) % 7;
        next.setHours(0, 0, 0, 0);
        next.setDate(next.getDate() - day);
        return next;
    },

    sessions() {
        return FocusStorage.getSessions().sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    },

    renderSessions() {
        const list = document.querySelector('[data-session-list]');
        const total = document.querySelector('[data-total-focus]');
        const sessions = this.sessions();
        if (total) total.textContent = this.formatMinutes(sessions.reduce((sum, session) => sum + Number(session.duration || 0), 0));
        if (!list) return;
        if (!sessions.length) {
            list.innerHTML = '<p class="empty-state">Ainda nao ha sessoes concluidas.</p>';
            return;
        }
        list.innerHTML = sessions.map(session => `
            <article class="session-item">
                <div>
                    <strong>${session.methodName || (session.type === 'focus' ? 'Foco' : 'Pausa')}</strong><br>
                    <span>${new Date(session.completedAt).toLocaleDateString('pt-PT')}</span>
                </div>
                <strong>${this.formatMinutes(session.duration)}</strong>
            </article>
        `).join('');
    },

    renderSessionSummary() {
        const statsTarget = document.querySelector('[data-session-summary-stats]');
        const chartTarget = document.querySelector('[data-daily-focus-chart]');
        const insightsTarget = document.querySelector('[data-session-insights]');
        if (!statsTarget && !chartTarget && !insightsTarget) return;

        const sessions = this.sessions();
        const today = new Date();
        const todayKey = this.formatDateKey(today);
        const weekStart = this.startOfWeek(today);
        const monthKey = today.toISOString().slice(0, 7);
        const total = sessions.reduce((sum, session) => sum + Number(session.duration || 0), 0);
        const todayTotal = sessions
            .filter(session => (session.completedAt || '').slice(0, 10) === todayKey)
            .reduce((sum, session) => sum + Number(session.duration || 0), 0);
        const weekTotal = sessions
            .filter(session => new Date(session.completedAt) >= weekStart)
            .reduce((sum, session) => sum + Number(session.duration || 0), 0);
        const monthTotal = sessions
            .filter(session => (session.completedAt || '').slice(0, 7) === monthKey)
            .reduce((sum, session) => sum + Number(session.duration || 0), 0);
        const focusDays = new Set(sessions.map(session => (session.completedAt || '').slice(0, 10)).filter(Boolean)).size;
        const average = focusDays ? Math.round(total / focusDays) : 0;

        if (statsTarget) {
            statsTarget.innerHTML = [
                ['Hoje', this.formatMinutes(todayTotal)],
                ['Esta semana', this.formatMinutes(weekTotal)],
                ['Este mes', this.formatMinutes(monthTotal)],
                ['Media por dia ativo', this.formatMinutes(average)]
            ].map(([label, value]) => `<article class="glass-card stat-card"><span>${label}</span><strong>${value}</strong></article>`).join('');
        }

        if (chartTarget) {
            const days = Array.from({ length: 7 }, (_, index) => {
                const date = new Date(today);
                date.setDate(today.getDate() - (6 - index));
                const key = this.formatDateKey(date);
                const minutes = sessions
                    .filter(session => (session.completedAt || '').slice(0, 10) === key)
                    .reduce((sum, session) => sum + Number(session.duration || 0), 0);
                return { key, date, minutes };
            });
            const max = Math.max(1, ...days.map(day => day.minutes));
            chartTarget.innerHTML = days.map(day => `
                <div class="bar-day">
                    <span>${day.minutes}</span>
                    <div class="bar-track"><i style="height: ${Math.max(8, Math.round((day.minutes / max) * 100))}%"></i></div>
                    <strong>${day.date.toLocaleDateString('pt-PT', { weekday: 'short' })}</strong>
                </div>
            `).join('');
        }

        if (insightsTarget) {
            const methodCounts = sessions.reduce((acc, session) => {
                const name = session.methodName || 'Foco';
                acc[name] = (acc[name] || 0) + Number(session.duration || 0);
                return acc;
            }, {});
            const topMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0];
            const lastSession = sessions[0];
            insightsTarget.innerHTML = [
                ['Metodo mais usado', topMethod ? `${topMethod[0]} · ${this.formatMinutes(topMethod[1])}` : 'Sem dados'],
                ['Dias ativos', `${focusDays}`],
                ['Ultima sessao', lastSession ? `${lastSession.methodName || 'Foco'} · ${new Date(lastSession.completedAt).toLocaleDateString('pt-PT')}` : 'Sem dados'],
                ['Total acumulado', this.formatMinutes(total)]
            ].map(([label, value]) => `
                <article class="insight-row">
                    <span>${label}</span>
                    <strong>${value}</strong>
                </article>
            `).join('');
        }
    },

    escape(value) {
        const div = document.createElement('div');
        div.textContent = value || '';
        return div.innerHTML;
    },

    renderTasks(onToggle, onRemove) {
        const list = document.querySelector('[data-task-list]');
        if (!list) return;
        const tasks = FocusStorage.getTasks().sort((a, b) => Number(a.completed) - Number(b.completed) || new Date(b.createdAt) - new Date(a.createdAt));
        if (!tasks.length) {
            list.innerHTML = '<li class="empty-state">Ainda nao ha tarefas no Focus.</li>';
            return;
        }
        list.innerHTML = tasks.map(task => `
            <li class="list-item">
                <button class="button button-ghost" data-task-toggle="${this.escape(task.id)}">${task.completed ? 'Feita' : 'Fazer'}</button>
                <span class="${task.completed ? 'done' : ''}">${this.escape(task.title)}</span>
                <button class="icon-button" data-task-remove="${this.escape(task.id)}" aria-label="Remover tarefa">×</button>
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
