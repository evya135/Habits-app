// ---------- Habit completion animation ----------
function triggerHabitCompletionAnimation(element) {
    element.classList.remove('just-completed'); // reset if already animating
    // Force reflow to restart animation
    void element.offsetWidth;
    element.classList.add('just-completed');
    setTimeout(() => {
        element.classList.remove('just-completed');
    }, 600); // match CSS animation duration
}
// script.js
// Habit Tracker app logic
// Saves habits, today's XP, streak, screen time, and total XP in localStorage.

// ---------- Date formatting ----------
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

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
    if (localStorage.getItem('dailyHistory') === null) {
        localStorage.setItem('dailyHistory', '[]');
    }
    if (localStorage.getItem('withdrawals') === null) {
        localStorage.setItem('withdrawals', '[]');
    }
    if (localStorage.getItem('dailyGoal') === null) {
        localStorage.setItem('dailyGoal', '3');
    }
    if (localStorage.getItem('achievements') === null) {
        localStorage.setItem('achievements', '[]');
    }
    if (localStorage.getItem('completionTimes') === null) {
        localStorage.setItem('completionTimes', '[]');
    }
    if (localStorage.getItem('habitNotes') === null) {
        localStorage.setItem('habitNotes', '{}');
    }
    if (localStorage.getItem('milestones') === null) {
        localStorage.setItem('milestones', '[]');
    }
    // Initialize custom habits (new feature)
    if (localStorage.getItem('habits') === null) {
        const defaultHabits = [
            { id: 'wk1', name: 'Workout', icon: '💪', description: '30 min session', reward: 2 },
            { id: 'wk2', name: 'Walk', icon: '🚶', description: '20 min', reward: 1 },
            { id: 'wk3', name: 'Sleep', icon: '😴', description: '8 hours target', reward: 1 }
        ];
        localStorage.setItem('habits', JSON.stringify(defaultHabits));
    }
    // Initialize notification settings (new feature)
    if (localStorage.getItem('notificationSettings') === null) {
        localStorage.setItem('notificationSettings', JSON.stringify({
            enabled: false,
            time: '09:00'
        }));
    }
}

// ---------- Habit persistence ----------
function saveHabits() {
    const completed = [];
    document.querySelectorAll('.habit-card').forEach((card) => {
        if (card.classList.contains('completed')) {
            const habitId = card.getAttribute('data-habit-id');
            if (habitId) completed.push(habitId);
        }
    });
    localStorage.setItem('completedHabits', JSON.stringify(completed));
}

function loadHabits() {
    const completed = JSON.parse(localStorage.getItem('completedHabits') || '[]');
    document.querySelectorAll('.habit-card').forEach((card) => {
        const habitId = card.getAttribute('data-habit-id');
        if (completed.includes(habitId)) {
            card.classList.add('completed');
        } else {
            card.classList.remove('completed');
        }
    });
}

// ---------- Custom habit management ----------
function getHabits() {
    return JSON.parse(localStorage.getItem('habits') || '[]');
}

function addHabit(name, icon, description, reward) {
    const habits = getHabits();
    const id = 'h_' + Date.now();
    habits.push({ id, name, icon, description, reward });
    localStorage.setItem('habits', JSON.stringify(habits));
    
    // Track habit creation for achievements
    const habitsHistory = JSON.parse(localStorage.getItem('habitsHistory') || '[]');
    habitsHistory.push({ id, name, date: new Date().toISOString() });
    localStorage.setItem('habitsHistory', JSON.stringify(habitsHistory));
    
    renderHabits();
    loadHabits();
    return id;
}

function removeHabit(habitId) {
    let habits = getHabits();
    habits = habits.filter(h => h.id !== habitId);
    localStorage.setItem('habits', JSON.stringify(habits));
    // Remove from completed list
    let completed = JSON.parse(localStorage.getItem('completedHabits') || '[]');
    completed = completed.filter(id => id !== habitId);
    localStorage.setItem('completedHabits', JSON.stringify(completed));
    renderHabits();
    loadHabits();
}

function updateHabit(habitId, name, icon, description, reward) {
    const habits = getHabits();
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
        habit.name = name;
        habit.icon = icon;
        habit.description = description;
        habit.reward = reward;
        localStorage.setItem('habits', JSON.stringify(habits));
        renderHabits();
        loadHabits();
    }
}

