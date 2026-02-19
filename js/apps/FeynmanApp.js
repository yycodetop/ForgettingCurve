/**
 * js/apps/FeynmanApp.js
 * 费曼自测独立模块 - v1.0
 * 功能：专注于费曼技巧的内容维护（新增、编辑、删除）
 * 字段：核心概念、关键词提示、标准定义
 */
import { ref, computed, nextTick } from 'vue';

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
                    <span class="bg-white/20 px-2 py-0.5 rounded text-xs">{{ filteredList('all').length }}</span>
                </button>
                <div class="h-px bg-slate-100 my-2 mx-2"></div>
                <button v-for="sub in subjects" :key="sub" @click="currentSubject = sub" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex justify-between items-center group" :class="currentSubject === sub ? 'bg-cyan-50 text-cyan-600' : 'text-slate-500 hover:bg-slate-50'">
                    <span>{{ sub }}</span>
                    <span class="text-xs opacity-40 group-hover:opacity-100">{{ filteredList(sub).length }}</span>
                </button>
            </div>
            <button @click="$emit('back-home')" class="mt-4 w-full py-3 text-slate-400 hover:text-slate-600 text-sm font-bold bg-slate-50 hover:bg-slate-100 rounded-xl transition"><i class="fas fa-arrow-left mr-1"></i> 返回概览</button>
        </div>

        <div class="flex-1 flex flex-col min-w-0">
            <div class="h-16 mb-4 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-between px-6 border border-white/50 shadow-sm">
                <div>
                    <h3 class="font-bold text-slate-700 text-lg flex items-center gap-2">
                        {{ currentSubject === 'all' ? '所有学科' : currentSubject }}
                        <span v-if="currentGrade !== 'all'" class="text-xs bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-md border border-cyan-100">{{ currentGrade }}</span>
                    </h3>
                    <p class="text-xs text-slate-400">通过“以教代学”的方式深度掌握概念</p>
                </div>
                
                <button @click="openAddModal(null)" class="px-6 py-2.5 rounded-xl font-bold text-white shadow-lg bg-cyan-500 hover:bg-cyan-600 shadow-cyan-200 transition transform active:scale-95 flex items-center gap-2">
                    <i class="fas fa-plus"></i> 新建费曼卡片
                </button>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar p-1">
                <div v-if="displayList.length === 0" class="h-full flex flex-col items-center justify-center text-slate-300">
                    <i class="fas fa-chalkboard-teacher text-5xl mb-4 opacity-30"></i>
                    <p>暂无费曼卡片，点击右上角新建</p>
                </div>

                <div v-else class="grid grid-cols-3 gap-4 pb-20">
                    <div v-for="item in displayList" :key="item.id" 
                         class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col relative overflow-hidden h-[220px]">
                        
                        <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 opacity-5 rounded-bl-full -mr-4 -mt-4 pointer-events-none"></div>

                        <div class="flex justify-between items-start mb-3">
                            <div class="flex gap-1">
                                <span class="text-[10px] font-bold px-2 py-1 rounded border bg-slate-50 text-slate-600 border-slate-100">{{ item.subject }}</span>
                                <span v-if="item.grade" class="text-[10px] font-bold px-2 py-1 rounded border bg-slate-50 text-slate-500 border-slate-200">{{ item.grade }}</span>
                            </div>
                            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button @click="openAddModal(item)" class="w-6 h-6 rounded bg-slate-50 hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 transition"><i class="fas fa-pen text-xs"></i></button>
                                <button @click="$emit('delete-concept', item.id)" class="w-6 h-6 rounded bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 transition"><i class="fas fa-trash text-xs"></i></button>
                            </div>
                        </div>

                        <h4 class="font-bold text-slate-800 text-lg mb-2 line-clamp-1" :title="item.title">
                            <span class="text-cyan-500 mr-1">Q:</span>{{ item.title }}
                        </h4>
                        
                        <div class="flex-1 overflow-hidden space-y-2">
                            <div v-if="item.hints" class="bg-amber-50 rounded-lg p-2 border border-amber-100">
                                <div class="text-[10px] font-bold text-amber-500 mb-0.5"><i class="fas fa-key mr-1"></i>关键词提示</div>
                                <p class="text-xs text-amber-800 line-clamp-2 leading-relaxed">{{ item.hints }}</p>
                            </div>
                            <div class="pl-2 border-l-2 border-slate-100">
                                <div class="text-[10px] font-bold text-slate-400 mb-0.5">标准定义</div>
                                <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">{{ item.content }}</p>
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
                            <select v-model="newItem.subject" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-cyan-500 focus:bg-cyan-50/20 transition">
                                <option v-for="s in subjects" :value="s">{{ s }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 mb-1">年级</label>
                            <select v-model="newItem.grade" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-cyan-500 focus:bg-cyan-50/20 transition">
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
                        <label class="block text-xs font-bold text-slate-500 mb-1">标准定义 (Answer)</label>
                        <textarea v-model="newItem.content" rows="5" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-cyan-500 transition custom-scrollbar" placeholder="在此输入标准的定义或解释，用于自测后比对..."></textarea>
                    </div>
                </div>

                <div class="flex gap-4 mt-8">
                    <button @click="showAddModal=false" class="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition">取消</button>
                    <button @click="handleSave" class="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-200 transition transform active:scale-95">保存卡片</button>
                </div>
            </div>
        </div>
    </div>
    `,
    setup(props, { emit }) {
        const currentSubject = ref('all');
        const currentGrade = ref('all');
        
        // Modal State
        const showAddModal = ref(false);
        const isEditing = ref(false);
        const editingId = ref(null);
        
        // Data Model
        const newItem = ref({ 
            subject: '数学', 
            grade: '', 
            title: '', 
            hints: '',   // 新增：关键词提示
            content: ''  // 标准定义
        });

        // 筛选逻辑
        const filteredList = (sub) => {
            let list = props.concepts; // Parent should pass pre-filtered concepts (type='feynman')
            if (sub !== 'all') list = list.filter(c => c.subject === sub);
            if (currentGrade.value !== 'all') list = list.filter(c => c.grade === currentGrade.value);
            return list;
        };
        const displayList = computed(() => filteredList(currentSubject.value));

        // 操作逻辑
        const openAddModal = (item) => {
            if (item) {
                isEditing.value = true;
                editingId.value = item.id;
                // Deep copy to break reference
                newItem.value = JSON.parse(JSON.stringify(item));
            } else {
                isEditing.value = false;
                editingId.value = null;
                newItem.value = { 
                    subject: props.subjects[0] || '数学', 
                    grade: props.grades[0] || '', 
                    title: '', 
                    hints: '', 
                    content: '' 
                };
            }
            showAddModal.value = true;
        };

        const handleSave = () => {
            if (!newItem.value.title) return alert('请输入核心概念标题');
            
            // 构建数据对象，确保 type 正确
            const conceptData = {
                type: 'feynman',
                ...newItem.value
            };

            if (isEditing.value) {
                emit('update-concept', editingId.value, conceptData);
            } else {
                emit('add-concept', conceptData);
            }
            showAddModal.value = false;
        };

        return {
            currentSubject,
            currentGrade,
            displayList,
            showAddModal,
            isEditing,
            newItem,
            filteredList,
            openAddModal,
            handleSave
        };
    }
}