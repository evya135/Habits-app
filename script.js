// script.js
// Habit Tracker app logic
// Saves habits, today's XP, streak, screen time, and total XP in localStorage.

// ---------- Storage defaults ----------
function initializeStorage() {
    if (localStorage.getItem('xpL') === null) {
        localStorage.setItem('xpL', '0'); // total XP
    }
    if (localStorage.getItem('todayXP') === null) {
        localStorage.setItem('todayXP', '0');
    }
    if (localStorage.getItem('lastDayXP') === null) {
        localStorage.setItem('lastDayXP', '0');
    }
    if (localStorage.getItem('streak') === null) {
        localStorage.setItem('streak', '0');
    }
    if (localStorage.getItem('instagramMinutes') === null) {
        localStorage.setItem('instagramMinutes', '135');
    }
    if (localStorage.getItem('completedHabits') === null) {
        localStorage.setItem('completedHabits', '[]');
    }
    if (localStorage.getItem('lastDate') === null) {
        localStorage.setItem('lastDate', new Date().toDateString());
    }
}

// ---------- Habit persistence ----------
function saveHabits() {
    const completed = [];

    document.querySelectorAll('.habit-card').forEach((card, index) => {
        if (card.classList.contains('completed')) {
            completed.push(index);
        }
    });

    localStorage.setItem('completedHabits', JSON.stringify(completed));
}

function loadHabits() {
    const completed = JSON.parse(localStorage.getItem('completedHabits') || '[]');

    document.querySelectorAll('.habit-card').forEach((card, index) => {
        if (completed.includes(index)) {
            card.classList.add('completed');
        } else {
            card.classList.remove('completed');
        }
    });
}

// ---------- Daily rollover ----------
function handleNewDay() {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('lastDate');

    if (lastDate !== today) {
        const yesterdayXP = Number(localStorage.getItem('todayXP') || 0);
        let totalXP = Number(localStorage.getItem('xpL') || 0);
        let streak = Number(localStorage.getItem('streak') || 0);

        // Save yesterday for display
        localStorage.setItem('lastDayXP', String(yesterdayXP));

        // Add yesterday to total banked XP
        totalXP += yesterdayXP;
        localStorage.setItem('xpL', String(totalXP));

        // Update streak from yesterday's result
        if (yesterdayXP > 0) {
            streak += 1;
        } else {
            streak = 0;
        }
        localStorage.setItem('streak', String(streak));

        // Reset today's editable state
        localStorage.setItem('todayXP', '0');
        localStorage.setItem('instagramMinutes', '135');
        localStorage.setItem('completedHabits', '[]');

        // Mark new day
        localStorage.setItem('lastDate', today);
    }
}

// ---------- Habit selection and UI animation ----------
function toggleHabit(element) {
    element.classList.toggle('completed');
    element.classList.add('just-completed');

    const checkMark = element.querySelector('.check-mark');
    if (checkMark) {
        checkMark.classList.add('popup');
    }

    setTimeout(() => {
        element.classList.remove('just-completed');
        if (checkMark) {
            checkMark.classList.remove('popup');
        }
    }, 600);

    saveHabits();
    refreshXP();
}

// ---------- XP helpers ----------
function parseXPFromReward(text) {
    const matches = text.match(/([+-]?\d+)/);
    return matches ? Number(matches[0]) : 0;
}

function getCurrentHabitXP() {
    let xp = 0;

    document.querySelectorAll('.habit-card').forEach(card => {
        const reward = card.querySelector('.habit-reward');
        const value = reward ? parseXPFromReward(reward.textContent) : 0;

        if (card.classList.contains('completed')) {
            xp += value;
        }
    });

    return xp;
}

// ---------- Instagram bar evaluation ----------
function calculatePenalty(minutes) {
    // 1m-60m => +1 XP
    // 61m-120m => 0 XP
    // 121m-180m => -1 XP
    // 181m-240m => -2 XP
    // 241m+ => -3 XP
    if (minutes <= 60) {
        return 1;
    }
    if (minutes <= 120) {
        return 0;
    }

    const hours = Math.ceil(minutes / 60);
    return -Math.min(3, hours - 2);
}

function formatTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
}

// ---------- State ----------
let currentInstagramMinutes = 135;
let isDraggingBar = false;

