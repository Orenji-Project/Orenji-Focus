const OrenjiTasks = {
    tasksKey: 'orenji.shared.tasks',
    migratedKey: 'orenji.shared.tasks.migrated',

    read(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : structuredClone(fallback);
        } catch (error) {
            console.warn('Falha ao carregar tarefas Orenji', error);
            return structuredClone(fallback);
        }
    },

    write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    init() {
        if (!localStorage.getItem(this.tasksKey)) this.write(this.tasksKey, []);
        this.migrateFocusTasks();
    },

    migrateFocusTasks() {
        if (localStorage.getItem(this.migratedKey)) return;
        const oldTasks = this.read('orenji.focus.tasks', []);
        if (oldTasks.length) {
            const tasks = this.getTasks();
            const migrated = oldTasks.map(task => ({
                id: task.id || crypto.randomUUID(),
                app: 'focus',
                title: task.title || 'Tarefa',
                completed: Boolean(task.completed),
                linkedHabitId: task.linkedHabitId || '',
                createdAt: task.createdAt || new Date().toISOString(),
                completedAt: task.completed ? task.completedAt || new Date().toISOString() : ''
            }));
            const existingIds = new Set(tasks.map(task => task.id));
            this.saveTasks([...migrated.filter(task => !existingIds.has(task.id)), ...tasks]);
        }
        localStorage.setItem(this.migratedKey, 'true');
    },

    getTasks(app) {
        const tasks = this.read(this.tasksKey, []);
        return app ? tasks.filter(task => task.app === app) : tasks;
    },

    saveTasks(tasks) {
        this.write(this.tasksKey, tasks);
    },

    addTask(task) {
        const tasks = this.getTasks();
        this.saveTasks([{ ...task, id: crypto.randomUUID(), createdAt: new Date().toISOString(), completed: false }, ...tasks]);
    },

    updateTask(id, updater) {
        this.saveTasks(this.getTasks().map(task => task.id === id ? updater(task) : task));
    },

    removeTask(id) {
        this.saveTasks(this.getTasks().filter(task => task.id !== id));
    },

    habits() {
        return window.OrenjiShared?.getHabits() || [];
    },

    habitName(id) {
        return this.habits().find(habit => habit.id === id)?.name || '';
    },

    completeHabitToday(habitId) {
        if (!window.OrenjiShared || !habitId) return;
        const today = OrenjiShared.today();
        const habits = this.habits().map(habit => {
            if (habit.id !== habitId) return habit;
            const completions = habit.completions || [];
            if (completions.includes(today)) return habit;
            return { ...habit, completions: [...completions, today] };
        });
        OrenjiShared.saveHabits(habits);
    },

    escape(value) {
        const div = document.createElement('div');
        div.textContent = value || '';
        return div.innerHTML;
    },

    mountAll() {
        this.init();
        document.querySelectorAll('[data-tasks-component]').forEach(root => this.mount(root));
    },

    mount(root) {
        const app = root.dataset.tasksApp || document.body.dataset.app || 'focus';
        const compact = root.dataset.tasksCompact === 'true';
        root.classList.add('tasks-component');
        root.innerHTML = this.template(app, compact);
        this.bind(root, app, compact);
        this.renderList(root, app, compact);
    },

    template(app, compact) {
        const habits = this.habits();
        return `
            <div class="section-header compact">
                <h2>${compact ? 'Tarefas' : `Tarefas ${app === 'habit' ? 'Habit' : 'Focus'}`}</h2>
                ${compact ? '' : '<p>Organiza tarefas por app e liga-as a habitos quando fizer sentido.</p>'}
            </div>
            <form class="tasks-form ${compact ? 'inline-form' : ''}" data-tasks-form>
                <input type="text" name="title" placeholder="Nova tarefa" required>
                <div class="task-link-row">
                    <select name="linkedHabit" aria-label="Habito ligado">
                        <option value="">Sem habito ligado</option>
                        ${habits.map(habit => `<option value="${this.escape(habit.id)}">${this.escape(habit.name)}</option>`).join('')}
                    </select>
                    <button class="button" type="submit">Adicionar</button>
                </div>
            </form>
            <ul class="item-list tasks-list" data-tasks-list></ul>
        `;
    },

    bind(root, app, compact) {
        root.querySelector('[data-tasks-form]')?.addEventListener('submit', event => {
            event.preventDefault();
            const form = event.currentTarget;
            const title = form.elements.title.value.trim();
            if (!title) return;
            this.addTask({ app, title, linkedHabitId: form.elements.linkedHabit.value });
            form.reset();
            this.renderList(root, app, compact);
        });
    },

    renderList(root, app, compact) {
        const list = root.querySelector('[data-tasks-list]');
        if (!list) return;
        const tasks = this.getTasks(app).sort((a, b) => Number(a.completed) - Number(b.completed) || new Date(b.createdAt) - new Date(a.createdAt));
        if (!tasks.length) {
            list.innerHTML = '<li class="empty-state">Ainda nao ha tarefas nesta app.</li>';
            return;
        }
        list.innerHTML = tasks.map(task => {
            const habitName = this.habitName(task.linkedHabitId);
            return `
                <li class="list-item task-item">
                    <button class="button button-ghost" data-task-toggle="${this.escape(task.id)}">${task.completed ? 'Feita' : 'Fazer'}</button>
                    <span class="task-copy ${task.completed ? 'done' : ''}">
                        <strong>${this.escape(task.title)}</strong>
                        ${habitName ? `<small>Habito: ${this.escape(habitName)}</small>` : compact ? '' : '<small>Sem habito ligado</small>'}
                    </span>
                    <button class="icon-button" data-task-remove="${this.escape(task.id)}" aria-label="Remover tarefa">x</button>
                </li>
            `;
        }).join('');
        list.querySelectorAll('[data-task-toggle]').forEach(button => {
            button.addEventListener('click', () => {
                this.updateTask(button.dataset.taskToggle, task => {
                    const completed = !task.completed;
                    if (completed && task.linkedHabitId) this.completeHabitToday(task.linkedHabitId);
                    return { ...task, completed, completedAt: completed ? new Date().toISOString() : '' };
                });
                this.renderList(root, app, compact);
            });
        });
        list.querySelectorAll('[data-task-remove]').forEach(button => {
            button.addEventListener('click', () => {
                this.removeTask(button.dataset.taskRemove);
                this.renderList(root, app, compact);
            });
        });
    }
};

window.OrenjiTasks = OrenjiTasks;
