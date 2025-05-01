const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

app.post('/gpt', async (req, res) => {
    const userInput = req.body.user_input;

    if (!userInput) {
        return res.status(400).json({ error: 'Missing user_input' });
    }

    const payload = {
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'system',
                content: '너는 생명과학 실험 추천 도우미야. 사용자의 실험 목적에 따라 적절한 실험 방법과 구매에 사용되는 재료를 추천해. 각 항목은 줄바꿈("\\n")으로 구분해서 리스트 형태로 제공해줘. 한 줄에 한 항목만 있어야 해.'
            },
            {
                role: 'user',
                content: userInput
            }
        ],
        temperature: 0.5
    };

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error(error?.response?.data || error.message);
        res.status(500).json({ error: 'Error communicating with OpenAI API' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
