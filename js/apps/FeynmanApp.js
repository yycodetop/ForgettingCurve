/**
 * js/apps/FeynmanApp.js
 * 费曼自测独立模块 - v2.1
 * 功能迭代：
 * 1. 语音输入：改为手动开启/手动结束 (continuous模式)
 * 2. 数据统计：揭晓答案时自动增加"自测次数" (reviewCount)，并在列表展示
 * 3. 学习反思：右侧新增备注区域，支持记录不足，失焦自动保存
 */
import { ref, computed, nextTick, onUnmounted } from 'vue';

export default {
    props: ['concepts', 'subjects', 'grades'], 
    emits: ['add-concept', 'update-concept', 'delete-concept', 'back-home'],
    template: `
    <div class="h-full flex gap-6 animate-fade-in relative">
        <div class="w-64 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col p-4">
            <div class="mb-4 flex items-center gap-2 px-2 pt-2">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-500 text-white shadow-md shadow-cyan-200">
                    <i class="fas fa-chalkboard-teacher"></i>
                </div>
                <h2 class="font-bold text-lg text-slate-800">费曼自测</h2>
            </div>
            
            <div class="px-2 mb-4 space-y-3">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">年级筛选</label>
                    <div class="relative">
                        <select v-model="currentGrade" class="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-cyan-500 transition cursor-pointer">
                            <option value="all">🎓 全部年级</option>
                            <option v-for="g in grades" :value="g">{{ g }}</option>
                        </select>
                        <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none"></i>
                    </div>
                </div>
            </div>
            <div class="h-px bg-slate-100 mx-2 mb-2"></div>
            
            <div class="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                <button @click="currentSubject = 'all'" class="w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition flex justify-between items-center" :class="currentSubject === 'all' ? 'bg-slate-800 text-white shadow-lg shadow-slate-300' : 'text-slate-500 hover:bg-slate-50'">
                    <span>📚 全部学科</span>
                    <span class="bg-white/20 px-2 py-0.5 rounded text-xs">{{ filteredList.length }}</span>
                </button>
                <div class="h-px bg-slate-100 my-2 mx-2"></div>
                <button v-for="sub in subjects" :key="sub" @click="currentSubject = sub" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex justify-between items-center group" :class="currentSubject === sub ? 'bg-cyan-50 text-cyan-600' : 'text-slate-500 hover:bg-slate-50'">
                    <span>{{ sub }}</span>
                    <span class="text-xs opacity-40 group-hover:opacity-100">{{ concepts.filter(c => c.subject === sub).length }}</span>
                </button>
            </div>
            <button @click="$emit('back-home')" class="mt-4 w-full py-3 text-slate-400 hover:text-slate-600 text-sm font-bold bg-slate-50 hover:bg-slate-100 rounded-xl transition"><i class="fas fa-arrow-left mr-1"></i> 返回概览</button>
        </div>

        <div class="flex-1 flex flex-col min-w-0">
            <div class="h-16 mb-4 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-between px-6 border border-white/50 shadow-sm">
                <div class="flex items-center gap-4 flex-1">
                    <div>
                        <h3 class="font-bold text-slate-700 text-lg flex items-center gap-2">
                            {{ currentSubject === 'all' ? '所有学科' : currentSubject }}
                            <span v-if="currentGrade !== 'all'" class="text-xs bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-md border border-cyan-100">{{ currentGrade }}</span>
                        </h3>
                        <p class="text-xs text-slate-400">以教代学 · 深度掌握</p>
                    </div>
                    <div class="relative ml-8 flex-1 max-w-md">
                        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input v-model="searchQuery" class="w-full pl-10 pr-4 py-2 bg-slate-100/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-cyan-500 transition" placeholder="搜索核心概念(Q)...">
                    </div>
                </div>
                
                <button @click="openAddModal(null)" class="px-6 py-2.5 rounded-xl font-bold text-white shadow-lg bg-cyan-500 hover:bg-cyan-600 shadow-cyan-200 transition transform active:scale-95 flex items-center gap-2">
                    <i class="fas fa-plus"></i> 新建卡片
                </button>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar p-1">
                <div v-if="filteredList.length === 0" class="h-full flex flex-col items-center justify-center text-slate-300">
                    <i class="fas fa-search text-5xl mb-4 opacity-30"></i>
                    <p>没有找到符合条件的费曼卡片</p>
                </div>

                <div v-else class="grid grid-cols-3 gap-4 pb-20">
                    <div v-for="item in filteredList" :key="item.id" 
                         class="bg-white rounded-2xl p-5 border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col relative overflow-hidden h-[240px]"
                         :class="item.isPinned ? 'border-cyan-200 ring-1 ring-cyan-100' : 'border-slate-100'"
                    >
                        <button @click.stop="togglePin(item)" 
                                class="absolute top-0 right-0 p-3 rounded-bl-2xl transition z-10"
                                :class="item.isPinned ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-200 hover:text-cyan-400 bg-transparent'"
                                title="置顶"
                        >
                            <i class="fas fa-thumbtack text-xs transform rotate-45"></i>
                        </button>

                        <div class="flex justify-between items-start mb-3 pr-8">
                            <div class="flex gap-1">
                                <span class="text-[10px] font-bold px-2 py-1 rounded border bg-slate-50 text-slate-600 border-slate-100">{{ item.subject }}</span>
                                <span v-if="item.grade" class="text-[10px] font-bold px-2 py-1 rounded border bg-slate-50 text-slate-500 border-slate-200">{{ item.grade }}</span>
                            </div>
                        </div>

                        <h4 class="font-bold text-slate-800 text-lg mb-2 line-clamp-2" :title="item.title">
                            <span class="text-cyan-500 mr-1">Q:</span>{{ item.title }}
                        </h4>
                        
                        <div class="flex-1 overflow-hidden">
                            <div v-if="item.hints" class="bg-amber-50 rounded-lg p-2 border border-amber-100">
                                <div class="text-[10px] font-bold text-amber-500 mb-0.5"><i class="fas fa-key mr-1"></i>提示词</div>
                                <p class="text-xs text-amber-800 line-clamp-2 leading-relaxed">{{ item.hints }}</p>
                            </div>
                            <div v-else class="h-full flex items-center justify-center text-slate-300 text-xs italic">
                                无提示词
                            </div>
                        </div>

                        <div class="mt-4 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="flex gap-0.5" title="熟练度评价">
                                    <i v-for="n in 10" :key="n" 
                                       class="fas fa-star text-[8px]" 
                                       :class="n <= (item.proficiency || 0) ? 'text-yellow-400' : 'text-slate-100'">
                                    </i>
                                </div>
                                <div class="text-[10px] text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100" title="已完成自测次数">
                                    <i class="fas fa-sync-alt mr-0.5"></i>{{ item.reviewCount || 0 }}
                                </div>
                            </div>

                            <div class="flex gap-2">
                                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button @click="openAddModal(item)" class="w-7 h-7 rounded bg-slate-50 hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 transition"><i class="fas fa-pen text-xs"></i></button>
                                    <button @click="$emit('delete-concept', item.id)" class="w-7 h-7 rounded bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 transition"><i class="fas fa-trash text-xs"></i></button>
                                </div>
                                <button @click="startFeynmanTest(item)" class="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-200 transition transform active:scale-95 flex items-center gap-1">
                                    <i class="fas fa-play"></i> 启动
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showAddModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
            <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 scale-up max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-slate-800">{{ isEditing ? '编辑' : '新建' }}费曼卡片</h3>
                    <button @click="showAddModal=false" class="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 transition flex items-center justify-center"><i class="fas fa-times"></i></button>
                </div>
                
                <div class="space-y-5">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 mb-1">学科</label>
                            <select v-model="newItem.subject" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-cyan-500 transition">
                                <option v-for="s in subjects" :value="s">{{ s }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 mb-1">年级</label>
                            <select v-model="newItem.grade" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-cyan-500 transition">
                                <option value="" disabled>选择年级</option>
                                <option v-for="g in grades" :value="g">{{ g }}</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1">核心概念 (Question)</label>
                        <input v-model="newItem.title" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition" placeholder="例如: 什么是量子纠缠？">
                    </div>

                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <label class="block text-xs font-bold text-slate-500">关键词提示 (Hints)</label>
                            <span class="text-[10px] text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">复述时的思路引导</span>
                        </div>
                        <textarea v-model="newItem.hints" rows="2" class="w-full px-4 py-3 bg-amber-50/30 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:bg-amber-50 transition" placeholder="例如: 叠加态, 远距离, 瞬时感应..."></textarea>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1">标准定义 (Answer - 列表隐藏)</label>
                        <textarea v-model="newItem.content" rows="5" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-cyan-500 transition custom-scrollbar" placeholder="在此输入标准的定义或解释，用于自测后比对..."></textarea>
                    </div>
                </div>

                <div class="flex gap-4 mt-8">
                    <button @click="showAddModal=false" class="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition">取消</button>
                    <button @click="handleSave" class="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-200 transition transform active:scale-95">保存卡片</button>
                </div>
            </div>
        </div>

        <div v-if="showTestModal" class="fixed inset-0 bg-slate-900/95 z-[70] flex flex-col animate-fade-in">
            <div class="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
                <div class="flex items-center gap-4">
                    <button @click="exitTest" class="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition shadow-sm border border-slate-700 flex items-center justify-center"><i class="fas fa-times"></i></button>
                    <div>
                        <h2 class="text-xl font-bold text-white flex items-center gap-2">
                            费曼自测模式
                            <span v-if="testItem" class="text-xs bg-cyan-600 text-white px-2 py-0.5 rounded border border-cyan-500 shadow-sm">{{ testItem.subject }}</span>
                        </h2>
                    </div>
                </div>
            </div>

            <div class="flex flex-1 overflow-hidden">
                <div class="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
                    <div class="p-4 border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        队列 ({{ filteredList.length }})
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        <div v-for="item in filteredList" :key="item.id" 
                             @click="switchTestItem(item)"
                             class="p-3 rounded-lg cursor-pointer transition flex items-center gap-3 group relative"
                             :class="testItem.id === item.id ? 'bg-cyan-900/40 border border-cyan-500/50' : 'hover:bg-slate-800 border border-transparent'"
                        >
                            <div class="shrink-0">
                                <i v-if="item.proficiency >= 8" class="fas fa-star text-yellow-500 text-xs"></i>
                                <div v-else class="w-2 h-2 rounded-full bg-slate-600"></div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-bold truncate transition-colors" 
                                     :class="testItem.id === item.id ? 'text-cyan-400' : 'text-slate-400'">
                                    {{ item.title }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex-1 flex overflow-hidden">
                    
                    <div class="flex-1 flex flex-col border-r border-slate-700 p-8 bg-slate-900 overflow-y-auto custom-scrollbar relative">
                        <div class="max-w-2xl mx-auto w-full flex flex-col h-full">
                            <div class="mb-6">
                                <div class="text-cyan-500 font-bold text-sm uppercase tracking-widest mb-2">Question</div>
                                <h2 class="text-3xl font-bold text-white leading-tight">{{ testItem.title }}</h2>
                            </div>

                            <div v-if="testItem.hints" class="mb-8 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <div class="text-amber-500 font-bold text-xs uppercase tracking-widest mb-1"><i class="fas fa-lightbulb mr-1"></i>Hints</div>
                                <p class="text-slate-300">{{ testItem.hints }}</p>
                            </div>

                            <div class="flex-1 flex flex-col relative">
                                <div class="text-slate-500 font-bold text-sm uppercase tracking-widest mb-2 flex justify-between items-center">
                                    <span>Your Explanation</span>
                                    <div class="flex items-center gap-2">
                                        <span v-if="isListening" class="text-red-500 animate-pulse text-xs font-bold flex items-center"><i class="fas fa-circle text-[8px] mr-1"></i>Recording...</span>
                                        <span v-else class="text-slate-600 text-xs">点击右下角麦克风开始</span>
                                    </div>
                                </div>
                                <div class="flex-1 relative bg-slate-800 rounded-2xl border border-slate-700 focus-within:border-cyan-500/50 transition overflow-hidden">
                                    <textarea 
                                        v-model="userAnswer"
                                        class="w-full h-full bg-transparent p-6 text-slate-200 text-lg leading-relaxed outline-none resize-none custom-scrollbar" 
                                        placeholder="请尝试用简单的语言复述这个概念..."
                                    ></textarea>
                                    
                                    <button @click="toggleSpeech" 
                                            class="absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95"
                                            :class="isListening ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-cyan-500/30'"
                                            :title="isListening ? '点击停止录音' : '点击开始录音'"
                                    >
                                        <i class="fas" :class="isListening ? 'fa-stop' : 'fa-microphone'"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex-1 flex flex-col p-8 bg-slate-900/50 overflow-y-auto custom-scrollbar relative">
                        <div class="max-w-2xl mx-auto w-full flex flex-col h-full">
                            <div class="text-emerald-500 font-bold text-sm uppercase tracking-widest mb-4">Standard Definition</div>
                            
                            <div class="relative min-h-[250px] bg-slate-800 p-8 rounded-2xl border border-slate-700 shrink-0">
                                <div class="text-xl leading-loose text-slate-200 whitespace-pre-wrap transition-all duration-700"
                                     :class="isContentBlurred ? 'blur-md select-none opacity-50' : 'blur-0 opacity-100'"
                                >
                                    {{ testItem.content }}
                                </div>

                                <div v-if="isContentBlurred" class="absolute inset-0 flex flex-col items-center justify-center z-10">
                                    <button @click="revealAnswer" class="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full shadow-lg shadow-emerald-900/50 transition transform hover:scale-105 flex items-center gap-2">
                                        <i class="fas fa-eye"></i> 点击揭晓答案
                                    </button>
                                    <p class="mt-4 text-slate-400 text-sm">完成复述后点击比对 (自测数 +1)</p>
                                </div>
                            </div>

                            <div v-if="!isContentBlurred" class="mt-6 flex-1 flex flex-col animate-slide-up">
                                <div class="text-center mb-6">
                                    <h4 class="text-slate-300 font-bold mb-3 text-sm">自我评价熟练度</h4>
                                    <div class="inline-flex gap-1 bg-slate-800 p-2 rounded-full border border-slate-700">
                                        <button v-for="n in 10" :key="n" 
                                                @click="rateProficiency(n)"
                                                @mouseenter="hoverRating = n"
                                                @mouseleave="hoverRating = 0"
                                                class="w-8 h-8 rounded-full flex items-center justify-center transition transform hover:scale-125"
                                        >
                                            <i class="fas fa-star text-lg" 
                                               :class="(hoverRating ? n <= hoverRating : n <= testItem.proficiency) ? 'text-yellow-400 drop-shadow-md' : 'text-slate-600'">
                                            </i>
                                        </button>
                                    </div>
                                    <div class="mt-2 text-xs text-slate-500 font-mono">
                                        {{ hoverRating || testItem.proficiency || 0 }} / 10
                                    </div>
                                </div>

                                <div class="flex-1 flex flex-col">
                                    <div class="text-purple-400 font-bold text-sm uppercase tracking-widest mb-2 flex justify-between">
                                        <span>Notes & Reflections</span>
                                        <span class="text-[10px] text-slate-500 font-normal normal-case">失焦自动保存</span>
                                    </div>
                                    <textarea 
                                        v-model="testItem.notes"
                                        @blur="saveNotes"
                                        class="flex-1 w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-slate-300 text-sm leading-relaxed outline-none focus:border-purple-500/50 focus:bg-slate-800 transition resize-none custom-scrollbar"
                                        placeholder="记录你的不足，或者需要改进的地方..."
                                    ></textarea>
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
        // --- 筛选与搜索 ---
        const currentSubject = ref('all');
        const currentGrade = ref('all');
        const searchQuery = ref('');

        const filteredList = computed(() => {
            let list = props.concepts;
            // 1. 基础筛选
            if (currentSubject.value !== 'all') list = list.filter(c => c.subject === currentSubject.value);
            if (currentGrade.value !== 'all') list = list.filter(c => c.grade === currentGrade.value);
            
            // 2. 模糊搜索
            if (searchQuery.value.trim()) {
                const q = searchQuery.value.toLowerCase();
                list = list.filter(c => c.title.toLowerCase().includes(q));
            }

            // 3. 排序：置顶优先 -> 更新时间倒序 -> 创建时间倒序
            return list.sort((a, b) => {
                if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
                const timeA = a.lastReview || a.id;
                const timeB = b.lastReview || b.id;
                return timeB > timeA ? 1 : -1;
            });
        });

        // --- 内容维护 ---
        const showAddModal = ref(false);
        const isEditing = ref(false);
        const editingId = ref(null);
        const newItem = ref({ subject: '数学', grade: '', title: '', hints: '', content: '', isPinned: false, proficiency: 0, notes: '', reviewCount: 0 });

        const openAddModal = (item) => {
            if (item) {
                isEditing.value = true;
                editingId.value = item.id;
                newItem.value = JSON.parse(JSON.stringify(item));
            } else {
                isEditing.value = false;
                editingId.value = null;
                newItem.value = { 
                    subject: props.subjects[0] || '数学', 
                    grade: props.grades[0] || '', 
                    title: '', hints: '', content: '', 
                    isPinned: false, proficiency: 0, notes: '', reviewCount: 0
                };
            }
            showAddModal.value = true;
        };

        const handleSave = () => {
            if (!newItem.value.title) return alert('请输入核心概念标题');
            const conceptData = { type: 'feynman', ...newItem.value };
            if (isEditing.value) emit('update-concept', editingId.value, conceptData);
            else emit('add-concept', conceptData);
            showAddModal.value = false;
        };

        const togglePin = (item) => {
            emit('update-concept', item.id, { isPinned: !item.isPinned });
        };

        // --- 费曼自测逻辑 ---
        const showTestModal = ref(false);
        const testItem = ref(null);
        const userAnswer = ref('');
        const isContentBlurred = ref(true);
        const hoverRating = ref(0);
        
        // 语音相关
        const isListening = ref(false);
        let recognition = null;

        const startFeynmanTest = (item) => {
            testItem.value = item; // 注意：这里直接引用了 props 对象，修改 ref 会触发响应，但需 emit 保存
            userAnswer.value = ''; 
            isContentBlurred.value = true; 
            isListening.value = false;
            showTestModal.value = true;
        };

        const switchTestItem = (item) => {
            startFeynmanTest(item);
        };

        const revealAnswer = () => {
            isContentBlurred.value = false;
            // 揭晓答案时，增加自测次数
            if (testItem.value) {
                const newCount = (testItem.value.reviewCount || 0) + 1;
                // 更新本地视图
                testItem.value.reviewCount = newCount;
                // 持久化保存
                emit('update-concept', testItem.value.id, { 
                    reviewCount: newCount,
                    lastReview: new Date().toISOString()
                });
            }
        };

        const rateProficiency = (score) => {
            if (!testItem.value) return;
            testItem.value.proficiency = score;
            emit('update-concept', testItem.value.id, { proficiency: score });
        };

        const saveNotes = () => {
            if (!testItem.value) return;
            // 失焦保存备注
            emit('update-concept', testItem.value.id, { notes: testItem.value.notes });
        };

        const exitTest = () => {
            showTestModal.value = false;
            stopSpeech();
        };

        // --- 语音输入 (手动控制版) ---
        const toggleSpeech = () => {
            if (isListening.value) {
                stopSpeech(); // 手动停止
            } else {
                startSpeech(); // 手动开始
            }
        };

        const startSpeech = () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) return alert("浏览器不支持语音识别");
            
            recognition = new SpeechRecognition();
            recognition.lang = 'zh-CN';
            recognition.interimResults = true;
            recognition.continuous = true; // [关键] 允许连续录音，直到手动停止

            recognition.onstart = () => { isListening.value = true; };
            
            // 注意：手动停止时也会触发 onend，这里主要处理意外断开
            recognition.onend = () => { 
                // 只有当非预期停止时才可能需要逻辑，但在 toggle 模式下，
                // 我们简单地更新状态即可。如果用户没点停止但断了，UI会变回停止状态，用户需重点。
                isListening.value = false; 
            };

            recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                // 追加文本
                if (finalTranscript) {
                    userAnswer.value += finalTranscript;
                }
            };

            recognition.start();
        };

        const stopSpeech = () => {
            if (recognition) { 
                recognition.stop(); 
                recognition = null; 
            }
            isListening.value = false;
        };
        
        onUnmounted(() => stopSpeech());

        return {
            currentSubject, currentGrade, searchQuery, filteredList,
            showAddModal, isEditing, newItem, openAddModal, handleSave, togglePin,
            showTestModal, testItem, userAnswer, isContentBlurred, hoverRating,
            startFeynmanTest, switchTestItem, revealAnswer, rateProficiency, saveNotes, exitTest,
            isListening, toggleSpeech
        };
    }
}