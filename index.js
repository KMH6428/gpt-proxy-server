const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// 🔵 [추가] UTF-8 헤더 강제 설정
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

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
        content: '너는 생명과학 실험 추천 도우미야. 사용자의 실험 목적에 맞는 재료를 한 줄씩 줄바꿈으로 추천해줘.'
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

    // 🔵 [중요] JSON 문자열로 명시적 전송
    res.send(JSON.stringify(response.data));
  } catch (error) {
    console.error(error?.response?.data || error.message);
    res.status(500).json({ error: 'Error communicating with OpenAI API' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
