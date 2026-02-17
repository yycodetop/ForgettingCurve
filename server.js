const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// 注册路由
app.use('/api/data', require('./routes/tasks'));
app.use('/api/vocabulary', require('./routes/vocabulary')); // 这里注意路由前缀与前端匹配

app.listen(PORT, () => {
    console.log(`Memory OS running at http://localhost:${PORT}`);
});