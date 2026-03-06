import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getCurrentUser } from './auth';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import OAuthCallback from './pages/OAuthCallback';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Opportunities from './pages/Opportunities';
import PathwayDashboard from './pages/PathwayDashboard';
import ResumePage from './pages/ResumePage';
import Saved from './pages/Saved';
import Profile from './pages/Profile';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import './index.css';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'https://app.lablinkinitiative.org';
const RESUME_JOB_KEY = 'cdp_resume_job_v2';

type ParseJobState = 'processing' | 'complete' | 'error' | null;

function ResumeParseNotification() {
  const navigate = useNavigate();
  const [jobState, setJobState] = useState<ParseJobState>(null);
  const [dismissed, setDismissed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; }
  }, []);

  const startJob = useCallback((resumeId: string) => {
    clearTimers();
    setJobState('processing');
    setDismissed(false);
    setElapsed(0);

    const token = localStorage.getItem('cdp_token');
    if (!token) return;

    elapsedRef.current = setInterval(() => setElapsed(s => s + 1), 1000);

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/cdp/resumes/${resumeId}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === 'parsed') {
          setJobState('complete');
          localStorage.removeItem(RESUME_JOB_KEY);
          clearTimers();
          // Sync fresh student data
          try {
            const syncRes = await fetch(`${API_BASE}/api/cdp/students/me/full-data`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (syncRes.ok) {
              const sd = await syncRes.json();
              const user = getCurrentUser();
              if (user) localStorage.setItem(`cdp_student_data_${user.uid}`, JSON.stringify(sd));
            }
          } catch { /* best-effort */ }
        } else if (data.status === 'error') {
          setJobState('error');
          localStorage.removeItem(RESUME_JOB_KEY);
          clearTimers();
        }
      } catch { /* keep polling on network error */ }
    };

    poll();
    pollRef.current = setInterval(poll, 3000);
  }, [clearTimers]);

  // On mount: resume a pending job from a previous page/session
  useEffect(() => {
    const raw = localStorage.getItem(RESUME_JOB_KEY);
    if (!raw) return;
    try {
      const job = JSON.parse(raw) as { resume_id: string; started_at: number };
      if (Date.now() - job.started_at < 10 * 60 * 1000) {
        startJob(job.resume_id);
      } else {
        localStorage.removeItem(RESUME_JOB_KEY);
      }
    } catch { localStorage.removeItem(RESUME_JOB_KEY); }
  }, [startJob]);

  // Listen for uploads that happen in the same session
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ resume_id: string }>).detail;
      startJob(detail.resume_id);
    };
    window.addEventListener('cdp-resume-started', handler);
    return () => window.removeEventListener('cdp-resume-started', handler);
  }, [startJob]);

  // Auto-dismiss success toast after 10s
  useEffect(() => {
    if (jobState !== 'complete') return;
    const t = setTimeout(() => setDismissed(true), 10000);
    return () => clearTimeout(t);
  }, [jobState]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  if (!jobState || dismissed) return null;

  const phases = [
    { label: 'Reading PDF', maxT: 5 },
    { label: 'Extracting text', maxT: 15 },
    { label: 'AI analyzing skills', maxT: 32 },
    { label: 'Updating your profile', maxT: Infinity },
  ];
  const phaseIdx = phases.findIndex(p => elapsed < p.maxT);
  const currentPhase = phases[phaseIdx >= 0 ? phaseIdx : phases.length - 1];
  const fakeProgress = Math.min(90, 8 + (elapsed / 42) * 82);

  const toasts = {
    processing: {
      bg: '#1e293b',
      color: '#f8fafc',
      accentColor: '#f59e0b',
      icon: null,
      title: currentPhase.label + '…',
      sub: null as string | null,
      action: null as { label: string; to: string } | null,
    },
    complete: {
      bg: '#14532d',
      color: '#f0fdf4',
      accentColor: '#86efac',
      icon: '✓',
      title: 'Resume parsed!',
      sub: 'Skills and experience merged into your profile.',
      action: { label: 'View profile →', to: '/profile' },
    },
    error: {
      bg: '#7f1d1d',
      color: '#fef2f2',
      accentColor: '#fca5a5',
      icon: '✕',
      title: 'Resume parse failed',
      sub: 'Please try uploading again.',
      action: { label: 'Try again →', to: '/resume' },
    },
  }[jobState];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        background: toasts.bg,
        color: toasts.color,
        borderRadius: '0.875rem',
        padding: '0.875rem 1rem',
        width: 280,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        animation: 'slideUp 0.25s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
        {/* Icon / spinner */}
        <div style={{ flexShrink: 0, marginTop: 1 }}>
          {jobState === 'processing' ? (
            <div style={{ width: 16, height: 16, border: `2px solid ${toasts.accentColor}33`, borderTop: `2px solid ${toasts.accentColor}`, borderRadius: '50%', animation: 'toastSpin 0.8s linear infinite' }} />
          ) : (
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>{toasts.icon}</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.1rem' }}>{toasts.title}</div>
          {jobState === 'processing' && (
            <div style={{ fontSize: '0.7rem', opacity: 0.55, marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Usually 20–40 seconds</span>
              <span>{elapsed}s elapsed</span>
            </div>
          )}
          {jobState === 'processing' && (
            <div style={{ height: 3, background: 'rgba(245,158,11,0.2)', borderRadius: 2, overflow: 'hidden', marginBottom: '0.25rem' }}>
              <div style={{ height: '100%', background: toasts.accentColor, borderRadius: 2, width: `${fakeProgress}%`, transition: 'width 1s ease-out' }} />
            </div>
          )}
          {toasts.sub && <div style={{ fontSize: '0.7rem', opacity: 0.75, marginBottom: toasts.action ? '0.375rem' : 0 }}>{toasts.sub}</div>}
          {toasts.action && (
            <button
              onClick={() => { setDismissed(true); navigate(toasts.action!.to); }}
              style={{ background: 'transparent', border: 'none', color: toasts.accentColor, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            >
              {toasts.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          style={{ background: 'transparent', border: 'none', color: 'inherit', opacity: 0.45, cursor: 'pointer', padding: '0 0.125rem', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/signin" replace />;
  return <>{children}</>;
}

// Redirect /pathway/:id → /pathways?selected=:id
function PathwayIdRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/pathways${id ? `?selected=${id}` : ''}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <a className="skip-link" href="#main">Skip to main content</a>
      <ResumeParseNotification />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/opportunities" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />
        <Route path="/pathways" element={<ProtectedRoute><PathwayDashboard /></ProtectedRoute>} />
        <Route path="/pathways/explore" element={<Navigate to="/pathways" replace />} />
        <Route path="/pathway/:id" element={<ProtectedRoute><PathwayIdRedirect /></ProtectedRoute>} />
        <Route path="/resume" element={<ProtectedRoute><ResumePage /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><Saved /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
