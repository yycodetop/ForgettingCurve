// 【新增】忽略本地开发环境下的 SSL 证书验证错误（解决 UNABLE_TO_GET_ISSUER_CERT_LOCALLY 问题）
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

// 请确保这里换成了您自己的真实 API Key
const AI_API_KEY = 'sk-f6616d15718b46f8921bf2bc5ddf92eb'; 

// 初始化 OpenAI 客户端，指向 DeepSeek 的服务
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com', // 注意：不要加 /v1，SDK会自动处理
    apiKey: AI_API_KEY
});

router.post('/memory-decoder', async (req, res) => {
    const { word } = req.body;

    if (!word) {
        return res.status(400).json({ error: '请提供需要解码的单词' });
    }

    const prompt = `你是一个非常幽默、擅长启发中小学生的英语魔法老师。
学生现在遇到了一个难记的单词：【${word}】。
请你帮她"解码"这个单词，打破死记硬背。

请直接返回一段美观的 HTML 格式的代码（不需要 markdown 标记，直接返回带标签的内容即可），包含以下三个部分：
1. 🧩 <b>词根词缀拆解</b>：如果有词根词缀，请拆解说明；如果没有，请说明它的起源。
2. 💡 <b>趣味记忆法</b>：用好玩的谐音梗、联想、或者生动的故事来记住它。越夸张、越好玩越好！
3. 🎯 <b>常见黄金搭配</b>：给出 1-2 个最地道、最常用的短语搭配，并附带简短的中文解释。

注意：语言要生动活泼，多用 Emoji，排版清晰，适合孩子阅读。不要输出多余的解释，直接输出 HTML 内容。`;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "deepseek-chat", 
            temperature: 0.7 
        });

        const aiReply = completion.choices[0].message.content;
        res.json({ success: true, content: aiReply });

    } catch (error) {
        console.error("AI 解码失败:", error);
        // 如果还有报错，可以通过这里将具体的 error message 返回给前端方便排查
        res.status(500).json({ success: false, error: '魔法老师暂时走开了，具体原因: ' + error.message });
    }
});

module.exports = router;