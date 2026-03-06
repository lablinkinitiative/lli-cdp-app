import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import { getCurrentUser, getStudentData } from '../auth';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'https://app.lablinkinitiative.org';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PathwayGapSummary {
  id: string;
  status: 'queued' | 'processing' | 'complete' | 'error';
  overall_match: number | null;
  summary: string | null;
}

interface AssignedPathway {
  id: number;
  pathway_id: string;
  title: string;
  short_name: string;
  description: string;
  career_field: string;
  fit_score: number;
  fit_tier: 'high' | 'medium' | 'stretch';
  notes: string | null;
  is_default: boolean;
  assigned_at: string;
  gap_analysis: PathwayGapSummary | null;
  mapped_programs_count: number;
}

// ─── Tier config ─────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  high: {
    label: 'Almost There',
    color: '#4caf50',
    bg: 'rgba(76,175,80,0.08)',
    border: 'rgba(76,175,80,0.25)',
    icon: '●',
  },
  medium: {
    label: 'Achievable',
    color: '#ff9800',
    bg: 'rgba(255,152,0,0.08)',
    border: 'rgba(255,152,0,0.25)',
    icon: '◑',
  },
  stretch: {
    label: 'Think Big',
    color: '#2196f3',
    bg: 'rgba(33,150,243,0.08)',
    border: 'rgba(33,150,243,0.25)',
    icon: '○',
  },
};

// ─── Generation steps ─────────────────────────────────────────────────────────

const GEN_STEPS = [
  { icon: '👤', label: 'Reading your profile', sub: 'Analyzing skills, goals, interests, and background…' },
  { icon: '🔍', label: 'Searching pathway library', sub: 'Scanning 42 career pathways for potential matches…' },
  { icon: '🤖', label: 'AI scoring candidates', sub: 'Evaluating fit, readiness, and alignment with your goals…' },
  { icon: '🎯', label: 'Selecting your pathways', sub: 'One achievable, one strong fit, one ambitious reach…' },
  { icon: '📊', label: 'Running gap analyses', sub: 'Identifying skills and experiences to develop for each path…' },
  { icon: '✨', label: 'Finalizing your roadmap', sub: 'Mapping internship programs to your pathways…' },
];

// ─── Generating banner ────────────────────────────────────────────────────────

function GeneratingBanner() {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setStepIdx(s => Math.min(s + 1, GEN_STEPS.length - 1));
    }, 9000);
    return () => clearInterval(iv);
  }, []);

  const progress = Math.min(95, Math.round(((stepIdx + 1) / GEN_STEPS.length) * 100));
  const current = GEN_STEPS[stepIdx];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(154,184,46,0.07) 0%, rgba(37,99,235,0.05) 100%)',
      border: '1px solid rgba(154,184,46,0.22)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--sp-lg)',
      marginBottom: 'var(--sp-lg)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 'var(--sp-md)' }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '3px solid rgba(154,184,46,0.2)',
          borderTopColor: 'var(--brand-500)',
          animation: 'spin 0.9s linear infinite',
          flexShrink: 0,
        }} />
        <div>
          <p style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text-strong)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: '0.15rem' }}>
            Generating Your Career Pathways
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Usually takes 30–60 seconds — we'll show your results automatically
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 'var(--sp-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
            {current.icon} {current.label}…
          </span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--brand-700)' }}>
            {progress}%
          </span>
        </div>
        <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--brand-500), #9AB82E)',
            borderRadius: 99,
            transition: 'width 1.2s ease',
          }} />
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', marginTop: '0.3rem' }}>
          {current.sub}
        </p>
      </div>

      {/* Step list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {GEN_STEPS.map((step, i) => {
          const done = i < stepIdx;
          const active = i === stepIdx;
          return (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              opacity: i > stepIdx ? 0.38 : 1,
              transition: 'opacity 0.5s',
            }}>
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.68rem',
                flexShrink: 0,
                background: done ? '#4caf50' : active ? 'rgba(37,99,235,0.12)' : 'var(--surface-2)',
                border: active ? '2px solid var(--brand-400)' : 'none',
                animation: active ? 'stepPulse 1.6s ease-in-out infinite' : 'none',
                color: done ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
              }}>
                {done ? '✓' : (i + 1)}
              </div>
              <span style={{
                fontSize: 'var(--text-xs)',
                fontWeight: active ? 700 : 500,
                color: active ? 'var(--text-strong)' : done ? 'var(--text-muted)' : 'var(--text-faint)',
              }}>
                {step.icon} {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--sp-md)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-2)', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 14, width: 80, borderRadius: 4, background: 'var(--surface-2)', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
      </div>
      <div style={{ height: 20, width: '70%', borderRadius: 4, background: 'var(--surface-2)', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 12, width: '100%', borderRadius: 4, background: 'var(--surface-2)', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 12, width: '85%', borderRadius: 4, background: 'var(--surface-2)', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 12, width: '60%', borderRadius: 4, background: 'var(--surface-2)', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
    </div>
  );
}

// ─── Pathway card ─────────────────────────────────────────────────────────────

function PathwayCard({ pathway }: { pathway: AssignedPathway }) {
  const navigate = useNavigate();
  const tier = TIER_CONFIG[pathway.fit_tier];
  const hasCompleteAnalysis = pathway.gap_analysis?.status === 'complete';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/pathway/${pathway.pathway_id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/pathway/${pathway.pathway_id}`); }}
      style={{
        background: tier.bg,
        border: `1px solid ${tier.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--sp-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.15s',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Tier badge + fit score */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ fontSize: '1rem', color: tier.color, lineHeight: 1 }}>{tier.icon}</span>
          <span style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            color: tier.color,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {tier.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {hasCompleteAnalysis && pathway.gap_analysis?.overall_match != null && (() => {
            const match = pathway.gap_analysis!.overall_match!;
            return (
              <span style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                color: 'var(--white)',
                background: match >= 70 ? 'var(--success, #15803d)' : match >= 45 ? 'var(--warning, #b45309)' : 'var(--error, #dc2626)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px 6px',
              }}>
                {match}% match
              </span>
            );
          })()}
          <span style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            color: tier.color,
            background: `${tier.bg}`,
            border: `1px solid ${tier.border}`,
            borderRadius: 'var(--radius-sm)',
            padding: '2px 6px',
          }}>
            {pathway.fit_score}% fit
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: 'var(--text-base)',
        fontWeight: 700,
        color: 'var(--text-strong)',
        lineHeight: 1.3,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}>
        {pathway.title}
      </h3>

      {/* Description — 2 lines */}
      <p style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--text-muted)',
        lineHeight: 1.55,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {pathway.description}
      </p>

      {/* Notes — 1 line */}
      {pathway.notes && (
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-faint)',
          fontStyle: 'italic',
          lineHeight: 1.45,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {pathway.notes}
        </p>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.25rem', borderTop: `1px solid ${tier.border}` }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {pathway.mapped_programs_count} program{pathway.mapped_programs_count !== 1 ? 's' : ''} aligned
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: tier.color, fontWeight: 600 }}>
          Explore →
        </span>
      </div>
    </div>
  );
}

