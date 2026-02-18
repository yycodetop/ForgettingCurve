/**
 * routes/concepts.js
 * 处理概念知识库的增删改查及 Excel 导入导出
 * 迭代 v2.0: 增加 Excel 模板下载与批量导入功能
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const XLSX = require('xlsx');

// 配置内存存储，用于处理上传的文件
const upload = multer({ storage: multer.memoryStorage() });

// 数据文件路径
const DATA_FILE = path.join(__dirname, '../concepts.json');

// 辅助函数：读取数据
const readData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        return [];
    }
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (e) {
        console.error('Error reading concepts.json:', e);
        return [];
    }
};

// 辅助函数：写入数据
const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('Error writing concepts.json:', e);
    }
};

// GET: 获取所有概念
router.get('/', (req, res) => {
    const data = readData();
    res.json(data);
});

// GET: 下载导入模板
router.get('/template', (req, res) => {
    try {
        const wb = XLSX.utils.book_new();
        // 定义表头和示例文本
        const ws_data = [
            ["学科", "年级", "标题", "内容"],
            ["数学", "初一", "有理数", "有理数是{{整数}}和{{分数}}的统称。"],
            ["物理", "八年级", "声音的产生", "声音是由物体{{振动}}产生的。"],
            ["生物", "七年级", "细胞核", "细胞核是{{遗传信息库}}，是细胞代谢和遗传的控制中心。"]
        ];
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        
        // 设置列宽
        ws['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 50 }];
        
        XLSX.utils.book_append_sheet(wb, ws, "导入模板");
        
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Disposition', 'attachment; filename="concepts_template.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (e) {
        console.error("Template generation error:", e);
        res.status(500).send("Error generating template");
    }
});

// POST: Excel 批量导入
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(ws);

        if (!rawData || rawData.length === 0) {
            return res.json({ success: false, message: 'Excel is empty' });
        }

        const newItems = [];
        const timestamp = Date.now();

        rawData.forEach((row, index) => {
            // 兼容中文表头和可能的英文表头
            const subject = row['学科'] || row['subject'];
            const grade = row['年级'] || row['grade'];
            const title = row['标题'] || row['title'];
            const content = row['内容'] || row['content'];

            // 只有标题和内容都存在时才导入
            if (title && content) {
                newItems.push({
                    id: timestamp + index + Math.random(), // 确保 ID 唯一
                    type: 'cloze', // 默认为挖空题
                    subject: String(subject || '通用').trim(),
                    grade: String(grade || '通用').trim(),
                    title: String(title).trim(),
                    content: String(content).trim(),
                    lastReview: null
                });
            }
        });

        if (newItems.length > 0) {
            const currentData = readData();
            // 新导入的数据放在最前面
            const updatedData = [...newItems, ...currentData];
            writeData(updatedData);
            res.json({ success: true, count: newItems.length });
        } else {
            res.json({ success: false, message: 'No valid data found (Check headers: 学科, 年级, 标题, 内容)' });
        }

    } catch (e) {
        console.error('Upload error:', e);
        res.status(500).json({ error: 'Import failed: ' + e.message });
    }
});

// POST: 新增概念
router.post('/', (req, res) => {
    const list = readData();
    const newItem = { 
        id: Date.now(), 
        ...req.body,
        lastReview: null 
    };
    list.unshift(newItem);
    writeData(list);
    res.json(newItem);
});

// PUT: 更新概念
router.put('/:id', (req, res) => {
    const list = readData();
    const id = parseFloat(req.params.id);
    const index = list.findIndex(item => item.id === id);
    
    if (index !== -1) {
        list[index] = { ...list[index], ...req.body };
        writeData(list);
        res.json(list[index]);
    } else {
        res.status(404).json({ error: 'Concept not found' });
    }
});

// DELETE: 删除概念
router.delete('/:id', (req, res) => {
    const list = readData();
    const id = parseFloat(req.params.id);
    const newList = list.filter(item => item.id !== id);
    
    if (list.length !== newList.length) {
        writeData(newList);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Concept not found' });
    }
});

module.exports = router;