function renderHabits() {
    const habits = getHabits();
    const container = document.querySelector('.habits-section');
    if (!container) return;
    const habitsContainer = container.querySelector('[data-habits-list]') || container.querySelector('.habits-list') || container.querySelectorAll('.habit-card')[0]?.parentElement;
    if (!habitsContainer) return;
    // Clear existing habit cards
    let habitCards = habitsContainer.querySelectorAll('.habit-card');
    habitCards.forEach(card => {
        if (card.getAttribute('data-habit-id')) {
            card.remove();
        }
    });
    // Create new habit cards
    habits.forEach(habit => {
        const card = document.createElement('div');
        card.className = 'habit-card';
        card.setAttribute('data-habit-id', habit.id);
        card.onclick = function() {
            toggleHabit(this);
            // UI will update via refreshXP() inside toggleHabit
        };
        card.innerHTML = `
            <div class="habit-info">
                <div class="habit-icon">${habit.icon}</div>
                <div class="habit-details">
                    <h3>${habit.name}</h3>
                    <p>${habit.description}</p>
                </div>
            </div>
            <div class="habit-reward">+${habit.reward} ₪</div>
            <div class="check-mark">✓</div>
        `;
        habitsContainer.appendChild(card);
    });
    // Always load state after rendering
    loadHabits();
    // Force UI update after loading state
    setTimeout(refreshXP, 0);
}

// ---------- Daily rollover ----------
function handleNewDay() {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('lastDate');
    const freezeKey = 'streakFreezeDate';
    const lastFreeze = localStorage.getItem(freezeKey);
    if (lastDate !== today) {
        const yesterdayXP = Number(localStorage.getItem('todayXP') || 0);
        let totalXP = Number(localStorage.getItem('xpL') || 0);
        let streak = Number(localStorage.getItem('streak') || 0);
        localStorage.setItem('lastDayXP', String(yesterdayXP));
        totalXP += yesterdayXP;
        localStorage.setItem('xpL', String(totalXP));
        // If streak freeze was used yesterday, don't reset streak even if XP is 0
        if (lastFreeze === lastDate) {
            // Do not reset streak
        } else if (yesterdayXP > 0) {
            streak += 1;
        } else {
            streak = 0;
        }
        localStorage.setItem('streak', String(streak));
        // Save daily history
        const completedHabits = JSON.parse(localStorage.getItem('completedHabits') || '[]');
        const habits = getHabits();
        const completedHabitNames = completedHabits.map(habitId => {
            const habit = habits.find(h => h.id === habitId);
            return habit ? habit.name : null;
        }).filter(Boolean);
        const instagramMinutes = Number(localStorage.getItem('instagramMinutes') || 0);
        const dailyHistory = JSON.parse(localStorage.getItem('dailyHistory') || '[]');
        dailyHistory.push({
            date: lastDate,
            habits: completedHabitNames,
            instagramMinutes: instagramMinutes,
            netXP: yesterdayXP,
            earned: yesterdayXP
        });
        localStorage.setItem('dailyHistory', JSON.stringify(dailyHistory));
        localStorage.setItem('todayXP', '0');
        localStorage.setItem('instagramMinutes', '135');
        localStorage.setItem('completedHabits', '[]');
        localStorage.setItem('lastDate', today);
    }
}

// ---------- Habit selection and UI animation ----------
function toggleHabit(element) {
    element.classList.toggle('completed');
    triggerHabitCompletionAnimation(element);
    const checkMark = element.querySelector('.check-mark');
    if (checkMark) {
        checkMark.classList.add('popup');
    }
    setTimeout(() => {
        if (checkMark) checkMark.classList.remove('popup');
    }, 600);
    // Save immediately after toggle
    saveHabits();
    // Force UI update after saving
    setTimeout(refreshXP, 0);
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
    console.log("refreshXP");
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
        penaltyNode.textContent = `${penalty >= 0 ? '+' : ''}${penalty} ₪`;
        penaltyNode.style.color = penalty === 1 ? '#00c864' : '#ff6b6b';
    }

    if (netNode) {
        netNode.textContent = `${netToday >= 0 ? '+' : ''}${netToday} ₪`;
    }

    if (todayNode) {
        todayNode.textContent = `${netToday >= 0 ? '+' : ''}${netToday} ₪`;
    }

    if (lastDayNode) {
        lastDayNode.textContent = `${savedLast >= 0 ? '+' : ''}${savedLast} ₪`;
    }

    if (streakNode) {
        streakNode.textContent = `🔥 ${streak} day streak`;
    }

    if (moneyNode) {
        // shows current total XP balance
        moneyNode.innerHTML = savedTotal;
    }

    // Update streak display
    const streakNumberNode = document.getElementById('streakNumber');
    if (streakNumberNode) {
        streakNumberNode.textContent = streak;
    }

    // Display achievements
    displayAchievements();
    checkAndUnlockAchievements();
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
    showNotification("Saved", "Today's net XP saved as last day XP.");
}

// ---------- Daily goal management ----------
function saveDailyGoal(value) {
    localStorage.setItem('dailyGoal', String(value));
    refreshXP();
}

function getDailyGoal() {
    return Number(localStorage.getItem('dailyGoal') || 3);
}


