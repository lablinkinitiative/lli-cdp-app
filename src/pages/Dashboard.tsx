import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import { getCurrentUser, getStudentData } from '../auth';
import { computeMatchScore } from '../matching';
import type { StudentData, Program } from '../types';
import programsData from '../data/programs.json';
import pathwaysData from '../data/pathways.json';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'https://app.lablinkinitiative.org';

const programs = programsData.programs as unknown as Program[];
const pathways = pathwaysData.pathways;

interface AgenticAnalysisSummary {
  total: number;
  complete: number;
  queued: number;
  processing: number;
}

export default function Dashboard() {
  const user = getCurrentUser()!;
  const [student, setStudent] = useState<StudentData | null>(null);
  const [agenticAnalyses, setAgenticAnalyses] = useState<AgenticAnalysisSummary | null>(null);
  const token = localStorage.getItem('cdp_token');

  useEffect(() => {
    setStudent(getStudentData(user.uid));
  }, [user.uid]);

  useEffect(() => {
    if (!token) return;
    // Count analyses for assigned pathways only (not explorer/auto-init analyses for unassigned pathways)
    fetch(`${API_BASE}/api/cdp/students/me/pathways`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.pathways) {
          const analyses = data.pathways.map((p: { gap_analysis: { status: string } | null }) => p.gap_analysis).filter(Boolean);
          const total = analyses.length;
          const complete = analyses.filter((a: { status: string }) => a.status === 'complete').length;
          const queued = analyses.filter((a: { status: string }) => a.status === 'queued').length;
          const processing = analyses.filter((a: { status: string }) => a.status === 'processing').length;
          setAgenticAnalyses({ total, complete, queued, processing });
        }
      })
      .catch(() => {});
  }, [token]);

  const firstName = user.firstName || student?.profile?.firstName || user.email.split('@')[0];
  const completeness = student?.profileCompleteness || 0;

  // Top matched programs
  const topPrograms = student
    ? programs
        .filter(p => p.compensation?.paid)
        .map(p => ({ program: p, score: computeMatchScore(p, student) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
    : programs.slice(0, 3).map(p => ({ program: p, score: 0 }));

  const savedCount = student?.savedPrograms?.length || 0;
  const analysesCount = agenticAnalyses?.complete || student?.gapAnalyses?.length || 0;
  const analysesPending = (agenticAnalyses?.queued || 0) + (agenticAnalyses?.processing || 0);

  return (
    <>
      <Nav />
      <main id="main">
        {/* Welcome header */}
        <div style={{ background: 'var(--brand-900)', padding: 'var(--sp-lg) 1.25rem' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <h1 style={{ color: 'var(--white)', fontSize: 'var(--text-3xl)', marginBottom: '0.5rem' }}>
              Welcome back, {firstName}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-md)' }}>
              Your personalized career development dashboard
            </p>

            {/* Profile completeness */}
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  Profile completeness — {completeness}%
                </span>
                {completeness < 80 && (
                  <Link to="/profile" style={{ color: 'var(--accent-lime)', fontSize: 'var(--text-xs)', textDecoration: 'underline' }}>
                    Complete profile →
                  </Link>
                )}
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${completeness}%` }} />
              </div>
              {completeness < 80 && (
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 'var(--text-xs)', marginTop: '0.375rem' }}>
                  Complete your profile to get better program matches
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', padding: 'var(--sp-md) 1.25rem', display: 'flex', gap: 'var(--sp-xl)', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--brand-700)', lineHeight: 1 }}>{programs.length}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Programs available</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--brand-700)', lineHeight: 1 }}>{savedCount}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Saved programs</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--brand-700)', lineHeight: 1 }}>{analysesCount}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Gap analyses</div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1160, margin: '0 auto', padding: 'var(--sp-lg) 1.25rem var(--sp-2xl)' }}>

          {/* Agentic analysis notification */}
          {analysesPending > 0 && (
            <div style={{
              background: 'rgba(154,184,46,0.08)',
              border: '1px solid rgba(154,184,46,0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--sp-md)',
              marginBottom: 'var(--sp-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--sp-md)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-500)', animation: 'dashPulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-default)' }}>
                  <strong>Analyzing your profile…</strong> {analysesPending} pathway {analysesPending === 1 ? 'analysis' : 'analyses'} in progress (usually 30–60 seconds each)
                </span>
              </div>
              <Link to="/pathways" className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
                View →
              </Link>
            </div>
          )}
          {agenticAnalyses && agenticAnalyses.complete > 0 && analysesPending === 0 && (
            <div style={{
              background: 'rgba(21,128,61,0.06)',
              border: '1px solid rgba(21,128,61,0.2)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--sp-md)',
              marginBottom: 'var(--sp-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--sp-md)',
            }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-default)' }}>
                <strong style={{ color: 'var(--success)' }}>✓ {agenticAnalyses.complete} pathway {agenticAnalyses.complete === 1 ? 'analysis' : 'analyses'} ready</strong> — See your personalized career readiness scores
              </span>
              <Link to="/pathways" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                View Analyses →
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          {(!student?.profile?.firstName || completeness < 50 || !student?.resumeUploaded) && (
            <div style={{ marginBottom: 'var(--sp-lg)' }}>
              <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--text-strong)', marginBottom: 'var(--sp-sm)' }}>Quick Actions</h2>
              <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
                {!student?.profile?.firstName && (
                  <Link to="/profile" className="btn btn-lime btn-sm">Complete your profile →</Link>
                )}
                {!student?.resumeUploaded && (
                  <Link to="/resume" className="btn btn-outline btn-sm">Upload your resume</Link>
                )}
                {analysesCount === 0 && (
                  <Link to="/pathways" className="btn btn-ghost btn-sm">View career pathways →</Link>
                )}
              </div>
            </div>
          )}

          {/* Recommended Programs */}
          <div style={{ marginBottom: 'var(--sp-xl)' }}>
            <div className="section-header">
              <h2>Recommended for You</h2>
              <Link to="/opportunities" style={{ color: 'var(--brand-700)', fontSize: 'var(--text-sm)', textDecoration: 'underline' }}>View all programs →</Link>
            </div>
            <div className="grid-3">
              {topPrograms.map(({ program, score }) => (
                <article key={program.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--brand-500)', marginBottom: '0.125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {program.category}
                      </div>
                      <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-strong)', lineHeight: 1.3, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        {program.shortName || program.name}
                      </h3>
                    </div>
                    {student && (
                      <span className={`match-badge ${score >= 70 ? 'match-high' : score >= 45 ? 'match-medium' : 'match-low'}`}>
                        {score}%
                      </span>
                    )}
                  </div>
                  {program.keyFacts?.[0] && (
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {program.keyFacts[0]}
                    </p>
                  )}
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {program.compensation?.stipend?.slice(0, 50)}
                  </div>
                  <a href={program.applicationUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ marginTop: 'auto' }}>
                    Apply ↗
                  </a>
                </article>
              ))}
            </div>
          </div>

          {/* Career Pathways — link to new PathwayDashboard */}
          <div style={{ marginBottom: 'var(--sp-xl)' }}>
            <div className="section-header">
              <h2>Your Career Pathways</h2>
              <Link to="/pathways" style={{ color: 'var(--brand-700)', fontSize: 'var(--text-sm)', textDecoration: 'underline' }}>Explore all pathways →</Link>
            </div>
            {completeness >= 60 ? (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                  Your profile is ready for personalized career pathway analysis.
                </p>
                <Link to="/pathways" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
                  View My Career Pathways →
                </Link>
              </div>
            ) : (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🔒</span>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: 'var(--text-sm)' }}>Unlock Career Pathways</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                      Complete {60 - completeness}% more of your profile to unlock personalized pathways
                    </div>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${Math.round((completeness / 60) * 100)}%` }} />
                </div>
                <Link to="/profile" className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }}>
                  Complete Profile →
                </Link>
              </div>
            )}
          </div>

          {/* Explore Pathways */}
          <div>
            <div className="section-header">
              <h2 style={{ fontSize: 'var(--text-lg)' }}>Explore Career Pathways</h2>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {pathways.slice(0, 8).map((p) => (
                <Link
                  key={p.id}
                  to={`/pathways?selected=${p.id}`}
                  className="badge badge-green"
                  style={{ textDecoration: 'none', fontSize: 'var(--text-sm)', padding: '0.4rem 0.875rem' }}
                >
                  {p.shortName}
                </Link>
              ))}
              <Link to="/pathways" className="badge badge-muted" style={{ textDecoration: 'none', fontSize: 'var(--text-sm)', padding: '0.4rem 0.875rem' }}>
                View all →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes dashPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </>
  );
}
