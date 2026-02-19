const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../feynman.json');

// 读取数据
const readData = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (e) {
        console.error('Error reading feynman.json:', e);
        return [];
    }
};

// 写入数据
const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('Error writing feynman.json:', e);
    }
};

// GET: 获取列表
router.get('/', (req, res) => {
    res.json(readData());
});

// POST: 新增
router.post('/', (req, res) => {
    const list = readData();
    const newItem = { 
        id: Date.now(), 
        ...req.body,
        lastReview: null 
    };
    list.unshift(newItem); // 新增在最前
    writeData(list);
    res.json(newItem);
});

// PUT: 更新
router.put('/:id', (req, res) => {
    const list = readData();
    const id = parseFloat(req.params.id);
    const index = list.findIndex(item => item.id === id);
    
    if (index !== -1) {
        list[index] = { ...list[index], ...req.body };
        writeData(list);
        res.json(list[index]);
    } else {
        res.status(404).json({ error: 'Item not found' });
    }
});

// DELETE: 删除
router.delete('/:id', (req, res) => {
    const list = readData();
    const id = parseFloat(req.params.id);
    const newList = list.filter(item => item.id !== id);
    
    if (list.length !== newList.length) {
        writeData(newList);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Item not found' });
    }
});

module.exports = router;