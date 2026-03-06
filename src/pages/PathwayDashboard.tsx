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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sp-2xl) var(--sp-lg)',
      textAlign: 'center',
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'var(--surface)',
        border: '2px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        marginBottom: 'var(--sp-md)',
      }}>
        {/* Lock icon using Unicode */}
        <span style={{ lineHeight: 1 }}>&#128274;</span>
      </div>

      <h2 style={{
        fontSize: 'var(--text-xl)',
        fontWeight: 800,
        color: 'var(--text-strong)',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        marginBottom: '0.5rem',
      }}>
        Unlock Career Pathways
      </h2>

      <p style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--text-muted)',
        lineHeight: 1.6,
        maxWidth: 400,
        marginBottom: 'var(--sp-lg)',
      }}>
        Complete your profile to {needed > 0 ? `${needed}% more (reach 60%)` : '60%'} to unlock personalized career pathways tailored to your background and goals.
      </p>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 360, marginBottom: 'var(--sp-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
            Your progress
          </span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--brand-700)' }}>
            {completeness}% / 60%
          </span>
        </div>
        <div style={{
          height: 10,
          background: 'var(--surface-2)',
          borderRadius: 99,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (completeness / 60) * 100)}%`,
            background: completeness >= 40 ? 'var(--brand-500)' : 'var(--brand-300)',
            borderRadius: 99,
            transition: 'width 0.4s ease',
          }} />
          {/* 60% threshold marker */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '100%',
            height: '100%',
            width: 2,
            background: 'rgba(0,0,0,0.15)',
            transform: 'translateX(-2px)',
          }} />
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', marginTop: '0.375rem' }}>
          {needed > 0 ? `${needed}% more to unlock` : 'Almost there!'}
        </p>
      </div>

      <Link to="/profile" className="btn btn-primary">
        Complete my profile →
      </Link>
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

          {/* Generating — skeleton + status */}
          {generating && (
            <div>
              <div style={{
                background: 'linear-gradient(135deg, rgba(154,184,46,0.08) 0%, rgba(37,99,235,0.06) 100%)',
                border: '1px solid rgba(154,184,46,0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--sp-lg)',
                marginBottom: 'var(--sp-lg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 'var(--sp-sm)',
              }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  border: '4px solid rgba(154,184,46,0.2)',
                  borderTopColor: 'var(--accent-lime)',
                  animation: 'spin 0.9s linear infinite',
                  marginBottom: '0.25rem',
                }} />
                <div>
                  <p style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text-strong)', marginBottom: '0.35rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Building your career pathways…
                  </p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', maxWidth: 420, lineHeight: 1.6 }}>
                    We're analyzing your skills, experience, and goals to find your best-fit trajectories. This takes about 30–60 seconds.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['Reviewing your profile', 'Scoring 42 pathways', 'Selecting your 3 best fits'].map((step, i) => (
                    <span key={i} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-lime)', display: 'inline-block', animation: `pulse ${1 + i * 0.3}s ease-in-out infinite` }} />
                      {step}
                    </span>
                  ))}
                </div>
              </div>

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
        @media (max-width: 700px) {
          .grid-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
