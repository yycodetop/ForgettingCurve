/**
 * js/apps/DashboardApp.js
 * 综合概览 - 完整版
 * 集成：概念知识库快捷入口(含快速新建)、任务分布交互、任务列表高级操作(延期/防作弊)
 */
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';

export default {
    props: ['calendarDays', 'currentDayTasks', 'selectedDate', 'startDayOfWeek', 'categories', 'chartData', 'allTasks'], 
    emits: ['selectDate', 'openPomodoro', 'openRate', 'editTask', 'deleteTask', 'addCategory', 'deleteCategory', 'postponeTask', 'switchApp', 'quickAddConcept'], 
    template: `
    <div class="h-full flex flex-col gap-6 animate-fade-in pb-4 relative">
        
        <div class="flex gap-6 h-64 shrink-0">
            
            <div class="w-1/4 bg-white rounded-3xl shadow-sm border border-slate-100 p-4 relative flex flex-col overflow-hidden group">
                <div class="flex justify-between items-center mb-2 px-2 shrink-0">
                    <h3 class="font-bold text-slate-700"><i class="fas fa-chart-pie mr-2 text-indigo-500"></i>任务分布</h3>
                    <button @click="showCategoryModal=true" class="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-500 transition"><i class="fas fa-cog mr-1"></i>分类</button>
                </div>
                <div class="flex-1 w-full h-full relative min-h-0 cursor-pointer">
                    <div ref="pieChartRef" class="absolute inset-0"></div>
                    <div class="absolute bottom-2 right-2 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-white/80 px-2 py-1 rounded backdrop-blur">
                        <i class="fas fa-hand-pointer"></i> 点击查看详情
                    </div>
                </div>
            </div>

            <div class="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 p-5 flex flex-col">
                <h3 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <i class="fas fa-brain text-rose-500"></i> 概念知识库
                    <span class="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-400">Concept Studio</span>
                </h3>
                <div class="flex gap-4 h-full">
                    <div class="flex-1 relative group">
                        <button @click="$emit('switchApp', 'cloze')" class="w-full h-full bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-2xl p-4 text-left transition relative overflow-hidden">
                            <div class="absolute right-0 bottom-0 text-6xl text-amber-200 opacity-20 transform translate-x-2 translate-y-2 group-hover:scale-110 transition"><i class="fas fa-highlighter"></i></div>
                            <div class="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center text-lg mb-3 shadow-md shadow-amber-200"><i class="fas fa-highlighter"></i></div>
                            <div class="font-bold text-slate-800">挖空填空</div>
                            <div class="text-xs text-slate-500 mt-1">记忆定义与关键词</div>
                        </button>
                        <button @click.stop="$emit('quickAddConcept', 'cloze')" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white text-amber-500 hover:text-amber-600 hover:bg-amber-50 shadow-sm border border-amber-100 flex items-center justify-center transition opacity-0 group-hover:opacity-100 z-10 hover:scale-110" title="快速新建">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    
                    <div class="flex-1 relative group">
                        <button @click="$emit('switchApp', 'image')" class="w-full h-full bg-pink-50 hover:bg-pink-100 border border-pink-100 rounded-2xl p-4 text-left transition relative overflow-hidden">
                            <div class="absolute right-0 bottom-0 text-6xl text-pink-200 opacity-20 transform translate-x-2 translate-y-2 group-hover:scale-110 transition"><i class="fas fa-image"></i></div>
                            <div class="w-10 h-10 rounded-lg bg-pink-500 text-white flex items-center justify-center text-lg mb-3 shadow-md shadow-pink-200"><i class="fas fa-image"></i></div>
                            <div class="font-bold text-slate-800">图片遮挡</div>
                            <div class="text-xs text-slate-500 mt-1">地理与生物结构</div>
                        </button>
                         <button @click.stop="$emit('quickAddConcept', 'image')" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white text-pink-500 hover:text-pink-600 hover:bg-pink-50 shadow-sm border border-pink-100 flex items-center justify-center transition opacity-0 group-hover:opacity-100 z-10 hover:scale-110" title="快速新建"><i class="fas fa-plus"></i></button>
                    </div>

                    <div class="flex-1 relative group">
                        <button @click="$emit('switchApp', 'feynman')" class="w-full h-full bg-cyan-50 hover:bg-cyan-100 border border-cyan-100 rounded-2xl p-4 text-left transition relative overflow-hidden">
                            <div class="absolute right-0 bottom-0 text-6xl text-cyan-200 opacity-20 transform translate-x-2 translate-y-2 group-hover:scale-110 transition"><i class="fas fa-chalkboard-teacher"></i></div>
                            <div class="w-10 h-10 rounded-lg bg-cyan-500 text-white flex items-center justify-center text-lg mb-3 shadow-md shadow-cyan-200"><i class="fas fa-chalkboard-teacher"></i></div>
                            <div class="font-bold text-slate-800">费曼自测</div>
                            <div class="text-xs text-slate-500 mt-1">深度理解与复述</div>
                        </button>
                         <button @click.stop="$emit('quickAddConcept', 'feynman')" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white text-cyan-500 hover:text-cyan-600 hover:bg-cyan-50 shadow-sm border border-cyan-100 flex items-center justify-center transition opacity-0 group-hover:opacity-100 z-10 hover:scale-110" title="快速新建"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
            </div>

             <div class="w-40 flex flex-col gap-4 shrink-0">
                 <div class="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 p-5 flex flex-col justify-center items-center">
                    <div class="text-3xl font-black text-slate-700 mb-1 tabular-nums">{{ currentDayTasks.length }}</div>
                    <div class="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">今日任务</div>
                </div>
                 <div class="flex-1 bg-slate-800 rounded-3xl shadow-lg shadow-slate-200 text-white p-5 flex flex-col justify-center items-center">
                    <div class="text-3xl font-black mb-1 tabular-nums">{{ chartData.completionRate }}<span class="text-lg">%</span></div>
                    <div class="text-xs font-bold opacity-60 uppercase tracking-widest text-center">完成率</div>
                </div>
            </div>
        </div>

        <div class="flex-1 flex gap-6 min-h-0">
            <div class="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-y-auto p-6 custom-scrollbar">
                 <div class="grid grid-cols-7 gap-3">
                    <div v-for="day in ['日','一','二','三','四','五','六']" class="text-center text-xs font-bold text-slate-300 py-1">{{ day }}</div>
                    <div v-for="n in startDayOfWeek" :key="'empty-'+n" class="h-24"></div>
                    
                    <div v-for="dayObj in calendarDays" :key="dayObj.fullDate" 
                         @click="$emit('selectDate', dayObj.fullDate)"
                         class="h-28 rounded-xl border border-slate-100 p-2 transition-all cursor-pointer flex flex-col hover:shadow-md hover:border-indigo-200 group relative"
                         :class="{'ring-2 ring-indigo-500 ring-offset-2 z-10 bg-indigo-50': dayObj.fullDate === selectedDate, 'bg-white': dayObj.fullDate !== selectedDate}">
                        
                        <span class="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1" 
                              :class="dayObj.isToday ? 'bg-indigo-600 text-white' : 'text-slate-500'">{{ dayObj.day }}</span>
                        
                        <div class="flex flex-wrap content-start gap-1 overflow-hidden">
                            <div v-for="t in dayObj.tasks.slice(0, 15)" :key="t.taskId + t.date" 
                                 class="w-1.5 h-1.5 shadow-sm transition-all" 
                                 :class="[
                                    getCategoryColor(t.category), 
                                    t.completed ? 'opacity-30' : 'opacity-100',
                                    t.type === 'weekend' ? 'rounded-[1px]' : 'rounded-full' 
                                 ]"
                                 :title="t.title"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="w-80 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div class="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <div>
                        <h3 class="font-bold text-lg text-slate-800">任务列表</h3>
                        <p class="text-[10px] text-slate-400 mt-0.5">{{ selectedDate }}</p>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    <div v-if="currentDayTasks.length === 0" class="h-full flex flex-col items-center justify-center text-slate-300">
                        <i class="fas fa-mug-hot text-3xl mb-3 opacity-50"></i>
                        <p class="text-xs">该日暂无安排</p>
                    </div>
                    <div v-for="item in currentDayTasks" :key="item.taskId" class="bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-all group">
                        <div class="flex justify-between items-start mb-2">
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded text-white" :class="getCategoryColor(item.category)">{{ item.category }}</span>
                            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button @click="$emit('editTask', item)" class="text-slate-300 hover:text-indigo-500 text-xs w-5 h-5 flex items-center justify-center rounded hover:bg-slate-50 transition" title="编辑"><i class="fas fa-pen"></i></button>
                                 <button @click="$emit('deleteTask', item.taskId)" class="text-slate-300 hover:text-red-500 text-xs w-5 h-5 flex items-center justify-center rounded hover:bg-slate-50 transition" title="删除"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                        <div class="flex justify-between items-center mb-2">
                             <h4 class="font-bold text-slate-700 text-sm leading-tight flex items-center gap-2">
                                 <i class="fas fa-circle text-[4px]" :class="item.type === 'weekend' ? 'text-indigo-300 rounded-[1px]' : 'text-slate-300'"></i>
                                 {{ item.title }}
                             </h4>
                             <button @click="$emit('openPomodoro', item)" class="text-slate-300 hover:text-indigo-500 text-xs ml-1"><i class="fas fa-stopwatch"></i></button>
                        </div>
                        <div v-if="item.attachments && item.attachments.length > 0" class="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                            <div v-for="(att, idx) in item.attachments" :key="idx" class="shrink-0 relative group/file">
                                <img v-if="att.type.startsWith('image/')" :src="att.data" class="w-8 h-8 rounded-md object-cover border border-slate-200 cursor-zoom-in hover:border-indigo-300 transition" @click="previewImage(att.data)">
                                <a v-else :href="att.data" :download="att.name" class="w-8 h-8 rounded-md border border-slate-200 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 transition text-xs"><i class="fas fa-paperclip"></i></a>
                            </div>
                        </div>
                        <div class="flex justify-between items-center pt-2 border-t border-slate-50">
                            <span class="text-[10px] text-slate-400 font-mono">{{ item.type === 'weekend' ? 'Weekend' : 'Day ' + item.interval }}</span>
                            
                            <div class="flex gap-2 items-center">
                                <button v-if="!item.completed && item.type === 'ebbinghaus' && item.date >= todayStr" 
                                        @click="handlePostpone(item)" 
                                        class="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-md font-bold hover:bg-amber-100 transition flex items-center gap-1" 
                                        title="延期">
                                    <i class="fas fa-clock text-[10px]"></i> 延期
                                </button>

                                <button v-if="!item.completed && item.date === todayStr" 
                                        @click="$emit('openRate', item)" 
                                        class="text-xs bg-indigo-600 text-white px-3 py-1 rounded-md font-bold hover:bg-indigo-700 transition shadow-sm shadow-indigo-200 transform active:scale-95">
                                    打卡
                                </button>
                                
                                <span v-else-if="!item.completed && item.date < todayStr" class="text-xs font-bold text-red-400 flex items-center gap-1 bg-red-50 px-2 py-1 rounded">
                                    <i class="fas fa-exclamation-circle"></i> 已过期
                                </span>
                                <span v-else-if="!item.completed && item.date > todayStr" class="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                    <i class="fas fa-hourglass-start"></i> 待开始
                                </span>
                                <span v-else-if="item.completed" class="text-xs font-bold text-emerald-500 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded">
                                    <i class="fas fa-check-circle"></i> 完成
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showCategoryModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
            <div class="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-up">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-lg text-slate-800">管理分类</h3>
                    <button @click="showCategoryModal=false" class="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400"><i class="fas fa-times"></i></button>
                </div>
                <div class="flex gap-2 mb-4">
                    <input v-model="newCatName" @keyup.enter="handleAddCategory" placeholder="输入新分类名称..." class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none">
                    <button @click="handleAddCategory" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700">添加</button>
                </div>
                <div class="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                    <div v-for="cat in categories" :key="cat" class="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-sm flex items-center gap-2 group">
                        <span :class="getCategoryTextColor(cat)" class="font-bold">{{ cat }}</span>
                        <button @click="$emit('deleteCategory', cat)" class="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><i class="fas fa-times"></i></button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showSubjectModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[70] flex items-center justify-center p-6 animate-fade-in" @click.self="showSubjectModal=false">
            <div class="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] shadow-2xl scale-up flex flex-col overflow-hidden border border-slate-100">
                <div class="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm text-white" :class="getCategoryColor(selectedSubject)">
                            <i class="fas fa-folder-open"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-black text-slate-800">{{ selectedSubject }}</h3>
                            <p class="text-xs text-slate-400">学科任务全景视图 · {{ subjectTasks.length }} 个任务</p>
                        </div>
                    </div>
                    <button @click="showSubjectModal=false" class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 transition"><i class="fas fa-times"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
                    <div v-if="subjectTasks.length === 0" class="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                        <i class="fas fa-clipboard-list text-5xl mb-4 opacity-30"></i>
                        <p>该学科下暂无任务</p>
                    </div>
                    <div v-else class="space-y-6">
                        <div v-for="task in subjectTasks" :key="task.id" class="relative pl-4 border-l-2 border-slate-100 hover:border-indigo-200 transition group">
                            <div class="flex justify-between items-start mb-3">
                                <div>
                                    <h4 class="text-lg font-bold text-slate-700 flex items-center gap-2">
                                        {{ task.title }}
                                        <i v-if="task.type === 'weekend'" class="fas fa-calendar-week text-xs text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded"></i>
                                    </h4>
                                    <p class="text-xs text-slate-400 mt-0.5">Start: {{ task.startDate }}</p>
                                </div>
                                <div class="text-xs font-bold px-2 py-1 rounded bg-slate-50 text-slate-500">
                                    进度: {{ getTaskProgress(task) }}%
                                </div>
                            </div>
                            <div class="flex gap-2 flex-wrap">
                                <div v-for="(node, idx) in task.schedule" :key="idx" 
                                     class="flex flex-col items-center gap-1 group/node cursor-default"
                                     :title="node.date + (node.completed ? ' (已完成)' : '')"
                                >
                                    <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all shadow-sm border border-transparent"
                                         :class="getNodeStyle(node)">
                                        <i :class="getNodeIcon(node)"></i>
                                    </div>
                                    <span class="text-[10px] font-mono text-slate-300 group-hover/node:text-slate-500 transition">
                                        {{ task.type === 'weekend' ? 'W' : '+' + node.interval }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
    `,
    setup(props, { emit }) {
        const todayStr = new Date().toISOString().split('T')[0];
        
        const pieChartRef = ref(null);
        let pieChart = null;
        
        const showCategoryModal = ref(false);
        const newCatName = ref('');
        const showSubjectModal = ref(false);
        const selectedSubject = ref('');

        // 计算选中学科的任务
        const subjectTasks = computed(() => {
            if (!selectedSubject.value || !props.allTasks) return [];
            return props.allTasks.filter(t => t.category === selectedSubject.value).sort((a,b) => b.id - a.id);
        });

        // 任务延期处理
        const handlePostpone = (item) => {
            const days = prompt("🕒 任务延期\n\n请输入需要延后的天数 (例如 1):", "1");
            if (days !== null) {
                emit('postponeTask', { 
                    taskId: item.taskId, 
                    stage: item.scheduleItem.stage, 
                    days: days 
                });
            }
        };

        // --- ECharts 逻辑 ---
        const initCharts = () => {
            if (pieChartRef.value && !pieChart) {
                pieChart = echarts.init(pieChartRef.value);
                pieChart.on('click', (params) => { selectedSubject.value = params.name; showSubjectModal.value = true; });
            }
            updatePieChart();
        };

        const updatePieChart = () => {
            if (!pieChart) return;
            pieChart.setOption({
                tooltip: { trigger: 'item' },
                series: [{
                    name: '任务分布',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: false,
                    itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
                    label: { show: false },
                    emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
                    data: props.chartData.pieData
                }]
            });
        };

        const handleResize = () => { pieChart?.resize(); };
        
        watch(() => props.chartData, () => { 
            nextTick(() => { 
                if (!pieChart) initCharts(); 
                pieChart?.resize(); 
                updatePieChart(); 
            }); 
        }, { deep: true });

        onMounted(() => { setTimeout(() => { initCharts(); window.addEventListener('resize', handleResize); }, 100); });
        onUnmounted(() => { window.removeEventListener('resize', handleResize); pieChart?.dispose(); });

        // --- 辅助函数 ---
        const handleAddCategory = () => { if (newCatName.value) { emit('addCategory', newCatName.value); newCatName.value = ''; } };
        const getCategoryTextColor = (cat) => { const map = { '英语': 'text-blue-500', '数学': 'text-red-500', '编程': 'text-slate-700' }; return map[cat] || 'text-indigo-500'; };
        const getCategoryColor = (cat) => { const map = { '英语': 'bg-blue-500', '数学': 'bg-red-500', '编程': 'bg-slate-700', '语文': 'bg-orange-400', '科学': 'bg-emerald-500' }; return map[cat] || 'bg-indigo-500'; };
        
        const getNodeStyle = (node) => {
            if (node.completed) return 'bg-emerald-500 text-white shadow-emerald-200';
            const t = new Date().toISOString().split('T')[0];
            if (node.date < t) return 'bg-red-500 text-white shadow-red-200 animate-pulse';
            if (node.date === t) return 'bg-indigo-500 text-white shadow-indigo-200 ring-2 ring-indigo-100';
            return 'bg-slate-50 text-slate-300 border-slate-200';
        };
        const getNodeIcon = (node) => {
            if (node.completed) return 'fas fa-check';
            const t = new Date().toISOString().split('T')[0];
            if (node.date < t) return 'fas fa-exclamation';
            if (node.date === t) return 'fas fa-pen';
            return 'fas fa-hourglass-start';
        };
        const getTaskProgress = (task) => {
            if (!task.schedule || task.schedule.length === 0) return 0;
            const done = task.schedule.filter(s => s.completed).length;
            return Math.round((done / task.schedule.length) * 100);
        };

        return {
            pieChartRef, todayStr,
            showCategoryModal, newCatName, handleAddCategory, getCategoryTextColor, getCategoryColor,
            previewImage: (src) => { const win = window.open(); win.document.write('<style>body{margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#f1f5f9;}</style><img src="' + src + '" style="max-width:90%;max-height:90%;box-shadow:0 20px 25px -5px rgb(0 0 0 / 0.1);border-radius:1rem;">'); },
            showSubjectModal, selectedSubject, subjectTasks, getNodeStyle, getNodeIcon, getTaskProgress,
            handlePostpone
        };
    }
}