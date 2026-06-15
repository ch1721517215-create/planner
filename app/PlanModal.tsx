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

type Step = { id: string; text: string; done: boolean };

export type WorkPlanStep = { id: string; text: string; done: boolean };
export type WorkPlan = {
  goal: string;
  steps: WorkPlanStep[];
  resources: string;
  timeEstimate: string;
  doneWhen: string;
  obstacles: string;
};

type PlanTask = {
  id: string;
  text: string;
  plan_content?: unknown;
  steps?: Step[];
  work_plan?: WorkPlan | null;
};

type Props = {
  task: PlanTask;
  onClose: () => void;
  onSaved: (id: string, content: unknown) => void;
  onStepsSaved: (id: string, steps: Step[]) => void;
  onWorkPlanSaved: (id: string, plan: WorkPlan | null) => void;
};

const PLAN_SECTIONS: { key: keyof Omit<WorkPlan, 'steps'>; emoji: string; label: string }[] = [
  { key: 'goal', emoji: '🎯', label: '목표' },
  { key: 'resources', emoji: '🧰', label: '필요한 것' },
  { key: 'timeEstimate', emoji: '⏱', label: '예상 소요' },
  { key: 'doneWhen', emoji: '✅', label: '완료 기준' },
  { key: 'obstacles', emoji: '⚠️', label: '걸림돌 & 대비' },
];