// ---------- Achievement system ----------
const ACHIEVEMENTS = [
    // Early milestones
    { id: 'first10', name: '⭐ First Steps', target: 10, type: 'total', reward: 1 },
    { id: 'first20', name: '✨ Getting Started', target: 20, type: 'total', reward: 1 },
    { id: 'first30', name: '🌟 Moving Forward', target: 30, type: 'total', reward: 1 },
    { id: 'first40', name: '💫 Building Momentum', target: 40, type: 'total', reward: 1 },
    { id: 'first50', name: '🎯 Halfway There', target: 50, type: 'total', reward: 2 },
    { id: 'first60', name: '🚀 Picking Up Speed', target: 60, type: 'total', reward: 2 },
    { id: 'first75', name: '⚡ Three Quarters', target: 75, type: 'total', reward: 2 },
    // Medium milestones
    { id: 'first100', name: '💰 Century Club', target: 100, type: 'total', reward: 3 },
    { id: 'first150', name: '🎖️ Rising Star', target: 150, type: 'total', reward: 3 },
    { id: 'first200', name: '🏺 Collector', target: 200, type: 'total', reward: 3 },
    { id: 'first250', name: '🏆 Quarter Thousand', target: 250, type: 'total', reward: 4 },
    { id: 'first350', name: '🌈 Rainbow Path', target: 350, type: 'total', reward: 4 },
    { id: 'first500', name: '💵 500 Champion', target: 500, type: 'total', reward: 5 },
    // Large milestones
    { id: 'first750', name: '👽 Alien Power', target: 750, type: 'total', reward: 7 },
    { id: 'first1000', name: '💎 Millionaire', target: 1000, type: 'total', reward: 10 },
    { id: 'first1500', name: '🌟 Superstar', target: 1500, type: 'total', reward: 12 },
    { id: 'first2000', name: '👑 King of Habits', target: 2000, type: 'total', reward: 15 },
    { id: 'first3000', name: '🔱 Poseidon', target: 3000, type: 'total', reward: 20 },
    { id: 'first5000', name: '✨ Legendary', target: 5000, type: 'total', reward: 25 },
    // Short streaks
    { id: 'perfect2', name: '🔥 Two in a Row', target: 2, type: 'streak', reward: 1 },
    { id: 'perfect3', name: '🔥 Three Days Strong', target: 3, type: 'streak', reward: 2 },
    { id: 'perfect5', name: '✨ Five-Day Warrior', target: 5, type: 'streak', reward: 3 },
    // Medium streaks
    { id: 'perfect7', name: '✨ Perfect Week', target: 7, type: 'streak', reward: 5 },
    { id: 'perfect14', name: '🔥 Fortnight Legend', target: 14, type: 'streak', reward: 8 },
    { id: 'perfect21', name: '🎯 Three Week Sprint', target: 21, type: 'streak', reward: 10 },
    // Long streaks
    { id: 'perfect30', name: '👑 Month Master', target: 30, type: 'streak', reward: 15 },
    { id: 'perfect60', name: '⚡ Two Month Thunder', target: 60, type: 'streak', reward: 25 },
    { id: 'perfect90', name: '🏆 Three Month Champion', target: 90, type: 'streak', reward: 35 },
    { id: 'perfect100', name: '💯 Century Streak', target: 100, type: 'streak', reward: 50 },
    // Perfect days
    { id: 'allhabitday', name: '⭐ Perfect Day', target: 1, type: 'perfectday', reward: 2 },
    { id: 'perfectday3', name: '🌟 Triple Perfect', target: 3, type: 'perfectday-multi', reward: 5 },
    { id: 'perfectday7', name: '✨ Perfect Week (All)', target: 7, type: 'perfectday-multi', reward: 10 },
    // Funny & Humorous Milestones
    { id: 'first_withdrawal', name: '🏃 Breaking the Habit', target: 1, type: 'withdrawal', reward: 0 },
    { id: 'multiple_withdrawals', name: '💸 Spending Spree', target: 5, type: 'withdrawal', reward: 0 },
    { id: 'big_withdrawal', name: '🤑 The Big Surrender', target: 500, type: 'withdrawal-amount', reward: 0 },
    { id: 'balance_check', name: '💰 Millionaire Wisher', target: 1000, type: 'total', reward: 10 },
    { id: 'fail_comeback', name: '🎭 Phoenix Rising', target: 7, type: 'streak', reward: 8 },
    { id: 'crazy_earner', name: '🤯 Money Machine', target: 10000, type: 'total', reward: 30 },
    { id: 'emoji_collector', name: '😂 Emoji Queen', target: 20, type: 'total', reward: 5 },
    // More Funny & Unrelated Milestones
    { id: 'medias_enemy', name: '📱 Media\'s Enemy', target: 7, type: 'screen-time', reward: 5 },
    { id: 'early_bird', name: '🐦 Early Bird', target: 5, type: 'wake-time', reward: 3 },
    { id: 'night_owl', name: '🦉 Night Owl', target: 24, type: 'bed-time', reward: 3 },
    { id: 'speed_demon', name: '🏎️ Speed Demon', target: 5, type: 'completion-time', reward: 3 },
    { id: 'lucky_number', name: '🍀 Lucky Number', target: 777, type: 'exact-total', reward: 7 },
    { id: 'round_number', name: '🔄 Round Number', target: 1000, type: 'exact-total', reward: 10 },
    { id: 'habit_hoarder', name: '📚 Habit Hoarder', target: 10, type: 'habit-count', reward: 5 },
    { id: 'monday_motivation', name: '💪 Monday Motivation', target: 1, type: 'monday-start', reward: 2 }
];

