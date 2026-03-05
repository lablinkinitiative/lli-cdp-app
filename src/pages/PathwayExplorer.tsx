import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import { getCurrentUser } from '../auth';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'https://app.lablinkinitiative.org';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PathwayItem {
  id: string;
  title: string;
  short_name: string;
  description: string;
  career_field: string;
  entry_level: string | null;
  keywords: string[];
  usage_count: number;
}

interface AssignedTier {
  pathway_id: string;
  fit_tier: 'high' | 'medium' | 'stretch';
  title: string;
}

// ─── Career fields for filter ─────────────────────────────────────────────────

const CAREER_FIELDS = ['All Fields', 'STEM Research', 'Computing & Data', 'Policy', 'Business'];

const TIER_LABELS: Record<string, string> = {
  high: 'Almost There',
  medium: 'Achievable',
  stretch: 'Think Big',
};

// ─── Pathway card ─────────────────────────────────────────────────────────────

function PathwayCard({
  pathway,
  assignedTiers,
  token,
  onSwapped,
}: {
  pathway: PathwayItem;
  assignedTiers: AssignedTier[];
  token: string | null;
  onSwapped: (tier: string, pathway: PathwayItem) => void;
}) {
  const navigate = useNavigate();
  const [swapping, setSwapping] = useState(false);
  const [showSwapMenu, setShowSwapMenu] = useState(false);
  const [swapMsg, setSwapMsg] = useState<string | null>(null);

  const isAssigned = assignedTiers.some(t => t.pathway_id === pathway.id);
  const assignedTier = assignedTiers.find(t => t.pathway_id === pathway.id);
  const hasAssignments = assignedTiers.length > 0;

  const handleSwap = useCallback(async (tier: string) => {
    setSwapping(true);
    setShowSwapMenu(false);
    try {
      const res = await fetch(`${API_BASE}/api/cdp/students/me/pathways/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier, pathway_id: pathway.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setSwapMsg(`Swapped into "${TIER_LABELS[tier]}" slot`);
        onSwapped(tier, pathway);
        setTimeout(() => setSwapMsg(null), 3000);
      } else {
        setSwapMsg(`Error: ${data.error || 'Failed to swap'}`);
        setTimeout(() => setSwapMsg(null), 4000);
      }
    } catch {
      setSwapMsg('Network error — try again');
      setTimeout(() => setSwapMsg(null), 4000);
    }
    setSwapping(false);
  }, [pathway.id, token, onSwapped]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/pathway/${pathway.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/pathway/${pathway.id}`); }}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--sp-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, border-color 0.15s, transform 0.15s',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = 'var(--shadow-md)';
        el.style.borderColor = 'var(--brand-300)';
        el.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = 'none';
        el.style.borderColor = 'var(--border)';
        el.style.transform = 'translateY(0)';
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLDivElement).style.outline = '2px solid var(--brand-500)';
        (e.currentTarget as HTMLDivElement).style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLDivElement).style.outline = 'none';
      }}
    >
      {/* Career field badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <span style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          color: 'var(--brand-700)',
          background: 'var(--brand-50)',
          borderRadius: 'var(--radius-sm)',
          padding: '2px 8px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          flexShrink: 0,
        }}>
          {pathway.career_field}
        </span>
        {pathway.usage_count > 0 && (
          <span style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-faint)',
            flexShrink: 0,
          }}>
            {pathway.usage_count} student{pathway.usage_count !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Title + short name */}
      <div>
        <h3 style={{
          fontSize: 'var(--text-base)',
          fontWeight: 700,
          color: 'var(--text-strong)',
          lineHeight: 1.3,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          marginBottom: '0.2rem',
        }}>
          {pathway.title}
        </h3>
        {pathway.short_name && pathway.short_name !== pathway.title && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', fontWeight: 500 }}>
            {pathway.short_name}
          </div>
        )}
      </div>

      {/* Description */}
      <p style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--text-muted)',
        lineHeight: 1.55,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        flex: 1,
      }}>
        {pathway.description}
      </p>

      {/* Entry level + keywords */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: 'auto' }}>
        {pathway.entry_level && (
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 6px',
          }}>
            {pathway.entry_level}
          </span>
        )}
        {(pathway.keywords || []).slice(0, 3).map((kw) => (
          <span key={kw} style={{
            fontSize: '0.7rem',
            color: 'var(--text-faint)',
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 6px',
          }}>
            {kw}
          </span>
        ))}
      </div>

      {/* CTA row */}
      <div style={{ paddingTop: '0.375rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span
          style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--brand-700)', cursor: 'pointer', flex: 1 }}
          onClick={() => navigate(`/pathway/${pathway.id}`)}
        >
          {isAssigned ? `Your ${TIER_LABELS[assignedTier!.fit_tier]} pathway →` : 'View + run analysis →'}
        </span>

        {/* Swap button — only shown when student has 3 assigned pathways and this isn't one of them */}
        {hasAssignments && !isAssigned && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              disabled={swapping}
              onClick={(e) => { e.stopPropagation(); setShowSwapMenu(v => !v); }}
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--brand-300)',
                background: 'var(--brand-50)',
                color: 'var(--brand-700)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {swapping ? 'Swapping…' : '⇄ Swap in'}
            </button>

            {showSwapMenu && (
              <div style={{
                position: 'absolute',
                bottom: '110%',
                right: 0,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                padding: '0.375rem',
                zIndex: 100,
                minWidth: 170,
              }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-faint)', padding: '0 4px 4px', fontWeight: 600 }}>
                  REPLACE WHICH SLOT?
                </p>
                {(['high', 'medium', 'stretch'] as const).map(tier => {
                  const current = assignedTiers.find(t => t.fit_tier === tier);
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleSwap(tier); }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '5px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-strong)',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <strong>{TIER_LABELS[tier]}</strong>
                      {current && (
                        <span style={{ color: 'var(--text-faint)', display: 'block', fontSize: '0.65rem' }}>
                          Currently: {current.title.length > 28 ? current.title.slice(0, 28) + '…' : current.title}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Swap feedback */}
      {swapMsg && (
        <div style={{
          fontSize: '0.7rem',
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          background: swapMsg.startsWith('Error') ? 'var(--error-bg)' : 'rgba(76,175,80,0.08)',
          color: swapMsg.startsWith('Error') ? 'var(--error)' : '#2e7d32',
          fontWeight: 600,
        }}>
          {swapMsg}
        </div>
      )}
    </div>
  );
}

// ─── Loading skeleton grid ────────────────────────────────────────────────────

function LoadingGrid() {
  return (
    <div className="explorer-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--sp-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ height: 20, width: 80, borderRadius: 4, background: 'var(--surface-2)', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 18, width: '70%', borderRadius: 4, background: 'var(--surface-2)', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 12, width: '100%', borderRadius: 4, background: 'var(--surface-2)', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 12, width: '90%', borderRadius: 4, background: 'var(--surface-2)', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 12, width: '60%', borderRadius: 4, background: 'var(--surface-2)', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PathwayExplorer() {
  getCurrentUser(); // auth guard

  const [pathways, setPathways] = useState<PathwayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [careerField, setCareerField] = useState('All Fields');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedTiers, setAssignedTiers] = useState<AssignedTier[]>([]);

  const token = localStorage.getItem('cdp_token');

  // Fetch student's assigned pathways for swap context
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/cdp/students/me/pathways`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.pathways) {
          setAssignedTiers(d.pathways.map((p: { pathway_id: string; fit_tier: string; title: string }) => ({
            pathway_id: p.pathway_id,
            fit_tier: p.fit_tier,
            title: p.title,
          })));
        }
      })
      .catch(() => {});
  }, [token]);

  const handleSwapped = useCallback((tier: string, pathway: PathwayItem) => {
    setAssignedTiers(prev => prev.map(t =>
      t.fit_tier === tier ? { pathway_id: pathway.id, fit_tier: tier as AssignedTier['fit_tier'], title: pathway.title } : t
    ));
  }, []);

  // Fetch from API with filters
  useEffect(() => {
    const controller = new AbortController();

    const fetchPathways = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (careerField !== 'All Fields') params.set('career_field', careerField);
        if (searchQuery.trim()) params.set('search', searchQuery.trim());

        const url = `${API_BASE}/api/cdp/pathways${params.toString() ? '?' + params.toString() : ''}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.ok) {
          setPathways(data.pathways || []);
        } else {
          throw new Error(data.error || 'Failed to load pathways');
        }
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') return;
        setError('Failed to load pathways. Please try again.');
      }
      setLoading(false);
    };

    fetchPathways();
    return () => controller.abort();
  }, [careerField, searchQuery, token]);

  // Client-side filter for instant search feedback
  const displayed = useMemo(() => {
    if (!searchQuery.trim()) return pathways;
    const q = searchQuery.toLowerCase();
    return pathways.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.short_name?.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.career_field.toLowerCase().includes(q) ||
      (p.keywords || []).some(kw => kw.toLowerCase().includes(q))
    );
  }, [pathways, searchQuery]);

  return (
    <>
      <Nav />
      <main id="main">
        {/* Page header */}
        <div className="page-header">
          <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', marginBottom: '0.5rem' }}>
              <Link
                to="/pathways"
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'rgba(255,255,255,0.6)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              >
                ← My Pathways
              </Link>
            </div>
            <h1>Explore Career Pathways</h1>
            <p>Browse the full pathway library — click any pathway to run a personalized gap analysis</p>
          </div>
        </div>

        <div className="page-container" style={{ padding: 'var(--sp-lg) 1.25rem var(--sp-2xl)' }}>

          {/* Back link (secondary, below header for mobile) */}
          <div style={{ marginBottom: 'var(--sp-md)' }}>
            <Link to="/pathways" className="btn btn-ghost btn-sm">
              ← Back to My Pathways
            </Link>
          </div>

          {/* Filters row */}
          <div style={{
            display: 'flex',
            gap: 'var(--sp-sm)',
            flexWrap: 'wrap',
            marginBottom: 'var(--sp-lg)',
            alignItems: 'center',
          }}>
            {/* Search */}
            <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pathways by title, field, or keyword..."
                aria-label="Search pathways"
              />
              <button type="button" aria-label="Search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>

            {/* Career field dropdown */}
            <select
              className="form-select"
              style={{ width: 'auto', flex: 'none' }}
              value={careerField}
              onChange={(e) => setCareerField(e.target.value)}
              aria-label="Filter by career field"
            >
              {CAREER_FIELDS.map((field) => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </div>

          {/* Career field chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: 'var(--sp-lg)' }}>
            {CAREER_FIELDS.map((field) => (
              <button
                key={field}
                type="button"
                onClick={() => setCareerField(field)}
                className={`btn btn-sm ${careerField === field ? 'btn-primary' : 'btn-ghost'}`}
                aria-pressed={careerField === field}
              >
                {field}
              </button>
            ))}
          </div>

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
            }}>
              <span style={{ color: 'var(--error)', fontWeight: 700 }}>!</span>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--error)' }}>{error}</p>
              <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => setError(null)}>
                Dismiss
              </button>
            </div>
          )}

          {/* Results count */}
          {!loading && !error && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-md)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-strong)' }}>{displayed.length}</strong> pathway{displayed.length !== 1 ? 's' : ''}
                {careerField !== 'All Fields' ? ` in ${careerField}` : ''}
                {searchQuery.trim() ? ` matching "${searchQuery}"` : ''}
              </p>
              {(careerField !== 'All Fields' || searchQuery.trim()) && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setCareerField('All Fields'); setSearchQuery(''); }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && <LoadingGrid />}

          {/* Pathway grid */}
          {!loading && displayed.length > 0 && (
            <div className="explorer-grid">
              {displayed.map((pathway) => (
                <PathwayCard
                  key={pathway.id}
                  pathway={pathway}
                  assignedTiers={assignedTiers}
                  token={token}
                  onSwapped={handleSwapped}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && displayed.length === 0 && (
            <div className="empty-state">
              <h3>No pathways found</h3>
              <p>Try adjusting your search or clearing filters.</p>
              <button
                type="button"
                className="btn btn-outline"
                style={{ marginTop: 'var(--sp-md)' }}
                onClick={() => { setCareerField('All Fields'); setSearchQuery(''); }}
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Bottom nav */}
          {!loading && displayed.length > 0 && (
            <div style={{ marginTop: 'var(--sp-xl)', textAlign: 'center' }}>
              <Link to="/pathways" className="btn btn-outline">
                ← Back to My Pathways
              </Link>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .explorer-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--sp-md);
        }
        @media (max-width: 960px) {
          .explorer-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .explorer-grid { grid-template-columns: 1fr; }
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
