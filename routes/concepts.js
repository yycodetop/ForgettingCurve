/**
 * routes/concepts.js
 * 处理概念知识库的增删改查，数据存储在根目录 concepts.json
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// 数据文件路径
const DATA_FILE = path.join(__dirname, '../concepts.json');

// 辅助函数：读取数据
const readData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        // 如果文件不存在，初始化为空数组
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

// POST: 新增概念
router.post('/', (req, res) => {
    const list = readData();
    // 生成唯一ID (使用时间戳)
    const newItem = { 
        id: Date.now(), 
        ...req.body,
        lastReview: null // 可以在此初始化复习时间字段
    };
    list.unshift(newItem); //哪怕是最新的也放在最前面
    writeData(list);
    res.json(newItem);
});

// PUT: 更新概念
router.put('/:id', (req, res) => {
    const list = readData();
    const id = parseFloat(req.params.id); // 确保 ID 类型匹配
    const index = list.findIndex(item => item.id === id);
    
    if (index !== -1) {
        // 合并旧数据和新数据
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