export default function PlanModal({ task, onClose, onSaved, onStepsSaved, onWorkPlanSaved }: Props) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [localSteps, setLocalSteps] = useState<Step[]>(task.steps ?? []);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [stepsError, setStepsError] = useState('');
  const [workPlan, setWorkPlan] = useState<WorkPlan | null>(task.work_plan ?? null);
  const [workPlanLoading, setWorkPlanLoading] = useState(false);
  const [workPlanError, setWorkPlanError] = useState('');
  const stepsRef = useRef<Step[]>(task.steps ?? []);
  const workPlanRef = useRef<WorkPlan | null>(task.work_plan ?? null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSteps(task.steps ?? []);
    stepsRef.current = task.steps ?? [];
    const wp = task.work_plan ?? null;
    setWorkPlan(wp);
    workPlanRef.current = wp;
  }, [task.id]);

  const persist = useCallback(async (content: unknown) => {
    await supabase.from('todos').update({ plan_content: content }).eq('id', task.id);
    onSaved(task.id, content);
    setSaveStatus('saved');
    if (statusTimeout.current) clearTimeout(statusTimeout.current);
    statusTimeout.current = setTimeout(() => setSaveStatus('idle'), 2000);
  }, [task.id, onSaved]);

  async function persistSteps(steps: Step[]) {
    await supabase.from('todos').update({ steps }).eq('id', task.id);
    onStepsSaved(task.id, steps);
  }

  async function persistWorkPlan(plan: WorkPlan | null) {
    await supabase.from('todos').update({ work_plan: plan }).eq('id', task.id);
    onWorkPlanSaved(task.id, plan);
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

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor) return;

    setUploadStatus('uploading');
    const ext = file.name.split('.').pop() ?? 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from('plan-images')
      .upload(fileName, file, { contentType: file.type });

    if (error) {
      setUploadStatus('error');
      if (statusTimeout.current) clearTimeout(statusTimeout.current);
      statusTimeout.current = setTimeout(() => setUploadStatus('idle'), 3000);
      return;
    }

    const { data: urlData } = supabase.storage.from('plan-images').getPublicUrl(fileName);
    editor.chain().focus().setImage({ src: urlData.publicUrl }).run();
    setUploadStatus('idle');
  }

  async function handleGenerateSteps() {
    setStepsLoading(true);
    setStepsError('');
    try {
      const res = await fetch('/api/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: task.text }),
      });
      const data = await res.json();
      if (!res.ok) { setStepsError(data.error ?? 'AI 오류가 발생했어요.'); return; }
      const newSteps: Step[] = (data.steps as string[]).map(s => ({
        id: crypto.randomUUID(),
        text: s,
        done: false,
      }));
      stepsRef.current = newSteps;
      setLocalSteps(newSteps);
      await persistSteps(newSteps);
    } catch {
      setStepsError('네트워크 오류가 발생했어요.');
    } finally {
      setStepsLoading(false);
    }
  }

  async function handleToggleStep(stepId: string) {
    const newSteps = stepsRef.current.map(s => s.id === stepId ? { ...s, done: !s.done } : s);
    stepsRef.current = newSteps;
    setLocalSteps(newSteps);
    await persistSteps(newSteps);
  }

  function handleStepTextChange(stepId: string, text: string) {
    const newSteps = stepsRef.current.map(s => s.id === stepId ? { ...s, text } : s);
    stepsRef.current = newSteps;
    setLocalSteps(newSteps);
  }

  async function handleStepBlur() {
    await persistSteps(stepsRef.current);
  }

  async function handleDeleteStep(stepId: string) {
    const newSteps = stepsRef.current.filter(s => s.id !== stepId);
    stepsRef.current = newSteps;
    setLocalSteps(newSteps);
    await persistSteps(newSteps);
  }

  async function handleAddStep() {
    const newSteps = [...stepsRef.current, { id: crypto.randomUUID(), text: '', done: false }];
    stepsRef.current = newSteps;
    setLocalSteps(newSteps);
    await persistSteps(newSteps);
  }

  async function handleGenerateWorkPlan() {
    setWorkPlanLoading(true);
    setWorkPlanError('');
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: task.text }),
      });
      const data = await res.json();
      if (!res.ok) { setWorkPlanError(data.error ?? 'AI 오류가 발생했어요.'); return; }
      const newPlan: WorkPlan = {
        goal: data.goal,
        steps: (data.steps as string[]).map(s => ({ id: crypto.randomUUID(), text: s, done: false })),
        resources: data.resources,
        timeEstimate: data.timeEstimate,
        doneWhen: data.doneWhen,
        obstacles: data.obstacles,
      };
      workPlanRef.current = newPlan;
      setWorkPlan(newPlan);
      await persistWorkPlan(newPlan);
    } catch {
      setWorkPlanError('네트워크 오류가 발생했어요.');
    } finally {
      setWorkPlanLoading(false);
    }
  }

  function handleWorkPlanFieldChange(field: keyof Omit<WorkPlan, 'steps'>, value: string) {
    if (!workPlanRef.current) return;
    const updated = { ...workPlanRef.current, [field]: value };
    workPlanRef.current = updated;
    setWorkPlan(updated);
  }

  async function handleWorkPlanFieldBlur() {
    if (workPlanRef.current) await persistWorkPlan(workPlanRef.current);
  }

  async function handleToggleWorkPlanStep(id: string) {
    if (!workPlanRef.current) return;
    const updated = {
      ...workPlanRef.current,
      steps: workPlanRef.current.steps.map(s => s.id === id ? { ...s, done: !s.done } : s),
    };
    workPlanRef.current = updated;
    setWorkPlan(updated);
    await persistWorkPlan(updated);
  }

  function handleWorkPlanStepTextChange(id: string, text: string) {
    if (!workPlanRef.current) return;
    const updated = {
      ...workPlanRef.current,
      steps: workPlanRef.current.steps.map(s => s.id === id ? { ...s, text } : s),
    };
    workPlanRef.current = updated;
    setWorkPlan(updated);
  }

  async function handleWorkPlanStepBlur() {
    if (workPlanRef.current) await persistWorkPlan(workPlanRef.current);
  }

  async function handleDeleteWorkPlanStep(id: string) {
    if (!workPlanRef.current) return;
    const updated = {
      ...workPlanRef.current,
      steps: workPlanRef.current.steps.filter(s => s.id !== id),
    };
    workPlanRef.current = updated;
    setWorkPlan(updated);
    await persistWorkPlan(updated);
  }

  async function handleAddWorkPlanStep() {
    if (!workPlanRef.current) return;
    const updated = {
      ...workPlanRef.current,
      steps: [...workPlanRef.current.steps, { id: crypto.randomUUID(), text: '', done: false }],
    };
    workPlanRef.current = updated;
    setWorkPlan(updated);
    await persistWorkPlan(updated);
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
            <div className="plan-label">세부 계획서</div>
            <div className="plan-title">{task.text}</div>
          </div>
          <div className="plan-header-actions">
            {uploadStatus === 'error' && <span className="plan-upload-err">업로드 실패</span>}
            {saveStatus === 'saved' && <span className="plan-saved-msg">저장 완료</span>}
            <button type="button" className="plan-save-btn" onClick={handleManualSave}>저장</button>
            <button type="button" className="close-x" onClick={onClose}>&times;</button>
          </div>
        </div>

        {/* AI 실행 단계 */}
        <div className="plan-steps-section">
          <div className="steps-top">
            <span className="steps-label">실행 단계</span>
            <button
              className={`ai-steps-btn${stepsLoading ? ' loading' : ''}`}
              onClick={handleGenerateSteps}
              disabled={stepsLoading}
            >
              {stepsLoading ? '생성 중…' : '✨ AI로 3단계 나누기'}
            </button>
          </div>
          {stepsError && <div className="steps-err">{stepsError}</div>}
          <div className="plan-steps-list">
            {localSteps.map(step => (
              <div key={step.id} className="step-row">
                <input
                  type="checkbox"
                  className="step-check"
                  checked={step.done}
                  onChange={() => handleToggleStep(step.id)}
                />
                <input
                  type="text"
                  className={`step-input${step.done ? ' done' : ''}`}
                  value={step.text}
                  placeholder="단계 내용"
                  onChange={e => handleStepTextChange(step.id, e.target.value)}
                  onBlur={handleStepBlur}
                />
                <button className="step-del-btn" onClick={() => handleDeleteStep(step.id)}>×</button>
              </div>
            ))}
            <button className="step-add-btn" onClick={handleAddStep}>+ 단계 추가</button>
          </div>
        </div>

        {/* AI 업무계획 */}
        <div className="plan-workplan-section">
          <div className="workplan-top">
            <span className="steps-label">업무계획</span>
            <button
              className={`ai-plan-btn${workPlanLoading ? ' loading' : ''}`}
              onClick={handleGenerateWorkPlan}
              disabled={workPlanLoading}
            >
              {workPlanLoading ? '업무계획 만드는 중...' : '📋 AI 업무계획 만들기'}
            </button>
          </div>
          {workPlanError && <div className="steps-err">{workPlanError}</div>}

          {workPlan === null ? (
            <div className="workplan-empty">
              버튼을 눌러 AI가 6개 항목의 업무계획서를 만들어 드려요.
            </div>
          ) : (
            <div className="workplan-cards">
              {/* 세부 단계 카드 */}
              <div className="workplan-card">
                <div className="workplan-card-title">📋 세부 단계</div>
                <div className="workplan-steps-list">
                  {workPlan.steps.map(s => (
                    <div key={s.id} className="step-row">
                      <input
                        type="checkbox"
                        className="step-check"
                        checked={s.done}
                        onChange={() => handleToggleWorkPlanStep(s.id)}
                      />
                      <input
                        type="text"
                        className={`step-input${s.done ? ' done' : ''}`}
                        value={s.text}
                        placeholder="단계 내용"
                        onChange={e => handleWorkPlanStepTextChange(s.id, e.target.value)}
                        onBlur={handleWorkPlanStepBlur}
                      />
                      <button className="step-del-btn" onClick={() => handleDeleteWorkPlanStep(s.id)}>×</button>
                    </div>
                  ))}
                  <button className="step-add-btn" onClick={handleAddWorkPlanStep}>+ 단계 추가</button>
                </div>
              </div>

              {/* 나머지 5개 텍스트 카드 */}
              {PLAN_SECTIONS.map(({ key, emoji, label }) => (
                <div key={key} className="workplan-card">
                  <div className="workplan-card-title">{emoji} {label}</div>
                  <textarea
                    className="workplan-textarea"
                    value={workPlan[key]}
                    placeholder={`${label} 내용`}
                    onChange={e => handleWorkPlanFieldChange(key, e.target.value)}
                    onBlur={handleWorkPlanFieldBlur}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 에디터 툴바 */}
        <div className="plan-toolbar">
          {tb('H1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
          {tb('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
          {tb('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
          <span className="tb-sep" />
          {tb('굵게', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
          {tb('기울임', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
          <span className="tb-sep" />
          {tb('• 목록', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
          {tb('1. 목록', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
          {tb('☑ 체크', () => editor.chain().focus().toggleTaskList().run(), editor.isActive('taskList'))}
          <span className="tb-sep" />
          {tb('표 삽입', () => editor.chain().focus().insertTable({ rows: 2, cols: 3, withHeaderRow: true }).run())}
          {tb('구분선', () => editor.chain().focus().setHorizontalRule().run())}
          {tb('인용구', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
          <span className="tb-sep" />
          <button
            type="button"
            className={`tb-btn${uploadStatus === 'uploading' ? ' uploading' : ''}`}
            onMouseDown={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadStatus === 'uploading'}
          >
            {uploadStatus === 'uploading' ? '업로드 중...' : '🖼 사진'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageFile} />
        </div>

        {/* 세부 계획서 에디터 */}
        <div className="plan-editor-wrap">
          <EditorContent editor={editor} className="plan-editor" />
        </div>

      </div>
    </div>
  );
}
