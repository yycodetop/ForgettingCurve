import { ref, computed, watch } from 'vue';

export function useTasks(API_BASE) {
    const tasks = ref([]);
    const categories = ref(['英语', '数学', '编程', '语文', '科学']);
    const isDataLoaded = ref(false);
    
    const currentYear = ref(new Date().getFullYear());
    const currentMonth = ref(new Date().getMonth());
    const todayStr = new Date().toISOString().split('T')[0];
    const selectedDate = ref(todayStr);

    const showTaskModal = ref(false);
    const ratingModal = ref({ show: false, taskItem: null });
    
    const newTask = ref({ title: '', category: '', type: 'ebbinghaus', startDate: todayStr });
    const INTERVALS = [0, 1, 2, 4, 7, 15];

    // --- 数据加载与保存 (保持不变) ---
    const loadTasks = async () => {
        try {
            const res = await fetch(`${API_BASE}/data`);
            const data = await res.json();
            if (data.tasks) tasks.value = data.tasks;
            if (data.categories) categories.value = data.categories;
            isDataLoaded.value = true;
        } catch (e) { console.error(e); }
    };

    const saveTasks = async () => {
        if (!isDataLoaded.value) return;
        await fetch(`${API_BASE}/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: tasks.value, categories: categories.value })
        });
    };
    watch([tasks, categories], saveTasks, { deep: true });

    // --- 日历核心逻辑 (保持不变) ---
    const calendarDays = computed(() => {
        const year = currentYear.value;
        const month = currentMonth.value;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const fullDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
            
            const dayTasks = [];
            tasks.value.forEach(task => {
                const match = task.schedule.find(s => s.date === fullDate);
                if (match) dayTasks.push({ ...match, taskId: task.id, title: task.title, category: task.category });
            });
            
            days.push({
                day: d,
                fullDate: fullDate,
                isToday: fullDate === todayStr,
                tasks: dayTasks
            });
        }
        return days;
    });

    const startDayOfWeek = computed(() => new Date(currentYear.value, currentMonth.value, 1).getDay());

    const currentDayTasks = computed(() => {
        const result = [];
        tasks.value.forEach(task => {
            const match = task.schedule.find(s => s.date === selectedDate.value);
            if (match) result.push({ taskId: task.id, title: task.title, category: task.category, interval: match.interval, completed: match.completed, quality: match.quality, scheduleItem: match });
        });
        return result.sort((a, b) => Number(a.completed) - Number(b.completed));
    });

    const dailyProgress = computed(() => {
        const total = currentDayTasks.value.length;
        if (total === 0) return 0;
        return Math.round((currentDayTasks.value.filter(t => t.completed).length / total) * 100);
    });

    // --- Actions ---
    const addDays = (d, n) => { const date = new Date(d); date.setDate(date.getDate() + n); return date.toISOString().split('T')[0]; };

    const confirmAddTask = () => {
        if (!newTask.value.title || !newTask.value.category) return alert("请填写完整");
        const schedule = newTask.value.type === 'ebbinghaus' 
            ? INTERVALS.map((int, i) => ({ stage: i, interval: int, date: addDays(newTask.value.startDate, int), completed: false }))
            : [{ stage: 0, interval: 0, date: newTask.value.startDate, completed: false }]; // 简化演示
            
        tasks.value.push({ id: Date.now(), ...newTask.value, schedule });
        showTaskModal.value = false;
        newTask.value.title = '';
    };

    const confirmRating = (q) => {
        const { scheduleItem } = ratingModal.value.taskItem;
        if (scheduleItem) { scheduleItem.completed = true; scheduleItem.quality = q; }
        ratingModal.value.show = false;
    };

    // --- UI Helper ---
    const getCategoryColor = (cat) => {
        const map = { 
            '英语': 'bg-blue-500', 
            '数学': 'bg-red-500', 
            '编程': 'bg-slate-700',
            '语文': 'bg-orange-400',
            '科学': 'bg-emerald-500'
        };
        return map[cat] || 'bg-indigo-500';
    };

    return {
        tasks, categories, currentYear, currentMonth, selectedDate, calendarDays, startDayOfWeek,
        currentDayTasks, dailyProgress, showTaskModal, ratingModal, newTask,
        loadTasks, confirmAddTask, confirmRating,
        changeMonth: (d) => { 
            let m = currentMonth.value + d; 
            if(m>11){m=0;currentYear.value++;} else if(m<0){m=11;currentYear.value--;} 
            currentMonth.value = m; 
        },
        selectDate: (d) => selectedDate.value = d,
        openAddTaskModal: () => showTaskModal.value = true,
        openRateModal: (item) => { ratingModal.value.taskItem = item; ratingModal.value.show = true; },
        formatDateCN: (d) => `${new Date(d).getMonth()+1}月${new Date(d).getDate()}日`,
        getWeekDayCN: (d) => ['周日','周一','周二','周三','周四','周五','周六'][new Date(d).getDay()],
        getCategoryColor
    };
}