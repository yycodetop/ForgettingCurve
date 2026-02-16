export default {
    props: ['calendarDays', 'currentDayTasks', 'selectedDate', 'startDayOfWeek'], // 接收父组件数据
    emits: ['selectDate', 'openPomodoro', 'openRate'],
    template: `
    <div class="h-full flex gap-6 animate-fade-in">
        <div class="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-y-auto p-8 custom-scrollbar">
            <div class="grid grid-cols-7 gap-4">
                <div v-for="day in ['日','一','二','三','四','五','六']" class="text-center text-sm font-bold text-slate-300 py-2">{{ day }}</div>
                <div v-for="n in startDayOfWeek" :key="'empty-'+n" class="h-32"></div>
                <div v-for="dayObj in calendarDays" :key="dayObj.fullDate" 
                     @click="$emit('selectDate', dayObj.fullDate)"
                     class="h-32 rounded-2xl border border-slate-100 p-3 transition-all cursor-pointer flex flex-col hover:shadow-md hover:border-indigo-200"
                     :class="{'ring-2 ring-indigo-500 ring-offset-2 z-10 bg-indigo-50': dayObj.fullDate === selectedDate, 'bg-white': dayObj.fullDate !== selectedDate}">
                    <span class="text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full" 
                          :class="dayObj.isToday ? 'bg-indigo-600 text-white' : 'text-slate-500'">{{ dayObj.day }}</span>
                    <div class="mt-2 flex flex-wrap content-start gap-1.5 overflow-hidden">
                        <div v-for="t in dayObj.tasks.slice(0, 12)" :key="t.taskId + t.date" class="w-2 h-2 rounded-full shadow-sm" :class="[getCategoryColor(t.category), t.completed ? 'opacity-30' : 'opacity-100']"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="w-96 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div class="p-6 border-b border-slate-50 bg-slate-50/50">
                <h3 class="font-bold text-xl text-slate-800">任务列表</h3>
                <p class="text-xs text-slate-400 mt-1">{{ currentDayTasks.length }} 个任务</p>
            </div>
            <div class="flex-1 overflow-y-auto p-4 space-y-3">
                <div v-for="item in currentDayTasks" :key="item.taskId" class="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded text-white" :class="getCategoryColor(item.category)">{{ item.category }}</span>
                        <button @click="$emit('openPomodoro', item)" class="text-slate-300 hover:text-indigo-500">⏱</button>
                    </div>
                    <h4 class="font-bold text-slate-700 mb-2">{{ item.title }}</h4>
                    <div class="flex justify-between items-center">
                        <span class="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">Day {{ item.interval }}</span>
                        <button v-if="!item.completed" @click="$emit('openRate', item)" class="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold">打卡</button>
                        <span v-else class="text-xs font-bold text-emerald-500">✓ 完成</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    methods: {
        getCategoryColor(cat) {
            const map = { '英语': 'bg-blue-500', '数学': 'bg-red-500', '编程': 'bg-slate-700' };
            return map[cat] || 'bg-indigo-500';
        }
    }
}