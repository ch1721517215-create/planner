'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import PlanModal from './PlanModal';
import EditModal from './EditModal';
import AuthScreen from './AuthScreen';

type Task = {
  id: string;
  text: string;
  due_date: string;
  importance: number;
  done: boolean;
  done_at?: string | null;
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

// 완료 통계 박스용 사분면 라벨·색상 정의
const STAT_QUADS: { key: QuadKey; label: string; color: string }[] = [
  { key: 'q1', label: '당장 해야할 일',      color: '#E24B4A' },
  { key: 'q2', label: '나와 삶을 바꾸는 일', color: '#1D9E75' },
  { key: 'q3', label: '자동화시켜야 되는 일', color: '#378ADD' },
  { key: 'q4', label: '없애야 할 일',         color: '#888780' },
];

const QUOTES: { text: string; author: string }[] = [
  { text: '이것이 나의 길이다. 너의 길은 어디 있는가?', author: '프리드리히 니체' },
  { text: '너를 죽이지 못하는 것은 너를 더 강하게 만든다.', author: '프리드리히 니체' },
  { text: '춤추는 별을 낳으려면 내면에 혼돈을 품고 있어야 한다.', author: '프리드리히 니체' },
  { text: '왜 살아야 하는지 아는 사람은 그 어떤 어려움도 견딜 수 있다.', author: '프리드리히 니체' },
  { text: '괴물과 싸우는 자는 스스로 괴물이 되지 않도록 조심해야 한다.', author: '프리드리히 니체' },
  { text: '삶이 가장 어려울 때, 가장 크게 성장한다.', author: '프리드리히 니체' },
  { text: '자신을 사랑하는 법을 배우는 것이 가장 위대한 일이다.', author: '프리드리히 니체' },
  { text: '행동하라. 그러면 길이 열린다.', author: '프리드리히 니체' },
  { text: '오늘 할 수 있는 일에 전념하라. 그러면 내일은 한 걸음 나아가 있을 것이다.', author: '마르쿠스 아우렐리우스' },
  { text: '우리의 삶은 우리의 생각이 만들어가는 것이다.', author: '마르쿠스 아우렐리우스' },
  { text: '완벽을 기대하지 말고, 진전을 이루는 데 집중하라.', author: '마르쿠스 아우렐리우스' },
  { text: '네가 가진 것에 만족하되, 더 나아지기를 멈추지 마라.', author: '마르쿠스 아우렐리우스' },
  { text: '장애물은 행동을 가로막지만, 동시에 행동의 길이 된다.', author: '마르쿠스 아우렐리우스' },
  { text: '할 수 있다고 믿든 없다고 믿든, 믿는 대로 된다.', author: '헨리 포드' },
  { text: '시작이 반이다.', author: '아리스토텔레스' },
  { text: '우리는 반복적으로 행하는 것의 결과다. 그러므로 탁월함은 행위가 아니라 습관이다.', author: '아리스토텔레스' },
  { text: '천 리 길도 한 걸음부터 시작된다.', author: '노자' },
  { text: '가장 큰 영광은 한 번도 넘어지지 않음이 아니라, 넘어질 때마다 일어서는 데 있다.', author: '넬슨 만델라' },
  { text: '오늘 누군가 그늘에 앉아 쉴 수 있는 것은, 오래 전 누군가 나무를 심었기 때문이다.', author: '워런 버핏' },
  { text: '미래를 예측하는 가장 좋은 방법은 그것을 만드는 것이다.', author: '피터 드러커' },
  { text: '작은 일들을 매일 꾸준히 하는 것이 큰 변화를 만든다.', author: '제임스 클리어' },
  { text: '당신은 목표 수준으로 올라가는 것이 아니라, 시스템 수준으로 떨어진다.', author: '제임스 클리어' },
  { text: '1퍼센트씩 나아지는 것이 처음엔 눈에 띄지 않지만, 시간이 지나면 모든 것을 바꾼다.', author: '제임스 클리어' },
  { text: '습관은 복리로 쌓인다.', author: '제임스 클리어' },
  { text: '어떤 일을 시작하기에 완벽한 때란 없다. 지금이 그때다.', author: '작자 미상' },
  { text: '행복은 습관이다. 그것을 몸에 지녀라.', author: '엘버트 허버드' },
  { text: '지식에 투자하는 것이 가장 높은 이자를 낳는다.', author: '벤저민 프랭클린' },
  { text: '오늘 할 수 있는 일을 내일로 미루지 마라.', author: '벤저민 프랭클린' },
  { text: '준비에 실패하는 것은 실패를 준비하는 것이다.', author: '벤저민 프랭클린' },
  { text: '운명을 사랑하라. 일어나는 모든 일이 너를 위한 것이다.', author: '에픽테토스' },
  { text: '중요한 것은 무슨 일이 일어나는가가 아니라, 그것에 어떻게 반응하는가이다.', author: '에픽테토스' },
  { text: '우리를 괴롭히는 것은 사건이 아니라, 그 사건에 대한 우리의 판단이다.', author: '에픽테토스' },
  { text: '어려운 일을 먼저 하라. 쉬운 일은 저절로 풀린다.', author: '세네카' },
  { text: '시간을 어떻게 쓰는가가 곧 삶을 어떻게 쓰는가이다.', author: '세네카' },
  { text: '우리는 가진 것이 적어서가 아니라, 더 많이 바라기 때문에 가난하다.', author: '세네카' },
  { text: '할 일을 미루는 사이, 삶은 빠르게 지나간다.', author: '세네카' },
  { text: '성공은 최종이 아니고, 실패는 치명이 아니다. 중요한 건 계속하는 용기다.', author: '윈스턴 처칠' },
  { text: '비관주의자는 모든 기회에서 어려움을 보고, 낙관주의자는 모든 어려움에서 기회를 본다.', author: '윈스턴 처칠' },
  { text: '위대한 일을 하는 유일한 방법은 자신이 하는 일을 사랑하는 것이다.', author: '스티브 잡스' },
  { text: '오늘이 인생의 마지막 날이라면, 지금 하려는 일을 할 것인가?', author: '스티브 잡스' },
  { text: '할 수 없다고 생각하는 동안에는 사실 그것을 하기 싫은 것이다.', author: '스피노자' },
  { text: '행동은 모든 성공의 기초적 열쇠다.', author: '파블로 피카소' },
  { text: '당신이 할 수 있거나 꿈꿀 수 있는 모든 것을 시작하라. 대담함 속에 천재성과 힘이 있다.', author: '괴테' },
  { text: '아는 것만으로는 충분치 않다. 적용해야 한다. 의지만으로는 충분치 않다. 행동해야 한다.', author: '괴테' },
  { text: '인생에서 가장 큰 위험은 아무 위험도 감수하지 않는 것이다.', author: '작자 미상' },
  { text: '넘어지는 것은 실패가 아니다. 넘어진 자리에 머무는 것이 실패다.', author: '작자 미상' },
  { text: '포기하지 마라. 고통은 잠시지만 포기는 영원하다.', author: '작자 미상' },
  { text: '가장 어두운 밤도 끝이 나고, 해는 떠오른다.', author: '빅토르 위고' },
  { text: '작게 시작하라. 하지만 시작하라.', author: '작자 미상' },
  { text: '지금 심는 씨앗이 내일의 숲이 된다.', author: '작자 미상' },
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
    done_at: (row.done_at as string) ?? null,
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
  // 필수 입력 검증: 어느 필드가 비었는지 추적
  const [formErrors, setFormErrors] = useState<{ text?: boolean; date?: boolean; stars?: boolean; quad?: boolean }>({});
  // 사용자가 분류 토글을 한 번이라도 건드렸는지 (AI 분류도 포함)
  const [classifyTouched, setClassifyTouched] = useState(false);
  // 완료 통계: 펼쳐진 사분면, 전체 보기 중인 사분면, 기간 필터
  const [statsExpanded, setStatsExpanded] = useState<QuadKey | null>(null);
  const [statsShowAll, setStatsShowAll] = useState<QuadKey | null>(null);
  const [statsFilter, setStatsFilter] = useState<'all' | 'week' | 'month'>('all');
  const [editTarget, setEditTarget] = useState<{ task: Task; quad: QuadKey } | null>(null);
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
        .select('id, text, quadrant, importance, due_date, done, done_at, plan_content, background_note')
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

  // KST(+9h) 기준 이번 주 월요일 00:00, 이번 달 1일 00:00 계산
  const KST = 9 * 60 * 60 * 1000;
  const kstNow = new Date(Date.now() + KST);
  const kstWeekStart = (() => {
    const d = new Date(kstNow);
    const dow = d.getUTCDay(); // 0=일, 1=월 ... 6=토
    d.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1));
    d.setUTCHours(0, 0, 0, 0);
    return new Date(d.getTime() - KST); // UTC로 환산
  })();
  const kstMonthStart = (() => {
    const d = new Date(kstNow);
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
    return new Date(d.getTime() - KST);
  })();

  // 선택한 기간에 해당하는 완료 항목인지 판별
  // done_at이 null인 항목은 '이번 주'/'이번 달'에서 제외, '전체'에서만 포함
  function inStatsFilter(t: Task): boolean {
    if (!t.done) return false;
    if (statsFilter === 'all') return true;
    if (!t.done_at) return false;
    const d = new Date(t.done_at);
    return statsFilter === 'week' ? d >= kstWeekStart : d >= kstMonthStart;
  }

  // 필터 적용 후 총 완료 수
  const filteredDoneCount = QUADS.reduce((s, q) => s + tasks[q].filter(inStatsFilter).length, 0);

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
      // AI 분류도 사용자가 선택한 것으로 인정
      setClassifyTouched(true);
      setFormErrors(prev => ({ ...prev, quad: false }));
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

    // 필수 항목 일괄 검증
    const errs: typeof formErrors = {};
    const missing: string[] = [];
    if (!text)             { errs.text  = true; missing.push('할 일 제목'); }
    if (!inputDate)        { errs.date  = true; missing.push('마감 날짜'); }
    if (stars === 0)       { errs.stars = true; missing.push('중요도'); }
    if (!classifyTouched)  { errs.quad  = true; missing.push('분류'); }

    if (missing.length > 0) {
      setFormErrors(errs);
      setError(`${missing.join(' · ')}을(를) 입력해 주세요.`);
      return;
    }

    setFormErrors({});
    setError('');
    const q = currentQuad(urgent, important);
    const { data, error: err } = await supabase
      .from('todos')
      .insert({
        text,
        quadrant: q,
        importance: stars,   // 검증으로 1 이상 보장됨
        due_date: inputDate,
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
    // 폼 초기화
    setInputText('');
    setInputDate('');
    setStars(0);
    setUrgent(false);
    setImportant(false);
    setClassifyTouched(false);
    setFormErrors({});
    setError('');
    setAiHint('');
    setFormOpen(false);
  }

  async function handleToggleDone(q: QuadKey, id: string) {
    const task = tasks[q].find(t => t.id === id);
    if (!task) return;
    const newDone = !task.done;
    // 완료로 바꿀 때는 현재 시각을, 미완료로 되돌릴 때는 null을 저장
    const doneAt = newDone ? new Date().toISOString() : null;
    await supabase.from('todos').update({ done: newDone, done_at: doneAt }).eq('id', id);
    // 로컬 상태에도 done_at 반영 (통계 목록 즉시 갱신)
    setTasks(prev => ({
      ...prev,
      [q]: prev[q].map(t => t.id === id ? { ...t, done: newDone, done_at: doneAt } : t),
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

  function handleEditSaved(oldQuad: QuadKey, newQuad: QuadKey, updated: Task) {
    setTasks(prev => {
      const next = { ...prev };
      if (oldQuad === newQuad) {
        next[newQuad] = prev[newQuad].map(t => t.id === updated.id ? updated : t);
      } else {
        next[oldQuad] = prev[oldQuad].filter(t => t.id !== updated.id);
        next[newQuad] = [...prev[newQuad], updated];
      }
      return next;
    });
    setPlanTask(pt => pt?.id === updated.id ? { ...pt, ...updated } : pt);
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

        <div
          className="quote-box"
          onClick={() => { advanceQuote(); resetQuoteTimer(); }}
          title="클릭하면 다음 명언"
        >
          <div className={`quote-fade${quoteVisible ? '' : ' fade-out'}`}>
            <p className="quote-text">&#8220;{QUOTES[quoteIdx].text}&#8221;</p>
            <span className="quote-attr">— {QUOTES[quoteIdx].author}</span>
          </div>
        </div>

        <div className="stats">
          <span>전체 <b>{total}</b>개</span>
          <span>완료 <b className="done-n">{doneCount}</b>개</span>
          <span>마감임박 <b className="soon-n">{soonCount}</b>개</span>
        </div>

        {/* 완료 통계 박스 */}
        <div className="completion-stats">
          <div className="cs-header">
            <span className="cs-title">완료 통계</span>
            <span className="cs-total">총 완료 <b>{filteredDoneCount}</b>개</span>
          </div>

          {/* 기간 필터 버튼 */}
          <div className="cs-filter-row">
            {(['week', 'month', 'all'] as const).map(f => (
              <button
                key={f}
                className={`cs-filter-btn${statsFilter === f ? ' active' : ''}`}
                onClick={() => {
                  // 필터 변경 시 펼침 상태 초기화
                  setStatsFilter(f);
                  setStatsExpanded(null);
                  setStatsShowAll(null);
                }}
              >
                {f === 'week' ? '이번 주' : f === 'month' ? '이번 달' : '전체'}
              </button>
            ))}
          </div>

          {filteredDoneCount === 0 ? (
            // 전체 필터일 때와 기간 필터일 때 안내 문구 구분
            <div className="cs-empty">
              {statsFilter === 'all' ? '아직 완료한 일이 없어요' : '이 기간에 완료한 일이 없어요'}
            </div>
          ) : (
            <div className="cs-bars">
              {STAT_QUADS.map(({ key, label, color }) => {
                // 기간 필터 적용 후 해당 사분면 완료 항목
                const doneTasks = tasks[key].filter(inStatsFilter);
                const count = doneTasks.length;
                const pct = Math.round(count / filteredDoneCount * 100);
                const isExpanded = statsExpanded === key;
                // 최근 완료순 정렬 (done_at 없는 항목은 뒤로)
                const sorted = [...doneTasks].sort((a, b) => {
                  if (!a.done_at && !b.done_at) return 0;
                  if (!a.done_at) return 1;
                  if (!b.done_at) return -1;
                  return new Date(b.done_at).getTime() - new Date(a.done_at).getTime();
                });
                const showAll = statsShowAll === key;
                const visible = showAll ? sorted : sorted.slice(0, 5);
                const remaining = sorted.length - 5;
                return (
                  <div key={key} className="cs-quad-section">
                    <div
                      className="cs-bar-row"
                      onClick={() => {
                        // 같은 사분면 재클릭 시 접기, 다른 사분면 클릭 시 펼치기
                        setStatsExpanded(prev => prev === key ? null : key);
                        if (statsShowAll === key) setStatsShowAll(null);
                      }}
                    >
                      <span className="cs-bar-label">{label}</span>
                      <div className="cs-bar-track">
                        <div className="cs-bar-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className="cs-bar-info">{count}개 · {pct}%</span>
                    </div>
                    {isExpanded && count > 0 && (
                      <div className="cs-tasks">
                        {visible.map(t => (
                          <div key={t.id} className="cs-task-item">{t.text}</div>
                        ))}
                        {/* 5개 초과 시 "더 보기" 버튼 */}
                        {!showAll && remaining > 0 && (
                          <button
                            className="cs-more-btn"
                            onClick={e => { e.stopPropagation(); setStatsShowAll(key); }}
                          >
                            + {remaining}개 더 보기
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={`form-box${formOpen ? ' open' : ''}`}>
          <div className="field">
            <label>할 일</label>
            <div className="input-row">
              <input
                type="text"
                placeholder="무엇을 해야 하나요?"
                value={inputText}
                className={formErrors.text ? 'field-err' : ''}
                onChange={e => {
                  setInputText(e.target.value);
                  setAiHint('');
                  // 입력하는 순간 해당 필드 에러 해제
                  if (formErrors.text) setFormErrors(prev => ({ ...prev, text: false }));
                }}
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
                className={formErrors.date ? 'field-err' : ''}
                onChange={e => {
                  setInputDate(e.target.value);
                  if (formErrors.date) setFormErrors(prev => ({ ...prev, date: false }));
                }}
              />
            </div>
            <div className="field">
              <label>중요도</label>
              {/* 에러 시 별 컨테이너에 강조 클래스 추가 */}
              <div className={`stars${formErrors.stars ? ' field-err-stars' : ''}`}>
                {[1, 2, 3].map(v => (
                  <span
                    key={v}
                    className={`star${stars >= v ? ' on' : ''}`}
                    onClick={() => {
                      setStars(v);
                      if (formErrors.stars) setFormErrors(prev => ({ ...prev, stars: false }));
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="field">
            <label>분류 (급함 / 중요)</label>
            {/* 에러 시 토글 컨테이너에 강조 클래스 추가 */}
            <div className={`toggles${formErrors.quad ? ' field-err-toggles' : ''}`}>
              <div
                className={`toggle${urgent ? ' on' : ''}`}
                onClick={() => {
                  setUrgent(u => !u);
                  // 토글을 건드린 것으로 인정, 에러 해제
                  setClassifyTouched(true);
                  if (formErrors.quad) setFormErrors(prev => ({ ...prev, quad: false }));
                }}
              >
                급함
              </div>
              <div
                className={`toggle${important ? ' on' : ''}`}
                onClick={() => {
                  setImportant(i => !i);
                  setClassifyTouched(true);
                  if (formErrors.quad) setFormErrors(prev => ({ ...prev, quad: false }));
                }}
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
                <div className="quad-cnt">{tasks[q].filter(t => !t.done).length} / {tasks[q].length}</div>
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

      </div>

      {editTarget && (
        <EditModal
          task={editTarget.task}
          quadrant={editTarget.quad}
          onClose={() => setEditTarget(null)}
          onSaved={handleEditSaved}
        />
      )}

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
                          className="tf-btn edit"
                          onClick={() => panelQuad && setEditTarget({ task: t, quad: panelQuad })}
                          title="수정"
                        >
                          ✏️
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
