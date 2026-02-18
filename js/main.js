/**
 * js/main.js
 * 应用主入口 - 集成任务管理、英语学习、番茄钟及概念学习模块
 */
import { createApp, ref, computed, onMounted } from 'vue';

// 导入核心逻辑 Composable
import { useTasks } from './composables/useTasks.js';
import { useVocabulary } from './composables/useVocabulary.js';
import { usePomodoro } from './composables/usePomodoro.js';
import { useConcepts } from './composables/useConcepts.js';

// 导入应用组件
import DashboardApp from './apps/DashboardApp.js';
import EnglishApp from './apps/EnglishApp.js';
import ConceptApp from './apps/ConceptApp.js';
import TheDock from './components/TheDock.js';

const app = createApp({
    components: { 
        DashboardApp, 
        EnglishApp, 
        ConceptApp, 
        TheDock 
    },
    setup() {
        const API_BASE = '/api';
        
        // --- 初始化各业务模块 ---
        const taskModule = useTasks(API_BASE);
        const vocabModule = useVocabulary(API_BASE);
        const pomodoroModule = usePomodoro();
        const conceptModule = useConcepts(API_BASE);

        // --- 全局状态 ---
        const currentApp = ref('dashboard');
        const recitationData = ref([]); 
        
        // 概念模块初始动作状态（用于快速新建）
        const conceptInitialAction = ref(null);
        
        // --- 计算属性 ---
        // 提取英语任务给 EnglishApp 的侧边栏使用
        const englishTasks = computed(() => {
            const now = new Date().toISOString().split('T')[0];
            if (!taskModule.tasks.value) return [];
            return taskModule.tasks.value
                .filter(t => t.category === '英语' && Array.isArray(t.schedule))
                .map(t => {
                    const next = t.schedule.find(n => !n.completed && n.date >= now);
                    return next ? { id: t.id, title: t.title, nextDate: next.date, nextStage: next.stage } : null;
                })
                .filter(Boolean)
                .sort((a,b) => a.nextDate.localeCompare(b.nextDate))
                .slice(0, 10);
        });

        // --- 生命周期 ---
        onMounted(async () => {
            // 并行加载基础数据
            await Promise.all([
                taskModule.loadTasks(), 
                vocabModule.loadBooks()
            ]);
        });

        // --- 事件处理函数 ---

        // 1. 英语模块：添加单词
        const handleAddWord = async (wordObj) => {
            vocabModule.newWord.value = wordObj; 
            await vocabModule.addManualWord();
        };

        // 2. 英语模块：请求背诵数据
        const handleRecitationRequest = async (bookIds) => {
            const data = await vocabModule.fetchAggregateVocab(bookIds);
            recitationData.value = data;
        };

        // 3. 任务模块：处理任务延期
        const handlePostponeTask = ({ taskId, stage, days }) => {
            taskModule.postponeTask(taskId, stage, days);
        };

        // 4. 概念模块：处理 Excel 导入
        const handleConceptImport = async (file) => {
            try {
                // 目前主要支持导入到 'cloze' (挖空) 模式
                const result = await conceptModule.importConceptsFromExcel(file, 'cloze');
                alert(`导入完成！\n成功: ${result.success} 条\n跳过: ${result.skipped} 条 (格式错误或缺少数据)`);
            } catch (e) {
                console.error(e);
                alert("导入失败，请检查文件格式。\n需要包含: 年级 | 课程 | 原句(含{{关键词}})");
            }
        };

        // 5. 概念模块：处理快速新建跳转
        const handleQuickAddConcept = (mode) => {
            currentApp.value = mode;
            conceptInitialAction.value = 'add';
            // 重置状态，防止下次切换时自动打开
            setTimeout(() => { conceptInitialAction.value = null; }, 500);
        };

        // 6. 概念模块：处理更新
        const handleUpdateConcept = (id, data) => {
            conceptModule.updateConcept(id, data);
        };

        return {
            // 状态
            currentApp,
            englishTasks,
            recitationData, 
            conceptInitialAction,
            
            // 展开各模块状态与方法
            ...taskModule,
            ...vocabModule,
            ...pomodoroModule,
            ...conceptModule, 
            
            // 手动绑定的处理函数
            handleAddWord,
            handleRecitationRequest,
            handlePostponeTask,
            handleConceptImport,
            handleQuickAddConcept,
            handleUpdateConcept
        };
    }
});

app.mount('#app');