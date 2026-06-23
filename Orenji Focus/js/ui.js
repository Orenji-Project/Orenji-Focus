const FocusUI = {
    formatMinutes(minutes) {
        return `${minutes} min`;
    },

    formatDuration(minutes) {
        const value = Number(minutes || 0);
        if (value < 60) return `${value} min`;
        const hours = Math.floor(value / 60);
        const rest = value % 60;
        return rest ? `${hours}h ${String(rest).padStart(2, '0')}m` : `${hours}h`;
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
                    <span>${new Date(session.completedAt).toLocaleDateString('pt-PT')}${session.linkedHabitId ? ' · habito ligado' : ''}</span>
                </div>
                <strong>${this.formatMinutes(session.duration)}</strong>
            </article>
        `).join('');
    },

    renderCurrentTask() {
        const title = document.querySelector('[data-current-task-title]');
        const meta = document.querySelector('[data-current-task-meta]');
        if (!title && !meta) return;

        const tasks = window.OrenjiTasks
            ? OrenjiTasks.getTasks('focus')
            : FocusStorage.getTasks();
        const activeTask = tasks
            .filter(task => !task.completed)
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];

        if (!activeTask) {
            if (title) title.textContent = 'Criar primeira tarefa';
            if (meta) meta.textContent = 'Escolhe um objetivo para este ciclo de foco';
            return;
        }

        const habitName = window.OrenjiTasks?.habitName(activeTask.linkedHabitId);
        if (title) title.textContent = activeTask.title;
        if (meta) meta.textContent = habitName ? `Habito: ${habitName}` : 'Foco do ciclo atual';
    },

    renderTodaySessions(selectedMethod, completedCycles = 0) {
        const list = document.querySelector('[data-today-session-list]');
        const count = document.querySelector('[data-today-session-count]');
        if (!list && !count) return;

        const targetCycles = Number(selectedMethod?.cycles || 4);
        const todayKey = this.formatDateKey(new Date());
        const todaySessions = this.sessions().filter(session => (session.completedAt || '').slice(0, 10) === todayKey);
        const savedCycles = todaySessions.length;
        const doneCount = Math.min(targetCycles, savedCycles + completedCycles);
        if (count) count.textContent = `${doneCount} / ${targetCycles}`;

        if (!list) return;
        list.innerHTML = Array.from({ length: targetCycles }, (_, index) => {
            const session = todaySessions[index];
            const number = index + 1;
            const isDone = number <= doneCount;
            const isCurrent = !isDone && number === doneCount + 1;
            const time = session
                ? new Date(session.completedAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
                : isCurrent ? 'Agora' : 'Planeado';
            return `
                <article class="today-session-item ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}">
                    <span class="today-session-marker">${isDone ? '✓' : number}</span>
                    <span>${time}</span>
                    <strong>${selectedMethod?.focusMinutes || 25}:00</strong>
                </article>
            `;
        }).join('');
    },

    renderDashboardStats(selectedMethod, completedCycles = 0) {
        const today = new Date();
        const todayKey = this.formatDateKey(today);
        const sessions = this.sessions();
        const todaySessions = sessions.filter(session => (session.completedAt || '').slice(0, 10) === todayKey);
        const todayMinutes = todaySessions.reduce((sum, session) => sum + Number(session.duration || 0), 0);
        const targetCycles = Number(selectedMethod?.cycles || 4);
        const cycleCount = Math.min(targetCycles, todaySessions.length + completedCycles);
        const uniqueDays = [...new Set(sessions.map(session => (session.completedAt || '').slice(0, 10)).filter(Boolean))]
            .sort()
            .reverse();
        let streak = uniqueDays.includes(todayKey) ? 1 : 0;
        let cursor = new Date(today);
        cursor.setDate(cursor.getDate() - 1);
        while (uniqueDays.includes(this.formatDateKey(cursor))) {
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
        }

        const focusToday = document.querySelector('[data-focus-today]');
        const cycleCountTarget = document.querySelector('[data-cycle-count]');
        const cycleRemaining = document.querySelector('[data-cycle-remaining]');
        const streakTarget = document.querySelector('[data-focus-streak]');
        const goalTarget = document.querySelector('[data-cycle-goal]');
        if (focusToday) focusToday.textContent = this.formatDuration(todayMinutes);
        if (cycleCountTarget) cycleCountTarget.textContent = `${cycleCount} / ${targetCycles}`;
        if (cycleRemaining) cycleRemaining.textContent = cycleCount >= targetCycles ? 'Meta concluida' : `Faltam ${targetCycles - cycleCount} ciclos`;
        if (streakTarget) streakTarget.textContent = `${Math.max(1, streak)} dia${Math.max(1, streak) === 1 ? '' : 's'}`;
        if (goalTarget) goalTarget.textContent = `Meta diaria: ${targetCycles} ciclo${targetCycles === 1 ? '' : 's'}`;
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
            const linkedSessions = sessions.filter(session => session.linkedHabitId).length;
            const lastSession = sessions[0];
            insightsTarget.innerHTML = [
                ['Metodo mais usado', topMethod ? `${topMethod[0]} · ${this.formatMinutes(topMethod[1])}` : 'Sem dados'],
                ['Sessoes com habito', `${linkedSessions} de ${sessions.length}`],
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

    setTimer(seconds, timerTitle, totalSeconds, cycleState = {}) {
        const display = document.querySelector('[data-timer-display]');
        const state = document.querySelector('[data-timer-state]');
        const ring = document.querySelector('[data-timer-ring]');
        const cycleLabel = document.querySelector('[data-cycle-label]');
        const cycleDots = document.querySelector('[data-cycle-dots]');
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        if (display) display.textContent = `${mins}:${secs}`;
        if (state) state.textContent = timerTitle;
        if (ring && totalSeconds) {
            const percent = Math.max(8, Math.min(94, (Number(seconds) / Number(totalSeconds)) * 94));
            ring.style.setProperty('--timer-progress', `${percent}%`);
        }
        if (cycleLabel) {
            const current = Math.min(Number(cycleState.completedCycles || 0) + 1, Number(cycleState.totalCycles || 1));
            cycleLabel.textContent = `Sessao ${current} de ${cycleState.totalCycles || 1}`;
        }
        if (cycleDots) {
            const total = Number(cycleState.totalCycles || 1);
            const completed = Number(cycleState.completedCycles || 0);
            cycleDots.innerHTML = Array.from({ length: total }, (_, index) => {
                const className = index < completed ? 'is-done' : index === completed ? 'is-current' : '';
                return `<span class="cycle-dot ${className}"></span>`;
            }).join('');
        }
    }
};
