import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Nav from '../components/Nav';
import RadarChart from '../components/RadarChart';
import { getCurrentUser, getStudentData, saveStudentData } from '../auth';
import { computeGapAnalysis } from '../matching';
import type { StudentData, Pathway, Program } from '../types';
import pathwaysData from '../data/pathways.json';
import programsData from '../data/programs.json';

const pathways = pathwaysData.pathways as unknown as Pathway[];
const programs = programsData.programs as unknown as Program[];

export default function PathwayGap() {
  const { id } = useParams<{ id: string }>();
  const user = getCurrentUser()!;
  const [student, setStudent] = useState<StudentData | null>(null);
  const [selectedPathwayId, setSelectedPathwayId] = useState(id || pathways[0].id);

  useEffect(() => {
    setStudent(getStudentData(user.uid));
  }, [user.uid]);

  useEffect(() => {
    if (id) setSelectedPathwayId(id);
  }, [id]);

  const pathway = pathways.find(p => p.id === selectedPathwayId) || pathways[0];

  const analysis = student ? computeGapAnalysis(pathway, student) : null;

  const matchedPrograms = pathway.corePrograms
    ? programs.filter(p => pathway.corePrograms!.includes(p.id)).slice(0, 4)
    : programs.filter(p => p.category.toLowerCase().includes(pathway.track?.toLowerCase().split('/')[0]?.trim() || '')).slice(0, 4);

  const saveAnalysis = () => {
    if (!student || !analysis) return;
    const existing = student.gapAnalyses || [];
    saveStudentData(user.uid, {
      gapAnalyses: [analysis, ...existing.filter(a => a.pathwayId !== pathway.id)],
    });
    setStudent(s => s ? { ...s, gapAnalyses: [analysis, ...(s.gapAnalyses || []).filter(a => a.pathwayId !== pathway.id)] } : s);
  };

  const matchColor = analysis
    ? analysis.overallMatch >= 70 ? 'var(--success)' : analysis.overallMatch >= 45 ? 'var(--warning)' : 'var(--error)'
    : 'var(--text-muted)';

  return (
    <>
      <Nav />
      <main id="main">
        <div className="page-header">
          <div className="page-container">
            <h1>Gap Analysis</h1>
            <p>See how your current skills compare to your target career pathway</p>
          </div>
        </div>

        <div className="page-container" style={{ padding: 'var(--sp-lg) 1.25rem var(--sp-2xl)' }}>
          {/* Pathway selector */}
          <div style={{ marginBottom: 'var(--sp-lg)' }}>
            <label className="form-label" htmlFor="pathway-select" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Select a career pathway:
            </label>
            <select
              id="pathway-select"
              className="form-select"
              value={selectedPathwayId}
              onChange={e => setSelectedPathwayId(e.target.value)}
              style={{ maxWidth: 400 }}
            >
              {pathways.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {!student?.profile?.firstName && (
            <div className="alert" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid rgba(180,83,9,0.2)', marginBottom: 'var(--sp-lg)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>
                Your profile is incomplete. <Link to="/onboarding" style={{ color: 'var(--warning)' }}>Complete your profile</Link> for a more accurate gap analysis.
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'var(--sp-xl)', alignItems: 'start' }}>
            {/* Left column — radar + score */}
            <div>
              {/* Pathway info */}
              <div className="card" style={{ marginBottom: 'var(--sp-md)' }}>
                <div className="badge badge-lime" style={{ marginBottom: 'var(--sp-sm)' }}>{pathway.track}</div>
                <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--text-strong)', marginBottom: '0.375rem' }}>{pathway.name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{pathway.description}</p>
                {pathway.timeToReady && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    <strong>Time to ready:</strong> {pathway.timeToReady}
                  </p>
                )}
              </div>

              {/* Match score */}
              {analysis && (
                <div className="card" style={{ textAlign: 'center', marginBottom: 'var(--sp-md)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Overall Match
                  </div>
                  <div style={{ fontSize: '3.5rem', fontWeight: 800, color: matchColor, lineHeight: 1, marginBottom: '0.375rem' }}>
                    {analysis.overallMatch}%
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    {analysis.overallMatch >= 70 ? 'Strong candidate' : analysis.overallMatch >= 45 ? 'Building readiness' : 'Early stage — keep building'}
                  </div>
                </div>
              )}

              {/* Radar chart */}
              {analysis && analysis.radarData.axes.length > 2 && (
                <div className="card" style={{ position: 'relative' }}>
                  <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 'var(--sp-sm)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Skills Radar
                  </h3>
                  <RadarChart
                    axes={analysis.radarData.axes}
                    studentScores={analysis.radarData.studentScores}
                    requiredScores={analysis.radarData.requiredScores}
                  />
                </div>
              )}
            </div>

            {/* Right column — breakdown + recommendations */}
            <div>
              {/* Skill breakdown */}
              {analysis && (
                <div className="card" style={{ marginBottom: 'var(--sp-md)' }}>
                  <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-strong)', marginBottom: 'var(--sp-md)' }}>
                    Skill Breakdown
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: '0.5rem 1rem', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-muted)', gridColumn: '1', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Skill</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Progress</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Required</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Status</div>
                    {analysis.skillBreakdown.slice(0, 8).map(item => (
                      <>
                        <div key={`name-${item.skill}`} style={{ color: 'var(--text-default)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                          {item.skill.length > 28 ? item.skill.slice(0, 26) + '…' : item.skill}
                        </div>
                        <div key={`bar-${item.skill}`} style={{ height: 8, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.round(item.studentLevel * 100)}%`,
                            background: item.status === 'meets' ? 'var(--success)' : item.status === 'partial' ? 'var(--warning)' : 'var(--error)',
                            borderRadius: 99,
                          }} />
                        </div>
                        <div key={`req-${item.skill}`} style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                          {Math.round(item.requiredLevel * 100)}%
                        </div>
                        <div key={`status-${item.skill}`} className={`status-${item.status}`} style={{ fontWeight: 700, textTransform: 'capitalize' }}>
                          {item.status}
                        </div>
                      </>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis && (
                <div className="card" style={{ marginBottom: 'var(--sp-md)' }}>
                  <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-strong)', marginBottom: 'var(--sp-md)' }}>
                    Top Recommendations
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
                    {analysis.recommendations.map((rec, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        gap: '0.75rem',
                        padding: 'var(--sp-sm)',
                        background: rec.priority === 'high' ? 'var(--error-bg)' : rec.priority === 'medium' ? 'var(--warning-bg)' : 'var(--surface)',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${rec.priority === 'high' ? 'rgba(185,28,28,0.15)' : rec.priority === 'medium' ? 'rgba(180,83,9,0.15)' : 'var(--border)'}`,
                      }}>
                        <div style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: rec.priority === 'high' ? 'var(--error)' : rec.priority === 'medium' ? 'var(--warning)' : 'var(--text-faint)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          flexShrink: 0,
                          marginTop: '0.125rem',
                          textTransform: 'uppercase',
                        }}>
                          {rec.priority[0]}
                        </div>
                        <div>
                          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-default)', lineHeight: 1.5 }}>{rec.text}</p>
                          {rec.resource && (
                            <a href={rec.resource} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--brand-700)', textDecoration: 'underline', marginTop: '0.25rem', display: 'inline-block' }}>
                              Learn more ↗
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched programs */}
              <div className="card">
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-strong)', marginBottom: 'var(--sp-md)' }}>
                  Programs Aligned with this Pathway
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(matchedPrograms.length > 0 ? matchedPrograms : programs.slice(0, 4)).map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-strong)' }}>{p.shortName || p.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{p.category}</div>
                      </div>
                      <a href={p.applicationUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                        Apply ↗
                      </a>
                    </div>
                  ))}
                </div>
                <Link to="/opportunities" className="btn btn-outline btn-sm btn-block" style={{ marginTop: 'var(--sp-md)' }}>
                  Browse all {programs.length} programs →
                </Link>
              </div>

              {/* Save analysis */}
              {analysis && (
                <div style={{ marginTop: 'var(--sp-md)', display: 'flex', gap: 'var(--sp-sm)' }}>
                  <button onClick={saveAnalysis} className="btn btn-primary btn-sm">
                    Save this analysis
                  </button>
                  <Link to="/profile" className="btn btn-ghost btn-sm">
                    Update skills →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* All pathways */}
          <div style={{ marginTop: 'var(--sp-xl)', padding: 'var(--sp-lg)', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--sp-md)', color: 'var(--text-strong)' }}>
              All 14 Career Pathways
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {pathways.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPathwayId(p.id)}
                  className={`btn btn-sm ${p.id === selectedPathwayId ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {p.shortName}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
