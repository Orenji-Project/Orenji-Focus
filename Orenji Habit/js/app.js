window.addEventListener('DOMContentLoaded', () => {
    HabitStorage.init();
    window.OrenjiShared?.init();
    window.OrenjiTasks?.init();
    HabitTheme.init();
    HabitSettings.init();

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === currentPage);
    });

    if (document.body.dataset.page === 'dashboard') {
        initHabitDashboard();
    } else if (document.body.dataset.page === 'tasks') {
        window.OrenjiTasks?.mountAll();
    } else {
        HabitUI.renderDashboard(HabitStorage.getHabits(), {});
    }
});

function initHabitDashboard() {
    const form = document.querySelector('[data-habit-form]');
    const habitMethods = () => OrenjiShared.getHabitMethods();
    const focusMethods = () => OrenjiShared.getFocusMethods();
    const findHabitMethod = id => habitMethods().find(method => method.id === id) || habitMethods()[0];
    const findFocusMethod = id => focusMethods().find(method => method.id === id);
    const refresh = () => {
        HabitUI.renderDashboard(HabitStorage.getHabits(), handlers);
        renderFocusContributions();
    };
    const handlers = {
        complete(id) {
            const today = HabitUI.today();
            const habits = HabitStorage.getHabits().map(habit => {
                if (habit.id !== id || habit.completions.includes(today)) return habit;
                return { ...habit, completions: [...habit.completions, today] };
            });
            HabitStorage.saveHabits(habits);
            refresh();
        },
        edit(id) {
            const habit = HabitStorage.getHabits().find(item => item.id === id);
            if (!habit || !form) return;
            const fields = form.elements;
            fields.id.value = habit.id;
            fields.name.value = habit.name;
            fields.category.value = habit.category;
            fields.method.value = habit.methodId || habitMethods()[0].id;
            fields.linkedFocusMethod.value = habit.linkedFocusMethodId || '';
            fields.name.focus();
        },
        remove(id) {
            HabitStorage.saveHabits(HabitStorage.getHabits().filter(habit => habit.id !== id));
            refresh();
        }
    };

    function renderMethodOptions() {
        const methodSelect = document.querySelector('[data-habit-method]');
        const focusMethodSelect = document.querySelector('[data-linked-focus-method]');
        if (methodSelect) {
            methodSelect.innerHTML = habitMethods().map(method => `
                <option value="${method.id}">${method.name} · ${method.frequency}</option>
            `).join('');
        }
        if (focusMethodSelect) {
            focusMethodSelect.innerHTML = [
                '<option value="">Sem metodo de foco ligado</option>',
                ...focusMethods().map(method => `<option value="${method.id}">${method.name}</option>`)
            ].join('');
        }
    }

    function renderFocusContributions() {
        const target = document.querySelector('[data-focus-contributions]');
        if (!target) return;
        const habits = HabitStorage.getHabits();
        const links = OrenjiShared.getLinks().focusHabitCompletions || [];
        if (!links.length) {
            target.innerHTML = '<p class="empty-state">Ainda nao ha habitos completados pelo Focus.</p>';
            return;
        }
        target.innerHTML = links.slice(0, 6).map(link => {
            const habit = habits.find(item => item.id === link.habitId);
            const focusMethod = findFocusMethod(link.methodId);
            return `
                <article class="session-item">
                    <div>
                        <strong>${habit?.name || 'Habito removido'}</strong><br>
                        <span>${focusMethod?.name || 'Metodo de foco'} · ${new Date(link.completedAt).toLocaleDateString('pt-PT')}</span>
                    </div>
                    <span>Focus</span>
                </article>
            `;
        }).join('');
    }

    form?.addEventListener('submit', event => {
        event.preventDefault();
        const fields = form.elements;
        const habits = HabitStorage.getHabits();
        const id = fields.id.value || crypto.randomUUID();
        const method = findHabitMethod(fields.method.value);
        const linkedFocusMethod = findFocusMethod(fields.linkedFocusMethod.value);
        const nextHabit = {
            id,
            name: fields.name.value.trim(),
            category: fields.category.value,
            methodId: method.id,
            methodName: method.name,
            linkedFocusMethodId: linkedFocusMethod?.id || '',
            linkedFocusMethodName: linkedFocusMethod?.name || '',
            completions: habits.find(habit => habit.id === id)?.completions || [],
            createdAt: habits.find(habit => habit.id === id)?.createdAt || new Date().toISOString()
        };
        const exists = habits.some(habit => habit.id === id);
        HabitStorage.saveHabits(exists ? habits.map(habit => habit.id === id ? nextHabit : habit) : [nextHabit, ...habits]);
        form.reset();
        fields.id.value = '';
        refresh();
    });

    document.querySelector('[data-custom-habit-form]')?.addEventListener('submit', event => {
        event.preventDefault();
        const form = event.currentTarget;
        const fields = form.elements;
        const nextMethod = {
            id: `habit-custom-${crypto.randomUUID()}`,
            name: fields.name.value.trim(),
            frequency: fields.frequency.value.trim(),
            objective: fields.objective.value.trim(),
            description: 'Metodo de habito personalizado.',
            isDefault: false
        };
        OrenjiShared.saveHabitMethods([...habitMethods(), nextMethod]);
        form.reset();
        renderMethodOptions();
        if (document.querySelector('[data-habit-method]')) {
            document.querySelector('[data-habit-method]').value = nextMethod.id;
        }
    });

    renderMethodOptions();
    refresh();
}
