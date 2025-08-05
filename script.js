class TodoApp {
      constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.initializeElements();
        this.attachEventListeners();
        this.loadTheme();
        this.render();
      }

      initializeElements() {
        this.taskInput = document.getElementById('task-input');
        this.addBtn = document.getElementById('add-task-btn');
        this.taskList = document.getElementById('task-list');
        this.emptyState = document.getElementById('empty-state');
        this.clearCompleted = document.getElementById('clear-completed');
        this.prioritySelector = document.getElementById('priority-selector');
        this.themeToggle = document.getElementById('theme-toggle');
        
        // Stats elements
        this.totalTasks = document.getElementById('total-tasks');
        this.completedCount = document.getElementById('completed-count');
        this.activeCount = document.getElementById('active-count');
        
        // Filter buttons
        this.filterBtns = document.querySelectorAll('.filter-btn');
      }

      attachEventListeners() {
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') this.addTask();
        });
        
        this.clearCompleted.addEventListener('click', () => this.clearCompletedTasks());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        this.filterBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
            this.setFilter(e.target.dataset.filter);
          });
        });

        // Auto-save on input
        this.taskInput.addEventListener('input', () => {
          this.addBtn.textContent = this.taskInput.value.trim() ? 'Add' : 'Add';
        });
      }

      addTask() {
        const text = this.taskInput.value.trim();
        if (!text) return;

        const task = {
          id: Date.now(),
          text: text,
          completed: false,
          priority: this.prioritySelector.value,
          createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.taskInput.value = '';
        this.saveTasks();
        this.render();
      }

      toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
          task.completed = !task.completed;
          this.saveTasks();
          this.render();
        }
      }

      deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.render();
      }

      editTask(id, newText) {
        const task = this.tasks.find(t => t.id === id);
        if (task && newText.trim()) {
          task.text = newText.trim();
          this.saveTasks();
          this.render();
        }
      }

      clearCompletedTasks() {
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
        this.render();
      }

      setFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
      }

      getFilteredTasks() {
        switch (this.currentFilter) {
          case 'active':
            return this.tasks.filter(t => !t.completed);
          case 'completed':
            return this.tasks.filter(t => t.completed);
          case 'high':
            return this.tasks.filter(t => t.priority === 'high');
          default:
            return this.tasks;
        }
      }

      createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''} new`;
        li.innerHTML = `
          <div class="priority-indicator priority-${task.priority}"></div>
          <div class="task-content">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}"></div>
            <span class="task-text ${task.completed ? 'completed' : ''}" data-id="${task.id}">${task.text}</span>
            <div class="task-actions">
              <button class="action-btn edit-btn" data-id="${task.id}" title="Edit">✏️</button>
              <button class="action-btn delete-btn" data-id="${task.id}" title="Delete">🗑️</button>
            </div>
          </div>
        `;

        // Remove animation class after animation completes
        setTimeout(() => li.classList.remove('new'), 500);

        // Event listeners for this task
        li.querySelector('.task-checkbox').addEventListener('click', () => this.toggleTask(task.id));
        li.querySelector('.task-text').addEventListener('dblclick', (e) => this.startEdit(e.target, task.id));
        li.querySelector('.edit-btn').addEventListener('click', (e) => {
          const textEl = li.querySelector('.task-text');
          this.startEdit(textEl, task.id);
        });
        li.querySelector('.delete-btn').addEventListener('click', () => this.deleteTask(task.id));

        return li;
      }

      startEdit(textElement, taskId) {
        const currentText = textElement.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
        input.value = currentText;

        const saveEdit = () => {
          const newText = input.value.trim();
          if (newText && newText !== currentText) {
            this.editTask(taskId, newText);
          } else {
            textElement.textContent = currentText;
          }
        };

        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') saveEdit();
          if (e.key === 'Escape') {
            textElement.textContent = currentText;
          }
        });

        input.addEventListener('blur', saveEdit);

        textElement.replaceWith(input);
        input.focus();
        input.select();
      }

      updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;

        this.totalTasks.textContent = `${total} total`;
        this.completedCount.textContent = `${completed} completed`;
        this.activeCount.textContent = `${active} active`;

        // Show/hide clear completed button
        this.clearCompleted.style.display = completed > 0 ? 'block' : 'none';
      }

      render() {
        const filteredTasks = this.getFilteredTasks();
        
        this.taskList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
          this.emptyState.style.display = 'block';
          this.taskList.appendChild(this.emptyState);
        } else {
          this.emptyState.style.display = 'none';
          // Sort by priority and completion status
          const sortedTasks = filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) {
              return a.completed - b.completed;
            }
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          });

          sortedTasks.forEach(task => {
            this.taskList.appendChild(this.createTaskElement(task));
          });
        }

        this.updateStats();
      }

      toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        this.themeToggle.textContent = isDark ? '☀️' : '🌙';
        this.saveTheme(isDark);
      }

      loadTheme() {
        // Load theme preference from memory
        const isDark = this.darkThemeEnabled || false;
        if (isDark) {
          document.body.classList.add('dark-theme');
          this.themeToggle.textContent = '☀️';
        } else {
          this.themeToggle.textContent = '🌙';
        }
      }

      saveTheme(isDark) {
        // Store theme preference in memory instead of localStorage
        this.darkThemeEnabled = isDark;
      }

      loadTasks() {
        // Store tasks in memory instead of localStorage for Claude.ai compatibility
        return this.tasksData || [];
      }

      saveTasks() {
        // Store tasks in memory instead of localStorage for Claude.ai compatibility
        this.tasksData = this.tasks;
      }
    }

    // Initialize the app
    const app = new TodoApp();

    // Add some demo tasks for demonstration
    if (app.tasks.length === 0) {
      app.tasks = [
        { id: 1, text: "Welcome to your new todo app! 🎉", completed: false, priority: "high", createdAt: new Date().toISOString() },
        { id: 2, text: "Double-click any task to edit it", completed: false, priority: "medium", createdAt: new Date().toISOString() },
        { id: 3, text: "Click the checkbox to mark as complete", completed: true, priority: "low", createdAt: new Date().toISOString() }
      ];
      app.render();
    }