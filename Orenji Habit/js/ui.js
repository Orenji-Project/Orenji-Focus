const HabitUI = {
    today() {
        return new Date().toISOString().slice(0, 10);
    },

    lastThirtyDays() {
        return Array.from({ length: 30 }, (_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - index));
            return date.toISOString().slice(0, 10);
        });
    },

    calculateStats(habit) {
        const days = new Set(habit.completions || []);
        const timeline = this.lastThirtyDays();
        let currentStreak = 0;
        for (let index = timeline.length - 1; index >= 0; index -= 1) {
            if (!days.has(timeline[index])) break;
            currentStreak += 1;
        }
        let bestStreak = 0;
        let running = 0;
        timeline.forEach(day => {
            running = days.has(day) ? running + 1 : 0;
            bestStreak = Math.max(bestStreak, running);
        });
        const week = timeline.slice(-7);
        const weeklyCompleted = week.filter(day => days.has(day)).length;
        return {
            currentStreak,
            bestStreak,
            weeklyConsistency: Math.round((weeklyCompleted / 7) * 100),
            totalCompleted: days.size
        };
    },

    renderDashboard(habits, handlers) {
        this.renderStats(habits);
        this.renderHabits(habits, handlers);
        const homeCount = document.querySelector('[data-home-count]');
        if (homeCount) homeCount.textContent = `${habits.length} habitos`;
    },

    renderStats(habits) {
        const target = document.querySelector('[data-stats]');
        if (!target) return;
        const totals = habits.reduce((acc, habit) => {
            const stats = this.calculateStats(habit);
            acc.currentStreak = Math.max(acc.currentStreak, stats.currentStreak);
            acc.bestStreak = Math.max(acc.bestStreak, stats.bestStreak);
            acc.totalCompleted += stats.totalCompleted;
            acc.weeklyConsistency += stats.weeklyConsistency;
            return acc;
        }, { currentStreak: 0, bestStreak: 0, totalCompleted: 0, weeklyConsistency: 0 });
        const averageConsistency = habits.length ? Math.round(totals.weeklyConsistency / habits.length) : 0;
        target.innerHTML = [
            ['Streak atual', `${totals.currentStreak} dias`],
            ['Melhor streak', `${totals.bestStreak} dias`],
            ['Consistencia semanal', `${averageConsistency}%`],
            ['Dias completos', totals.totalCompleted]
        ].map(([label, value]) => `<article class="glass-card stat-card"><span>${label}</span><strong>${value}</strong></article>`).join('');
    },

    renderHabits(habits, handlers) {
        const target = document.querySelector('[data-habit-list]');
        if (!target) return;
        target.innerHTML = habits.map(habit => {
            const stats = this.calculateStats(habit);
            const todayDone = (habit.completions || []).includes(this.today());
            const heatmap = this.lastThirtyDays().map(day => `<span class="heat-day ${(habit.completions || []).includes(day) ? 'done' : ''}" title="${day}"></span>`).join('');
            return `
                <article class="glass-card habit-card">
                    <div class="habit-card-header">
                        <div>
                            <span class="pill">${habit.category}</span>
                            <h2>${habit.name}</h2>
                            <p>${stats.currentStreak} dias atuais · melhor ${stats.bestStreak} · ${stats.weeklyConsistency}% esta semana · ${stats.totalCompleted} totais</p>
                            <p class="habit-meta">${habit.methodName || 'Metodo por definir'}${habit.linkedFocusMethodName ? ` · Focus: ${habit.linkedFocusMethodName}` : ''}</p>
                        </div>
                        <div class="habit-actions">
                            <button class="button" data-complete="${habit.id}" ${todayDone ? 'disabled' : ''}>${todayDone ? 'Feito hoje' : 'Completar'}</button>
                            <button class="button button-secondary" data-edit="${habit.id}">Editar</button>
                            <button class="button button-ghost" data-remove="${habit.id}">Remover</button>
                        </div>
                    </div>
                    <div class="heatmap">${heatmap}</div>
                </article>
            `;
        }).join('');
        target.querySelectorAll('[data-complete]').forEach(button => button.addEventListener('click', () => handlers.complete(button.dataset.complete)));
        target.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => handlers.edit(button.dataset.edit)));
        target.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => handlers.remove(button.dataset.remove)));
    }
};
