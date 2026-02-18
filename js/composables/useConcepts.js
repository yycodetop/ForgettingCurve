/**
 * js/composables/useConcepts.js
 * 概念知识管理核心 - 增加更新逻辑
 */
import { ref } from 'vue';

export function useConcepts(API_BASE) {
    const grades = [
        '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
        '初一', '初二', '初三',
        '高一', '高二', '高三'
    ];

    const concepts = ref([
        { id: 101, type: 'cloze', subject: '生物', grade: '初一', title: '光合作用定义', content: '光合作用是绿色植物利用{{叶绿素}}等光合色素\n将{{二氧化碳}}和{{水}}转化为有机物。', tags: ['核心概念'] },
        { id: 102, type: 'image', subject: '地理', grade: '初二', title: '中国地势三级阶梯', imageUrl: '', description: '请指出第二级阶梯的范围', occlusionRegions: [] },
        { id: 103, type: 'feynman', subject: '物理', grade: '初二', title: '牛顿第一定律', content: '一切物体在没有受到力的作用时，总保持静止状态 or 匀速直线运动状态。', myExplanation: '', audioUrl: '' }
    ]);

    const getConceptsByType = (type) => concepts.value.filter(c => c.type === type);

    const addConcept = (item) => {
        concepts.value.unshift({ id: Date.now() + Math.random(), ...item });
    };

    // [新增] 更新概念
    const updateConcept = (id, updatedData) => {
        const index = concepts.value.findIndex(c => c.id === id);
        if (index !== -1) {
            concepts.value[index] = { ...concepts.value[index], ...updatedData };
        }
    };

    const deleteConcept = (id) => {
        if(confirm('确定要删除这条知识卡片吗？')) {
            concepts.value = concepts.value.filter(c => c.id !== id);
        }
    };

    const validateClozeContent = (content) => {
        const regex = /\{\{(.+?)\}\}/;
        return regex.test(content);
    };

    const importConceptsFromExcel = async (file, type) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    let successCount = 0;
                    let skipCount = 0;

                    for (let i = 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        const grade = row[0] && row[0].toString().trim();
                        const subject = row[1] && row[1].toString().trim();
                        const content = row[2] && row[2].toString().trim();

                        if (!grade || !subject || !content) {
                            skipCount++;
                            continue;
                        }

                        if (type === 'cloze' && !validateClozeContent(content)) {
                            skipCount++;
                            continue;
                        }

                        const title = content.replace(/\{\{|\}\}/g, '').substring(0, 15) + (content.length > 15 ? '...' : '');

                        addConcept({ type, grade, subject, title, content });
                        successCount++;
                    }
                    resolve({ success: successCount, skipped: skipCount });
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    };

    const getSubjectColor = (sub) => {
        const colors = {
            '数学': 'bg-red-50 text-red-600 border-red-100',
            '物理': 'bg-blue-50 text-blue-600 border-blue-100',
            '化学': 'bg-purple-50 text-purple-600 border-purple-100',
            '生物': 'bg-emerald-50 text-emerald-600 border-emerald-100',
            '地理': 'bg-amber-50 text-amber-600 border-amber-100',
            '语文': 'bg-orange-50 text-orange-600 border-orange-100',
            '英语': 'bg-indigo-50 text-indigo-600 border-indigo-100'
        };
        return colors[sub] || 'bg-slate-50 text-slate-600 border-slate-100';
    };

    return {
        concepts, grades,
        getConceptsByType, addConcept, updateConcept, deleteConcept, // 导出 updateConcept
        importConceptsFromExcel, validateClozeContent,
        getSubjectColor
    };
}