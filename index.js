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

// ✅ (1) PubMed API 호출 예시 함수
  const getPubmedSnippet = async (query) => {
    try {
      const encoded = encodeURIComponent(query);
      const response = await axios.get(
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encoded}&retmax=1&retmode=json`
      );

      const pmid = response.data.esearchresult?.idlist[0];
      if (!pmid) return '관련 논문을 찾을 수 없음.';

      const detail = await axios.get(
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`
      );

      const summary = detail.data.result?.[pmid]?.title || '';
      return `관련 논문 제목: ${summary}\nPMID: ${pmid}\n링크: https://pubmed.ncbi.nlm.nih.gov/${pmid}`;
    } catch (e) {
      console.error('🔴 논문 API 오류:', e.message);
      return '논문 정보를 불러오지 못했어.';
    }
  };

  // ✅ (2) 논문 정보 추가
  const paperInfo = await getPubmedSnippet(userInput);

  // ✅ (3) GPT 요청 payload 생성
  const payload = {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          `너는 바이오 제품 추천 도우미야. 사용자에게 실험 목적에 맞는 실험 방법과 실험에 사용되는 제품을 추천해. \
각 제품의 역할을 설명하고, 가능한 경우 대체 제품도 함께 제시해줘. 모든 응답은 HTML 형식으로 구성해줘. \
\n\n🔍 아래는 참고할 논문 정보야:\n${paperInfo}`
      },
      {
        role: 'user',
        content: String(userInput)
      }
    ],
    temperature: 0.5
  };

  console.log('🔍 GPT 요청 payload:\n', JSON.stringify(payload, null, 2));
  
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
