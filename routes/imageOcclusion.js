const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// 配置图片存储限制 (5MB)
const upload = multer({ 
    limits: { fileSize: 5 * 1024 * 1024 } 
});

const DATA_FILE = path.join(__dirname, '../image_occlusion.json');

const readData = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    } catch (e) {
        return [];
    }
};

const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// GET: 获取列表
router.get('/', (req, res) => res.json(readData()));

// POST: 新增卡片 (包含图片上传)
// 注意：前端会把 masks 坐标数据作为 JSON 字符串放在 body.masks 中
router.post('/', upload.single('imageFile'), (req, res) => {
    try {
        const list = readData();
        let imageUrl = '';
        
        // 处理图片：如果是上传的文件，转为 Base64 存入 (简化部署，生产环境建议存路径)
        if (req.file) {
            const b64 = req.file.buffer.toString('base64');
            const mime = req.file.mimetype;
            imageUrl = `data:${mime};base64,${b64}`;
        } else if (req.body.imageUrl) {
            imageUrl = req.body.imageUrl;
        }

        const newItem = {
            id: Date.now(),
            subject: req.body.subject,
            grade: req.body.grade,
            title: req.body.title,
            imageUrl: imageUrl,
            // 解析遮罩坐标数组
            masks: JSON.parse(req.body.masks || '[]'), 
            proficiency: 0,
            reviewCount: 0,
            lastReview: null
        };

        list.unshift(newItem);
        writeData(list);
        res.json(newItem);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to save image card' });
    }
});

// PUT: 更新 (支持只更新遮罩位置或熟练度，不重新传图)
router.put('/:id', (req, res) => {
    const list = readData();
    const id = parseFloat(req.params.id);
    const index = list.findIndex(item => item.id === id);
    
    if (index !== -1) {
        // 如果有新字段则更新，否则保持原样
        const updatedItem = { ...list[index], ...req.body };
        // 特殊处理 masks 字段，如果是字符串需要 parse
        if (typeof req.body.masks === 'string') {
            updatedItem.masks = JSON.parse(req.body.masks);
        }
        list[index] = updatedItem;
        writeData(list);
        res.json(list[index]);
    } else {
        res.status(404).json({ error: 'Item not found' });
    }
});

// DELETE: 删除
router.delete('/:id', (req, res) => {
    const list = readData();
    const newList = list.filter(item => item.id !== parseFloat(req.params.id));
    writeData(newList);
    res.json({ success: true });
});

module.exports = router;