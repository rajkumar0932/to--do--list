class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.editingTaskId = null;
        this.nextId = 1;
        this.isDarkMode = false;
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateDisplay();
    }
    
    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.dateInput = document.getElementById('dateInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.categoryInput = document.getElementById('categoryInput');
        this.addBtn = document.getElementById('addBtn');
        this.tasksContainer = document.getElementById('tasksContainer');
        this.emptyState = document.getElementById('emptyState');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.searchInput = document.getElementById('searchInput');
        this.themeToggle = document.getElementById('themeToggle');
        this.filterBtns = document.querySelectorAll('.filter-btn');
    }
    
    attachEventListeners() {
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.updateDisplay();
        });
        
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.updateDisplay();
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'Enter':
                        this.addTask();
                        e.preventDefault();
                        break;
                    case '/':
                        this.searchInput.focus();
                        e.preventDefault();
                        break;
                }
            }
        });
    }
    
    addTask() {
        const text = this.taskInput.value.trim();
        if (!text) return;
        
        const task = {
            id: this.nextId++,
            text: text,
            completed: false,
            priority: this.prioritySelect.value,
            category: this.categoryInput.value.trim() || 'General',
            dueDate: this.dateInput.value,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.unshift(task);
        this.clearInputs();
        this.updateDisplay();
        
        // Add animation
        setTimeout(() => {
            const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
            if (taskElement) {
                taskElement.style.animation = 'none';
                taskElement.offsetHeight; // Trigger reflow
                taskElement.style.animation = 'slideInUp 0.4s ease-out';
            }
        }, 10);
    }
    
    deleteTask(id) {
        const taskElement = document.querySelector(`[data-task-id="${id}"]`);
        if (taskElement) {
            taskElement.classList.add('removing');
            setTimeout(() => {
                this.tasks = this.tasks.filter(task => task.id !== id);
                this.updateDisplay();
            }, 300);
        }
    }
    
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.updateDisplay();
        }
    }
    
    editTask(id, newText) {
        const task = this.tasks.find(t => t.id === id);
        if (task && newText.trim()) {
            task.text = newText.trim();
            this.editingTaskId = null;
            this.updateDisplay();
        }
    }
    
    startEditing(id) {
        this.editingTaskId = id;
        this.updateDisplay();
        setTimeout(() => {
            const editInput = document.querySelector('.edit-input');
            if (editInput) {
                editInput.focus();
                editInput.select();
            }
        }, 10);
    }
    
    getFilteredTasks() {
        let filtered = this.tasks;
        
        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(task => 
                task.text.toLowerCase().includes(this.searchTerm) ||
                task.category.toLowerCase().includes(this.searchTerm)
            );
        }
        
        // Apply status filter
        switch(this.currentFilter) {
            case 'active':
                filtered = filtered.filter(task => !task.completed);
                break;
            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;
            case 'high':
                filtered = filtered.filter(task => task.priority === 'high');
                break;
        }
        
        return filtered;
    }
    
    updateProgress() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `${completed} of ${total} tasks completed`;
    }
    
    updateDisplay() {
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            this.tasksContainer.innerHTML = `
                <div class="empty-state">
                    <h3>${this.tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}</h3>
                    <p>${this.tasks.length === 0 ? 'Add your first task above to get started!' : 'Try adjusting your search or filter.'}</p>
                </div>
            `;
        } else {
            this.tasksContainer.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
            this.attachTaskEventListeners();
        }
        
        this.updateProgress();
    }
    
    createTaskHTML(task) {
        const isEditing = this.editingTaskId === task.id;
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''} priority-${task.priority}" data-task-id="${task.id}">
                <div class="task-content">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-action="toggle" data-id="${task.id}"></div>
                    <div class="task-details">
                        ${isEditing ? 
                            `<input type="text" class="edit-input" value="${task.text}" data-action="save-edit" data-id="${task.id}">` :
                            `<div class="task-text" data-action="start-edit" data-id="${task.id}">${task.text}</div>`
                        }
                        <div class="task-meta">
                            <span class="category">📁 ${task.category}</span>
                            <span class="priority">⭐ ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                            ${dueDate ? `<span class="due-date ${isOverdue ? 'overdue' : ''}">📅 ${dueDate}</span>` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        ${!isEditing ? `<button class="action-btn edit-btn" data-action="start-edit" data-id="${task.id}">✏️</button>` : ''}
                        <button class="action-btn delete-btn" data-action="delete" data-id="${task.id}">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    attachTaskEventListeners() {
        this.tasksContainer.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const id = parseInt(e.target.dataset.id);
            
            switch(action) {
                case 'toggle':
                    this.toggleTask(id);
                    break;
                case 'delete':
                    this.deleteTask(id);
                    break;
                case 'start-edit':
                    this.startEditing(id);
                    break;
            }
        });
        
        this.tasksContainer.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.classList.contains('edit-input')) {
                const id = parseInt(e.target.dataset.id);
                this.editTask(id, e.target.value);
            }
        });
        
        this.tasksContainer.addEventListener('blur', (e) => {
            if (e.target.classList.contains('edit-input')) {
                const id = parseInt(e.target.dataset.id);
                this.editTask(id, e.target.value);
            }
        }, true);
    }
    
    clearInputs() {
        this.taskInput.value = '';
        this.dateInput.value = '';
        this.categoryInput.value = '';
        this.prioritySelect.value = 'medium';
        this.taskInput.focus();
    }
    
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark', this.isDarkMode);
        this.themeToggle.textContent = this.isDarkMode ? '☀️ Light' : '🌙 Dark';
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});