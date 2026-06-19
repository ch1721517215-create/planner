'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Image } from '@tiptap/extension-image';
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

type PlanTask = {
  id: string;
  text: string;
  plan_content?: unknown;
  background_note?: string | null;
};

type Props = {
  task: PlanTask;
  onClose: () => void;
  onSaved: (id: string, content: unknown) => void;
  onBackgroundNoteSaved: (id: string, note: string) => void;
};

type DecomposeResult = {
  identity: string;
  q1: string[];
  q2: string[];
  q3: string[];
  q4: string[];
};

const QUAD_SECTIONS: { key: keyof Omit<DecomposeResult, 'identity'>; label: string; sub: string; cls: string }[] = [
  { key: 'q1', label: '🔴 당장 해야할 일', sub: '급하고 중요', cls: 'dq-red' },
  { key: 'q2', label: '🟣 삶을 바꾸는 일', sub: '급하진 않지만 중요', cls: 'dq-purple' },
  { key: 'q3', label: '🟡 자동화시켜야 되는 일', sub: '급하지만 중요치 않음', cls: 'dq-yellow' },
  { key: 'q4', label: '⬜ 없애야 할 일', sub: '급하지도 중요하지도 않음', cls: 'dq-gray' },
];

export default function PlanModal({ task, onClose, onSaved, onBackgroundNoteSaved }: Props) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [backgroundNote, setBackgroundNote] = useState(task.background_note ?? '');
  const [decompose, setDecompose] = useState<DecomposeResult | null>(null);
  const [decomposeLoading, setDecomposeLoading] = useState(false);
  const [decomposeError, setDecomposeError] = useState('');
  const backgroundNoteRef = useRef(task.background_note ?? '');
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const note = task.background_note ?? '';
    setBackgroundNote(note);
    backgroundNoteRef.current = note;
    setDecompose(null);
    setDecomposeError('');
  }, [task.id]);

  const persist = useCallback(async (content: unknown) => {
    await supabase.from('todos').update({ plan_content: content }).eq('id', task.id);
    onSaved(task.id, content);
    setSaveStatus('saved');
    if (statusTimeout.current) clearTimeout(statusTimeout.current);
    statusTimeout.current = setTimeout(() => setSaveStatus('idle'), 2000);
  }, [task.id, onSaved]);

  async function persistBackgroundNote(note: string) {
    await supabase.from('todos').update({ background_note: note }).eq('id', task.id);
    onBackgroundNoteSaved(task.id, note);
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: (task.plan_content as object) || '',
    onUpdate: ({ editor }) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => persist(editor.getJSON()), 1500);
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      if (statusTimeout.current) clearTimeout(statusTimeout.current);
    };
  }, []);

  function handleManualSave() {
    if (!editor) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    persist(editor.getJSON());
  }

  function handleAddToMemo() {
    if (!editor || !decompose) return;
    const end = editor.state.doc.content.size;

    const nodes: object[] = [
      { type: 'paragraph' },
      {
        type: 'paragraph',
        content: [{ type: 'text', marks: [{ type: 'bold' }], text: '🧩 AI 실행 분해 (아토믹 해빗)' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', marks: [{ type: 'italic' }], text: `💬 ${decompose.identity}` }],
      },
    ];

    for (const section of QUAD_SECTIONS) {
      const items = decompose[section.key];
      if (items.length === 0) continue;
      nodes.push({
        type: 'paragraph',
        content: [{ type: 'text', marks: [{ type: 'bold' }], text: `${section.label} (${section.sub})` }],
      });
      nodes.push({
        type: 'bulletList',
        content: items.map(item => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }],
        })),
      });
    }

    editor.chain().focus().insertContentAt(end, nodes).run();
  }

  async function handleDecompose() {
    setDecomposeLoading(true);
    setDecomposeError('');
    setDecompose(null);
    try {
      const res = await fetch('/api/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: task.text, backgroundNote: backgroundNoteRef.current }),
      });
      const data = await res.json();
      if (!res.ok) { setDecomposeError(data.error ?? 'AI 오류가 발생했어요.'); return; }
      setDecompose(data as DecomposeResult);
    } catch {
      setDecomposeError('네트워크 오류가 발생했어요.');
    } finally {
      setDecomposeLoading(false);
    }
  }

  if (!editor) return null;

  const tb = (label: string, action: () => void, active?: boolean) => (
    <button
      type="button"
      className={`tb-btn${active ? ' active' : ''}`}
      onMouseDown={e => { e.preventDefault(); action(); }}
    >
      {label}
    </button>
  );

  return (
    <div className="plan-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="plan-modal">

        {/* 헤더 */}
        <div className="plan-header">
          <div className="plan-header-info">
            <div className="plan-label">메모</div>
            <div className="plan-title">{task.text}</div>
          </div>
          <div className="plan-header-actions">
            {saveStatus === 'saved' && <span className="plan-saved-msg">저장 완료</span>}
            <button type="button" className="plan-save-btn" onClick={handleManualSave}>저장</button>
            <button type="button" className="close-x" onClick={onClose}>&times;</button>
          </div>
        </div>

        {/* AI 실행 분해 + 배경 메모 */}
        <div className="plan-tips-section">
          <div className="tips-bg-wrap">
            <textarea
              className="tips-bg-textarea"
              placeholder="이 과제의 배경/상황 (선택) — 적으면 AI 분해가 더 맞춤형이 돼요"
              value={backgroundNote}
              rows={2}
              onChange={e => {
                setBackgroundNote(e.target.value);
                backgroundNoteRef.current = e.target.value;
              }}
              onBlur={() => persistBackgroundNote(backgroundNoteRef.current)}
            />
          </div>
          <div className="tips-action-row">
            <button
              className={`ai-tips-btn${decomposeLoading ? ' loading' : ''}`}
              onClick={handleDecompose}
              disabled={decomposeLoading}
            >
              {decomposeLoading ? '분해하는 중...' : '🧩 AI로 실행 분해하기'}
            </button>
            {decompose && !decomposeLoading && (
              <button
                className="ai-tips-btn ai-tips-retry"
                onClick={handleDecompose}
                disabled={decomposeLoading}
                title="다시 생성하기"
              >
                ↺ 재생성
              </button>
            )}
            {decomposeError && <span className="tips-err">{decomposeError}</span>}
          </div>

          {decompose && (
            <div className="decompose-result">
              <div className="decompose-identity">
                <span className="decompose-identity-badge">정체성</span>
                <span className="decompose-identity-text">{decompose.identity}</span>
              </div>
              <div className="decompose-quads">
                {QUAD_SECTIONS.map(section => {
                  const items = decompose[section.key];
                  if (items.length === 0) return null;
                  return (
                    <div key={section.key} className={`decompose-quad ${section.cls}`}>
                      <div className="decompose-quad-header">
                        <span className="decompose-quad-label">{section.label}</span>
                        <span className="decompose-quad-sub">{section.sub}</span>
                      </div>
                      <ul className="decompose-items">
                        {items.map((item, i) => (
                          <li key={i} className="decompose-item">{item}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
              <button className="tips-add-btn" onClick={handleAddToMemo}>
                📥 메모에 추가
              </button>
            </div>
          )}
        </div>

        {/* 툴바 */}
        <div className="plan-toolbar">
          {tb('굵게', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
          {tb('기울임', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
          <span className="tb-sep" />
          {tb('• 목록', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
          {tb('1. 목록', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
          {tb('☑ 체크', () => editor.chain().focus().toggleTaskList().run(), editor.isActive('taskList'))}
        </div>

        {/* 메모 편집기 */}
        <div className="plan-editor-wrap">
          <EditorContent editor={editor} className="plan-editor" />
        </div>

      </div>
    </div>
  );
}
