import { NextRequest } from 'next/server';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function buildPrompt(text: string, backgroundNote: string): string {
  const bgSection = backgroundNote.trim()
    ? `배경/상황: "${backgroundNote.trim()}"\n`
    : '';

  const bgExample = backgroundNote.trim()
    ? `\n배경: "당근마켓 무재고 1인 운영, 자본 적음, 초보 단계"`
    : '';

  return `당신은 독종 실행 코치입니다. 교과서적 일반론은 없습니다. 이 사람의 현실에 딱 맞는 업무계획만 씁니다.

할 일: "${text}"
${bgSection}
⛔ 절대 금지:
- "목표를 설정한다", "타겟 고객을 분석한다", "전략을 수립한다" 같은 추상적 표현
- 인터넷에서 찾을 수 있는 교과서적 표준 답변
- 배경 상황을 무시한 대기업·전문가 기준 계획
- 뻔한 일반론 ("열심히 한다", "꾸준히 실행한다")

✅ 반드시 지킬 것:
- 배경 메모가 있으면 그 맥락에 100% 맞춰서 작성 (예: "1인 무재고 셀러" → 오늘 혼자 할 수 있는 것만)
- 각 단계는 오늘 또는 이번 주에 실제로 할 수 있는 것 (무엇을, 어떻게, 어디서 구체적으로)
- 이 과제 특유의 걸림돌 — 이 상황에서만 나올 법한 것, 구체적 대처법

예시 (할 일: "스마트스토어 상품 첫 등록하기"${bgExample}):
{"goal":"오늘 중 상품 1개를 스마트스토어에 '판매중' 상태로 올리기","steps":["셀러센터 로그인 후 '상품 등록' 클릭해 빈 폼 열기","당근마켓에서 팔릴 것 같은 상품 1개 검색해 제목·가격·카테고리 메모하기","메모한 내용 그대로 폼에 입력하고 무재고 배송(위탁) 옵션 선택 후 저장하기"],"resources":"스마트스토어 셀러센터 계정, 스마트폰 또는 PC, 30분","timeEstimate":"첫 등록 30~50분, 두 번째부터 10~15분","doneWhen":"상품 상세 페이지 URL이 생기고 '구매하기' 버튼이 뜸","obstacles":"상품 이미지 없음 → 공급사 이미지 URL 그대로 사용; 가격 감이 없음 → 스마트스토어 동일 상품 최저가 -500원으로 시작"}

반드시 아래 JSON 형식 하나만 응답하세요. 한국어로. 다른 텍스트 없이.
{"goal":"...","steps":["...","...","..."],"resources":"...","timeEstimate":"...","doneWhen":"...","obstacles":"..."}`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'GROQ_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }

  const body = await request.json();
  const text: string = (body.text ?? '').trim();
  const backgroundNote: string = (body.backgroundNote ?? '').trim();
  if (!text) {
    return Response.json({ error: '할 일 내용이 없습니다.' }, { status: 400 });
  }

  let groqRes: Response;
  try {
    groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: buildPrompt(text, backgroundNote) }],
        temperature: 0.5,
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
    return Response.json({ error: 'AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.' }, { status: 502 });
  }

  let parsed: {
    goal?: unknown;
    steps?: unknown;
    resources?: unknown;
    timeEstimate?: unknown;
    doneWhen?: unknown;
    obstacles?: unknown;
  };
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return Response.json({ error: 'AI 응답 파싱 실패' }, { status: 502 });
  }

  if (!parsed.goal || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
    return Response.json({ error: 'AI가 업무계획을 생성하지 못했습니다.' }, { status: 502 });
  }

  return Response.json({
    goal: String(parsed.goal),
    steps: (parsed.steps as unknown[]).map(s => String(s)).slice(0, 6),
    resources: String(parsed.resources ?? ''),
    timeEstimate: String(parsed.timeEstimate ?? ''),
    doneWhen: String(parsed.doneWhen ?? ''),
    obstacles: String(parsed.obstacles ?? ''),
  });
}
