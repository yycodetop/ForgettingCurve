/**
 * js/components/TheDock.js
 * 底部 Dock 栏组件 - 视觉升级版
 */
export default {
    props: ['currentApp'],
    emits: ['switchApp', 'addTask', 'openPomodoro'],
    template: `
    <div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div class="glass px-4 py-3 rounded-2xl shadow-2xl shadow-indigo-900/20 flex items-center gap-4 ring-1 ring-white/60 bg-white/80 backdrop-blur-xl transition-all hover:scale-[1.02]">
            <button v-for="app in apps" :key="app.id" 
                @click="$emit('switchApp', app.id)" 
                class="dock-item relative group w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all duration-300"
                :class="currentApp === app.id ? app.activeClass : 'bg-slate-50 hover:bg-white text-slate-400 hover:text-indigo-500'">
                <i :class="app.icon"></i>
                <span class="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg transform translate-y-2 group-hover:translate-y-0">{{ app.name }}</span>
            </button>
            
            <div class="w-px h-8 bg-slate-300 mx-2"></div>
            
            <button @click="$emit('addTask')" class="dock-item w-12 h-12 rounded-xl flex items-center justify-center text-lg bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-100 transition-transform active:scale-95" title="新建任务"><i class="fas fa-plus"></i></button>
            <button @click="$emit('openPomodoro')" class="dock-item w-12 h-12 rounded-xl flex items-center justify-center text-lg bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-100 transition-transform active:scale-95" title="番茄专注"><i class="fas fa-stopwatch"></i></button>
        </div>
    </div>
    `,
    data() {
        return {
            apps: [
                { id: 'dashboard', name: '综合概览', icon: 'fas fa-calendar-alt', activeClass: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-200 transform -translate-y-2' },
                { id: 'english', name: '英语工作室', icon: 'fas fa-language', activeClass: 'bg-blue-500 text-white shadow-lg shadow-blue-500/40 ring-2 ring-blue-200 transform -translate-y-2' },
                { id: 'math', name: '数学思维', icon: 'fas fa-shapes', activeClass: 'bg-red-500 text-white shadow-lg shadow-red-500/40 ring-2 ring-red-200 transform -translate-y-2' },
                { id: 'code', name: '编程实验', icon: 'fas fa-code', activeClass: 'bg-slate-700 text-white shadow-lg shadow-slate-500/40 ring-2 ring-slate-200 transform -translate-y-2' }
            ]
        }
    }
}