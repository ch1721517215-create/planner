import { NextRequest } from 'next/server';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function buildPrompt(text: string, backgroundNote: string): string {
  const bgLine = backgroundNote.trim() ? `배경/상황: "${backgroundNote.trim()}"\n` : '';
  return `당신은 실용 코치입니다. 아래 할 일에 대해 바로 써먹을 수 있는 구체적인 참고 팁을 3~5가지 제안해주세요.

할 일: "${text}"
${bgLine}
규칙:
- 교과서적 일반론 절대 금지 ("계획을 세워라", "집중해라", "꾸준히 해라")
- 이 과제에 실제로 도움이 되는, 오늘 바로 써먹을 수 있는 팁만
- 배경 메모가 있으면 그 상황에 100% 맞게 (없으면 과제 자체에 맞게)
- 한국어로, 각 팁은 1~2문장 간결하게
- 3~5개

반드시 아래 JSON 형식만 응답. 다른 텍스트 없이.
{"tips":["팁1","팁2","팁3"]}`;
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
        temperature: 0.5,
        max_tokens: 400,
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

  let parsed: { tips?: unknown };
  try { parsed = JSON.parse(jsonMatch[0]); } catch {
    return Response.json({ error: 'AI 응답 파싱 실패' }, { status: 502 });
  }

  if (!Array.isArray(parsed.tips) || parsed.tips.length === 0) {
    return Response.json({ error: 'AI가 팁을 생성하지 못했습니다.' }, { status: 502 });
  }

  return Response.json({ tips: (parsed.tips as unknown[]).map(t => String(t)).slice(0, 5) });
}
