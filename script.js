const { createApp, ref, computed, watch, onMounted } = Vue;

createApp({
    setup() {
        const INTERVALS = [0, 1, 2, 4, 7, 15]; 
        const STORAGE_KEY_DATA = 'ebbinghaus_pro_data_v11'; 
        const STORAGE_KEY_CATS = 'ebbinghaus_pro_cats_v11';

        const tasks = ref([]);
        const categories = ref(['英语', '数学', '语文', '科学', '编程']);
        const newCategoryName = ref('');
        
        const todayStr = new Date().toISOString().split('T')[0];
        const currentYear = ref(new Date().getFullYear());
        const currentMonth = ref(new Date().getMonth());
        const selectedDate = ref(todayStr);

        const showTaskModal = ref(false);
        const ratingModal = ref({ show: false, taskItem: null, comment: '' });
        const detailModal = ref({ show: false, task: null, editing: { title: '', description: '' } });
        const postponeModal = ref({ show: false, taskItem: null });
        const subjectOverviewModal = ref({ show: false, subject: '', month: new Date().getMonth(), year: new Date().getFullYear() });
        
        // 专注番茄钟状态
        const pomodoroModal = ref({
            show: false,
            taskItem: null, 
            duration: 25,   
            timeLeft: 25 * 60, 
            isRunning: false,
            isPaused: false,
            intervalId: null
        });

        const newTask = ref({
            title: '',
            category: '', 
            description: '',
            type: 'ebbinghaus', 
            startDate: todayStr,
            weekendWeeks: 7
        });

        onMounted(() => {
            const savedData = localStorage.getItem(STORAGE_KEY_DATA);
            if (savedData) {
                try { 
                    tasks.value = JSON.parse(savedData); 
                    // 数据迁移
                    tasks.value.forEach(t => {
                        if (t.pomodoroCount === undefined) t.pomodoroCount = 0;
                        if (t.totalTimeSpent === undefined) t.totalTimeSpent = 0;
                    });
                } catch(e) { console.error(e); }
            }
            const savedCats = localStorage.getItem(STORAGE_KEY_CATS);
            if (savedCats) {
                try { categories.value = JSON.parse(savedCats); } catch(e) { console.error(e); }
            }
            if (categories.value.length > 0) newTask.value.category = categories.value[0];
        });

        watch(tasks, (val) => localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(val)), { deep: true });
        watch(categories, (val) => localStorage.setItem(STORAGE_KEY_CATS, JSON.stringify(val)), { deep: true });

        // --- 计算属性 ---
        const subjectStats = computed(() => {
            const stats = [];
            categories.value.forEach(cat => {
                let due = 0;
                let done = 0;
                tasks.value.forEach(t => {
                    if (t.category === cat) {
                        t.schedule.forEach(n => {
                            if (n.date <= todayStr) { 
                                due++;
                                if (n.completed) done++;
                            }
                        });
                    }
                });
                stats.push({ name: cat, rate: due === 0 ? 0 : Math.round((done / due) * 100) });
            });
            return stats;
        });

        const subjectMonthTasks = computed(() => {
            const targetSubject = subjectOverviewModal.value.subject;
            const targetMonth = subjectOverviewModal.value.month;
            const targetYear = subjectOverviewModal.value.year;
            const result = [];
            tasks.value.forEach(task => {
                if (task.category !== targetSubject) return;
                const monthNodes = task.schedule.filter(node => {
                    const d = new Date(node.date);
                    return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
                });
                if (monthNodes.length > 0) {
                    const formattedNodes = monthNodes.map(node => ({
                        date: node.date,
                        status: node.completed ? 'done' : (node.date < todayStr ? 'overdue' : 'pending')
                    })).sort((a, b) => a.date.localeCompare(b.date));
                    result.push({ taskId: task.id, title: task.title, taskType: task.type, nodes: formattedNodes });
                }
            });
            return result;
        });

        const calendarDays = computed(() => {
            const year = currentYear.value;
            const month = currentMonth.value;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const days = [];
            for (let d = 1; d <= daysInMonth; d++) {
                const dateObj = new Date(year, month, d);
                const fullDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
                const dayTasks = [];
                const dayCats = new Set();
                tasks.value.forEach(task => {
                    const match = task.schedule.find(s => s.date === fullDate);
                    if (match) {
                        dayTasks.push({ ...match, parentId: task.id, title: task.title, category: task.category, taskType: task.type });
                        if (!match.completed) dayCats.add(task.category);
                    }
                });
                dayTasks.forEach(t => dayCats.add(t.category));
                days.push({ day: d, fullDate: fullDate, isToday: fullDate === todayStr, tasks: dayTasks, pendingCount: dayTasks.filter(t => !t.completed).length, uniqueCats: Array.from(dayCats).slice(0, 5) });
            }
            return days;
        });

        const startDayOfWeek = computed(() => new Date(currentYear.value, currentMonth.value, 1).getDay());

        const currentDayTasks = computed(() => {
            const result = [];
            tasks.value.forEach(task => {
                const match = task.schedule.find(s => s.date === selectedDate.value);
                if (match) {
                    result.push({
                        taskId: task.id,
                        title: task.title,
                        description: task.description,
                        category: task.category,
                        taskType: task.type, 
                        interval: match.interval, 
                        date: match.date,
                        pomodoroCount: task.pomodoroCount || 0, // 暴露给列表
                        totalTimeSpent: task.totalTimeSpent || 0,
                        ...match 
                    });
                }
            });
            return result.sort((a, b) => Number(a.completed) - Number(b.completed));
        });
        
        const dailyProgress = computed(() => {
            const total = currentDayTasks.value.length;
            if (total === 0) return 0;
            const done = currentDayTasks.value.filter(t => t.completed).length;
            return Math.round((done / total) * 100);
        });

        const stats = computed(() => {
            let sss = 0, ss = 0, s = 0, totalDone = 0;
            tasks.value.forEach(task => {
                task.schedule.forEach(node => {
                    if (node.completed) {
                        totalDone++;
                        if (node.quality === 'SSS') sss++;
                        else if (node.quality === 'SS') ss++;
                        else if (node.quality === 'S') s++;
                    }
                });
            });
            const safeDiv = (num) => totalDone === 0 ? 0 : (num / totalDone * 100);
            return { totalCompleted: totalDone, sssCount: sss, ssCount: ss, sCount: s, sssRate: safeDiv(sss), ssRate: safeDiv(ss), sRate: safeDiv(s) };
        });

        // --- 番茄钟逻辑 ---
        const openPomodoroModal = (item) => {
            pomodoroModal.value.taskItem = item; 
            pomodoroModal.value.duration = 25;   
            pomodoroModal.value.timeLeft = 25 * 60;
            pomodoroModal.value.isRunning = false;
            pomodoroModal.value.isPaused = false;
            pomodoroModal.value.show = true;
        };

        const adjustPomodoroTime = (delta) => {
            let newTime = pomodoroModal.value.duration + delta;
            if (newTime < 5) newTime = 5;
            if (newTime > 120) newTime = 120;
            pomodoroModal.value.duration = newTime;
            pomodoroModal.value.timeLeft = newTime * 60;
        };

        const startPomodoro = () => {
            pomodoroModal.value.isRunning = true;
            pomodoroModal.value.intervalId = setInterval(() => {
                if (!pomodoroModal.value.isPaused) {
                    pomodoroModal.value.timeLeft--;
                    if (pomodoroModal.value.timeLeft <= 0) {
                        finishPomodoro();
                    }
                }
            }, 1000);
        };

        const togglePomodoroPause = () => {
            pomodoroModal.value.isPaused = !pomodoroModal.value.isPaused;
        };

        const stopPomodoro = () => {
            if (confirm('确定要放弃本次专注吗？不会记录数据。')) {
                clearInterval(pomodoroModal.value.intervalId);
                pomodoroModal.value.show = false;
            }
        };

        const closePomodoroModal = () => {
            pomodoroModal.value.show = false;
        };

        const finishPomodoro = () => {
            clearInterval(pomodoroModal.value.intervalId);
            const task = tasks.value.find(t => t.id === pomodoroModal.value.taskItem.taskId);
            if (task) {
                if (!task.pomodoroCount) task.pomodoroCount = 0;
                if (!task.totalTimeSpent) task.totalTimeSpent = 0;
                task.pomodoroCount += 1;
                task.totalTimeSpent += pomodoroModal.value.duration;
                alert(`太棒了！完成了 ${pomodoroModal.value.duration} 分钟的专注！`);
            }
            pomodoroModal.value.show = false;
        };

        const formatTime = (seconds) => {
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };

        // --- 其他原有方法 ---
        const getCategoryColor = (cat) => { const colors = { '英语': 'bg-blue-400', '数学': 'bg-indigo-400', '语文': 'bg-red-400', '科学': 'bg-emerald-400', '编程': 'bg-slate-600' }; return colors[cat] || 'bg-slate-400'; };
        const getCategoryColorText = (cat) => { const colors = { '英语': 'text-blue-600 border-blue-200', '数学': 'text-indigo-600 border-indigo-200', '语文': 'text-red-600 border-red-200', '科学': 'text-emerald-600 border-emerald-200', '编程': 'text-slate-600 border-slate-200' }; return colors[cat] || 'text-slate-500 border-slate-200'; };
        const addCategory = () => { const val = newCategoryName.value.trim(); if (val && !categories.value.includes(val)) { categories.value.push(val); newCategoryName.value = ''; if (categories.value.length === 1) newTask.value.category = val; } };
        const removeCategory = (index) => { if(confirm('确定要删除这个科目吗？')) { const removed = categories.value[index]; categories.value.splice(index, 1); if (newTask.value.category === removed) newTask.value.category = categories.value[0] || ''; } };
        const addDays = (dateStr, days) => { const result = new Date(dateStr); result.setDate(result.getDate() + days); return result.toISOString().split('T')[0]; };
        const changeMonth = (delta) => { let m = currentMonth.value + delta; let y = currentYear.value; if (m > 11) { m = 0; y++; } else if (m < 0) { m = 11; y--; } currentMonth.value = m; currentYear.value = y; };
        const selectDate = (date) => selectedDate.value = date;
        const resetToToday = () => { selectedDate.value = todayStr; currentYear.value = new Date().getFullYear(); currentMonth.value = new Date().getMonth(); };
        const isWeekend = (dateStr) => { const day = new Date(dateStr).getDay(); return day === 0 || day === 5 || day === 6; };
        const handleDateChange = () => { if (!isWeekend(newTask.value.startDate) && newTask.value.type === 'weekend') { newTask.value.type = 'ebbinghaus'; } };
        const openAddTaskModal = () => { newTask.value.startDate = selectedDate.value; if (!isWeekend(selectedDate.value)) { newTask.value.type = 'ebbinghaus'; } showTaskModal.value = true; };
        
        const confirmAddTask = () => {
            if (!newTask.value.title) return alert("请填写任务内容");
            if (!newTask.value.category) return alert("请先添加并选择科目");
            let schedule = [];
            if (newTask.value.type === 'ebbinghaus') {
                schedule = INTERVALS.map((intervalDays, index) => ({ stage: index, interval: intervalDays, date: addDays(newTask.value.startDate, intervalDays), completed: false, quality: null, comment: '' }));
            } else if (newTask.value.type === 'onetime') {
                schedule = [{ stage: 0, interval: 0, date: newTask.value.startDate, completed: false, quality: null, comment: '' }];
            } else if (newTask.value.type === 'weekend') {
                const weeks = newTask.value.weekendWeeks || 1;
                for (let i = 0; i < weeks; i++) { schedule.push({ stage: i, interval: i * 7, date: addDays(newTask.value.startDate, i * 7), completed: false, quality: null, comment: '' }); }
            }
            tasks.value.push({ id: Date.now(), title: newTask.value.title, description: newTask.value.description, category: newTask.value.category, startDate: newTask.value.startDate, type: newTask.value.type, schedule: schedule, pomodoroCount: 0, totalTimeSpent: 0 });
            showTaskModal.value = false; newTask.value.title = ''; newTask.value.description = '';
        };

        const openRateModal = (item) => {
            if (item.date > todayStr) { alert("不要急于求成哦！请专注于今天的任务，脚踏实地，一步一个脚印！"); return; }
            ratingModal.value.taskItem = item; ratingModal.value.comment = ''; ratingModal.value.show = true;
        };
        const confirmRating = (quality) => {
            const { taskId, stage } = ratingModal.value.taskItem; const task = tasks.value.find(t => t.id === taskId);
            if (task) { const node = task.schedule.find(s => s.stage === stage); if (node) { node.completed = true; node.quality = quality; node.comment = ratingModal.value.comment; } }
            ratingModal.value.show = false; ratingModal.value.taskItem = null;
        };
        const openTaskDetail = (taskId) => {
            const task = tasks.value.find(t => t.id === taskId);
            if (task) { detailModal.value.task = task; detailModal.value.editing = { title: task.title, description: task.description || '' }; detailModal.value.show = true; }
        };
        const saveTaskDetails = () => { const task = detailModal.value.task; if (task) { task.title = detailModal.value.editing.title; task.description = detailModal.value.editing.description; detailModal.value.show = false; } };
        const deleteTask = (taskId) => { if (confirm("确定要彻底删除这个任务吗？此操作无法撤销。")) { tasks.value = tasks.value.filter(t => t.id !== taskId); detailModal.value.show = false; } };
        const openPostponeModal = (item) => { postponeModal.value.taskItem = item; postponeModal.value.show = true; };
        const confirmPostpone = (days) => {
            const { taskId, stage } = postponeModal.value.taskItem; const task = tasks.value.find(t => t.id === taskId);
            if (task) { const currentIndex = task.schedule.findIndex(s => s.stage === stage); if (currentIndex !== -1) { for (let i = currentIndex; i < task.schedule.length; i++) { const node = task.schedule[i]; node.date = addDays(node.date, days); } } }
            postponeModal.value.show = false; postponeModal.value.taskItem = null;
        };
        const openSubjectOverview = (subjectName) => { subjectOverviewModal.value.subject = subjectName; subjectOverviewModal.value.month = currentMonth.value; subjectOverviewModal.value.year = currentYear.value; subjectOverviewModal.value.show = true; };
        const changeOverviewMonth = (delta) => { let m = subjectOverviewModal.value.month + delta; let y = subjectOverviewModal.value.year; if (m > 11) { m = 0; y++; } else if (m < 0) { m = 11; y--; } subjectOverviewModal.value.month = m; subjectOverviewModal.value.year = y; };
        const formatDateCN = (dateStr) => { const d = new Date(dateStr); return `${d.getMonth() + 1}月${d.getDate()}日`; };
        const getWeekDay = (dateStr) => { const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']; return days[new Date(dateStr).getDay()]; };
        const getWeekDayCN = (dateStr) => { const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']; return days[new Date(dateStr).getDay()]; };
        const getRateColor = (rate) => { if (rate >= 80) return 'text-emerald-400'; if (rate >= 60) return 'text-yellow-400'; return 'text-red-400'; };
        const getRateBarColor = (rate) => { if (rate >= 80) return 'bg-emerald-400'; if (rate >= 60) return 'bg-yellow-400'; return 'bg-red-400'; };

        return {
            currentYear, currentMonth, selectedDate, todayStr,
            showTaskModal, ratingModal, detailModal, postponeModal, subjectOverviewModal, pomodoroModal, 
            newTask, stats, subjectStats, categories, newCategoryName,
            calendarDays, startDayOfWeek, currentDayTasks, dailyProgress, subjectMonthTasks,
            changeMonth, selectDate, resetToToday,
            openAddTaskModal, confirmAddTask, openRateModal, confirmRating, 
            openTaskDetail, saveTaskDetails, deleteTask, openPostponeModal, confirmPostpone,
            openSubjectOverview, changeOverviewMonth,
            addCategory, removeCategory,
            formatDateCN, getWeekDay, getWeekDayCN, getRateColor, getRateBarColor, getCategoryColor, getCategoryColorText,
            isWeekend, handleDateChange,
            openPomodoroModal, adjustPomodoroTime, startPomodoro, togglePomodoroPause, stopPomodoro, closePomodoroModal, formatTime
        };
    }
}).mount('#app');