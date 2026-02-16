export default {
    props: ['currentApp'],
    emits: ['switchApp', 'addTask', 'openPomodoro'],
    template: `
    <div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div class="glass px-3 py-3 rounded-2xl shadow-2xl shadow-indigo-900/10 flex items-center gap-3 ring-1 ring-white/50 bg-white/80 backdrop-blur-xl">
            <button v-for="app in apps" :key="app.id" 
                @click="$emit('switchApp', app.id)" 
                class="dock-item relative group w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all"
                :class="currentApp === app.id ? app.activeClass : 'bg-slate-50 hover:bg-white text-slate-600'">
                {{ app.icon }}
                <span class="absolute -top-12 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">{{ app.name }}</span>
            </button>
            
            <div class="w-px h-8 bg-slate-300 mx-1"></div>
            
            <button @click="$emit('addTask')" class="dock-item w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg">➕</button>
            <button @click="$emit('openPomodoro')" class="dock-item w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg">⏱️</button>
        </div>
    </div>
    `,
    data() {
        return {
            apps: [
                { id: 'dashboard', name: '综合概览', icon: '📅', activeClass: 'bg-indigo-100 text-indigo-600 shadow-inner' },
                { id: 'english', name: '英语工作室', icon: '🔤', activeClass: 'bg-blue-100 text-blue-600 shadow-inner' },
                { id: 'math', name: '数学思维', icon: '📐', activeClass: 'bg-red-100 text-red-600 shadow-inner' },
                { id: 'code', name: '编程实验', icon: '💻', activeClass: 'bg-slate-200 text-slate-800 shadow-inner' }
            ]
        }
    }
}