function checkAndUnlockAchievements() {
    const totalXP = Number(localStorage.getItem('xpL') || 0);
    const streak = Number(localStorage.getItem('streak') || 0);
    const completedHabits = JSON.parse(localStorage.getItem('completedHabits') || '[]');
    const habits = getHabits();
    const unlockedAchievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    const dailyHistory = JSON.parse(localStorage.getItem('dailyHistory') || '[]');
    const withdrawals = JSON.parse(localStorage.getItem('withdrawals') || '[]');

    ACHIEVEMENTS.forEach(achievement => {
        if (unlockedAchievements.includes(achievement.id)) return; // Already unlocked

        let shouldUnlock = false;
        if (achievement.type === 'total' && totalXP >= achievement.target) {
            shouldUnlock = true;
        } else if (achievement.type === 'streak' && streak >= achievement.target) {
            shouldUnlock = true;
        } else if (achievement.type === 'perfectday' && completedHabits.length === habits.length && habits.length > 0) {
            shouldUnlock = true;
        } else if (achievement.type === 'perfectday-multi') {
            // Count consecutive perfect days
            let perfectDayCount = 0;
            for (let i = dailyHistory.length - 1; i >= 0; i--) {
                if (dailyHistory[i].habits.length === habits.length && habits.length > 0) {
                    perfectDayCount++;
                } else {
                    break;
                }
            }
            if (perfectDayCount >= achievement.target) {
                shouldUnlock = true;
            }
        } else if (achievement.type === 'withdrawal' && withdrawals.length >= achievement.target) {
            shouldUnlock = true;
        } else if (achievement.type === 'withdrawal-amount') {
            // Calculate total withdrawn amount
            const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
            if (totalWithdrawn >= achievement.target) {
                shouldUnlock = true;
            }
        } else if (achievement.type === 'exact-total' && totalXP === achievement.target) {
            shouldUnlock = true;
        } else if (achievement.type === 'habit-count' && habits.length >= achievement.target) {
            shouldUnlock = true;
        } else if (achievement.type === 'weekend-perfect') {
            // Check if today is weekend and all habits completed
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
            if ((dayOfWeek === 0 || dayOfWeek === 6) && completedHabits.length === habits.length && habits.length > 0) {
                shouldUnlock = true;
            }
        } else if (achievement.type === 'monday-start') {
            // Check if a new habit was added on Monday
            const habitsHistory = JSON.parse(localStorage.getItem('habitsHistory') || '[]');
            const mondayHabits = habitsHistory.filter(h => {
                const habitDate = new Date(h.date);
                return habitDate.getDay() === 1; // Monday
            });
            if (mondayHabits.length >= achievement.target) {
                shouldUnlock = true;
            }
        }

        if (shouldUnlock) {
            unlockedAchievements.push(achievement.id);
            localStorage.setItem('achievements', JSON.stringify(unlockedAchievements));
            
            // Award bonus XP to bank
            const currentBank = Number(localStorage.getItem('xpL') || 0);
            const totalBanked = currentBank + achievement.reward;
            localStorage.setItem('xpL', String(totalBanked));
            
            // Record milestone in milestones list
            const milestones = JSON.parse(localStorage.getItem('milestones') || '[]');
            milestones.push({
                id: achievement.id,
                name: achievement.name,
                reward: achievement.reward,
                date: new Date().toISOString()
            });
            localStorage.setItem('milestones', JSON.stringify(milestones));
            
            triggerAchievementAnimation(achievement.id);
            const achievementEl = document.querySelector(`[data-achievement="${achievement.id}"]`);
            if (achievementEl) {
                achievementEl.classList.remove('locked');
                const today = formatDate(new Date());
                showNotification('🎉 Achievement Unlocked!', `${achievement.name}\n💰 Reward: +${achievement.reward} ₪\n📅 ${today}`);
            }
            
            // Update UI
            refreshXP();
        }
    });
}

