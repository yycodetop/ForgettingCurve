import { createApp, ref, computed, onMounted } from 'vue';

import { useTasks } from './composables/useTasks.js';
import { useVocabulary } from './composables/useVocabulary.js';
import { usePomodoro } from './composables/usePomodoro.js';

import DashboardApp from './apps/DashboardApp.js';
import EnglishApp from './apps/EnglishApp.js';
import TheDock from './components/TheDock.js';

const app = createApp({
    components: { DashboardApp, EnglishApp, TheDock },
    setup() {
        const API_BASE = '/api';
        
        const taskModule = useTasks(API_BASE);
        const vocabModule = useVocabulary(API_BASE);
        const pomodoroModule = usePomodoro();

        const currentApp = ref('dashboard');
        const recitationData = ref([]); 
        
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

        onMounted(async () => {
            await Promise.all([taskModule.loadTasks(), vocabModule.loadBooks()]);
        });

        const handleAddWord = async (wordObj) => {
            vocabModule.newWord.value = wordObj; // [修复] 变量名修正
            await vocabModule.addManualWord();
        };

        const handleRecitationRequest = async (bookIds) => {
            const data = await vocabModule.fetchAggregateVocab(bookIds);
            recitationData.value = data;
        };

        return {
            currentApp,
            englishTasks,
            recitationData, 
            ...taskModule,
            ...vocabModule,
            ...pomodoroModule,
            handleAddWord,
            handleRecitationRequest
        };
    }
});

app.mount('#app');