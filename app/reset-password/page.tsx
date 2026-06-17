'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Status = 'loading' | 'ready' | 'success' | 'invalid';

function translateError(msg: string): string {
  if (msg.includes('at least 6') || msg.includes('Password should be at least')) return '비밀번호는 6자 이상이어야 해요.';
  if (msg.includes('rate limit') || msg.includes('For security purposes')) return '너무 많이 시도했어요. 잠시 후 다시 해주세요.';
  if (msg.includes('expired') || msg.includes('invalid') || msg.includes('Invalid')) return '재설정 링크가 만료됐어요. 다시 요청해주세요.';
  if (msg.includes('Network') || msg.includes('fetch')) return '네트워크 오류가 발생했어요. 다시 시도해주세요.';
  return '오류가 발생했어요. 다시 시도해 주세요.';
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const hash = window.location.hash;
    const hasToken = hash.includes('access_token') || hash.includes('type=recovery');

    if (!hasToken) {
      setStatus('invalid');
      return;
    }

    // Session may already be set if Supabase processed the hash before mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStatus('ready');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setStatus('ready');
      }
    });

    const timer = setTimeout(() => {
      setStatus(s => s === 'loading' ? 'invalid' : s);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 해요.');
      return;
    }
    if (password !== confirm) {
      setError('비밀번호가 서로 일치하지 않아요.');
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(translateError(err.message));
      } else {
        await supabase.auth.signOut();
        setStatus('success');
        setTimeout(() => router.push('/'), 3000);
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

          {status === 'loading' && (
            <div className="auth-status-msg">링크를 확인하는 중이에요...</div>
          )}

          {status === 'invalid' && (
            <div className="forgot-wrap">
              <div className="reset-invalid-msg">
                유효하지 않거나 만료된 링크예요.<br />
                비밀번호 재설정을 다시 요청해주세요.
              </div>
              <button type="button" className="submit-btn" style={{ marginTop: 16 }} onClick={() => router.push('/')}>
                로그인 화면으로
              </button>
            </div>
          )}

          {status === 'ready' && (
            <form className="auth-form" onSubmit={handleSubmit}>
              <p className="forgot-desc" style={{ marginBottom: 16 }}>
                새로운 비밀번호를 입력해주세요.
              </p>
              <div className="field">
                <label>새 비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="6자 이상 입력하세요"
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="field">
                <label>비밀번호 확인</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                  autoComplete="new-password"
                />
              </div>
              {error && <div className="err">{error}</div>}
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? '처리 중...' : '비밀번호 변경'}
              </button>
            </form>
          )}

          {status === 'success' && (
            <div className="forgot-wrap">
              <div className="reset-sent-msg">
                비밀번호가 변경됐어요.<br />다시 로그인해주세요.
              </div>
              <p className="reset-redirect-hint">잠시 후 로그인 화면으로 이동해요...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