// ─── Locked state ─────────────────────────────────────────────────────────────

function LockedState({ completeness }: { completeness: number }) {
  const needed = 60 - completeness;

  return (
    <div style={{ position: 'relative' }}>
      {/* Blurred skeleton preview — gives sense of what's waiting */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--sp-md)',
        marginBottom: 'var(--sp-xl)',
        opacity: 0.22,
        filter: 'blur(3px)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Lock overlay */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: 'var(--sp-xl) var(--sp-lg)',
        background: 'linear-gradient(to bottom, transparent, var(--bg) 30%)',
        marginTop: '-6rem',
        paddingTop: '6rem',
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'var(--surface)',
          border: '2px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.75rem',
          marginBottom: 'var(--sp-md)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <span style={{ lineHeight: 1 }}>&#128274;</span>
        </div>

        <h2 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 800,
          color: 'var(--text-strong)',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          marginBottom: '0.5rem',
        }}>
          Complete Your Profile to Unlock Pathways
        </h2>

        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          maxWidth: 420,
          marginBottom: 'var(--sp-lg)',
        }}>
          {needed > 0
            ? `You're ${completeness}% complete — add ${needed}% more and we'll automatically generate your personalized career pathways.`
            : 'Almost there! Finish your profile and your pathways will generate automatically.'}
        </p>

        {/* Progress bar */}
        <div style={{ width: '100%', maxWidth: 360, marginBottom: 'var(--sp-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
              Profile progress
            </span>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--brand-700)' }}>
              {completeness}% / 60% needed
            </span>
          </div>
          <div style={{
            height: 10,
            background: 'var(--surface-2)',
            borderRadius: 99,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, (completeness / 60) * 100)}%`,
              background: completeness >= 40 ? 'var(--brand-500)' : 'var(--brand-300)',
              borderRadius: 99,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', marginTop: '0.375rem' }}>
            {needed > 0 ? `${needed}% more to unlock` : 'Almost there!'}
          </p>
        </div>

        <Link to="/profile" className="btn btn-primary">
          Complete My Profile →
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PathwayDashboard() {
  const user = getCurrentUser()!;
  const token = localStorage.getItem('cdp_token');

  const student = getStudentData(user.uid);
  const completeness = student?.profileCompleteness || 0;

  const [pathways, setPathways] = useState<AssignedPathway[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justGenerated, setJustGenerated] = useState(false);
  const autoTriggeredRef = useRef(false);

  const isLocked = completeness < 60;

  // Load pathways from API
  const loadPathways = useCallback(async () => {
    if (isLocked) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/api/cdp/students/me/pathways`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setPathways(data.pathways || []);
      }
    } catch {
      setError('Failed to load pathways. Please try again.');
    }
    setLoading(false);
  }, [token, isLocked]);

  useEffect(() => { loadPathways(); }, [loadPathways]);

  // Auto-trigger pathway generation when profile is complete but no pathways exist yet
  useEffect(() => {
    if (!loading && !isLocked && pathways.length === 0 && !generating && !error && !autoTriggeredRef.current) {
      autoTriggeredRef.current = true;
      handleGenerate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isLocked, pathways.length, generating, error]);

  // Poll generation job
  useEffect(() => {
    if (!jobId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/cdp/students/me/pathways/status/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.status === 'complete') {
          // Fetch full pathway data (job result has incomplete records without title/description)
          await loadPathways();
          setGenerating(false);
          setJobId(null);
          setJustGenerated(true);
          clearInterval(interval);
        } else if (data.status === 'error') {
          setError(data.error || 'Pathway generation failed. Please try again.');
          setGenerating(false);
          setJobId(null);
          clearInterval(interval);
        }
      } catch {
        // keep polling on network error
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [jobId, token]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/cdp/students/me/pathways/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed to start generation');
      setJobId(data.job_id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start generation');
      setGenerating(false);
    }
  };

  return (
    <>
      <Nav />
      <main id="main">
        {/* Page header */}
        <div className="page-header">
          <div className="page-container">
            <h1>My Career Pathways</h1>
            <p>Your three personalized pathways — ranked by fit and readiness</p>
          </div>
        </div>

        <div className="page-container" style={{ padding: 'var(--sp-lg) 1.25rem var(--sp-2xl)' }}>

          {/* Locked state */}
          {isLocked && <LockedState completeness={completeness} />}

          {/* Loading */}
          {!isLocked && loading && (
            <div>
              <div style={{ height: 20, width: 200, borderRadius: 4, background: 'var(--surface-2)', marginBottom: 'var(--sp-lg)', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
              <div className="grid-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: 'var(--error-bg)',
              border: '1px solid rgba(185,28,28,0.2)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--sp-md)',
              marginBottom: 'var(--sp-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}>
              <span style={{ color: 'var(--error)', fontSize: '1.25rem' }}>!</span>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--error)', flex: 1 }}>{error}</p>
              <button className="btn btn-sm" style={{ background: 'var(--brand-600)', color: '#fff', border: 'none' }} onClick={() => { setError(null); autoTriggeredRef.current = false; }}>
                Try again
              </button>
            </div>
          )}

          {/* Pathways loaded — 3 cards */}
          {!isLocked && !loading && pathways.length === 3 && (
            <>
              {/* Success toast — shown once after auto-generation completes */}
              {justGenerated && (
                <div style={{
                  background: 'rgba(76,175,80,0.08)',
                  border: '1px solid rgba(76,175,80,0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--sp-sm) var(--sp-md)',
                  marginBottom: 'var(--sp-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  animation: 'fadeInUp 0.45s ease',
                }}>
                  <span style={{ fontSize: '1.1rem' }}>🎉</span>
                  <p style={{ fontSize: 'var(--text-sm)', color: '#2e7d32', fontWeight: 600 }}>
                    Your career pathways are ready! Gap analyses are running in the background.
                  </p>
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--sp-lg)',
                flexWrap: 'wrap',
                gap: 'var(--sp-sm)',
              }}>
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    Pathways are assigned based on your profile, interests, and background.
                  </p>
                </div>
                <Link to="/pathways/explore" style={{ fontSize: 'var(--text-sm)', color: 'var(--brand-700)', textDecoration: 'underline', fontWeight: 600 }}>
                  Explore more pathways →
                </Link>
              </div>

              <div className="grid-3">
                {pathways.map((pathway) => (
                  <PathwayCard key={pathway.id} pathway={pathway} />
                ))}
              </div>

              <div style={{ marginTop: 'var(--sp-xl)', textAlign: 'center' }}>
                <Link to="/pathways/explore" className="btn btn-outline">
                  Explore More Pathways →
                </Link>
              </div>
            </>
          )}

          {/* Auto-generating (no pathways yet, profile complete, error-free) */}
          {!isLocked && !loading && pathways.length === 0 && !generating && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-2xl) var(--sp-lg)', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid var(--brand-100)', borderTopColor: 'var(--brand-500)', animation: 'spin 0.9s linear infinite', marginBottom: 'var(--sp-md)' }} />
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Getting your pathways ready…</p>
            </div>
          )}

          {/* Generating — step-by-step animated banner + skeleton cards */}
          {generating && (
            <div>
              <GeneratingBanner />
              <div className="grid-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes stepPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.4); }
          50% { box-shadow: 0 0 0 5px rgba(37,99,235,0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 700px) {
          .grid-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
