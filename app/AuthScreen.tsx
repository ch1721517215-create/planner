'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Mode = 'login' | 'signup';

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 맞지 않아요.';
  if (msg.includes('Email not confirmed')) return '이메일 인증이 필요해요. 받은 메일을 확인해주세요.';
  if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('already in use')) return '이미 가입된 이메일이에요.';
  if (msg.includes('Password should be at least') || msg.includes('at least 6')) return '비밀번호는 6자 이상이어야 해요.';
  if (msg.includes('valid email') || msg.includes('invalid email') || msg.includes('Invalid email')) return '올바른 이메일 형식이 아니에요.';
  if (msg.includes('rate limit') || msg.includes('For security purposes')) return '너무 많이 시도했어요. 잠시 후 다시 해주세요.';
  if (msg.includes('Network') || msg.includes('fetch')) return '네트워크 오류가 발생했어요. 다시 시도해주세요.';
  return '오류가 발생했어요. 다시 시도해 주세요.';
}

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function switchMode(m: Mode) {
    setMode(m);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) setError(translateError(err.message));
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) setError(translateError(err.message));
      }
    } catch {
      setError('네트워크 오류가 발생했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

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

      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-header">
            <div className="main-title">그대여 걱정하지 말아요.</div>
            <div className="title">
              <span className="now">NOW.</span>{' '}
              <span className="must">MUST.</span>{' '}
              <span className="done">TILL DONE.</span>
            </div>
            <div className="subtitle">Eisenhower Matrix</div>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab${mode === 'login' ? ' active' : ''}`}
              onClick={() => switchMode('login')}
            >
              로그인
            </button>
            <button
              type="button"
              className={`auth-tab${mode === 'signup' ? ' active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              회원가입
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>이메일</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="이메일 주소를 입력하세요"
                required
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label>비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? '6자 이상 입력하세요' : '비밀번호를 입력하세요'}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            {error && <div className="err">{error}</div>}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
