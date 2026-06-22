import { NextRequest } from 'next/server';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function buildPrompt(text: string, backgroundNote: string): string {
  const bgLine = backgroundNote.trim() ? `배경/상황: "${backgroundNote.trim()}"` : '';

  return `당신은 실행 코치입니다. 아래 과제를 오늘 당장 실행할 수 있도록 순서대로 단계(steps)로 분해하세요.

과제: "${text}"
${bgLine}

[출력 규칙]
- 3~7개의 순차 실행 단계로 나눌 것
- 첫 단계는 2분 안에 시작할 수 있는 아주 작은 행동으로
- 각 단계는 구체적이고 행동 중심 (50자 이내 권장)
- "열심히 한다", "계획을 수립한다", "꾸준히 한다" 같은 교과서 일반론 금지
- 배경이 있으면 그 맥락에 맞게 현실적으로 작성
- 반드시 자연스러운 한국어로만 작성. 한자·일본어 문자 절대 금지 (예: "開く" 대신 "열기")
- 단계는 3~6개로 묶을 것. "노트북 열기", "인터넷 연결 확인" 같이 자명한 동작은 생략하거나 다음 단계에 합칠 것. 실제 결과를 만드는 핵심 행동 위주로만 나눌 것

참고 예시 (과제: "씨유 알바 줄이고 온라인 셀러로 전환하기"):
{"steps":["1688 검색창에 관심 키워드 하나 입력해보기","리뷰 많은 상품 1개 클릭해서 가격·마진 구조 파악하기","스마트스토어에서 상품명 초안 1개 입력해보기","무재고 발송 흐름 유튜브 영상 1개 보기","첫 상품 등록 완료 후 지인 1명에게 링크 공유하기"]}

반드시 아래 JSON 형식만 응답. 다른 텍스트 절대 없이.
{"steps":["...","...","..."]}`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'GROQ_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }

  const body = await request.json();
  const text: string = (body.text ?? '').trim();
  const backgroundNote: string = body.backgroundNote ?? '';
  if (!text) {
    return Response.json({ error: '할 일 내용이 없습니다.' }, { status: 400 });
  }

  let groqRes: Response;
  try {
    groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: buildPrompt(text, backgroundNote) }],
        temperature: 0.65,
        max_tokens: 700,
      }),
    });
  } catch {
    return Response.json({ error: '네트워크 오류가 발생했습니다.' }, { status: 502 });
  }

  if (!groqRes.ok) {
    if (groqRes.status === 429) {
      return Response.json({ error: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
    }
    return Response.json({ error: `Groq API 오류: ${groqRes.status}` }, { status: 502 });
  }

  const groqData = await groqRes.json();
  const raw: string = groqData?.choices?.[0]?.message?.content ?? '';

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return Response.json({ error: 'AI 응답을 파싱할 수 없습니다.' }, { status: 502 });
  }

  let parsed: { steps?: unknown };
  try { parsed = JSON.parse(jsonMatch[0]); } catch {
    return Response.json({ error: 'AI 응답 파싱 실패' }, { status: 502 });
  }

  if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
    return Response.json({ error: 'AI가 올바른 형식으로 응답하지 못했습니다. 다시 시도해주세요.' }, { status: 502 });
  }

  const steps = (parsed.steps as unknown[]).map(t => String(t));
  const refinedSteps = await refineIfNeeded(steps, apiKey);

  return Response.json({ steps: refinedSteps });
}

// CJK 한자(U+4E00–U+9FFF 등) 또는 일본어 가나(U+3040–U+30FF) 포함 여부
function hasCJK(str: string): boolean {
  return /[぀-ヿ一-鿿㐀-䶿豈-﫿]/.test(str);
}

async function refineIfNeeded(steps: string[], apiKey: string): Promise<string[]> {
  if (!steps.some(hasCJK)) return steps;

  const prompt = `아래 문장들을 의미를 유지한 채 100% 자연스러운 한국어로만 다시 써라. 한자·일본어 문자 절대 금지. 문장 수와 순서는 그대로 유지.

${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

반드시 아래 JSON 형식만 응답. 다른 텍스트 절대 없이.
{"steps":["...","..."]}`;

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 700,
      }),
    });
    if (!res.ok) return steps;

    const data = await res.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return steps;

    const refined: { steps?: unknown } = JSON.parse(match[0]);
    if (!Array.isArray(refined.steps) || refined.steps.length === 0) return steps;

    return (refined.steps as unknown[]).map(t => String(t));
  } catch {
    return steps;
  }
}
