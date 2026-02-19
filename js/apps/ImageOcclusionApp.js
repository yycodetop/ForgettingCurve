/**
 * js/apps/ImageOcclusionApp.js
 * 图像遮挡独立模块 - v1.0
 * 功能：
 * 1. 解决数理化生读图难题，通过"遮罩-揭晓"机制记忆
 * 2. 编辑模式：上传图片 -> 点击位置生成遮罩(Mask)
 * 3. 自测模式：遮罩覆盖 -> 点击揭晓底图文字 -> 自评
 */
import { ref, computed, nextTick, onUnmounted } from 'vue';

export default {
    props: ['subjects', 'grades', 'occlusions'], // 接收父组件传来的列表数据
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
                <button @click="openEditor(null)" class="px-5 py-2.5 rounded-2xl font-bold text-white shadow-lg bg-pink-500 hover:bg-pink-600 shadow-pink-200 transition transform active:scale-95 flex items-center gap-2 text-sm">
                    <i class="fas fa-plus"></i> 新建遮挡卡片
                </button>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
                <div v-if="filteredList.length === 0" class="h-full flex flex-col items-center justify-center text-slate-300">
                    <div class="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                        <i class="fas fa-image text-4xl opacity-50"></i>
                    </div>
                    <p class="font-bold text-lg">暂无图片卡片</p>
                </div>

                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 pb-24">
                    <div v-for="item in filteredList" :key="item.id" 
                         class="group relative bg-white rounded-[1.5rem] p-4 transition-all duration-300 flex flex-col h-[280px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:border-pink-200 hover:-translate-y-1"
                    >
                        <div class="h-36 rounded-xl bg-slate-100 relative overflow-hidden mb-4 border border-slate-100">
                            <img :src="item.imageUrl" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity">
                            <div class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm">
                                {{ item.masks.length }} 个遮挡点
                            </div>
                        </div>

                        <div class="flex-1 px-1">
                            <div class="flex gap-2 mb-2">
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-50 text-slate-500 border-slate-100">{{ item.subject }}</span>
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-50 text-slate-500 border-slate-200">{{ item.grade }}</span>
                            </div>
                            <h4 class="font-bold text-slate-800 text-lg line-clamp-1 mb-1">{{ item.title }}</h4>
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
                    <h3 class="font-bold text-lg">{{ isEditing ? '编辑遮挡' : '上传图片并设置遮挡' }}</h3>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-xs text-slate-400" v-if="currentMasks.length > 0">
                        已添加 <span class="text-pink-400 font-bold">{{ currentMasks.length }}</span> 个遮挡框 (点击图片添加，点击红框删除)
                    </div>
                    <button @click="saveItem" class="px-6 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl shadow-lg shadow-pink-900/50 transition transform active:scale-95">
                        保存全部
                    </button>
                </div>
            </div>

            <div class="flex flex-1 overflow-hidden">
                <div class="w-80 bg-slate-800/50 border-r border-white/5 p-6 flex flex-col gap-6 overflow-y-auto">
                    <div v-if="!imgPreview" class="border-2 border-dashed border-slate-600 rounded-2xl h-48 flex flex-col items-center justify-center text-slate-400 hover:border-pink-500 hover:text-pink-500 transition cursor-pointer relative group">
                        <i class="fas fa-cloud-upload-alt text-3xl mb-2"></i>
                        <span class="text-sm">点击上传图片</span>
                        <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" @change="handleImageSelect">
                    </div>
                    
                    <div v-else class="space-y-4">
                        <div class="h-32 rounded-xl bg-slate-900 relative overflow-hidden border border-slate-700 group">
                            <img :src="imgPreview" class="w-full h-full object-contain">
                            <button @click="reuploadImage" class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-sm font-bold"><i class="fas fa-sync-alt mr-2"></i>重传</button>
                            <input type="file" accept="image/*" ref="reuploadInput" class="hidden" @change="handleImageSelect">
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 mb-1">标题</label>
                            <input v-model="form.title" class="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-sm text-white focus:border-pink-500 outline-none transition" placeholder="例如: 心脏结构图">
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 mb-1">学科</label>
                                <select v-model="form.subject" class="w-full px-3 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-sm text-white focus:border-pink-500 outline-none transition">
                                    <option v-for="s in subjects" :value="s">{{ s }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 mb-1">年级</label>
                                <select v-model="form.grade" class="w-full px-3 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-sm text-white focus:border-pink-500 outline-none transition">
                                    <option v-for="g in grades" :value="g">{{ g }}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center p-8 select-none">
                    <div v-if="imgPreview" 
                         class="relative inline-block shadow-2xl rounded-lg overflow-hidden cursor-crosshair"
                         @click="addMask"
                         ref="imageContainer"
                    >
                        <img :src="imgPreview" class="max-h-[80vh] max-w-full block" draggable="false">
                        
                        <div v-for="(mask, idx) in currentMasks" :key="idx"
                             class="absolute bg-orange-500/80 border-2 border-orange-300 hover:bg-red-500/80 hover:border-red-300 transition cursor-pointer flex items-center justify-center shadow-md group"
                             :style="{ left: mask.x + '%', top: mask.y + '%', width: mask.w + '%', height: mask.h + '%' }"
                             @click.stop="removeMask(idx)"
                        >
                            <i class="fas fa-times text-white text-[10px] opacity-0 group-hover:opacity-100"></i>
                        </div>
                        
                        <div v-if="currentMasks.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div class="bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur text-sm">
                                点击图片任意位置添加遮挡框 (默认大小)
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-slate-600 font-bold text-xl">请先在左侧上传图片</div>
                </div>
            </div>
        </div>

        <div v-if="showTestModal" class="fixed inset-0 bg-slate-950 z-[90] flex flex-col animate-fade-in">
            <div class="h-16 px-8 border-b border-white/10 flex justify-between items-center bg-slate-900 shrink-0 text-white">
                <div class="flex items-center gap-4">
                    <button @click="showTestModal=false" class="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition"><i class="fas fa-times"></i></button>
                    <div>
                        <h2 class="font-bold text-lg">{{ testItem.title }}</h2>
                        <span class="text-xs text-slate-400">点击橙色块揭晓答案，再次点击隐藏</span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button @click="toggleAllMasks(true)" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition">全部显示</button>
                    <button @click="toggleAllMasks(false)" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition">全部隐藏</button>
                </div>
            </div>

            <div class="flex-1 overflow-auto flex items-center justify-center p-8 bg-slate-950 relative">
                <div class="relative inline-block shadow-2xl rounded-lg overflow-hidden">
                    <img :src="testItem.imageUrl" class="max-h-[85vh] max-w-full block" draggable="false">
                    
                    <div v-for="(mask, idx) in testMasksStatus" :key="idx"
                         class="absolute border-2 transition-all duration-300 cursor-pointer shadow-sm"
                         :class="mask.visible ? 'bg-orange-500 border-orange-400 opacity-100' : 'bg-transparent border-emerald-400/50 opacity-100 hover:bg-emerald-500/10'"
                         :style="{ left: mask.data.x + '%', top: mask.data.y + '%', width: mask.data.w + '%', height: mask.data.h + '%' }"
                         @click="toggleMask(idx)"
                    >
                    </div>
                </div>
            </div>

            <div class="h-20 border-t border-white/10 bg-slate-900 flex items-center justify-center gap-6 shrink-0">
                <span class="text-slate-400 text-sm font-bold">本次熟练度自评:</span>
                <div class="flex gap-2">
                    <button v-for="n in 5" :key="n" 
                            @click="rateProficiency(n * 2)" 
                            class="w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all transform hover:scale-110"
                            :class="n * 2 <= (testItem.proficiency || 0) ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'"
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
        
        // 列表数据
        const filteredList = computed(() => {
            let list = [...props.occlusions];
            if (currentSubject.value !== 'all') list = list.filter(c => c.subject === currentSubject.value);
            if (currentGrade.value !== 'all') list = list.filter(c => c.grade === currentGrade.value);
            return list.reverse();
        });

        // --- 编辑逻辑 ---
        const showEditor = ref(false);
        const isEditing = ref(false);
        const imgPreview = ref(null);
        const imageFile = ref(null);
        const imageContainer = ref(null);
        const currentMasks = ref([]); // [{x,y,w,h}] (percentages)
        
        const form = ref({ id: null, title: '', subject: '数学', grade: '' });

        const openEditor = (item) => {
            if (item) {
                isEditing.value = true;
                form.value = { ...item };
                imgPreview.value = item.imageUrl;
                currentMasks.value = JSON.parse(JSON.stringify(item.masks || []));
                imageFile.value = null;
            } else {
                isEditing.value = false;
                form.value = { title: '', subject: props.subjects[0], grade: props.grades[0] };
                imgPreview.value = null;
                currentMasks.value = [];
                imageFile.value = null;
            }
            showEditor.value = true;
        };

        const handleImageSelect = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            imageFile.value = file;
            const reader = new FileReader();
            reader.onload = (e) => imgPreview.value = e.target.result;
            reader.readAsDataURL(file);
        };

        const reuploadInput = ref(null);
        const reuploadImage = () => reuploadInput.value.click();

        // 核心：添加遮罩 (简化为点击添加固定大小框，为了MVP稳定性)
        // 进阶可做成拖拽画框，但逻辑较多
        const addMask = (e) => {
            if (!imageContainer.value) return;
            const rect = imageContainer.value.getBoundingClientRect();
            // 计算百分比坐标
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            // 默认添加一个 15% x 8% 的框，中心点对准点击处
            const w = 15;
            const h = 8;
            
            currentMasks.value.push({
                x: x - w/2,
                y: y - h/2,
                w: w,
                h: h
            });
        };

        const removeMask = (idx) => {
            currentMasks.value.splice(idx, 1);
        };

        const saveItem = () => {
            if (!form.value.title) return alert('请输入标题');
            if (!imgPreview.value) return alert('请上传图片');

            const formData = new FormData();
            formData.append('subject', form.value.subject);
            formData.append('grade', form.value.grade);
            formData.append('title', form.value.title);
            formData.append('masks', JSON.stringify(currentMasks.value));
            
            // 如果有新文件，传文件；否则传 URL 字符串
            if (imageFile.value) {
                formData.append('imageFile', imageFile.value);
            } else {
                formData.append('imageUrl', imgPreview.value);
            }

            if (isEditing.value) {
                emit('update-occlusion', form.value.id, {
                    ...form.value,
                    masks: currentMasks.value
                    // 注意：update如果是纯数据更新，不用 FormData 也可以，
                    // 但后端需要兼容。这里简化逻辑，假设 edit 主要是改 masks，
                    // 如果换图建议走 delete + add，或者后端支持 put FormData
                    // 我们之前的 useImageOcclusion 是 put json 的。
                    // 所以这里分叉处理：
                });
                // 这里的 update-occlusion 需要父组件处理，
                // 或者我们直接在这里调用 hooks?
                // 为了架构一致性，我们 Emit 出去，但是 FormData 传递比较麻烦。
                // 简单起见，如果没换图，传 JSON；换图了，提示不支持直接换图或者做特殊处理。
                // *Hack*: 我们的 updateOcclusion hook 只支持 json。
                // 暂时约定：编辑模式不支持换底图，只支持改遮罩和标题。
                // 这样我们可以直接传 JSON 对象。
                const updateData = {
                    title: form.value.title,
                    subject: form.value.subject,
                    grade: form.value.grade,
                    masks: currentMasks.value
                };
                emit('update-occlusion', form.value.id, updateData);
            } else {
                emit('add-occlusion', formData);
            }
            showEditor.value = false;
        };

        // --- 自测逻辑 ---
        const showTestModal = ref(false);
        const testItem = ref({});
        const testMasksStatus = ref([]); // [{data: {}, visible: true}]

        const startTest = (item) => {
            testItem.value = item;
            // 初始化遮罩状态：全部可见（即遮住）
            testMasksStatus.value = item.masks.map(m => ({
                data: m,
                visible: true // true = 有色块遮挡, false = 透明显示底图
            }));
            showTestModal.value = true;
        };

        const toggleMask = (idx) => {
            testMasksStatus.value[idx].visible = !testMasksStatus.value[idx].visible;
        };

        const toggleAllMasks = (visible) => {
            testMasksStatus.value.forEach(m => m.visible = visible);
        };

        const rateProficiency = (score) => {
            // 更新熟练度
            emit('update-occlusion', testItem.value.id, { 
                proficiency: score,
                reviewCount: (testItem.value.reviewCount || 0) + 1,
                lastReview: new Date().toISOString()
            });
            testItem.value.proficiency = score;
            // 不关闭，让用户决定何时关闭
            // showTestModal.value = false; 
        };

        return {
            currentSubject, currentGrade, filteredList,
            showEditor, isEditing, form, imgPreview, imageContainer, currentMasks, reuploadInput,
            openEditor, handleImageSelect, reuploadImage, addMask, removeMask, saveItem,
            
            showTestModal, testItem, testMasksStatus,
            startTest, toggleMask, toggleAllMasks, rateProficiency
        };
    }
}