function displayAchievements() {
    const unlockedAchievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    const achievementsList = document.getElementById('achievementsList');
    
    if (!achievementsList) return;

    // Find the next locked achievement (closest milestone)
    const nextAchievement = ACHIEVEMENTS.find(a => !unlockedAchievements.includes(a.id));
    
    // Get count of unlocked achievements
    const unlockedCount = unlockedAchievements.length;
    const totalCount = ACHIEVEMENTS.length;
    
    if (nextAchievement) {
        // Show only the next milestone and a progress indicator
        achievementsList.innerHTML = `
            <div style="margin-bottom: 12px;">
                <div style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Next Milestone</div>
                <div class="achievement-badge locked" data-achievement="${nextAchievement.id}" onclick="showMilestoneDetails('${nextAchievement.id}')" style="cursor: pointer; width: 100%;">
                    ${nextAchievement.name}
                </div>
            </div>
            <div style="text-align: center; font-size: 12px; color: #666; cursor: pointer;">
                📊 ${unlockedCount} of ${totalCount} completed <a href="milestones.html" style="color: #00ffc8; margin-left: 8px; text-decoration: underline;">View All →</a>
            </div>
        `;
    } else {
        // All milestones unlocked!
        achievementsList.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 32px; margin-bottom: 8px;">👑</div>
                <div style="font-size: 14px; font-weight: 600; color: #00ffc8;">All Milestones Unlocked!</div>
                <div style="font-size: 12px; color: #888; margin-top: 8px;">
                    <a href="milestones.html" style="color: #00ffc8; text-decoration: underline;">Click to view all achievements</a>
                </div>
            </div>
        `;
    }
}

function showUnlockedMilestones() {
    const unlockedAchievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    const modal = document.getElementById('unlocked-milestones-modal');
    const list = document.getElementById('unlocked-milestones-list');
    
    const unlockedMilestones = ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.id))
        .sort((a, b) => {
            // Sort by: total > streak > perfectday > perfectday-multi
            const typeOrder = { 'total': 1, 'streak': 2, 'perfectday': 3, 'perfectday-multi': 4 };
            return typeOrder[a.type] - typeOrder[b.type] || a.target - b.target;
        });
    
    if (unlockedMilestones.length === 0) {
        list.innerHTML = '<p style="color: #888; text-align: center;">No milestones unlocked yet</p>';
    } else {
        list.innerHTML = unlockedMilestones.map(achievement => `
            <div style="background: rgba(0, 255, 200, 0.05); border: 1px solid rgba(0, 255, 200, 0.15); border-radius: 12px; padding: 12px; margin-bottom: 8px; cursor: pointer; transition: all 0.3s ease;" 
                 onclick="showMilestoneDetails('${achievement.id}')"
                 onmouseover="this.style.background='rgba(0, 255, 200, 0.1)'; this.style.borderColor='rgba(0, 255, 200, 0.3)';"
                 onmouseout="this.style.background='rgba(0, 255, 200, 0.05)'; this.style.borderColor='rgba(0, 255, 200, 0.15)';">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600; font-size: 16px;">${achievement.name}</div>
                        <div style="font-size: 12px; color: #888; margin-top: 4px;">Target: ${achievement.target} ${achievement.type === 'total' ? '₪' : achievement.type.includes('streak') ? 'days' : 'habit' + (achievement.target > 1 ? 's' : '')}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 14px; color: #00ffc8; font-weight: 600;">+${achievement.reward} ₪</div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    modal.style.display = 'block';
}

function getNextMilestone() {
    const unlockedAchievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    return ACHIEVEMENTS.find(a => !unlockedAchievements.includes(a.id));
}

function showMilestoneDetails(achievementId) {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return;

    const modal = document.getElementById('milestone-modal');
    const unlockedAchievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    const isUnlocked = unlockedAchievements.includes(achievementId);

    document.getElementById('milestone-title').textContent = achievement.name;
    
    // Target info
    let targetText = '';
    if (achievement.type === 'total') {
        const currentTotal = Number(localStorage.getItem('xpL') || 0);
        targetText = `Total ₪: ${achievement.target} (Current: ${currentTotal})`;
    } else if (achievement.type === 'streak') {
        const currentStreak = Number(localStorage.getItem('streak') || 0);
        targetText = `Streak: ${achievement.target} days (Current: ${currentStreak})`;
    } else if (achievement.type === 'perfectday') {
        const habits = getHabits();
        targetText = `Complete all ${habits.length} habits in one day`;
    } else if (achievement.type === 'perfectday-multi') {
        targetText = `Complete all habits ${achievement.target} consecutive days`;
    } else if (achievement.type === 'withdrawal') {
        const withdrawals = JSON.parse(localStorage.getItem('withdrawals') || '[]');
        targetText = `Make ${achievement.target} withdrawal(s) (Current: ${withdrawals.length})`;
    } else if (achievement.type === 'withdrawal-amount') {
        const withdrawals = JSON.parse(localStorage.getItem('withdrawals') || '[]');
        const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
        targetText = `Withdraw a total of ₪${achievement.target} (Current: ₪${totalWithdrawn})`;
    } else if (achievement.type === 'exact-total') {
        const currentTotal = Number(localStorage.getItem('xpL') || 0);
        targetText = `Reach exactly ₪${achievement.target} (Current: ₪${currentTotal})`;
    } else if (achievement.type === 'habit-count') {
        const habits = getHabits();
        targetText = `Have ${achievement.target} habits active (Current: ${habits.length})`;
    } else if (achievement.type === 'weekend-perfect') {
        targetText = `Complete all habits on a weekend day`;
    } else if (achievement.type === 'monday-start') {
        const habitsHistory = JSON.parse(localStorage.getItem('habitsHistory') || '[]');
        const mondayHabits = habitsHistory.filter(h => {
            const habitDate = new Date(h.date);
            return habitDate.getDay() === 1;
        });
        targetText = `Start a new habit on a Monday (Started: ${mondayHabits.length})`;
    } else if (achievement.type === 'screen-time') {
        targetText = `Spend less than ${achievement.target} hours on social media in 3.5 days`;
    } else if (achievement.type === 'wake-time') {
        targetText = `Wake up before ${achievement.target}:00 AM`;
    } else if (achievement.type === 'bed-time') {
        targetText = `Stay up past ${achievement.target}:00 (midnight)`;
    } else if (achievement.type === 'coffee') {
        targetText = `Drink ${achievement.target} coffees in one day`;
    } else if (achievement.type === 'completion-time') {
        targetText = `Complete all habits in under ${achievement.target} minutes`;
    } else if (achievement.type === 'messages') {
        targetText = `Send ${achievement.target} messages in one day`;
    } else if (achievement.type === 'late-eating') {
        targetText = `Eat something after midnight`;
    } else if (achievement.type === 'habit-redo') {
        targetText = `Redo a habit ${achievement.target} times in one day`;
    } else if (achievement.type === 'last-minute') {
        targetText = `Complete a habit at the last minute`;
    } else if (achievement.type === 'dance-session') {
        targetText = `Have a spontaneous dance party`;
    } else if (achievement.type === 'shower-songs') {
        targetText = `Sing ${achievement.target} songs in the shower`;
    } else if (achievement.type === 'pet-playtime') {
        targetText = `Spend quality time with a pet`;
    } else if (achievement.type === 'weird-recipe') {
        targetText = `Try cooking something completely new and weird`;
    } else if (achievement.type === 'cloud-shapes') {
        targetText = `Spot ${achievement.target} different shapes in clouds`;
    } else if (achievement.type === 'good-deed') {
        targetText = `Do a random act of kindness`;
    } else if (achievement.type === 'dream-log') {
        targetText = `Record ${achievement.target} dreams in a journal`;
    } else if (achievement.type === 'jigsaw-complete') {
        targetText = `Complete a jigsaw puzzle`;
    } else if (achievement.type === 'constellation-spot') {
        targetText = `Spot and identify a constellation`;
    } else if (achievement.type === 'old-photos') {
        targetText = `Look through old family photos`;
    }
    document.getElementById('milestone-target').textContent = targetText;

    // Reward info
    document.getElementById('milestone-reward').textContent = `+${achievement.reward} ₪ to your bank`;

    // Status
    const statusText = isUnlocked ? '✅ Unlocked' : '🔒 Locked';
    document.getElementById('milestone-status').textContent = statusText;

    modal.style.display = 'block';
}

// Close milestone modal
document.addEventListener('DOMContentLoaded', () => {
    const closeMilestoneBtn = document.getElementById('close-milestone');
    if (closeMilestoneBtn) {
        closeMilestoneBtn.addEventListener('click', () => {
            document.getElementById('milestone-modal').style.display = 'none';
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const milestoneModal = document.getElementById('milestone-modal');
        const unlockedModal = document.getElementById('unlocked-milestones-modal');
        
        if (event.target === milestoneModal) {
            milestoneModal.style.display = 'none';
        }
        if (event.target === unlockedModal) {
            unlockedModal.style.display = 'none';
        }
    });
});

// ---------- Habit notes system ----------
function openHabitNotes(date) {
    const modal = document.getElementById('habit-notes-modal');
    const noteDisplay = document.getElementById('note-date-display');
    const noteInput = document.getElementById('habit-note-input');
    
    const notes = JSON.parse(localStorage.getItem('habitNotes') || '{}');
    noteDisplay.textContent = formatDate(date);
    noteInput.value = notes[date] || '';
    noteInput.dataset.date = date;
    
    modal.style.display = 'block';
}

function saveHabitNote() {
    const noteInput = document.getElementById('habit-note-input');
    const date = noteInput.dataset.date;
    const notes = JSON.parse(localStorage.getItem('habitNotes') || '{}');
    notes[date] = noteInput.value;
    localStorage.setItem('habitNotes', JSON.stringify(notes));
    document.getElementById('habit-notes-modal').style.display = 'none';
    showNotification('Saved', 'Note saved successfully');
}

// ---------- Undo withdrawal ----------
function showRecentWithdrawals() {
    const withdrawals = JSON.parse(localStorage.getItem('withdrawals') || '[]');
    const modal = document.getElementById('recent-withdrawals-modal');
    const list = document.getElementById('withdrawals-list');
    
    if (withdrawals.length === 0) {
        list.innerHTML = '<p style="color: #888;">No withdrawals yet</p>';
    } else {
        list.innerHTML = withdrawals.map((w, idx) => `
            <div style="background: rgba(255, 165, 0, 0.1); border: 1px solid rgba(255, 165, 0, 0.2); padding: 12px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                <span>${formatDate(w.date)} - Withdrew ₪${w.amount}</span>
                <button onclick="undoWithdrawal(${idx})" style="background: #00ffc8; color: #0a0e27; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px;">Undo</button>
            </div>
        `).join('');
    }
    
    modal.style.display = 'block';
}

function undoWithdrawal(index) {
    const withdrawals = JSON.parse(localStorage.getItem('withdrawals') || '[]');
    if (index >= 0 && index < withdrawals.length) {
        const withdrawal = withdrawals[index];
        const currentTotal = Number(localStorage.getItem('xpL') || 0);
        localStorage.setItem('xpL', String(currentTotal + withdrawal.amount));
        withdrawals.splice(index, 1);
        localStorage.setItem('withdrawals', JSON.stringify(withdrawals));
        refreshXP();
        showNotification('Withdrawal Undone', `Added back ₪${withdrawal.amount}`);
        showRecentWithdrawals(); // Refresh the list
    }
}

// ---------- Completion time tracking ----------
function trackCompletionTime(habitIndex) {
    const completionTimes = JSON.parse(localStorage.getItem('completionTimes') || '[]');
    const hour = new Date().getHours();
    completionTimes.push({ habit: habitIndex, hour, date: new Date().toDateString() });
    localStorage.setItem('completionTimes', JSON.stringify(completionTimes));
}

// ---------- Optional manual last-day save ----------
function saveLastDayXP() {
    const todayXP = Number(localStorage.getItem('todayXP') || 0);
    localStorage.setItem('lastDayXP', String(todayXP));
    refreshXP();
    showNotification("Saved", "Today's net XP saved as last day XP.");
}

// ---------- Withdraw money ----------
function withdrawMoney() {
    const currentTotal = Number(localStorage.getItem('xpL') || 0);
    
    if (currentTotal <= 0) {
        showNotification("No Money Available", "You have no money available to withdraw!");
        return;
    }
    
    // Show modal
    const modal = document.getElementById('withdraw-modal');
    const maxText = document.getElementById('withdraw-max-text');
    const input = document.getElementById('withdraw-amount');
    const confirmBtn = document.getElementById('withdraw-confirm');
    const cancelBtn = document.getElementById('withdraw-cancel');
    
    maxText.textContent = `Enter amount to withdraw (Max: ₪${currentTotal}):`;
    input.value = '';
    input.max = currentTotal;
    modal.style.display = 'block';
    
    // Focus input
    setTimeout(() => input.focus(), 100);
    
    const handleConfirm = () => {
        const amount = input.value.trim();
        const numAmount = Number(amount);
        
        if (isNaN(numAmount) || numAmount <= 0) {
            showNotification("Invalid Amount", "Please enter a valid positive number.");
            return;
        }
        
        if (numAmount > currentTotal) {
            showNotification("Insufficient Funds", `Cannot withdraw more than ₪${currentTotal}.`);
            return;
        }
        
        const newTotal = currentTotal - numAmount;
        localStorage.setItem('xpL', String(newTotal));
        
        // Save withdrawal
        const withdrawals = JSON.parse(localStorage.getItem('withdrawals') || '[]');
        withdrawals.push({
            date: new Date().toISOString(),
            amount: numAmount
        });
        localStorage.setItem('withdrawals', JSON.stringify(withdrawals));
        
        // Check for withdrawal-related achievements
        checkAndUnlockAchievements();
        
        refreshXP();
        showNotification("Withdrawal Successful", `Successfully withdrew ₪${numAmount}! Remaining balance: ₪${newTotal}`);
        
        modal.style.display = 'none';
        cleanup();
    };
    
    const handleCancel = () => {
        modal.style.display = 'none';
        cleanup();
    };
    
    const handleKeydown = (e) => {
        if (e.key === 'Enter') {
            handleConfirm();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };
    
    const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        input.removeEventListener('keydown', handleKeydown);
        document.removeEventListener('keydown', handleKeydown);
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    input.addEventListener('keydown', handleKeydown);
    document.addEventListener('keydown', handleKeydown);
}

// ---------- Show notification modal ----------
function showNotification(title, message) {
    const modal = document.getElementById('notification-modal');
    const titleEl = document.getElementById('notification-title');
    const messageEl = document.getElementById('notification-message');
    const okBtn = document.getElementById('notification-ok');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.style.display = 'block';
    
    const handleOk = () => {
        modal.style.display = 'none';
        okBtn.removeEventListener('click', handleOk);
        document.removeEventListener('keydown', handleOk);
    };
    
    const handleKeydown = (e) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
            handleOk();
        }
    };
    
    okBtn.addEventListener('click', handleOk);
    document.addEventListener('keydown', handleKeydown);
}

// ---------- Notification and reminders ----------
// --- Per-habit notification helpers ---
function getPerHabitNotificationSettings() {
    return JSON.parse(localStorage.getItem('perHabitNotifications') || '{}');
}

function isHabitNotificationEnabled(habitId) {
    const settings = getPerHabitNotificationSettings();
    return !!settings[habitId];
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    }
}

function requestNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            return Promise.resolve();
        } else if (Notification.permission !== 'denied') {
            return Notification.requestPermission();
        }
    }
    return Promise.resolve();
}

function enableNotifications(timeStr) {
    const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    settings.enabled = true;
    settings.time = timeStr;
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    
    requestNotificationPermission().then(() => {
        scheduleNotification(timeStr);
        showNotification('Notifications Enabled', `You will receive daily reminders at ${timeStr}`);
        renderHabits();
    });
}

function disableNotifications() {
    const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    settings.enabled = false;
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    showNotification('Notifications Disabled', 'Daily reminders have been turned off');
}

function scheduleNotification(timeStr) {
    // Schedule daily notification using service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_NOTIFICATION',
            time: timeStr
        });
    }
}

function sendDailyReminder() {
    if ('Notification' in window && Notification.permission === 'granted') {
        const habits = getHabits();
        const completed = JSON.parse(localStorage.getItem('completedHabits') || '[]');
        const perHabitSettings = getPerHabitNotificationSettings();
        let notifiedAny = false;
        habits.forEach(habit => {
            if (perHabitSettings[habit.id]) {
                const isCompleted = completed.includes(habit.id);
                const title = `⏰ ${habit.icon} ${habit.name}`;
                const options = {
                    body: isCompleted ? 'Completed today! 🎉' : 'Don\'t forget this habit today!',
                    icon: 'icon-192.png',
                    badge: 'icon-192.png',
                    tag: 'habit-' + habit.id,
                    requireInteraction: true
                };
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'SEND_NOTIFICATION',
                        title: title,
                        options: options
                    });
                } else {
                    new Notification(title, options);
                }
                notifiedAny = true;
            }
        });
        // Fallback: if no per-habit notifications enabled, send general reminder
        if (!notifiedAny) {
            const remaining = habits.length - completed.length;
            const title = '⏰ Habit Reminder';
            const options = {
                body: remaining > 0 ? `You have ${remaining} habit(s) to complete today!` : 'All habits completed today! Great job!',
                icon: 'icon-192.png',
                badge: 'icon-192.png',
                tag: 'daily-reminder',
                requireInteraction: true
            };
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SEND_NOTIFICATION',
                    title: title,
                    options: options
                });
            } else {
                new Notification(title, options);
            }
        }
    }
}

