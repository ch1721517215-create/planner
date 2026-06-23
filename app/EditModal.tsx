'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

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

type QuadKey = 'q1' | 'q2' | 'q3' | 'q4';

type Props = {
  task: Task;
  quadrant: QuadKey;
  onClose: () => void;
  onSaved: (oldQuad: QuadKey, newQuad: QuadKey, updated: Task) => void;
};

const QUAD_OPTIONS: { key: QuadKey; label: string; sub: string }[] = [
  { key: 'q1', label: '당장 해야할 일',      sub: '급하고 중요한 일' },
  { key: 'q2', label: '나와 삶을 바꾸는 일', sub: '급하진 않지만 중요한 일' },
  { key: 'q3', label: '자동화시켜야 되는 일', sub: '급하지만 중요치 않은 일' },
  { key: 'q4', label: '없애야 할 일',         sub: '급하지도 중요하지도 않은 일' },
];

export default function EditModal({ task, quadrant, onClose, onSaved }: Props) {
  const [text, setText] = useState(task.text);
  const [dueDate, setDueDate] = useState(task.due_date);
  const [stars, setStars] = useState(task.importance);
  const [quad, setQuad] = useState<QuadKey>(quadrant);
  const [errors, setErrors] = useState<{ text?: boolean; date?: boolean; stars?: boolean }>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmedText = text.trim();
    const errs: { text?: boolean; date?: boolean; stars?: boolean } = {};
    const missing: string[] = [];
    if (!trimmedText) { errs.text  = true; missing.push('제목'); }
    if (!dueDate)     { errs.date  = true; missing.push('마감 날짜'); }
    if (stars === 0)  { errs.stars = true; missing.push('중요도'); }

    if (missing.length > 0) {
      setErrors(errs);
      setError(`${missing.join(' · ')}을(를) 입력해 주세요.`);
      return;
    }

    setErrors({});
    setError('');
    setSaving(true);

    const { error: err } = await supabase
      .from('todos')
      .update({ text: trimmedText, due_date: dueDate, importance: stars, quadrant: quad })
      .eq('id', task.id);

    setSaving(false);

    if (err) {
      setError('저장에 실패했어요. 다시 시도해 주세요.');
      return;
    }

    onSaved(quadrant, quad, { ...task, text: trimmedText, due_date: dueDate, importance: stars });
    onClose();
  }

  return (
    <div
      className="edit-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="edit-modal">

        <div className="edit-modal-header">
          <span className="edit-modal-title">할 일 수정</span>
          <button className="close-x" onClick={onClose}>&times;</button>
        </div>

        <div className="edit-modal-body">

          <div className="field">
            <label>제목</label>
            <input
              type="text"
              value={text}
              className={errors.text ? 'field-err' : ''}
              onChange={e => {
                setText(e.target.value);
                if (errors.text) setErrors(prev => ({ ...prev, text: false }));
              }}
            />
          </div>

          <div className="field">
            <label>마감 날짜</label>
            <input
              type="date"
              value={dueDate}
              className={errors.date ? 'field-err' : ''}
              onChange={e => {
                setDueDate(e.target.value);
                if (errors.date) setErrors(prev => ({ ...prev, date: false }));
              }}
            />
          </div>

          <div className="field">
            <label>중요도</label>
            <div className={`stars${errors.stars ? ' field-err-stars' : ''}`}>
              {[1, 2, 3].map(v => (
                <span
                  key={v}
                  className={`star${stars >= v ? ' on' : ''}`}
                  onClick={() => {
                    setStars(v);
                    if (errors.stars) setErrors(prev => ({ ...prev, stars: false }));
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="field">
            <label>분류</label>
            <div className="edit-quad-grid">
              {QUAD_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  className={`edit-quad-btn ${opt.key}${quad === opt.key ? ' selected' : ''}`}
                  onClick={() => setQuad(opt.key)}
                >
                  <span className="edit-quad-label">{opt.label}</span>
                  <span className="edit-quad-sub">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <div className="err">{error}</div>}

        </div>

        <div className="edit-modal-footer">
          <button className="edit-cancel-btn" onClick={onClose}>취소</button>
          <button className="edit-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>

      </div>
    </div>
  );
}
