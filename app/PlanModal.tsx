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

export default function PlanModal({ task, onClose, onSaved, onBackgroundNoteSaved }: Props) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [backgroundNote, setBackgroundNote] = useState(task.background_note ?? '');
  const [tips, setTips] = useState<string[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tipsError, setTipsError] = useState('');
  const backgroundNoteRef = useRef(task.background_note ?? '');
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const note = task.background_note ?? '';
    setBackgroundNote(note);
    backgroundNoteRef.current = note;
    setTips([]);
    setTipsError('');
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
    if (!editor || tips.length === 0) return;
    const end = editor.state.doc.content.size;
    editor.chain().focus().insertContentAt(end, [
      { type: 'paragraph' },
      { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: '💡 AI 팁' }] },
      {
        type: 'bulletList',
        content: tips.map(tip => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: tip }] }],
        })),
      },
    ]).run();
  }

  async function handleGenerateTips() {
    setTipsLoading(true);
    setTipsError('');
    setTips([]);
    try {
      const res = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: task.text, backgroundNote: backgroundNoteRef.current }),
      });
      const data = await res.json();
      if (!res.ok) { setTipsError(data.error ?? 'AI 오류가 발생했어요.'); return; }
      setTips(data.tips as string[]);
    } catch {
      setTipsError('네트워크 오류가 발생했어요.');
    } finally {
      setTipsLoading(false);
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

        {/* AI 도움말 + 배경 메모 */}
        <div className="plan-tips-section">
          <div className="tips-bg-wrap">
            <textarea
              className="tips-bg-textarea"
              placeholder="이 과제의 배경/상황 (선택) — 적으면 AI 팁이 더 맞춤형이 돼요"
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
              className={`ai-tips-btn${tipsLoading ? ' loading' : ''}`}
              onClick={handleGenerateTips}
              disabled={tipsLoading}
            >
              {tipsLoading ? 'AI가 팁을 찾는 중...' : '💡 AI 도움말'}
            </button>
            {tipsError && <span className="tips-err">{tipsError}</span>}
          </div>
          {tips.length > 0 && (
            <>
              <ul className="tips-list">
                {tips.map((tip, i) => (
                  <li key={i} className="tips-item">{tip}</li>
                ))}
              </ul>
              <button className="tips-add-btn" onClick={handleAddToMemo}>
                📥 메모에 추가
              </button>
            </>
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
