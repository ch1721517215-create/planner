import { NextRequest } from 'next/server';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function buildPrompt(text: string, backgroundNote: string): string {
  const bgLine = backgroundNote.trim() ? `배경/상황: "${backgroundNote.trim()}"` : '';

  return `당신은 실행 분해 코치입니다. 아래 과제를 아이젠하워 매트릭스 + 제임스 클리어의 아토믹 해빗 철학으로 분해하세요.

과제: "${text}"
${bgLine}

[출력 규칙]
1. identity: "나는 ... 사람이다" 형식으로 이 과제를 해내는 사람의 정체성 한 문장. 거창하지 않고 진짜 동기를 파는 문장으로.

2. 4사분면 분해 (각 1~2개):
   - q1: 급하고 중요한 일 (당장 오늘 손댈 수 있는 것)
   - q2: 급하진 않지만 중요한 일 (삶을 바꾸는 반복 행동)
   - q3: 급하지만 중요치 않은 일 (자동화하거나 줄일 것)
   - q4: 급하지도 중요하지도 않은 일 (당장 없애거나 무시할 것)

3. 2분 규칙 — q1·q2 항목 끝에는 반드시 "(2분: [아주 작은 첫 행동])" 추가.
   좋은 예: "1688에서 관심 품목 3개 검색하기 (2분: 검색창에 단어 하나만 쳐보기)"
   나쁜 예: "(2분: 시작하기)" — 너무 막연함

4. 습관 쌓기 — q2 항목 중 반복적인 것은 "기존 습관 → 새 행동 (2분: ...)" 형식.
   예: "아침 커피 내린 후 → 잘 팔리는 상품 1개 분석하기 (2분: 리뷰 많은 상품 1개만 클릭)"

5. 절대 금지:
   - "열심히 한다", "전략을 수립한다", "꾸준히 한다" 같은 교과서 일반론
   - 대기업 기준의 거창한 항목
   - 과제와 무관한 뻔한 조언
   → 이 과제와 배경에 딱 맞춰서, 오늘 당장 손댈 수 있는 현실적 수준으로.

6. 배경 메모가 있으면 그 맥락(1인 운영, 자본 적음, 초보 등)을 100% 반영.

7. 한국어로, 각 항목 간결하게(50자 이내 권장). 잔소리 없이 행동 중심.

참고 예시 (과제: "씨유 알바 줄이고 온라인 셀러로 전환하기"):
{"identity":"나는 스스로 돈 버는 구조를 만드는 사람이다","q1":["1688에서 관심 품목 3개 장바구니에 담기 (2분: 검색창에 한 단어 쳐보기)"],"q2":["아침 커피 내린 후 → 잘 팔리는 상품 1개 분석하기 (2분: 리뷰 많은 상품 1개만 클릭)","스마트스토어 상품 1개 등록 연습하기 (2분: 상품명 초안만 입력)"],"q3":["주문 들어오면 발송하는 무재고 흐름 자동화하기"],"q4":["마진 안 나오는 품목 리스트에서 지우기"]}

반드시 아래 JSON 형식만 응답. 다른 텍스트 절대 없이.
{"identity":"...","q1":["..."],"q2":["..."],"q3":["..."],"q4":["..."]}`;
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

  let parsed: { identity?: unknown; q1?: unknown; q2?: unknown; q3?: unknown; q4?: unknown };
  try { parsed = JSON.parse(jsonMatch[0]); } catch {
    return Response.json({ error: 'AI 응답 파싱 실패' }, { status: 502 });
  }

  if (typeof parsed.identity !== 'string' || !Array.isArray(parsed.q1)) {
    return Response.json({ error: 'AI가 올바른 형식으로 응답하지 못했습니다. 다시 시도해주세요.' }, { status: 502 });
  }

  const toStrArr = (v: unknown) => Array.isArray(v) ? (v as unknown[]).map(t => String(t)) : [];

  return Response.json({
    identity: parsed.identity,
    q1: toStrArr(parsed.q1),
    q2: toStrArr(parsed.q2),
    q3: toStrArr(parsed.q3),
    q4: toStrArr(parsed.q4),
  });
}
