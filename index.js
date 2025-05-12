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
        content:  `너는 생명과학 실험 추천 도우미야. 
사용자의 요구에 따라 적절한 실험 방법과 사용되는 재료를 추천해줘. 
추천은 구체적으로 해야 하고, 예시가 있으면 함께 제시해줘. 
실험 명, 사용 재료, 도구를 항목별로 구분해줘. 
각 항목은 줄바꿈("\\n")으로 구분하고, 한 줄에 하나의 정보만 제공해. 
사용자의 입력이 애매하거나 짧아도 실험을 유추해서 추천을 제공하려고 노력해줘.
추가적으로 원할 경우 동일 성분 타 제품에 대해서도 추천해줘.`
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
