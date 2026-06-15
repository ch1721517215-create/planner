import { NextRequest } from 'next/server';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function buildPrompt(text: string): string {
  return `당신은 실행 코치입니다. 사용자의 할 일에 맞춰 구체적인 업무계획서를 한국어로 작성해주세요.

할 일: "${text}"

예시 (할 일: "기타 연습 1시간 하기"):
{"goal":"한 곡을 악보 없이 처음부터 끝까지 완주하기","steps":["기타를 현관에 꺼내 두기","연습할 곡 1곡 선택하기","메트로놈 BPM 60에 맞춰 25분 집중 연습하기","5분 손 스트레칭 후 25분 추가 연습하기"],"resources":"기타, 악보, 메트로놈 앱(무료), 조용한 방","timeEstimate":"총 1시간 (25분 연습 → 5분 휴식 → 25분 연습 → 5분 정리)","doneWhen":"선택한 곡의 1절을 끊김 없이 처음부터 끝까지 연주 성공","obstacles":"손가락 통증 → 10분마다 스트레칭; 집중이 안 될 때 → 폰을 다른 방에 두기"}

규칙:
- goal: 이 과제로 최종 이루려는 것 (1~2문장, 구체적 성과)
- steps: 실행 순서대로 3~6개 행동 (각 단계는 동사로 시작, 구체적, 40자 이내)
- resources: 준비물·자원 (쉼표 구분, 간결하게)
- timeEstimate: 단계별 또는 전체 소요 시간
- doneWhen: "이렇게 되면 끝"이라는 측정 가능한 기준 (1~2문장)
- obstacles: 예상 걸림돌과 구체적 대처법 (세미콜론 구분)
- 모든 항목은 오늘 당장 실행 가능한 수준으로, 막연한 일반론 금지

반드시 아래 JSON 형식 하나만 응답하세요. 다른 텍스트는 절대 쓰지 마세요.
{"goal":"...","steps":["...","...","..."],"resources":"...","timeEstimate":"...","doneWhen":"...","obstacles":"..."}`;
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
        temperature: 0.4,
        max_tokens: 600,
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
