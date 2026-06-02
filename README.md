# TaskMaster Pro & Focus Timer

A unified, premium, and calm productivity dashboard featuring a **glassmorphic dark-theme** design. This application combines advanced task management (folders, priorities, due dates, and reminders) with a dedicated Pomodoro focus timer.

---

## Key Features

### Advanced Task Management
- **Folder Categorization**: Group your tasks into folders like *Work*, *Study*, and *Personal*.
- **Priority Levels**: Color-coded badges for High (🔴), Medium (🟡), and Low (🟢) priorities.
- **Due Dates & Alarm Reminders**: Set specific due dates/times and receive in-app toast alerts as well as native system push notifications with sound when the limit is reached.
- **Progress Tracking**: A visual, shimmering progress bar dynamically updates based on completed tasks in your current view.
- **Persistence**: All tasks are saved automatically to your browser's local storage.

###  Integrated Pomodoro Focus Timer
- **Multi-Mode Timer**: Choose between *Pomodoro* (25m), *Short Break* (5m), and *Long Break* (15m) sessions.
- **Active Task Association**: Select an active task from your list to "focus on" during the timer execution.
- **Auto-Complete Flow**: Once the timer ends, a gentle alarm chimes, and an interactive prompt invites you to instantly mark the associated task as done.
- **Live Tab Tracking**: The page title dynamically changes to reflect the remaining minutes/seconds so you can keep track even while browsing other tabs.

### Premium Visual Aesthetics
- **Dark Glassmorphism**: Frosted glass panels (`backdrop-filter: blur(16px)`) with subtle borders and shadows.
- **Smooth Animations**: Slow-drifting colored background shapes and micro-animations for task card hover, checkboxes, and modal fade-ins.
- **Rounded Typography**: Uses Google Font's *Quicksand* and *Outfit* to enhance the calming and minimal look.

---

##  How to Run

Since the application is built using standard web technologies, **no server or build steps are required**!

1. Clone or download the repository.
2. Open the directory containing `index.html`.
3. Double-click `index.html` to run it directly in any modern web browser.

---

##  Technologies Used
- **HTML5**: Semantic document layout.
- **CSS3**: Layout, animation keyframes, and glassmorphic designs.
- **JavaScript (ES6+)**: Task lifecycle management, Web Audio API chime synthesis, notification scheduling, and Pomodoro timer mechanics.
- **Boxicons**: High-quality UI icons.
