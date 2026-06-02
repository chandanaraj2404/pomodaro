document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const dateDisplay = document.getElementById('date-display');
    const folderTitle = document.getElementById('folder-title');
    const folderItems = document.querySelectorAll('.folder-item');
    const taskList = document.getElementById('task-list');
    
    // View Switcher Panels
    const tasksDashboard = document.getElementById('tasks-dashboard');
    const focusTimerDashboard = document.getElementById('focus-timer-dashboard');
    
    // Progress Widget
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    // Modal Elements
    const modalOverlay = document.getElementById('task-modal');
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const taskForm = document.getElementById('task-form');
    
    // Form Inputs
    const taskIdInput = document.getElementById('task-id');
    const taskTitleInput = document.getElementById('task-title');
    const taskCategoryInput = document.getElementById('task-category');
    const taskPriorityInput = document.getElementById('task-priority');
    const taskDueDateInput = document.getElementById('task-due-date');
    const modalTitle = document.getElementById('modal-title');

    // Audio & Toast Notifications
    const notificationSound = document.getElementById('notification-sound');
    const toastContainer = document.getElementById('toast-container');

    // Focus Timer Elements
    const minutesDisplay = document.getElementById('minutes');
    const secondsDisplay = document.getElementById('seconds');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const timerModeBtns = document.querySelectorAll('.timer-mode-btn');
    const timerDisplay = document.getElementById('time-display');
    const focusTaskSelect = document.getElementById('focus-task-select');

    // --- State ---
    let tasks = JSON.parse(localStorage.getItem('advanced_tasks')) || [];
    let currentFolder = 'All'; // 'All', 'Work', 'Study', 'Personal'
    let notifiedTasks = JSON.parse(localStorage.getItem('notified_tasks')) || [];
    
    // Timer State
    let timerInterval;
    let timerRunning = false;
    let currentTimerMode = 'pomodoro'; // 'pomodoro', 'shortBreak', 'longBreak'
    const timerDurations = {
        pomodoro: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60
    };
    let timerTimeLeft = timerDurations[currentTimerMode];

    // --- Initialization ---
    init();

    function init() {
        // Display Date
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);

        // Ask for notification permission if not granted
        if ("Notification" in window) {
            if (Notification.permission !== "granted" && Notification.permission !== "denied") {
                Notification.requestPermission();
            }
        }

        renderApp();
        setupEventListeners();
        setupTimerEvents();

        // Start notification checker (every 10 seconds)
        setInterval(checkNotifications, 10000);
    }

    function setupEventListeners() {
        // Folder Navigation and View Switching
        folderItems.forEach(item => {
            item.addEventListener('click', () => {
                folderItems.forEach(f => f.classList.remove('active'));
                item.classList.add('active');
                
                const view = item.dataset.view;
                if (view === 'tasks') {
                    tasksDashboard.classList.remove('hidden');
                    focusTimerDashboard.classList.add('hidden');
                    
                    currentFolder = item.dataset.folder;
                    folderTitle.textContent = currentFolder === 'All' ? 'All Tasks' : currentFolder;
                    renderApp();
                } else if (view === 'focus') {
                    tasksDashboard.classList.add('hidden');
                    focusTimerDashboard.classList.remove('hidden');
                    populateFocusTaskSelect();
                }
            });
        });

        // Modal Controls
        openModalBtn.addEventListener('click', openModal);
        closeModalBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });

        // Form Submit
        taskForm.addEventListener('submit', handleTaskSubmit);
    }

    // --- Core Tasks Functions ---

    function getFilteredTasks() {
        if (currentFolder === 'All') return tasks;
        return tasks.filter(t => t.category === currentFolder);
    }

    function renderApp() {
        renderTasks();
        updateSidebarCounts();
        updateProgressBar();
    }

    function renderTasks() {
        taskList.innerHTML = '';
        const filteredTasks = getFilteredTasks();

        if (filteredTasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <i class='bx bx-task'></i>
                    <h3>No tasks found</h3>
                    <p>Enjoy your free time, or create a new task!</p>
                </div>
            `;
            return;
        }

        // Sort: Incomplete first, then by due date or priority
        filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
            return 0;
        });

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            let dueDateHtml = '';
            if (task.dueDate) {
                const dateObj = new Date(task.dueDate);
                const isPast = dateObj < new Date() && !task.completed;
                const timeStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
                dueDateHtml = `<span class="meta-item ${isPast ? 'text-danger' : ''}"><i class='bx bx-calendar'></i> ${timeStr}</span>`;
            }

            const catIcons = { 'Work': 'bx-briefcase', 'Study': 'bx-book-open', 'Personal': 'bx-user' };
            const catIcon = catIcons[task.category] || 'bx-folder';

            li.innerHTML = `
                <div class="custom-checkbox" onclick="toggleTask('${task.id}')">
                    <i class='bx bx-check'></i>
                </div>
                <div class="task-content">
                    <div class="task-name">${escapeHTML(task.title)}</div>
                    <div class="task-meta">
                        <span class="meta-item"><i class='bx ${catIcon}'></i> ${task.category}</span>
                        ${dueDateHtml}
                        <span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="icon-btn" onclick="editTask('${task.id}')" aria-label="Edit"><i class='bx bx-pencil'></i></button>
                    <button class="icon-btn delete-btn" onclick="deleteTask('${task.id}')" aria-label="Delete"><i class='bx bx-trash'></i></button>
                </div>
            `;
            
            taskList.appendChild(li);
        });

        // Expose global methods for inline HTML onclick handlers
        window.toggleTask = toggleTask;
        window.editTask = editTask;
        window.deleteTask = deleteTask;
    }

    function updateSidebarCounts() {
        const counts = { All: tasks.length, Work: 0, Study: 0, Personal: 0 };
        tasks.forEach(t => {
            if (counts[t.category] !== undefined) counts[t.category]++;
        });

        document.getElementById('count-All').textContent = counts.All;
        document.getElementById('count-Work').textContent = counts.Work;
        document.getElementById('count-Study').textContent = counts.Study;
        document.getElementById('count-Personal').textContent = counts.Personal;
    }

    function updateProgressBar() {
        const filteredTasks = getFilteredTasks();
        if (filteredTasks.length === 0) {
            progressBar.style.width = '0%';
            progressText.textContent = '0%';
            return;
        }

        const completedCount = filteredTasks.filter(t => t.completed).length;
        const percentage = Math.round((completedCount / filteredTasks.length) * 100);
        
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}%`;
    }

    // --- Focus View Helpers ---
    function populateFocusTaskSelect() {
        const currentValue = focusTaskSelect.value;
        focusTaskSelect.innerHTML = '<option value="">No active task (General Focus)</option>';
        
        const activeTasks = tasks.filter(t => !t.completed);
        activeTasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = `[${task.category}] ${task.title}`;
            if (task.id === currentValue) {
                option.selected = true;
            }
            focusTaskSelect.appendChild(option);
        });
    }

    // --- Data Operations ---

    function handleTaskSubmit(e) {
        e.preventDefault();
        
        const id = taskIdInput.value;
        const title = taskTitleInput.value.trim();
        const category = taskCategoryInput.value;
        const priority = taskPriorityInput.value;
        const dueDate = taskDueDateInput.value;

        if (!title) return;

        if (id) {
            // Edit existing
            const index = tasks.findIndex(t => t.id === id);
            if (index !== -1) {
                tasks[index] = { ...tasks[index], title, category, priority, dueDate };
                notifiedTasks = notifiedTasks.filter(notifId => notifId !== id);
            }
        } else {
            // Create new
            const newTask = {
                id: Date.now().toString(),
                title,
                category,
                priority,
                dueDate,
                completed: false
            };
            tasks.push(newTask);
            
            if (currentFolder !== 'All' && currentFolder !== category) {
                const targetBtn = document.querySelector(`[data-folder="${category}"]`);
                if (targetBtn) targetBtn.click();
            }
        }

        saveData();
        renderApp();
        closeModal();
    }

    function toggleTask(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveData();
            renderApp();
        }
    }

    function deleteTask(id) {
        tasks = tasks.filter(t => t.id !== id);
        saveData();
        renderApp();
    }

    function editTask(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        modalTitle.textContent = "Edit Task";
        taskIdInput.value = task.id;
        taskTitleInput.value = task.title;
        taskCategoryInput.value = task.category;
        taskPriorityInput.value = task.priority;
        taskDueDateInput.value = task.dueDate || "";
        
        openModal();
    }

    function saveData() {
        localStorage.setItem('advanced_tasks', JSON.stringify(tasks));
        localStorage.setItem('notified_tasks', JSON.stringify(notifiedTasks));
    }

    // --- Modal Control ---
    function openModal() {
        modalOverlay.classList.remove('hidden');
        if (!taskIdInput.value) {
            taskTitleInput.focus();
        }
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
        taskForm.reset();
        taskIdInput.value = "";
        modalTitle.textContent = "Create Task";
    }

    // --- Reminders & Notifications ---
    function checkNotifications() {
        const now = new Date();
        
        tasks.forEach(task => {
            if (task.completed || !task.dueDate) return;
            if (notifiedTasks.includes(task.id)) return;

            const dueTime = new Date(task.dueDate);
            
            if (dueTime <= now && (now - dueTime) < 3600000) {
                // Play notification sound
                playAlarmSound();
                
                // Native System Notification
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("Task Reminder: " + task.title, {
                        body: `Priority: ${task.priority} | Folder: ${task.category}`,
                        icon: 'https://cdn-icons-png.flaticon.com/512/906/906334.png'
                    });
                }

                // In-App Toast
                showToast(task);

                // Save status
                notifiedTasks.push(task.id);
                saveData();
            }
        });
    }

    function playAlarmSound() {
        notificationSound.play().catch(e => {
            // Fallback synthesized sound using Web Audio API if browser blocks play
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
                osc.start();
                osc.stop(audioCtx.currentTime + 1.5);
            } catch(err) {
                console.log("Audio block details:", err);
            }
        });
    }

    function showToast(task) {
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${task.priority.toLowerCase()}`;
        
        const catIcons = { 'Work': 'bx-briefcase', 'Study': 'bx-book-open', 'Personal': 'bx-user' };
        const catIcon = catIcons[task.category] || 'bx-bell';

        toast.innerHTML = `
            <div class="toast-icon">
                <i class='bx ${catIcon}'></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">Reminder: ${escapeHTML(task.title)}</div>
                <div class="toast-message">Due Time Reached! Priority: ${task.priority}</div>
            </div>
            <button class="toast-close"><i class='bx bx-x'></i></button>
        `;

        toastContainer.appendChild(toast);

        const closeBtn = toast.querySelector('.toast-close');
        const removeToast = () => {
            toast.classList.add('toast-out');
            setTimeout(() => {
                if(toast.parentElement) toast.remove();
            }, 400);
        };

        closeBtn.addEventListener('click', removeToast);
        setTimeout(removeToast, 8000);
    }

    // --- Pomodoro Focus Timer Logic ---

    function setupTimerEvents() {
        startBtn.addEventListener('click', toggleTimer);
        resetBtn.addEventListener('click', resetTimer);

        timerModeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                timerModeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                currentTimerMode = btn.dataset.mode;
                resetTimer();
            });
        });

        // Initialize state view of timer
        timerDisplay.classList.add('paused');
        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timerTimeLeft / 60);
        const seconds = timerTimeLeft % 60;
        
        const minsStr = minutes.toString().padStart(2, '0');
        const secsStr = seconds.toString().padStart(2, '0');
        
        minutesDisplay.textContent = minsStr;
        secondsDisplay.textContent = secsStr;
        
        const modeLabel = {
            'pomodoro': 'Focus',
            'shortBreak': 'Short Break',
            'longBreak': 'Long Break'
        }[currentTimerMode];

        if (timerRunning) {
            document.title = `${minsStr}:${secsStr} - ${modeLabel}`;
        } else {
            document.title = `Productive Hub`;
        }
    }

    function toggleTimer() {
        if (timerRunning) {
            // Pause
            clearInterval(timerInterval);
            timerRunning = false;
            startBtn.textContent = 'Start';
            timerDisplay.classList.add('paused');
            updateTimerDisplay();
        } else {
            // Start
            if (timerTimeLeft <= 0) {
                timerTimeLeft = timerDurations[currentTimerMode];
            }
            timerRunning = true;
            startBtn.textContent = 'Pause';
            timerDisplay.classList.remove('paused');
            updateTimerDisplay();

            timerInterval = setInterval(() => {
                timerTimeLeft--;
                updateTimerDisplay();

                if (timerTimeLeft <= 0) {
                    clearInterval(timerInterval);
                    timerRunning = false;
                    startBtn.textContent = 'Start';
                    timerDisplay.classList.add('paused');
                    
                    // Alert & Sound
                    playAlarmSound();
                    
                    // Native alert if focusing
                    if ("Notification" in window && Notification.permission === "granted") {
                        const alertMsg = currentTimerMode === 'pomodoro' ? 'Focus session completed! Time for a break.' : 'Break completed! Ready to focus?';
                        new Notification("Timer Ended", { body: alertMsg });
                    }

                    // Check if a task was assigned during Pomodoro focus completion
                    if (currentTimerMode === 'pomodoro' && focusTaskSelect.value) {
                        const selectedTaskId = focusTaskSelect.value;
                        const task = tasks.find(t => t.id === selectedTaskId);
                        if (task && !task.completed) {
                            showFocusCompletionToast(task);
                        }
                    }
                }
            }, 1000);
        }
    }

    function resetTimer() {
        clearInterval(timerInterval);
        timerRunning = false;
        startBtn.textContent = 'Start';
        timerTimeLeft = timerDurations[currentTimerMode];
        timerDisplay.classList.add('paused');
        updateTimerDisplay();
    }

    function showFocusCompletionToast(task) {
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-low`;
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class='bx bx-check-double'></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">Focus Complete!</div>
                <div class="toast-message">Did you finish "${escapeHTML(task.title)}"?</div>
                <button class="primary-btn" style="margin-top: 10px; padding: 6px 12px; font-size: 0.8rem;" id="toast-complete-btn-${task.id}">Mark as Done</button>
            </div>
            <button class="toast-close"><i class='bx bx-x'></i></button>
        `;

        toastContainer.appendChild(toast);

        const completeBtn = toast.querySelector(`#toast-complete-btn-${task.id}`);
        const closeBtn = toast.querySelector('.toast-close');
        
        const removeToast = () => {
            toast.classList.add('toast-out');
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, 400);
        };

        completeBtn.addEventListener('click', () => {
            toggleTask(task.id);
            removeToast();
            populateFocusTaskSelect();
        });

        closeBtn.addEventListener('click', removeToast);
        setTimeout(removeToast, 20000); // 20s to complete
    }

    // --- Utils ---
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
