import { NextRequest } from 'next/server';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function buildPrompt(text: string): string {
  return `당신은 실행 코치입니다. 사용자의 할 일을 오늘 당장 시작할 수 있는 구체적인 행동 3단계로 쪼개주세요.

할 일: "${text}"

규칙:
1. 각 단계는 반드시 동사로 시작하는 구체적인 행동이어야 합니다. ("준비하기", "근무하기"처럼 막연하게 요약하지 마세요.)
2. 단계마다 무엇을, 어떻게 해야 하는지 명확히 드러나야 합니다.
3. 오늘 당장 첫걸음을 뗄 수 있을 만큼 작고 실행 가능해야 합니다.
4. 할 일이 막연하면, 그것을 시작하기 위한 현실적인 첫 3가지 행동으로 나눠주세요.
5. 한국어로, 각 단계는 한 문장으로 간결하게 (40자 이내).

좋은 예시:
- "수영장 가기" → ["가방에 수영복·수경·수건 챙겨 현관에 두기", "강습 시간 확인하고 출발 알람 맞추기", "도착 후 준비운동 하고 입수하기"]
- "보고서 작성하기" → ["보고서 목차 초안을 빈 문서에 적기", "핵심 데이터 3가지를 찾아 수치 메모하기", "서론 단락 2~3문장 초고 쓰기"]
- "운동 루틴 만들기" → ["이번 주 운동 가능한 요일과 시간대 3개 적기", "할 운동 종류(유산소/근력) 각 1가지씩 결정하기", "첫날 루틴을 캘린더에 일정으로 등록하기"]

나쁜 예시 (이렇게 하지 마세요):
- "출근하기", "근무하기", "퇴근하기" — 행동이 아닌 상태를 나열한 것
- "준비하기", "진행하기", "마무리하기" — 너무 막연함

반드시 아래 JSON 형식 하나만 응답하세요. 다른 텍스트는 절대 쓰지 마세요.
{"steps":["단계1","단계2","단계3"]}`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'GROQ_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }

  const body = await request.json();
  const text: string = (body.text ?? '').trim();
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
        messages: [{ role: 'user', content: buildPrompt(text) }],
        temperature: 0.3,
        max_tokens: 200,
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

  const jsonMatch = raw.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) {
    return Response.json({ error: 'AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.' }, { status: 502 });
  }

  let parsed: { steps?: unknown };
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return Response.json({ error: 'AI 응답 파싱 실패' }, { status: 502 });
  }

  if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
    return Response.json({ error: 'AI가 단계를 생성하지 못했습니다.' }, { status: 502 });
  }

  return Response.json({ steps: (parsed.steps as string[]).slice(0, 3) });
}
