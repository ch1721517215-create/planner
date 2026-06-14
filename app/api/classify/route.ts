import { NextRequest } from 'next/server';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function buildPrompt(text: string, dueDate: string): string {
  const dateLine = dueDate ? `마감일: ${dueDate}` : '마감일: 없음';
  return `아이젠하워 매트릭스에서 다음 할 일을 분류해주세요.

할 일: "${text}"
${dateLine}

기준:
- 긴급(urgent): 마감이 3일 이내이거나, 즉시 처리하지 않으면 문제가 생기는 일
- 중요(important): 목표 달성·건강·재정·관계 등 삶에 큰 영향을 미치는 일

반드시 아래 JSON 형식 하나만 응답하세요. 다른 텍스트는 절대 쓰지 마세요.
{"quadrant":"q1","urgent":true,"important":true,"reason":"한 줄 이유"}
{"quadrant":"q2","urgent":false,"important":true,"reason":"한 줄 이유"}
{"quadrant":"q3","urgent":true,"important":false,"reason":"한 줄 이유"}
{"quadrant":"q4","urgent":false,"important":false,"reason":"한 줄 이유"}`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'GROQ_API_KEY가 설정되지 않았습니다. .env.local을 확인해주세요.' },
      { status: 500 },
    );
  }

  const body = await request.json();
  const text: string = (body.text ?? '').trim();
  const dueDate: string = body.dueDate ?? '';

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
        messages: [{ role: 'user', content: buildPrompt(text, dueDate) }],
        temperature: 0.1,
        max_tokens: 128,
      }),
    });
  } catch {
    return Response.json(
      { error: 'Groq API 연결에 실패했습니다. 네트워크를 확인해주세요.' },
      { status: 502 },
    );
  }

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    if (groqRes.status === 401) {
      return Response.json(
        { error: 'Groq API 키가 유효하지 않습니다. .env.local을 확인해주세요.' },
        { status: 401 },
      );
    }
    if (groqRes.status === 429) {
      return Response.json(
        { error: 'Groq API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 },
      );
    }
    return Response.json(
      { error: `Groq API 오류: ${groqRes.status} ${errText.slice(0, 200)}` },
      { status: 502 },
    );
  }

  const groqData = await groqRes.json();
  const raw: string = groqData?.choices?.[0]?.message?.content ?? '';

  const jsonMatch = raw.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) {
    return Response.json(
      { error: 'AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.' },
      { status: 502 },
    );
  }

  const result = JSON.parse(jsonMatch[0]) as {
    quadrant: string;
    urgent: boolean;
    important: boolean;
    reason: string;
  };

  const validQuads = ['q1', 'q2', 'q3', 'q4'];
  if (!validQuads.includes(result.quadrant)) {
    return Response.json({ error: 'AI가 잘못된 사분면을 반환했습니다.' }, { status: 502 });
  }

  return Response.json({
    quadrant: result.quadrant,
    urgent: !!result.urgent,
    important: !!result.important,
    reason: result.reason ?? '',
  });
}
