const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');  // ✅ 추가
const app = express();

// ✅ 기존 JSON 파서 외에도 URL-encoded form 파서 추가
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🔵 UTF-8 헤더 강제 설정
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// 🔍 PubMed 논문 검색 및 요약 함수
const getPubmedSnippet = async (query) => {
  try {
    const encoded = encodeURIComponent(query);

    // Step 1: PMID 검색
    const searchRes = await axios.get(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi`,
      {
        params: {
          db: 'pubmed',
          term: encoded,
          retmax: 1,
          retmode: 'json'
        }
      }
    );

    const pmid = searchRes.data.esearchresult?.idlist[0];
    if (!pmid) return '관련 논문을 찾을 수 없음.';

    // Step 2: 논문 요약 요청
    const summaryRes = await axios.get(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi`,
      {
        params: {
          db: 'pubmed',
          id: pmid,
          retmode: 'json'
        }
      }
    );

    const summary = summaryRes.data.result?.[pmid];
    const title = summary?.title || '제목 없음';
    const authors = summary?.authors?.map(a => a.name).join(', ') || '저자 정보 없음';

    return `🔬 <strong>${title}</strong><br>👨‍🔬 저자: ${authors}<br>🔗 <a href="https://pubmed.ncbi.nlm.nih.gov/${pmid}" target="_blank">논문 링크</a>`;
  } catch (err) {
    console.error('🔴 PubMed 오류:', err.message);
    return '논문 정보를 가져오는 데 실패했어.';
  }
};

app.post('/gpt', async (req, res) => {
  const userInput = req.body.user_input;  // ✅ 수정 없음
  console.log('🟢 수신된 user_input:', userInput);

  if (!userInput) {
    return res.status(400).json({ error: 'Missing user_input' });
  }

  // 🔍 PubMed 논문 정보 불러오기
  const paperInfo = await getPubmedSnippet(userInput);
  console.log('📄 논문 정보:', paperInfo);

  // GPT 요청 페이로드
  const payload = {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          `너는 생명과학 실험 추천 도우미야. 사용자의 실험 목적에 맞는 실험 방법과 실험 재료를 HTML 형식으로 추천해줘. \
각 재료의 역할과 대체재, 링크를 포함하고, 아래 논문 정보를 참조해.\n\n${paperInfo}`
      },
      {
        role: 'user',
        content: String(userInput)
      }
    ],
    temperature: 0.5
  };

  console.log('📦 GPT payload:', JSON.stringify(payload, null, 2));
  
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

    // 응답 반환
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
