'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import PlanModal from './PlanModal';
import AuthScreen from './AuthScreen';

type Task = {
  id: string;
  text: string;
  due_date: string;
  importance: number;
  done: boolean;
  plan_content?: unknown;
  background_note?: string | null;
};

type Tasks = {
  q1: Task[];
  q2: Task[];
  q3: Task[];
  q4: Task[];
};

type QuadKey = keyof Tasks;

const QUAD_NAMES: Record<QuadKey, string> = {
  q1: '급하고 중요한 일 (지금 당장)',
  q2: '급하진 않지만 중요한 일 (계획해서)',
  q3: '급하지만 중요치 않은 일 (줄이거나 자동화)',
  q4: '급하지도 중요하지도 않은 일 (아예 없애기)',
};

const QUAD_INFO: Record<QuadKey, { title: string; sub: string }> = {
  q1: { title: '급하고 중요한 일', sub: '당장 해야할 일' },
  q2: { title: '급하진 않지만 중요한 일', sub: '나와 삶을 바꾸는 일' },
  q3: { title: '급하지만 중요치 않은 일', sub: '자동화시켜야 되는 일' },
  q4: { title: '급하지도 중요하지도 않은 일', sub: '없애야 할 일' },
};

const QUADS: QuadKey[] = ['q1', 'q2', 'q3', 'q4'];

const QUOTES = [
  '나를 죽이지 못하는 것은 나를 더 강하게 만든다.',
  '왜 살아야 하는지 아는 사람은 그 어떤 어려움도 견뎌낸다.',
  '춤추는 별을 낳으려면, 마음속에 혼돈을 지녀야 한다.',
  '너 자신이 되어라.',
  '괴물과 싸우는 자는 스스로 괴물이 되지 않도록 조심하라.',
  '심연을 오래 들여다보면, 심연도 너를 들여다본다.',
  '인간은 극복되어야 할 무엇이다.',
  '하루의 3분의 2를 자신을 위해 쓰지 못하는 자는 노예다.',
  '진정으로 위대한 생각은 모두 걷는 중에 떠오른다.',
  '이것이 나의 길이다. 너의 길은 어디 있는가?',
  '허물을 벗지 못하는 뱀은 죽는다.',
  '성숙함이란, 어릴 적 놀이에 쏟던 진지함을 되찾는 것이다.',
  '인간은 건너가는 다리이지, 목적이 아니다.',
  '살아 있는 모든 것은 스스로를 끊임없이 극복한다.',
];

function starStr(v: number): string {
  return '★'.repeat(v);
}

function dayDiff(dateStr: string): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function getDateClass(task: Task): string {
  if (!task.due_date || task.done) return '';
  const diff = dayDiff(task.due_date);
  if (diff === null) return '';
  if (diff < 0) return 'overdue';
  if (diff <= 1) return 'soon';
  return '';
}

function sortTasks(arr: Task[]): Task[] {
  return [...arr].sort((a, b) => {
    if (b.importance !== a.importance) return b.importance - a.importance;
    if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });
}

