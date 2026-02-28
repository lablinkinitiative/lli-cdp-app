import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import ProgramCard from '../components/ProgramCard';
import { getCurrentUser, getStudentData, saveStudentData } from '../auth';
import { computeMatchScore } from '../matching';
import type { StudentData, Program } from '../types';
import programsData from '../data/programs.json';

const programs = programsData.programs as unknown as Program[];

export default function Saved() {
  const user = getCurrentUser()!;
  const [student, setStudent] = useState<StudentData | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    const data = getStudentData(user.uid);
    setStudent(data);
    setSavedIds(data?.savedPrograms || []);
  }, [user.uid]);

  const savedPrograms = programs.filter(p => savedIds.includes(p.id));

  // Sort saved programs by match score descending
  const sortedSaved = student
    ? [...savedPrograms]
        .map(p => ({ p, score: computeMatchScore(p, student) }))
        .sort((a, b) => b.score - a.score)
        .map(x => x.p)
    : savedPrograms;

  const handleSaveToggle = (id: string, saved: boolean) => {
    setSavedIds(prev => saved ? [...prev, id] : prev.filter(x => x !== id));
    if (student) {
      const newSaved = saved
        ? [...(student.savedPrograms || []), id]
        : (student.savedPrograms || []).filter(x => x !== id);
      saveStudentData(user.uid, { savedPrograms: newSaved });
    }
  };

  return (
    <>
      <Nav />
      <main id="main">
        <div className="page-header">
          <div className="page-container">
            <h1>Saved Programs</h1>
            <p>
              {savedIds.length > 0
                ? `${savedIds.length} program${savedIds.length !== 1 ? 's' : ''} saved`
                : 'No saved programs yet'}
            </p>
          </div>
        </div>

        <div className="page-container" style={{ padding: 'var(--sp-lg) 1.25rem var(--sp-2xl)' }}>
          {savedIds.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.25, marginBottom: 'var(--sp-md)' }}>
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
              <h3>No saved programs yet</h3>
              <p>
                Save programs you're interested in as you browse — they'll appear here for easy access.
              </p>
              <Link to="/opportunities" className="btn btn-primary" style={{ marginTop: 'var(--sp-md)' }}>
                Browse all programs →
              </Link>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              {student && (
                <div style={{ display: 'flex', gap: 'var(--sp-lg)', marginBottom: 'var(--sp-lg)', flexWrap: 'wrap' }}>
                  {['high', 'medium', 'low'].map(tier => {
                    const count = savedPrograms.filter(p => {
                      const score = computeMatchScore(p, student);
                      return tier === 'high' ? score >= 70 : tier === 'medium' ? score >= 45 : score < 45;
                    }).length;
                    if (count === 0) return null;
                    return (
                      <div key={tier} style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: 'var(--text-2xl)',
                          fontWeight: 800,
                          color: tier === 'high' ? 'var(--success)' : tier === 'medium' ? 'var(--warning)' : 'var(--text-muted)',
                          lineHeight: 1,
                        }}>
                          {count}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.2rem', textTransform: 'capitalize' }}>
                          {tier} match
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Remove all */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--sp-md)' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSavedIds([]);
                    if (student) saveStudentData(user.uid, { savedPrograms: [] });
                  }}
                  style={{ color: 'var(--error)', fontSize: 'var(--text-xs)' }}
                >
                  Remove all saved programs
                </button>
              </div>

              {/* Program list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {sortedSaved.map(program => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    student={student}
                    userId={user.uid}
                    savedIds={savedIds}
                    onSaveToggle={handleSaveToggle}
                    showMatch={!!student?.profile?.firstName}
                  />
                ))}
              </div>

              {/* Browse more */}
              <div style={{ marginTop: 'var(--sp-xl)', textAlign: 'center', padding: 'var(--sp-lg)', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-sm)' }}>
                  {programs.length - savedIds.length} more programs to explore
                </p>
                <Link to="/opportunities" className="btn btn-outline btn-sm">
                  Browse all programs →
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
