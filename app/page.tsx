'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Task = {
  id: string;
  text: string;
  due_date: string;
  importance: number;
  done: boolean;
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
  q1: { title: '급하고 중요한 일', sub: '지금 당장' },
  q2: { title: '급하진 않지만 중요한 일', sub: '계획해서' },
  q3: { title: '급하지만 중요치 않은 일', sub: '줄이거나 자동화' },
  q4: { title: '급하지도 중요하지도 않은 일', sub: '아예 없애기' },
};

const QUADS: QuadKey[] = ['q1', 'q2', 'q3', 'q4'];

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
  };
}

export default function Home() {
  const [tasks, setTasks] = useState<Tasks>({ q1: [], q2: [], q3: [], q4: [] });
  const [formOpen, setFormOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [inputDate, setInputDate] = useState('');
  const [stars, setStars] = useState(0);
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(false);
  const [panelQuad, setPanelQuad] = useState<QuadKey | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTasks() {
      const { data } = await supabase
        .from('todos')
        .select('id, text, quadrant, importance, due_date, done')
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
  }, []);

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

  async function handleSubmit() {
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

  const panelTasks = panelQuad ? tasks[panelQuad] : [];

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
            <div className="title">
              <span className="now">NOW.</span>{' '}
              <span className="must">MUST.</span>{' '}
              <span className="done">TILL DONE.</span>
            </div>
            <div className="subtitle">Eisenhower Matrix</div>
          </div>
          <button className="add-btn" onClick={() => setFormOpen(f => !f)}>
            + 할 일 추가
          </button>
        </div>

        <div className="stats">
          <span>전체 <b>{total}</b>개</span>
          <span>완료 <b className="done-n">{doneCount}</b>개</span>
          <span>마감임박 <b className="soon-n">{soonCount}</b>개</span>
        </div>

        <div className={`form-box${formOpen ? ' open' : ''}`}>
          <div className="field">
            <label>할 일</label>
            <input
              type="text"
              placeholder="무엇을 해야 하나요?"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
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
      </div>

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
                      <span className="tf-title">{t.text}</span>
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
