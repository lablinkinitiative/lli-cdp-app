import { useState, useEffect, useMemo } from 'react';
import Nav from '../components/Nav';
import ProgramCard from '../components/ProgramCard';
import { getCurrentUser, getStudentData, saveStudentData } from '../auth';
import { computeMatchScore } from '../matching';
import type { StudentData, Program } from '../types';
import programsData from '../data/programs.json';

const programs = programsData.programs as unknown as Program[];

const CATEGORIES = ['All', 'DOE National Labs', 'Federal / Space', 'Federal / Environment', 'Federal / Biomedical', 'Federal / Science', 'Federal / Defense', 'Academic Research', 'Industry / Tech', 'Industry / Clean Energy', 'Equity / Federal', 'Platform'];

type SortMode = 'match' | 'az' | 'deadline';

export default function Opportunities() {
  const user = getCurrentUser()!;
  const [student, setStudent] = useState<StudentData | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sortMode, setSortMode] = useState<SortMode>('match');

  useEffect(() => {
    const data = getStudentData(user.uid);
    setStudent(data);
    setSavedIds(data?.savedPrograms || []);
  }, [user.uid]);

  const filtered = useMemo(() => {
    let result = programs.filter(p => {
      if (category !== 'All' && !p.category.startsWith(category.split(' /')[0])) {
        // More flexible category matching
        if (!p.category.toLowerCase().includes(category.toLowerCase().split('/')[0].trim())) {
          return false;
        }
      }
      if (query) {
        const haystack = (p.name + ' ' + p.shortName + ' ' + p.category + ' ' + (p.researchAreas || []).join(' ') + ' ' + (p.keyFacts || []).join(' ')).toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }
      return true;
    });

    if (sortMode === 'match' && student) {
      result = result
        .map(p => ({ p, score: computeMatchScore(p, student) }))
        .sort((a, b) => b.score - a.score)
        .map(x => x.p);
    } else if (sortMode === 'az') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [query, category, sortMode, student]);

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
            <h1>Browse Opportunities</h1>
            <p>{programs.length} curated programs — with personalized match scores</p>
          </div>
        </div>

        <div className="page-container" style={{ padding: 'var(--sp-lg) 1.25rem var(--sp-2xl)' }}>
          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap', marginBottom: 'var(--sp-md)', alignItems: 'center' }}>
            <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by keyword, program, or field..."
                aria-label="Search programs"
              />
              <button type="button" aria-label="Search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
            </div>
            <select
              className="form-select"
              style={{ width: 'auto', flex: 'none' }}
              value={sortMode}
              onChange={e => setSortMode(e.target.value as SortMode)}
              aria-label="Sort by"
            >
              <option value="match">Best Match</option>
              <option value="az">A–Z</option>
              <option value="deadline">Deadline</option>
            </select>
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: 'var(--sp-lg)', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`btn btn-sm ${category === cat ? 'btn-primary' : 'btn-ghost'}`}
                aria-pressed={category === cat}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-md)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-strong)' }}>{filtered.length}</strong> programs
              {query ? ` matching "${query}"` : ''}
              {category !== 'All' ? ` in ${category}` : ''}
            </p>
            {(query || category !== 'All') && (
              <button
                onClick={() => { setQuery(''); setCategory('All'); }}
                className="btn btn-ghost btn-sm"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Program list */}
          {filtered.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {filtered.map(program => (
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
          ) : (
            <div className="empty-state">
              <h3>No programs found</h3>
              <p>Try adjusting your search or clearing filters.</p>
              <button onClick={() => { setQuery(''); setCategory('All'); }} className="btn btn-outline" style={{ marginTop: 'var(--sp-md)' }}>
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
