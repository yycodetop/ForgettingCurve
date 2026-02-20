/**
 * js/apps/ImageOcclusionApp.js
 * 图像遮挡独立模块 - v2.3 (排序与编号迭代版)
 * 1. 增加排序编号 (orderNum) 与自动计算
 * 2. 增加列表从小到大排序逻辑
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';

export default {
    props: ['subjects', 'grades', 'occlusions'],
    emits: ['add-occlusion', 'update-occlusion', 'delete-occlusion', 'back-home'],
    template: `
    <div class="h-full flex gap-6 animate-fade-in relative font-sans">
        <div class="w-64 bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-slate-100/50 flex flex-col p-5">
            <div class="mb-6 flex items-center gap-3 px-2 pt-2">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-lg shadow-pink-500/30">
                    <i class="fas fa-layer-group text-lg"></i>
                </div>
                <div>
                    <h2 class="font-bold text-lg text-slate-800 leading-tight">图像遮挡</h2>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Visual Memory</p>
                </div>
            </div>
            
            <div class="px-2 mb-4 space-y-4">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">年级筛选</label>
                    <div class="relative group">
                        <select v-model="currentGrade" class="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-2xl px-4 py-3 font-bold focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition cursor-pointer">
                            <option value="all">🎓 全部年级</option>
                            <option v-for="g in grades" :value="g">{{ g }}</option>
                        </select>
                        <i class="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none group-hover:text-pink-500 transition"></i>
                    </div>
                </div>
            </div>
            <div class="h-px bg-slate-100 mx-2 mb-2"></div>
            
            <div class="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                <button @click="currentSubject = 'all'" class="w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition flex justify-between items-center" :class="currentSubject === 'all' ? 'bg-slate-800 text-white shadow-lg shadow-slate-300' : 'text-slate-500 hover:bg-slate-50 hover:pl-5'">
                    <span>📚 全部学科</span>
                    <span class="bg-white/20 px-2 py-0.5 rounded-lg text-xs backdrop-blur-sm">{{ filteredList.length }}</span>
                </button>
                <div class="h-px bg-slate-100 my-2 mx-2"></div>
                <button v-for="sub in subjects" :key="sub" @click="currentSubject = sub" class="w-full text-left px-4 py-2.5 rounded-2xl text-sm font-bold transition-all flex justify-between items-center group" :class="currentSubject === sub ? 'bg-pink-50 text-pink-600' : 'text-slate-500 hover:bg-slate-50 hover:pl-6'">
                    <span>{{ sub }}</span>
                    <span class="text-xs opacity-40 group-hover:opacity-100 transition-opacity">{{ occlusions.filter(c => c.subject === sub).length }}</span>
                </button>
            </div>
            <button @click="$emit('back-home')" class="mt-4 w-full py-3 text-slate-400 hover:text-slate-600 text-sm font-bold bg-slate-50 hover:bg-slate-100 rounded-2xl transition flex items-center justify-center gap-2">
                <i class="fas fa-arrow-left"></i> 返回概览
            </button>
        </div>

        <div class="flex-1 flex flex-col min-w-0">
            <div class="h-20 mb-6 bg-white/70 backdrop-blur-md rounded-[2rem] flex items-center justify-between px-8 border border-white/60 shadow-sm sticky top-0 z-30">
                <div class="flex items-center gap-6 flex-1">
                    <div>
                        <h3 class="font-bold text-slate-800 text-xl flex items-center gap-2">
                            {{ currentSubject === 'all' ? '所有学科' : currentSubject }}
                            <span v-if="currentGrade !== 'all'" class="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-md border border-pink-200">{{ currentGrade }}</span>
                        </h3>
                        <p class="text-xs text-slate-400 font-medium">Image Occlusion Testing</p>
                    </div>
                </div>
                
                <div class="flex items-center gap-4">
                    <div class="relative w-64 group">
                        <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition"></i>
                        <input v-model="searchQuery" type="text" placeholder="搜索卡片标题..." class="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-2xl pl-10 pr-4 py-2.5 font-bold focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition shadow-sm">
                    </div>

                    <button @click="openEditor(null)" class="px-5 py-2.5 rounded-2xl font-bold text-white shadow-lg bg-pink-500 hover:bg-pink-600 shadow-pink-200 transition transform active:scale-95 flex items-center gap-2 text-sm">
                        <i class="fas fa-plus"></i> 新建遮挡卡片
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
                <div v-if="filteredList.length === 0" class="h-full flex flex-col items-center justify-center text-slate-300">
                    <div class="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                        <i class="fas fa-image text-4xl opacity-50"></i>
                    </div>
                    <p class="font-bold text-lg">暂无匹配的图片卡片</p>
                </div>

                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
                    <div v-for="item in filteredList" :key="item.id" 
                         class="group relative bg-white rounded-[1.5rem] p-4 transition-all duration-300 flex flex-col h-[280px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:border-pink-200 hover:-translate-y-1"
                    >
                        <div class="absolute top-6 left-6 flex gap-1 z-20">
                            <span v-if="item.pinned" class="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md" title="已置顶"><i class="fas fa-thumbtack text-[10px]"></i></span>
                            <span v-if="item.inCurve" class="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-md" title="已加入遗忘曲线"><i class="fas fa-chart-line text-[10px]"></i></span>
                        </div>

                        <div class="absolute top-6 right-6 flex flex-col gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button @click="togglePin(item)" class="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm transition transform hover:scale-110" :class="item.pinned ? 'bg-amber-500 text-white' : 'bg-white/90 text-slate-400 hover:text-amber-500'" title="置顶">
                                <i class="fas fa-thumbtack text-xs"></i>
                            </button>
                            <button @click="toggleCurve(item)" class="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm transition transform hover:scale-110" :class="item.inCurve ? 'bg-indigo-500 text-white' : 'bg-white/90 text-slate-400 hover:text-indigo-500'" title="加入遗忘曲线">
                                <i class="fas fa-chart-line text-xs"></i>
                            </button>
                        </div>

                        <div class="h-36 rounded-xl bg-slate-800 relative overflow-hidden mb-4 border border-slate-100 flex items-center justify-center">
                            <img :src="item.imageUrl" class="max-w-full max-h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity">
                            <div class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm z-10">
                                {{ item.masks.length }} 个遮挡点
                            </div>
                        </div>

                        <div class="flex-1 px-1">
                            <div class="flex gap-1.5 mb-2 flex-wrap">
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-50 text-slate-500 border-slate-100">{{ item.subject }}</span>
                                <span v-if="item.grade" class="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-50 text-slate-500 border-slate-200">{{ item.grade }}</span>
                                <span v-if="item.orderNum && item.orderNum > 0" class="text-[10px] font-bold px-2 py-0.5 rounded border bg-pink-50 text-pink-500 border-pink-100">No.{{ item.orderNum }}</span>
                            </div>
                            <h4 class="font-bold text-slate-800 text-lg line-clamp-1 mb-1" :title="item.title">{{ item.title }}</h4>
                        </div>

                        <div class="mt-2 pt-3 border-t border-slate-50 flex justify-between items-center">
                            <div class="flex gap-0.5">
                                <i v-for="n in 5" :key="n" 
                                   class="fas fa-star text-[8px]" 
                                   :class="n <= Math.round((item.proficiency||0)/2) ? 'text-yellow-400' : 'text-slate-200'">
                                </i>
                            </div>
                            
                            <div class="flex gap-2">
                                <button @click="openEditor(item)" class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-pink-500 transition flex items-center justify-center" title="编辑遮挡"><i class="fas fa-edit text-xs"></i></button>
                                <button @click="$emit('delete-occlusion', item.id)" class="w-8 h-8 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition flex items-center justify-center" title="删除"><i class="fas fa-trash text-xs"></i></button>
                                <button @click="startTest(item)" class="px-4 py-1.5 bg-slate-900 hover:bg-pink-600 text-white rounded-lg text-xs font-bold shadow-md transition transform active:scale-95 flex items-center gap-1">
                                    <i class="fas fa-play"></i> 开始
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showEditor" class="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[80] flex flex-col animate-fade-in text-white">
            <div class="h-16 px-6 border-b border-white/10 flex justify-between items-center bg-slate-900 shrink-0">
                <div class="flex items-center gap-4">
                    <button @click="showEditor=false" class="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition"><i class="fas fa-times"></i></button>
                    <h3 class="font-bold text-lg">{{ isEditing ? '编辑遮挡卡片' : '新建遮挡卡片' }}</h3>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-xs text-slate-400">
                        <span v-if="currentMasks.length > 0">已添加 <span class="text-pink-400 font-bold">{{ currentMasks.length }}</span> 个遮挡框</span>
                        <span v-else>请在图片上 <span class="text-pink-400 font-bold">按住左键拖动</span> 绘制遮挡</span>
                    </div>
                    <button @click="saveItem" class="px-6 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl shadow-lg shadow-pink-900/50 transition transform active:scale-95">
                        保存全部
                    </button>
                </div>
            </div>

            <div class="flex flex-1 overflow-hidden">
                <div class="w-[350px] bg-slate-800/50 border-r border-white/5 p-6 flex flex-col gap-6 overflow-y-auto">
                    <label v-if="!imgPreview" class="border-2 border-dashed border-slate-600 rounded-2xl h-48 flex flex-col items-center justify-center text-slate-400 hover:border-pink-500 hover:text-pink-500 transition cursor-pointer group hover:bg-slate-800/50">
                        <i class="fas fa-cloud-upload-alt text-3xl mb-2 group-hover:scale-110 transition-transform"></i>
                        <span class="text-sm font-bold">点击选择图片</span>
                        <span class="text-[10px] text-slate-500 mt-1">支持 JPG, PNG, GIF</span>
                        <input type="file" accept="image/*" class="hidden" @change="handleImageSelect">
                    </label>
                    
                    <div v-else class="space-y-4">
                        <div class="h-32 rounded-xl bg-slate-900 relative overflow-hidden border border-slate-700 group flex items-center justify-center">
                            <img :src="imgPreview" class="max-w-full max-h-full object-contain">
                            <label v-if="!isEditing" class="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-sm font-bold">
                                <i class="fas fa-sync-alt mb-1"></i>重新选择
                                <input type="file" accept="image/*" class="hidden" @change="handleImageSelect">
                            </label>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="grid grid-cols-3 gap-3">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 mb-1">学科</label>
                                <select v-model="form.subject" @change="handleSubjectGradeChange" class="w-full px-2 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-sm text-white focus:border-pink-500 outline-none transition">
                                    <option v-for="s in subjects" :value="s">{{ s }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 mb-1">年级</label>
                                <select v-model="form.grade" @change="handleSubjectGradeChange" class="w-full px-2 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-sm text-white focus:border-pink-500 outline-none transition">
                                    <option v-for="g in grades" :value="g">{{ g }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 mb-1">排序编号</label>
                                <input type="number" v-model.number="form.orderNum" class="w-full px-2 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-sm text-pink-400 font-bold focus:border-pink-500 outline-none transition" placeholder="自动计算">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 mb-1">标题 <span class="text-pink-500">*</span></label>
                            <input v-model="form.title" class="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-sm text-white focus:border-pink-500 outline-none transition" placeholder="例如: 动植物细胞结构图">
                        </div>
                    </div>
                </div>

                <div class="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center p-8 select-none" @mouseup="endDraw" @mouseleave="endDraw">
                    <div v-if="imgPreview" class="relative inline-block shadow-2xl rounded-lg overflow-hidden cursor-crosshair" @mousedown="startDraw" @mousemove="drawing" ref="imageContainer">
                        <img :src="imgPreview" class="max-h-[80vh] max-w-full block select-none pointer-events-none" draggable="false">
                        
                        <div v-for="(mask, idx) in currentMasks" :key="idx" class="absolute bg-orange-500/60 border border-orange-300 hover:bg-red-500/80 hover:border-red-300 transition cursor-pointer flex items-center justify-center shadow-sm group z-10" :style="{ left: mask.x + '%', top: mask.y + '%', width: mask.w + '%', height: mask.h + '%' }" @click.stop="removeMask(idx)" @mousedown.stop>
                            <i class="fas fa-times text-white text-[10px] opacity-0 group-hover:opacity-100"></i>
                        </div>

                        <div v-if="activeDrawingMask" class="absolute bg-blue-500/40 border border-blue-300 z-20 pointer-events-none" :style="{ left: activeDrawingMask.x + '%', top: activeDrawingMask.y + '%', width: activeDrawingMask.w + '%', height: activeDrawingMask.h + '%' }"></div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showTestModal" class="fixed inset-0 bg-slate-950 z-[90] flex flex-col animate-fade-in" tabindex="0" ref="testModalWrapper">
            <div class="h-16 px-8 border-b border-white/10 flex justify-between items-center bg-slate-900 shrink-0 text-white">
                <div class="flex items-center gap-4">
                    <button @click="closeTestModal" class="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition"><i class="fas fa-times"></i></button>
                    <div>
                        <h2 class="font-bold text-lg">{{ testItem.title }}</h2>
                        <span class="text-xs text-slate-400">点击橙色块揭晓答案，再次点击隐藏 | 支持键盘 ← / → 切换</span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button @click="toggleAllMasks(true)" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition">全部遮挡</button>
                    <button @click="toggleAllMasks(false)" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition">全部揭晓</button>
                </div>
            </div>

            <div class="flex-1 overflow-auto flex items-center justify-center p-8 bg-slate-950 relative">
                <button v-if="hasPrevTest" @click="navTest(-1)" class="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white text-2xl backdrop-blur-md transition-all hover:scale-110 z-50">
                    <i class="fas fa-chevron-left"></i>
                </button>

                <div class="relative inline-block shadow-2xl rounded-lg overflow-hidden select-none">
                    <img :src="testItem.imageUrl" class="max-h-[80vh] max-w-full block" draggable="false">
                    
                    <div v-for="(mask, idx) in testMasksStatus" :key="idx"
                         class="absolute border transition-all duration-300 cursor-pointer shadow-sm"
                         :class="mask.visible ? 'bg-orange-500 border-orange-400 opacity-100' : 'bg-transparent border-emerald-400/50 opacity-100 hover:bg-emerald-500/10'"
                         :style="{ left: mask.data.x + '%', top: mask.data.y + '%', width: mask.data.w + '%', height: mask.data.h + '%' }"
                         @click="toggleMask(idx)"
                    >
                    </div>
                </div>

                <button v-if="hasNextTest" @click="navTest(1)" class="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white text-2xl backdrop-blur-md transition-all hover:scale-110 z-50">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <div class="h-20 border-t border-white/10 bg-slate-900 flex items-center justify-center gap-6 shrink-0">
                <span class="text-slate-400 text-sm font-bold">自评掌握程度:</span>
                <div class="flex gap-2">
                    <button v-for="n in 5" :key="n" 
                            @click="rateProficiency(n * 2)" 
                            class="w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all transform hover:scale-110"
                            :class="n * 2 <= (testItem.proficiency || 0) ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'"
                            :title="n + '星'"
                    >
                        {{ n }}
                    </button>
                </div>
            </div>
        </div>

    </div>
    `,
    setup(props, { emit }) {
        const currentSubject = ref('all');
        const currentGrade = ref('all');
        const searchQuery = ref(''); 
        
        // --- 核心修复：多重排序逻辑 ---
        const filteredList = computed(() => {
            let list = [...props.occlusions];
            
            // 1. 学科 & 年级过滤
            if (currentSubject.value !== 'all') list = list.filter(c => c.subject === currentSubject.value);
            if (currentGrade.value !== 'all') list = list.filter(c => c.grade === currentGrade.value);
            
            // 2. 模糊搜索
            if (searchQuery.value.trim()) {
                const keyword = searchQuery.value.toLowerCase();
                list = list.filter(c => c.title.toLowerCase().includes(keyword));
            }

            // 3. 排序：置顶(pinned)优先 > 编号(orderNum)从小到大 > 创建时间倒序
            return list.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                
                const orderA = (a.orderNum !== undefined && a.orderNum !== null && a.orderNum !== '') ? Number(a.orderNum) : Infinity;
                const orderB = (b.orderNum !== undefined && b.orderNum !== null && b.orderNum !== '') ? Number(b.orderNum) : Infinity;
                
                if (orderA !== orderB) return orderA - orderB;
                return b.id - a.id;
            });
        });

        // 自动计算下一个编号
        const calculateNextOrderNum = (subject, grade) => {
            const existing = props.occlusions.filter(c => c.subject === subject && c.grade === grade);
            const maxOrder = existing.reduce((max, c) => Math.max(max, Number(c.orderNum) || 0), 0);
            return maxOrder + 1;
        };

        const togglePin = (item) => emit('update-occlusion', item.id, { pinned: !item.pinned });
        const toggleCurve = (item) => emit('update-occlusion', item.id, { inCurve: !item.inCurve });

        // --- 编辑逻辑 ---
        const showEditor = ref(false);
        const isEditing = ref(false);
        const imgPreview = ref(null);
        const imageFile = ref(null);
        const imageContainer = ref(null);
        const currentMasks = ref([]); 
        const form = ref({ id: null, title: '', subject: '', grade: '', orderNum: 1 });

        const openEditor = (item) => {
            if (item) {
                isEditing.value = true;
                form.value = { ...item };
                form.value.orderNum = item.orderNum || 0;
                imgPreview.value = item.imageUrl;
                currentMasks.value = JSON.parse(JSON.stringify(item.masks || []));
                imageFile.value = null;
            } else {
                isEditing.value = false;
                const defaultSub = props.subjects?.[0] || '综合';
                const defaultGrade = props.grades?.[0] || '通用';
                form.value = { 
                    title: '', subject: defaultSub, grade: defaultGrade, 
                    orderNum: calculateNextOrderNum(defaultSub, defaultGrade)
                };
                imgPreview.value = null;
                currentMasks.value = [];
                imageFile.value = null;
            }
            isDrawing.value = false;
            activeDrawingMask.value = null;
            showEditor.value = true;
        };

        const handleSubjectGradeChange = () => {
            if (!isEditing.value) {
                form.value.orderNum = calculateNextOrderNum(form.value.subject, form.value.grade);
            }
        };

        const handleImageSelect = (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) return alert('请选择一张图片文件！');

            imageFile.value = file;
            const reader = new FileReader();
            reader.onload = (event) => {
                imgPreview.value = event.target.result;
                e.target.value = ''; 
            };
            reader.readAsDataURL(file);
        };

        const isDrawing = ref(false);
        const drawStartPos = ref({ x: 0, y: 0 });
        const activeDrawingMask = ref(null);

        const startDraw = (e) => {
            if (!imageContainer.value) return;
            e.preventDefault();
            isDrawing.value = true;
            drawStartPos.value = { x: e.clientX, y: e.clientY };
            
            const rect = imageContainer.value.getBoundingClientRect();
            activeDrawingMask.value = { 
                x: ((e.clientX - rect.left) / rect.width) * 100, 
                y: ((e.clientY - rect.top) / rect.height) * 100, 
                w: 0, h: 0 
            };
        };

        const drawing = (e) => {
            if (!isDrawing.value || !activeDrawingMask.value || !imageContainer.value) return;
            const rect = imageContainer.value.getBoundingClientRect();
            const minX = Math.min(drawStartPos.value.x, e.clientX) - rect.left;
            const minY = Math.min(drawStartPos.value.y, e.clientY) - rect.top;
            const width = Math.abs(e.clientX - drawStartPos.value.x);
            const height = Math.abs(e.clientY - drawStartPos.value.y);

            activeDrawingMask.value = {
                x: (minX / rect.width) * 100,
                y: (minY / rect.height) * 100,
                w: (width / rect.width) * 100,
                h: (height / rect.height) * 100
            };
        };

        const endDraw = () => {
            if (!isDrawing.value) return;
            isDrawing.value = false;
            if (activeDrawingMask.value) {
                if (activeDrawingMask.value.w > 0.5 && activeDrawingMask.value.h > 0.5) {
                    currentMasks.value.push({ ...activeDrawingMask.value });
                }
                activeDrawingMask.value = null;
            }
        };

        const removeMask = (idx) => currentMasks.value.splice(idx, 1);

        const saveItem = () => {
            if (!imgPreview.value) return alert('请先上传图片底图！');
            if (!form.value.title.trim()) return alert('请输入卡片标题！');

            const orderNumValue = Number(form.value.orderNum) || 0;

            const formData = new FormData();
            formData.append('subject', form.value.subject);
            formData.append('grade', form.value.grade);
            formData.append('title', form.value.title);
            formData.append('orderNum', orderNumValue);
            formData.append('masks', JSON.stringify(currentMasks.value));
            
            if (imageFile.value) formData.append('imageFile', imageFile.value);
            else formData.append('imageUrl', imgPreview.value);

            if (isEditing.value) {
                emit('update-occlusion', form.value.id, {
                    title: form.value.title, 
                    subject: form.value.subject, 
                    grade: form.value.grade, 
                    orderNum: orderNumValue,
                    masks: currentMasks.value
                });
            } else {
                emit('add-occlusion', formData);
            }
            showEditor.value = false;
        };

        // --- 自测与切换逻辑 ---
        const showTestModal = ref(false);
        const testItem = ref({});
        const testMasksStatus = ref([]); 

        const currentTestIndex = computed(() => filteredList.value.findIndex(item => item.id === testItem.value.id));
        const hasPrevTest = computed(() => currentTestIndex.value > 0);
        const hasNextTest = computed(() => currentTestIndex.value < filteredList.value.length - 1);

        const startTest = (item) => {
            testItem.value = item;
            testMasksStatus.value = item.masks.map(m => ({ data: m, visible: true }));
            showTestModal.value = true;
        };

        const navTest = (offset) => {
            const newIndex = currentTestIndex.value + offset;
            if (newIndex >= 0 && newIndex < filteredList.value.length) {
                startTest(filteredList.value[newIndex]);
            }
        };

        const closeTestModal = () => showTestModal.value = false;

        const handleKeydown = (e) => {
            if (!showTestModal.value) return;
            if (e.key === 'ArrowLeft' && hasPrevTest.value) {
                navTest(-1);
            } else if (e.key === 'ArrowRight' && hasNextTest.value) {
                navTest(1);
            }
        };

        onMounted(() => window.addEventListener('keydown', handleKeydown));
        onUnmounted(() => window.removeEventListener('keydown', handleKeydown));

        const toggleMask = (idx) => testMasksStatus.value[idx].visible = !testMasksStatus.value[idx].visible;
        const toggleAllMasks = (visible) => testMasksStatus.value.forEach(m => m.visible = visible);

        const rateProficiency = (score) => {
            emit('update-occlusion', testItem.value.id, { 
                proficiency: score,
                reviewCount: (testItem.value.reviewCount || 0) + 1,
                lastReview: new Date().toISOString()
            });
            testItem.value.proficiency = score;
            if (hasNextTest.value) setTimeout(() => navTest(1), 300);
        };

        return {
            currentSubject, currentGrade, searchQuery, filteredList,
            showEditor, isEditing, form, imgPreview, imageContainer, currentMasks,
            openEditor, handleImageSelect, removeMask, saveItem, handleSubjectGradeChange,
            togglePin, toggleCurve,
            startDraw, drawing, endDraw, activeDrawingMask,
            showTestModal, testItem, testMasksStatus,
            hasPrevTest, hasNextTest, navTest, closeTestModal,
            startTest, toggleMask, toggleAllMasks, rateProficiency
        };
    }
}