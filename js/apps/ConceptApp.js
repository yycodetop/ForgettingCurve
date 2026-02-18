/**
 * js/apps/ConceptApp.js
 * 概念学习通用应用框架
 * 升级：支持编辑、换行显示、语音识别填空
 */
import { ref, computed, nextTick } from 'vue';

export default {
    props: ['mode', 'concepts', 'subjects', 'grades', 'initialAction'], 
    emits: ['add-concept', 'update-concept', 'delete-concept', 'back-home', 'import-excel'],
    template: `
    <div class="h-full flex gap-6 animate-fade-in relative">
        <div class="w-64 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col p-4">
            <div class="mb-4 flex items-center gap-2 px-2 pt-2">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md" :class="modeConfig.colorClass">
                    <i :class="modeConfig.icon"></i>
                </div>
                <h2 class="font-bold text-lg text-slate-800">{{ modeConfig.title }}</h2>
            </div>
            <div class="px-2 mb-4 space-y-3">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">年级筛选</label>
                    <div class="relative">
                        <select v-model="currentGrade" class="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-indigo-500 transition cursor-pointer">
                            <option value="all">🎓 全部年级</option>
                            <option v-for="g in grades" :value="g">{{ g }}</option>
                        </select>
                        <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none"></i>
                    </div>
                </div>
            </div>
            <div class="h-px bg-slate-100 mx-2 mb-2"></div>
            <div class="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                <button @click="currentSubject = 'all'" class="w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition flex justify-between items-center" :class="currentSubject === 'all' ? 'bg-slate-800 text-white shadow-lg shadow-slate-300' : 'text-slate-500 hover:bg-slate-50'"><span>📚 全部学科</span><span class="bg-white/20 px-2 py-0.5 rounded text-xs">{{ filteredList('all').length }}</span></button>
                <div class="h-px bg-slate-100 my-2 mx-2"></div>
                <button v-for="sub in subjects" :key="sub" @click="currentSubject = sub" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex justify-between items-center group" :class="currentSubject === sub ? modeConfig.activeItemClass : 'text-slate-500 hover:bg-slate-50'"><span>{{ sub }}</span><span class="text-xs opacity-40 group-hover:opacity-100">{{ filteredList(sub).length }}</span></button>
            </div>
            <button @click="$emit('back-home')" class="mt-4 w-full py-3 text-slate-400 hover:text-slate-600 text-sm font-bold bg-slate-50 hover:bg-slate-100 rounded-xl transition"><i class="fas fa-arrow-left mr-1"></i> 返回概览</button>
        </div>

        <div class="flex-1 flex flex-col min-w-0">
            <div class="h-16 mb-4 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-between px-6 border border-white/50 shadow-sm">
                <div>
                    <h3 class="font-bold text-slate-700 text-lg flex items-center gap-2">
                        {{ currentSubject === 'all' ? '所有学科' : currentSubject }}
                        <span v-if="currentGrade !== 'all'" class="text-xs bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-md border border-indigo-100">{{ currentGrade }}</span>
                    </h3>
                    <p class="text-xs text-slate-400">{{ modeConfig.subtitle }}</p>
                </div>
                <button @click="openAddModal(null)" class="px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition transform active:scale-95 flex items-center gap-2" :class="modeConfig.btnClass">
                    <i class="fas fa-plus"></i> 新建卡片
                </button>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar p-1">
                <div v-if="displayList.length === 0" class="h-full flex flex-col items-center justify-center text-slate-300">
                    <i class="fas fa-inbox text-5xl mb-4 opacity-30"></i>
                    <p>暂无符合筛选条件的知识卡片</p>
                </div>

                <div v-else class="grid grid-cols-3 gap-4 pb-20">
                    <div v-for="item in displayList" :key="item.id" 
                         class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col relative overflow-hidden">
                        
                        <div class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br opacity-10 rounded-bl-3xl -mr-2 -mt-2 pointer-events-none" :class="modeConfig.gradientClass"></div>

                        <div class="flex justify-between items-start mb-3">
                            <div class="flex gap-1">
                                <span class="text-[10px] font-bold px-2 py-1 rounded border" :class="getSubjectColor(item.subject)">{{ item.subject }}</span>
                                <span v-if="item.grade" class="text-[10px] font-bold px-2 py-1 rounded border bg-slate-50 text-slate-500 border-slate-200">{{ item.grade }}</span>
                            </div>
                            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button @click="openAddModal(item)" class="w-6 h-6 rounded bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-500 transition"><i class="fas fa-pen text-xs"></i></button>
                                <button @click="$emit('delete-concept', item.id)" class="w-6 h-6 rounded bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 transition"><i class="fas fa-trash text-xs"></i></button>
                            </div>
                        </div>

                        <h4 class="font-bold text-slate-800 text-lg mb-2 line-clamp-1" :title="item.title">{{ item.title }}</h4>
                        
                        <div class="flex-1 min-h-[60px] mb-4">
                            <p v-if="mode === 'cloze'" class="text-sm text-slate-500 leading-relaxed line-clamp-3 font-mono bg-slate-50 p-2 rounded-lg whitespace-pre-wrap" v-html="formatClozePreview(item.content)"></p>
                            
                            <div v-else-if="mode === 'image'" class="w-full h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 overflow-hidden relative">
                                <img v-if="item.imageUrl" :src="item.imageUrl" class="w-full h-full object-cover">
                                <i v-else class="fas fa-image text-2xl"></i>
                                <div class="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><span class="bg-black/60 text-white text-xs px-2 py-1 rounded">查看遮挡</span></div>
                            </div>
                            
                            <p v-else-if="mode === 'feynman'" class="text-sm text-slate-500 leading-relaxed line-clamp-3 italic">"{{ item.content }}"</p>
                        </div>

                        <button @click="startRecitation(item)" class="w-full py-2 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2" :class="modeConfig.actionBtnClass">
                            <i :class="modeConfig.actionIcon"></i> {{ modeConfig.actionText }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showAddModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
            <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 scale-up max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-slate-800">{{ isEditing ? '编辑' : '新建' }} {{ modeConfig.title }}</h3>
                    <label v-if="mode === 'cloze' && !isEditing" class="cursor-pointer bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-emerald-100">
                        <i class="fas fa-file-excel"></i> Excel 批量导入
                        <input type="file" accept=".xlsx, .xls" class="hidden" @change="handleFileUpload">
                    </label>
                </div>
                
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 mb-1">学科</label>
                            <select v-model="newItem.subject" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500">
                                <option v-for="s in subjects" :value="s">{{ s }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 mb-1">年级</label>
                            <select v-model="newItem.grade" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500">
                                <option value="" disabled>选择年级</option>
                                <option v-for="g in grades" :value="g">{{ g }}</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1">标题</label>
                        <input v-model="newItem.title" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" placeholder="例如: 勾股定理">
                    </div>

                    <div v-if="mode === 'cloze'">
                        <div class="flex justify-between items-center mb-1">
                            <label class="block text-xs font-bold text-slate-500">定义内容</label>
                            <span class="text-[10px] text-amber-500 bg-amber-50 px-2 rounded">使用 <code class="font-mono font-bold">{{ }}</code> 包裹关键词</span>
                        </div>
                        <textarea v-model="newItem.content" rows="6" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 custom-scrollbar whitespace-pre-wrap" placeholder="例如: \n第一行内容\n第二行{{关键词}}内容"></textarea>
                        
                        <div v-if="newItem.content" class="mt-2 p-3 bg-slate-100 rounded-xl border border-slate-200">
                            <div class="text-[10px] font-bold text-slate-400 mb-1 uppercase">效果预览</div>
                            <p class="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed" v-html="formatClozePreview(newItem.content)"></p>
                        </div>
                    </div>
                    
                    <div v-else-if="mode === 'image'">
                        <label class="block text-xs font-bold text-slate-500 mb-1">上传图片</label>
                        <div class="border-2 border-dashed border-slate-200 rounded-xl h-32 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition cursor-pointer bg-slate-50">
                            <i class="fas fa-cloud-upload-alt text-2xl mb-2"></i>
                            <span class="text-xs">点击上传图片</span>
                        </div>
                    </div>
                    <div v-else-if="mode === 'feynman'">
                        <label class="block text-xs font-bold text-slate-500 mb-1">核心概念</label>
                        <textarea v-model="newItem.content" rows="4" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 custom-scrollbar" placeholder="解释概念..."></textarea>
                    </div>
                </div>

                <div class="flex gap-4 mt-8">
                    <button @click="showAddModal=false" class="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition">取消</button>
                    <button @click="handleSave" class="flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition transform active:scale-95" :class="modeConfig.btnClass">保存</button>
                </div>
            </div>
        </div>

        <div v-if="showReciteModal" class="fixed inset-0 bg-white z-[70] flex flex-col animate-fade-in">
            <div class="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div class="flex items-center gap-3">
                    <button @click="exitRecitation" class="w-10 h-10 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition shadow-sm border border-slate-200 flex items-center justify-center"><i class="fas fa-times"></i></button>
                    <div>
                        <h2 class="text-xl font-bold text-slate-800">{{ currentReciteItem.title }}</h2>
                        <span class="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{{ currentReciteItem.subject }} · {{ currentReciteItem.grade }}</span>
                    </div>
                </div>
                <div class="text-slate-400 text-sm font-bold flex items-center gap-2">
                    <i class="fas fa-microphone-alt animate-pulse text-indigo-500" v-if="isListening"></i>
                    {{ isListening ? '正在识别语音...' : '点击下划线区域进行语音填空' }}
                </div>
            </div>

            <div v-if="mode === 'cloze'" class="flex-1 flex items-center justify-center p-8 overflow-y-auto bg-slate-50">
                <div class="max-w-4xl w-full bg-white rounded-3xl shadow-xl p-10 min-h-[400px] flex flex-col justify-center border border-slate-100">
                    <div class="text-2xl leading-loose text-slate-700 font-medium whitespace-pre-wrap text-justify">
                        <template v-for="(segment, idx) in parsedClozeContent" :key="idx">
                            <span v-if="segment.type === 'text'">{{ segment.val }}</span>
                            <span v-else 
                                  @click="handleClozeClick(idx)"
                                  class="inline-block min-w-[80px] border-b-4 px-2 mx-1 transition-all cursor-pointer select-none text-center relative group"
                                  :class="[
                                    segment.userVal ? 'border-emerald-400 text-emerald-600 font-bold' : 'border-slate-300 text-transparent hover:border-indigo-400 bg-slate-50',
                                    listeningIndex === idx ? 'border-indigo-500 bg-indigo-50 animate-pulse' : ''
                                  ]"
                            >
                                {{ segment.userVal || '____' }}
                                
                                <span v-if="!segment.userVal" class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                                    <i class="fas fa-microphone"></i> 点击说话
                                </span>
                                
                                <input v-if="editingIndex === idx" 
                                       v-model="segment.userVal" 
                                       @blur="editingIndex = null" 
                                       @keyup.enter="editingIndex = null"
                                       @click.stop
                                       class="absolute inset-0 w-full h-full bg-white border-b-4 border-indigo-500 outline-none text-center text-indigo-600 font-bold"
                                       v-focus
                                >
                            </span>
                        </template>
                    </div>
                </div>
            </div>

            <div v-else class="flex-1 flex items-center justify-center text-slate-400">
                <p>该模式的背诵功能开发中...</p>
            </div>
        </div>
    </div>
    `,
    directives: {
        focus: {
            mounted: (el) => el.focus()
        }
    },
    setup(props, { emit }) {
        const currentSubject = ref('all');
        const currentGrade = ref('all');
        
        // 新建/编辑相关
        const showAddModal = ref(false);
        const isEditing = ref(false); // 是否处于编辑模式
        const editingId = ref(null);
        const newItem = ref({ subject: '数学', grade: '', title: '', content: '' });

        // 背诵相关
        const showReciteModal = ref(false);
        const currentReciteItem = ref(null);
        const parsedClozeContent = ref([]); // [{type: 'text'|'cloze', val: string, userVal: string, answer: string}]
        const isListening = ref(false);
        const listeningIndex = ref(null); // 当前正在识别的挖空索引
        const editingIndex = ref(null);   // 当前正在手动修改的索引

        // 模式配置 (保持不变)
        const modeConfig = computed(() => {
            const configs = {
                cloze: { title: '挖空填空', subtitle: 'Cloze Deletion', icon: 'fas fa-highlighter', colorClass: 'bg-amber-500', btnClass: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200', activeItemClass: 'bg-amber-50 text-amber-600', gradientClass: 'from-amber-400 to-orange-500', actionText: '开始背诵', actionIcon: 'fas fa-eye', actionBtnClass: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
                image: { title: '图片遮挡', subtitle: 'Image Occlusion', icon: 'fas fa-image', colorClass: 'bg-pink-500', btnClass: 'bg-pink-500 hover:bg-pink-600 shadow-pink-200', activeItemClass: 'bg-pink-50 text-pink-600', gradientClass: 'from-pink-400 to-rose-500', actionText: '进入遮挡', actionIcon: 'fas fa-layer-group', actionBtnClass: 'bg-pink-50 text-pink-600 hover:bg-pink-100' },
                feynman: { title: '费曼自测', subtitle: 'Feynman Technique', icon: 'fas fa-chalkboard-teacher', colorClass: 'bg-cyan-500', btnClass: 'bg-cyan-500 hover:bg-cyan-600 shadow-cyan-200', activeItemClass: 'bg-cyan-50 text-cyan-600', gradientClass: 'from-cyan-400 to-blue-500', actionText: '开始授课', actionIcon: 'fas fa-microphone', actionBtnClass: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100' }
            };
            return configs[props.mode] || configs.cloze;
        });

        // 列表筛选
        const filteredList = (sub) => {
            let list = props.concepts;
            if (sub !== 'all') list = list.filter(c => c.subject === sub);
            if (currentGrade.value !== 'all') list = list.filter(c => c.grade === currentGrade.value);
            return list;
        };
        const displayList = computed(() => filteredList(currentSubject.value));

        // --- 编辑逻辑 ---
        const openAddModal = (item) => {
            if (item) {
                // 编辑模式
                isEditing.value = true;
                editingId.value = item.id;
                // 深拷贝防止修改影响列表显示
                newItem.value = JSON.parse(JSON.stringify(item));
            } else {
                // 新建模式
                isEditing.value = false;
                editingId.value = null;
                const defaultSubject = props.subjects.length > 0 ? props.subjects[0] : '数学';
                const defaultGrade = props.grades.length > 0 ? props.grades[0] : '';
                newItem.value = { subject: defaultSubject, grade: defaultGrade, title: '', content: '' };
            }
            showAddModal.value = true;
        };

        const handleSave = () => {
            if (!newItem.value.title) return alert('请输入标题');
            if (!newItem.value.grade) return alert('请选择年级');
            if (props.mode === 'cloze' && !/\{\{.+?\}\}/.test(newItem.value.content)) return alert('挖空内容必须包含至少一个 {{关键词}}');
            
            if (isEditing.value) {
                emit('update-concept', editingId.value, newItem.value);
            } else {
                emit('add-concept', { type: props.mode, ...newItem.value });
            }
            showAddModal.value = false;
        };

        // --- 背诵逻辑 ---
        const startRecitation = (item) => {
            currentReciteItem.value = item;
            
            if (props.mode === 'cloze') {
                // 解析挖空内容：分割 {{A}} 为片段
                const regex = /(\{\{.+?\}\})/g;
                const parts = item.content.split(regex);
                
                parsedClozeContent.value = parts.map(part => {
                    if (part.startsWith('{{') && part.endsWith('}}')) {
                        const answer = part.slice(2, -2); // 去掉 {{ }}
                        return { type: 'cloze', val: part, userVal: '', answer: answer };
                    } else {
                        return { type: 'text', val: part };
                    }
                }).filter(p => p.val !== ''); // 过滤空字符串
            }
            
            showReciteModal.value = true;
        };

        const exitRecitation = () => {
            showReciteModal.value = false;
            parsedClozeContent.value = [];
            isListening.value = false;
            listeningIndex.value = null;
        };

        // --- 语音识别逻辑 ---
        const handleClozeClick = (index) => {
            const segment = parsedClozeContent.value[index];
            
            // 如果已经有内容，点击进入手动修改模式
            if (segment.userVal) {
                editingIndex.value = index;
                return;
            }

            // 否则，开始语音识别
            startSpeechRecognition(index);
        };

        const startSpeechRecognition = (index) => {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                return alert("您的浏览器不支持语音识别，请使用 Chrome。");
            }

            if (isListening.value) return; // 防止重复点击

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.lang = 'zh-CN';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            isListening.value = true;
            listeningIndex.value = index;

            recognition.onstart = () => {
                console.log("Listening...");
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                // 去除可能末尾的句号（某些引擎会自动加标点）
                const cleanText = transcript.replace(/[。.,，]$/, '');
                
                // 填入内容
                parsedClozeContent.value[index].userVal = cleanText;
            };

            recognition.onerror = (event) => {
                console.error("Speech error", event.error);
                alert("语音识别失败: " + event.error);
            };

            recognition.onend = () => {
                isListening.value = false;
                listeningIndex.value = null;
            };

            recognition.start();
        };

        // 文件上传处理
        const handleFileUpload = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            emit('import-excel', file);
            event.target.value = '';
        };

        // 预览格式化
        const formatClozePreview = (text) => {
            if (!text) return '';
            return text.replace(/\{\{(.+?)\}\}/g, '<span class="border-b-2 border-amber-400 font-bold text-amber-600 px-1 bg-amber-50 rounded mx-0.5">$1</span>');
        };

        const getSubjectColor = (sub) => {
            const colors = { '数学': 'bg-red-50 text-red-600 border-red-100', '物理': 'bg-blue-50 text-blue-600 border-blue-100', '化学': 'bg-purple-50 text-purple-600 border-purple-100', '生物': 'bg-emerald-50 text-emerald-600 border-emerald-100', '地理': 'bg-amber-50 text-amber-600 border-amber-100', '语文': 'bg-orange-50 text-orange-600 border-orange-100', '英语': 'bg-indigo-50 text-indigo-600 border-indigo-100' };
            return colors[sub] || 'bg-slate-50 text-slate-600 border-slate-100';
        };

        // 如果 props 有 initialAction='add'，自动打开模态框 (用于 Dashboard 快速新建)
        if (props.initialAction === 'add') {
             nextTick(() => openAddModal(null));
        }

        return {
            currentSubject, currentGrade, displayList, modeConfig,
            showAddModal, isEditing, newItem,
            showReciteModal, currentReciteItem, parsedClozeContent, isListening, listeningIndex, editingIndex,
            openAddModal, handleSave, filteredList, getSubjectColor, handleFileUpload, formatClozePreview,
            startRecitation, exitRecitation, handleClozeClick
        };
    }
}