// ---------- Main UI refresh ----------
function refreshXP() {
    const minutes = Math.min(600, Math.max(0, currentInstagramMinutes));
    const habitXP = getCurrentHabitXP();
    const penalty = calculatePenalty(minutes);
    const netToday = habitXP + penalty;

    // Save current editable state
    localStorage.setItem('instagramMinutes', String(minutes));
    localStorage.setItem('todayXP', String(netToday));

    // Read stored values for UI
    const savedLast = Number(localStorage.getItem('lastDayXP') || 0);
    const savedTotal = Number(localStorage.getItem('xpL') || 0);
    const streak = Number(localStorage.getItem('streak') || 0);
    const previewTotal = savedTotal + netToday;

    // UI elements
    const hoursNode = document.querySelector('.screen-time-hours');
    const fillNode = document.querySelector('.screen-time-fill');
    const barNode = document.querySelector('.screen-time-bar');
    const penaltyNode = document.getElementById('penalty-value-id');
    const netNode = document.querySelector('.net-xp');
    const todayNode = document.querySelector('.today-xp');
    const lastDayNode = document.querySelector('.last-day-xp');
    const streakNode = document.querySelector('.streak');
    const moneyNode = document.getElementById('moneyDisplay');

    if (hoursNode) {
        hoursNode.textContent = formatTime(minutes);
    }

    if (fillNode) {
        fillNode.style.width = `${Math.min(100, (minutes / 600) * 100)}%`;
    }

    if (barNode) {
        barNode.setAttribute('aria-valuenow', String(minutes));
    }

    if (penaltyNode) {
        penaltyNode.textContent = `${penalty >= 0 ? '+' : ''}${penalty} XP`;
        penaltyNode.style.color = penalty === 1 ? '#00c864' : '#ff6b6b';
    }

    if (netNode) {
        netNode.textContent = `${netToday >= 0 ? '+' : ''}${netToday} XP`;
    }

    if (todayNode) {
        todayNode.textContent = `${netToday >= 0 ? '+' : ''}${netToday}`;
    }

    if (lastDayNode) {
        lastDayNode.textContent = `${savedLast >= 0 ? '+' : ''}${savedLast} XP`;
    }

    if (streakNode) {
        streakNode.textContent = `🔥 ${streak} day streak`;
    }

    if (moneyNode) {
        // shows what your total will look like if today ended now
        moneyNode.innerHTML = previewTotal;
    }
}

// ---------- Screen-time bar ----------
function setInstagramFromBar(clientX) {
    const bar = document.querySelector('.screen-time-bar');
    if (!bar) return;

    const rect = bar.getBoundingClientRect();
    const offsetX = Math.min(Math.max(0, clientX - rect.left), rect.width);
    const percent = offsetX / rect.width;

    currentInstagramMinutes = Math.round(percent * 600);
    refreshXP();
}

function bindBarDrag() {
    const bar = document.querySelector('.screen-time-bar');
    if (!bar) return;

    bar.addEventListener('click', event => {
        setInstagramFromBar(event.clientX);
    });

    bar.addEventListener('mousedown', event => {
        isDraggingBar = true;
        setInstagramFromBar(event.clientX);
    });

    document.addEventListener('mousemove', event => {
        if (!isDraggingBar) return;
        setInstagramFromBar(event.clientX);
    });

    document.addEventListener('mouseup', () => {
        isDraggingBar = false;
    });

    bar.addEventListener('keydown', event => {
        let changed = false;

        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            currentInstagramMinutes = Math.min(600, currentInstagramMinutes + 5);
            changed = true;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            currentInstagramMinutes = Math.max(0, currentInstagramMinutes - 5);
            changed = true;
        } else if (event.key === 'PageUp') {
            currentInstagramMinutes = Math.min(600, currentInstagramMinutes + 30);
            changed = true;
        } else if (event.key === 'PageDown') {
            currentInstagramMinutes = Math.max(0, currentInstagramMinutes - 30);
            changed = true;
        }

        if (changed) {
            event.preventDefault();
            refreshXP();
        }
    });
}

// ---------- Optional manual claim button ----------
function commitTodayXP() {
    const today = new Date().toDateString();
    const lastClaimDate = localStorage.getItem('xpClaimDate');
    if (lastClaimDate === today) return;

    const todayXP = Number(localStorage.getItem('todayXP') || 0);
    let totalXP = Number(localStorage.getItem('xpL') || 0);

    totalXP += todayXP;
    localStorage.setItem('xpL', String(totalXP));
    localStorage.setItem('xpClaimDate', today);

    refreshXP();
}

// ---------- Optional manual last-day save ----------
function saveLastDayXP() {
    const todayXP = Number(localStorage.getItem('todayXP') || 0);
    localStorage.setItem('lastDayXP', String(todayXP));
    refreshXP();
    window.alert("Today's net XP saved as last day XP.");
}

// ---------- Start ----------
document.addEventListener('DOMContentLoaded', () => {
    initializeStorage();
    handleNewDay();
    loadHabits();

    currentInstagramMinutes = Number(localStorage.getItem('instagramMinutes') || 135);

    refreshXP();
    bindBarDrag();
});