// ---------- Streak Freeze Feature ----------
// Allows user to freeze their streak for 1 day using 3₪
function freezeStreak() {
    let streak = Number(localStorage.getItem('streak') || 0);
    let xpL = Number(localStorage.getItem('xpL') || 0);
    const freezeKey = 'streakFreezeDate';
    const today = new Date().toDateString();
    const lastFreeze = localStorage.getItem(freezeKey);

    if (lastFreeze === today) {
        showNotification('Already Used', 'You have already used a streak freeze today.');
        return;
    }
    if (xpL < 3) {
        showNotification('Not Enough ₪', 'You need at least 3₪ to freeze your streak.');
        return;
    }
    // Deduct 3₪
    xpL -= 3;
    localStorage.setItem('xpL', String(xpL));
    // Mark freeze for today
    localStorage.setItem(freezeKey, today);
    // Prevent streak reset for today (handled in handleNewDay)
    showNotification('Streak Frozen!', 'Your streak is protected for today. 3₪ deducted.');
    refreshXP();
}

// ---------- Start ----------
document.addEventListener('DOMContentLoaded', () => {
    initializeStorage();
    handleNewDay();
    // Render habits first
    renderHabits();
    // Freeze streak button
    const freezeBtn = document.getElementById('freeze-streak-btn');
    if (freezeBtn) {
        freezeBtn.addEventListener('click', freezeStreak);
    }
    currentInstagramMinutes = Number(localStorage.getItem('instagramMinutes') || 135);

    refreshXP();
    bindBarDrag();
    
    // Setup new modal listeners
    const notificationOk = document.getElementById('notification-ok');
    if (notificationOk) {
        notificationOk.addEventListener('click', () => {
            document.getElementById('notification-modal').style.display = 'none';
        });
    }
    
    const closeWithdrawal = document.getElementById('close-withdrawals');
    if (closeWithdrawal) {
        closeWithdrawal.addEventListener('click', () => {
            document.getElementById('recent-withdrawals-modal').style.display = 'none';
        });
    }
    
    const saveNote = document.getElementById('save-note');
    if (saveNote) {
        saveNote.addEventListener('click', saveHabitNote);
    }
    
    const closeNote = document.getElementById('close-note');
    if (closeNote) {
        closeNote.addEventListener('click', () => {
            document.getElementById('habit-notes-modal').style.display = 'none';
        });
    }
    
    // Service worker registration
    registerServiceWorker();
});