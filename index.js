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
  console.log('🟢 수신된 user_input:', userInput);  // 이 줄 추가

  if (!userInput) {
    return res.status(400).json({ error: 'Missing user_input' });
  }

  const payload = {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:  `당신은 생명과학 실험 추천 도우미입니다.
사용자의 요구에 따라 필요한 실험 방법과 실험 재료를 추천하세요.
응답 형식은 다음과 같아야 합니다:

1. 실험 절차 (3~5단계로 나누어 설명)
2. 실험 재료 목록 (한 줄에 하나씩, 줄바꿈 \\n 으로 구분)

사용자의 질문이 모호하더라도 먼저 가능한 실험을 추천한 후, 필요한 정보를 요청하세요.`
      },
      {
        role: 'user',
        content: String(userInput)
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