function currentQuad(urgent: boolean, important: boolean): QuadKey {
  if (urgent && important) return 'q1';
  if (!urgent && important) return 'q2';
  if (urgent && !important) return 'q3';
  return 'q4';
}

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    text: row.text as string,
    due_date: (row.due_date as string) ?? '',
    importance: row.importance as number,
    done: row.done as boolean,
    plan_content: row.plan_content,
    background_note: (row.background_note as string) ?? null,
  };
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tasks, setTasks] = useState<Tasks>({ q1: [], q2: [], q3: [], q4: [] });
  const [formOpen, setFormOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [inputDate, setInputDate] = useState('');
  const [stars, setStars] = useState(0);
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(false);
  const [panelQuad, setPanelQuad] = useState<QuadKey | null>(null);
  const [planTask, setPlanTask] = useState<Task | null>(null);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHint, setAiHint] = useState('');
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [quoteVisible, setQuoteVisible] = useState(true);
  const quoteTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 인증 상태 구독
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 사용자 변경 시 할 일 로드 (로그아웃 시 초기화)
  useEffect(() => {
    if (!user) {
      setTasks({ q1: [], q2: [], q3: [], q4: [] });
      setPanelQuad(null);
      setPlanTask(null);
      setFormOpen(false);
      return;
    }
    async function loadTasks() {
      const { data } = await supabase
        .from('todos')
        .select('id, text, quadrant, importance, due_date, done, plan_content, background_note')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true });
      if (!data) return;
      const organized: Tasks = { q1: [], q2: [], q3: [], q4: [] };
      for (const row of data) {
        const q = row.quadrant as QuadKey;
        if (organized[q]) organized[q].push(rowToTask(row));
      }
      setTasks(organized);
    }
    loadTasks();
  }, [user?.id]);

  const advanceQuote = useCallback(() => {
    setQuoteVisible(false);
    setTimeout(() => {
      setQuoteIdx(i => (i + 1) % QUOTES.length);
      setQuoteVisible(true);
    }, 300);
  }, []);

  const resetQuoteTimer = useCallback(() => {
    if (quoteTimerRef.current) clearInterval(quoteTimerRef.current);
    quoteTimerRef.current = setInterval(advanceQuote, 10000);
  }, [advanceQuote]);

  useEffect(() => {
    resetQuoteTimer();
    return () => { if (quoteTimerRef.current) clearInterval(quoteTimerRef.current); };
  }, [resetQuoteTimer]);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const quad = currentQuad(urgent, important);
  const quadHint = `→ ${QUAD_NAMES[quad]}`;

  let total = 0, doneCount = 0, soonCount = 0;
  QUADS.forEach(q => {
    tasks[q].forEach(t => {
      total++;
      if (t.done) doneCount++;
      else {
        const diff = dayDiff(t.due_date);
        if (diff !== null && diff <= 1 && diff >= 0) soonCount++;
      }
    });
  });

  async function handleAiClassify() {
    const text = inputText.trim();
    if (!text) {
      setError('먼저 할 일 내용을 입력해 주세요.');
      return;
    }
    setAiLoading(true);
    setAiHint('');
    setError('');
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, dueDate: inputDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'AI 분류에 실패했어요.');
        return;
      }
      setUrgent(data.urgent);
      setImportant(data.important);
      setAiHint(`✨ AI 분류: ${data.reason}`);
    } catch {
      setError('네트워크 오류가 발생했어요. 다시 시도해주세요.');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit() {
    if (!user) return;
    const text = inputText.trim();
    if (!text) {
      setError('할 일 내용을 입력해 주세요.');
      return;
    }
    const q = currentQuad(urgent, important);
    if (tasks[q].length >= 7) {
      setError('이 칸은 꽉 찼어요 (최대 7개).');
      return;
    }
    const { data, error: err } = await supabase
      .from('todos')
      .insert({
        text,
        quadrant: q,
        importance: stars || 1,
        due_date: inputDate || null,
        done: false,
        user_id: user.id,
      })
      .select('id, text, quadrant, importance, due_date, done')
      .single();
    if (err || !data) {
      setError('저장에 실패했어요. 다시 시도해 주세요.');
      return;
    }
    setTasks(prev => ({
      ...prev,
      [q]: [...prev[q], rowToTask(data)],
    }));
    setInputText('');
    setInputDate('');
    setStars(0);
    setUrgent(false);
    setImportant(false);
    setError('');
    setAiHint('');
    setFormOpen(false);
  }

  async function handleToggleDone(q: QuadKey, id: string) {
    const task = tasks[q].find(t => t.id === id);
    if (!task) return;
    const newDone = !task.done;
    await supabase.from('todos').update({ done: newDone }).eq('id', id);
    setTasks(prev => ({
      ...prev,
      [q]: prev[q].map(t => t.id === id ? { ...t, done: newDone } : t),
    }));
  }

  async function handleDelete(q: QuadKey, id: string) {
    await supabase.from('todos').delete().eq('id', id);
    setTasks(prev => ({
      ...prev,
      [q]: prev[q].filter(t => t.id !== id),
    }));
  }

  function handlePlanSaved(id: string, content: unknown) {
    setTasks(prev => {
      const updated = { ...prev };
      for (const q of QUADS) {
        updated[q] = prev[q].map(t => t.id === id ? { ...t, plan_content: content } : t);
      }
      return updated;
    });
    setPlanTask(pt => pt && pt.id === id ? { ...pt, plan_content: content } : pt);
  }

  function handleBackgroundNoteSaved(id: string, note: string) {
    setTasks(prev => {
      const updated = { ...prev };
      for (const q of QUADS) {
        updated[q] = prev[q].map(t => t.id === id ? { ...t, background_note: note } : t);
      }
      return updated;
    });
    setPlanTask(pt => pt && pt.id === id ? { ...pt, background_note: note } : pt);
  }

  const panelTasks = panelQuad ? tasks[panelQuad] : [];

  if (authLoading) return null;
  if (!user) return <AuthScreen />;

  return (
    <>
      <div className="bg-shapes">
        <div className="sh circle s1" />
        <div className="sh square s2" />
        <div className="sh tri s3" />
        <div className="sh square s4" />
        <div className="sh circle s5" />
        <div className="sh circle s6" />
      </div>

      <div className="wrap">
        <div className="topbar">
          <div>
            <div className="main-title">그대여 걱정하지 말아요.</div>
            <div className="title">
              <span className="now">NOW.</span>{' '}
              <span className="must">MUST.</span>{' '}
              <span className="done">TILL DONE.</span>
            </div>
            <div className="subtitle">Eisenhower Matrix</div>
          </div>
          <div className="topbar-right">
            <button className="add-btn" onClick={() => setFormOpen(f => !f)}>
              + 할 일 추가
            </button>
            <div className="user-bar">
              <span className="user-email">{user.email}</span>
              <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
            </div>
          </div>
        </div>

        <div className="stats">
          <span>전체 <b>{total}</b>개</span>
          <span>완료 <b className="done-n">{doneCount}</b>개</span>
          <span>마감임박 <b className="soon-n">{soonCount}</b>개</span>
        </div>

        <div className={`form-box${formOpen ? ' open' : ''}`}>
          <div className="field">
            <label>할 일</label>
            <div className="input-row">
              <input
                type="text"
                placeholder="무엇을 해야 하나요?"
                value={inputText}
                onChange={e => { setInputText(e.target.value); setAiHint(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              <button
                type="button"
                className={`ai-btn${aiLoading ? ' loading' : ''}`}
                onClick={handleAiClassify}
                disabled={aiLoading}
                title="AI가 사분면을 자동 분류합니다"
              >
                {aiLoading ? '분류 중…' : '✨ AI 자동 분류'}
              </button>
            </div>
            {aiHint && <div className="ai-hint">{aiHint}</div>}
          </div>
          <div className="row">
            <div className="field">
              <label>마감 날짜</label>
              <input
                type="date"
                value={inputDate}
                onChange={e => setInputDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label>중요도</label>
              <div className="stars">
                {[1, 2, 3].map(v => (
                  <span
                    key={v}
                    className={`star${stars >= v ? ' on' : ''}`}
                    onClick={() => setStars(v)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="field">
            <label>분류 (급함 / 중요)</label>
            <div className="toggles">
              <div
                className={`toggle${urgent ? ' on' : ''}`}
                onClick={() => setUrgent(u => !u)}
              >
                급함
              </div>
              <div
                className={`toggle${important ? ' on' : ''}`}
                onClick={() => setImportant(i => !i)}
              >
                중요
              </div>
            </div>
            <div className="quad-hint">{quadHint}</div>
          </div>
          <button className="submit-btn" onClick={handleSubmit}>추가</button>
          {error && <div className="err">{error}</div>}
        </div>

        <div className="matrix">
          {QUADS.map(q => {
            const info = QUAD_INFO[q];
            const sorted = sortTasks(tasks[q]);
            return (
              <div key={q} className={`quad ${q}`} onClick={() => setPanelQuad(q)}>
                <div className="quad-title">{info.title}</div>
                <div className="quad-sub">{info.sub}</div>
                <div className="quad-cnt">{tasks[q].length} / 7</div>
                <div className="quad-list">
                  {sorted.length === 0 ? (
                    <div className="empty">할 일 없음</div>
                  ) : (
                    sorted.map(t => (
                      <div
                        key={t.id}
                        className={`task-mini${t.done ? ' done' : ''}${getDateClass(t) ? ` ${getDateClass(t)}` : ''}`}
                      >
                        <span className="t">{t.text}</span>
                        <span className="st">{starStr(t.importance)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="quote-box"
          onClick={() => { advanceQuote(); resetQuoteTimer(); }}
          title="클릭하면 다음 명언"
        >
          <div className={`quote-fade${quoteVisible ? '' : ' fade-out'}`}>
            <p className="quote-text">&#8220;{QUOTES[quoteIdx]}&#8221;</p>
            <span className="quote-attr">— 프리드리히 니체</span>
          </div>
        </div>
      </div>

      {planTask && (
        <PlanModal
          key={planTask.id}
          task={planTask}
          onClose={() => setPlanTask(null)}
          onSaved={handlePlanSaved}
          onBackgroundNoteSaved={handleBackgroundNoteSaved}
        />
      )}

      <div
        className={`overlay${panelQuad ? ' open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) setPanelQuad(null); }}
      >
        <div className="panel">
          <div className="panel-head">
            <h2>{panelQuad ? QUAD_NAMES[panelQuad] : ''}</h2>
            <button className="close-x" onClick={() => setPanelQuad(null)}>&times;</button>
          </div>
          <div>
            {panelTasks.length === 0 ? (
              <p className="empty">아직 할 일이 없어요.</p>
            ) : (
              sortTasks(panelTasks).map(t => {
                const dc = getDateClass(t);
                const icon = dc === 'overdue' ? '⚠ ' : dc === 'soon' ? '⏰ ' : '📅 ';
                const dateLabel = t.due_date ? `${icon}${t.due_date}` : '마감 없음';
                return (
                  <div key={t.id} className={`task-full${t.done ? ' done' : ''}`}>
                    <div className="tf-row">
                      <span
                        className="tf-title tf-title-link"
                        onClick={() => setPlanTask(t)}
                        title="메모 열기"
                      >
                        {t.text}
                        <span className="plan-badge">{t.plan_content ? '📋' : '+'}</span>
                      </span>
                      <span className="tf-stars">{starStr(t.importance)}</span>
                    </div>
                    <div className="tf-meta">
                      <span className={`date${dc ? ` ${dc}` : ''}`}>{dateLabel}</span>
                      <span className="tf-actions">
                        <button
                          className="tf-btn chk"
                          onClick={() => panelQuad && handleToggleDone(panelQuad, t.id)}
                        >
                          {t.done ? '취소' : '완료'}
                        </button>
                        <button
                          className="tf-btn del"
                          onClick={() => panelQuad && handleDelete(panelQuad, t.id)}
                        >
                          삭제
                        </button>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
