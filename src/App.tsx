import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { getCurrentUser } from './auth';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import OAuthCallback from './pages/OAuthCallback';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Opportunities from './pages/Opportunities';
import PathwayGap from './pages/PathwayGap';
import PathwayDashboard from './pages/PathwayDashboard';
import PathwayExplorer from './pages/PathwayExplorer';
import ResumePage from './pages/ResumePage';
import Saved from './pages/Saved';
import Profile from './pages/Profile';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import './index.css';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'https://app.lablinkinitiative.org';
const POLL_INTERVAL = 5000; // 5s

type ParseJobState = 'processing' | 'complete' | 'error' | null;

function ResumeParseNotification() {
  const navigate = useNavigate();
  const [jobState, setJobState] = useState<ParseJobState>(null);
  const [dismissed, setDismissed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('cdp_resume_job');
    if (!raw) return;

    let job: { job_id: string; file_name: string; started_at: number };
    try { job = JSON.parse(raw); } catch { localStorage.removeItem('cdp_resume_job'); return; }

    // Don't poll stale jobs (> 10 min old)
    if (Date.now() - job.started_at > 10 * 60 * 1000) {
      localStorage.removeItem('cdp_resume_job');
      return;
    }

    const token = localStorage.getItem('cdp_token');
    if (!token) return;

    setJobState('processing');

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/cdp/resume/status/${job.job_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === 'complete') {
          setJobState('complete');
          localStorage.removeItem('cdp_resume_job');
          if (intervalRef.current) clearInterval(intervalRef.current);

          // Sync fresh student data from API into localStorage
          try {
            const syncRes = await fetch(`${API_BASE}/api/cdp/students/me/full-data`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (syncRes.ok) {
              const sd = await syncRes.json();
              const user = getCurrentUser();
              if (user) {
                localStorage.setItem(`cdp_student_data_${user.uid}`, JSON.stringify(sd));
              }
            }
          } catch { /* best-effort */ }

        } else if (data.status === 'error') {
          setJobState('error');
          localStorage.removeItem('cdp_resume_job');
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch { /* network error — keep polling */ }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  if (!jobState || dismissed) return null;

  const toast = {
    processing: {
      bg: '#1e293b',
      color: '#f8fafc',
      icon: '⏳',
      text: 'Parsing your resume in the background…',
      sub: 'Skills and profile data will update automatically.',
      action: null,
    },
    complete: {
      bg: '#14532d',
      color: '#f0fdf4',
      icon: '✓',
      text: 'Resume parsed! Your profile has been updated.',
      sub: 'Skills, education, and experience extracted.',
      action: { label: 'View full profile →', to: '/profile' },
    },
    error: {
      bg: '#7f1d1d',
      color: '#fef2f2',
      icon: '✕',
      text: 'Resume parse failed.',
      sub: 'Try uploading again from your profile.',
      action: { label: 'Try again →', to: '/resume' },
    },
  }[jobState];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        background: toast.bg,
        color: toast.color,
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        maxWidth: 340,
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        animation: 'slideUp 0.3s ease',
      }}
      role="status"
      aria-live="polite"
    >
      <span style={{ fontSize: '1.25rem', lineHeight: 1.2, flexShrink: 0 }}>{toast.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.2rem' }}>{toast.text}</div>
        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{toast.sub}</div>
        {toast.action && (
          <button
            onClick={() => { setDismissed(true); navigate(toast.action!.to); }}
            style={{ marginTop: '0.5rem', background: 'transparent', border: 'none', color: 'inherit', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{ background: 'transparent', border: 'none', color: 'inherit', opacity: 0.6, cursor: 'pointer', padding: '0 0.25rem', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}
      >
        ×
      </button>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/signin" replace />;
  return <>{children}</>;
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
        <Route path="/pathways/explore" element={<ProtectedRoute><PathwayExplorer /></ProtectedRoute>} />
        <Route path="/pathway/:id" element={<ProtectedRoute><PathwayGap /></ProtectedRoute>} />
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
