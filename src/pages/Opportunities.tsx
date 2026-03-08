import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Nav from '../components/Nav';
import ProgramCard from '../components/ProgramCard';
import { getCurrentUser, getStudentData, saveStudentData } from '../auth';
import { computeMatchScore } from '../matching';
import type { StudentData, Program } from '../types';
import programsData from '../data/programs.json';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'https://app.lablinkinitiative.org';

const programs = programsData.programs as unknown as Program[];

const CATEGORIES = ['All', 'DOE National Labs', 'Federal Science Agencies', 'Space & Defense', 'Biomedical & Health', 'Equity & Access', 'High School Programs', 'Competitive Fellowships', 'Industry: Tech & Computing', 'Community College', 'Academic Research'];

type SortMode = 'match' | 'az' | 'deadline';

export default function Opportunities() {
  const user = getCurrentUser()!;
  const [searchParams, setSearchParams] = useSearchParams();
  const pathwayParam = searchParams.get('pathway');

  const [student, setStudent] = useState<StudentData | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sortMode, setSortMode] = useState<SortMode>('match');
  const [showTagFilters, setShowTagFilters] = useState(false);

  // Pathway filter state
  const [pathwayTitle, setPathwayTitle] = useState<string | null>(null);
  const [pathwayProgramSlugs, setPathwayProgramSlugs] = useState<string[] | null>(null);
  const [isLoadingPathway, setIsLoadingPathway] = useState(!!pathwayParam);

  // Tag-based filters
  const [filterPaid, setFilterPaid] = useState(false);
  const [filterRemote, setFilterRemote] = useState(false);
  const [filterCareerStage, setFilterCareerStage] = useState('');
  const [filterBenefit, setFilterBenefit] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');

  useEffect(() => {
    const data = getStudentData(user.uid);
    setStudent(data);
    setSavedIds(data?.savedPrograms || []);

    // Auto-set career stage filter based on student profile (only if no pathway filter active)
    if (data && !searchParams.get('pathway')) {
      // Use explicit career_stage from backend if available
      const explicitStage = data.profile?.career_stage;
      if (explicitStage) {
        setFilterCareerStage(explicitStage);
      } else {
        const year = (data.profile?.year || '').toLowerCase();
        const hasCurrentWork = (data.experience || []).some(
          (e: { type: string; endDate?: string | null }) => e.type === 'work' && !e.endDate
        );
        if (hasCurrentWork) {
          setFilterCareerStage('professional');
        } else if (year.includes('phd') || year.includes('doct')) {
          setFilterCareerStage('phd');
        } else if (year.includes('grad') || year.includes('master')) {
          setFilterCareerStage('graduate');
        } else if (year.includes('fresh') || year.includes('soph') || year.includes('junior') || year.includes('senior') || year.includes('other')) {
          setFilterCareerStage('undergraduate');
        } else if (year.includes('community')) {
          setFilterCareerStage('undergraduate');
        } else if (year.includes('high school') || year === 'hs') {
          setFilterCareerStage('high_school');
        }
        // Unknown year: leave unfiltered so new users see all programs
      }
    }
  }, [user.uid]);

  useEffect(() => {
    if (!pathwayParam) {
      setPathwayTitle(null);
      setPathwayProgramSlugs(null);
      setIsLoadingPathway(false);
      return;
    }
    setIsLoadingPathway(true);
    const token = localStorage.getItem('cdp_token') || '';
    fetch(`${API_BASE}/api/cdp/pathways/${pathwayParam}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.pathway) {
          setPathwayTitle(data.pathway.title || pathwayParam);
          setPathwayProgramSlugs((data.pathway.programs || []).map((p: { slug: string }) => p.slug).filter(Boolean));
        } else {
          setPathwayProgramSlugs(null);
        }
      })
      .catch(() => { setPathwayProgramSlugs(null); })
      .finally(() => setIsLoadingPathway(false));
  }, [pathwayParam]);

  const hasActiveFilters = filterPaid || filterRemote || !!filterCareerStage || !!filterBenefit || !!filterKeyword;

  const filtered = useMemo(() => {
    let result = programs.filter(p => {
      // Pathway filter
      if (pathwayProgramSlugs !== null && !pathwayProgramSlugs.includes(p.id)) return false;

      // Category filter
      if (category !== 'All') {
        const catLower = category.toLowerCase();
        if (!p.category.toLowerCase().includes(catLower.split(':')[0].trim())) {
          return false;
        }
      }

      // Text search
      if (query) {
        const haystack = (
          p.name + ' ' + p.shortName + ' ' + p.category + ' ' +
          (p.researchAreas || []).join(' ') + ' ' +
          (p.keyFacts || []).join(' ')
        ).toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }

      // Tag-based filters
      if (filterPaid && !p.compensation?.paid) return false;

      if (filterRemote) {
        const isRemote = (p.tags?.location_type || []).includes('remote') ||
          (p.locations || []).some(l => /remote|virtual|online/i.test(l));
        if (!isRemote) return false;
      }

      if (filterCareerStage) {
        const stageMatch = (p.tags?.career_stage || []).includes(filterCareerStage) ||
          (p.eligibility?.level || []).some(l => l.toLowerCase().includes(filterCareerStage.replace('_', ' ')));
        if (!stageMatch) return false;
      }

      if (filterBenefit) {
        if (!(p.tags?.benefits || []).includes(filterBenefit)) return false;
      }

      if (filterKeyword) {
        if (!(p.tags?.keywords || []).includes(filterKeyword)) return false;
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
    } else if (sortMode === 'deadline') {
      result = [...result].sort((a, b) => {
        const aDate = a.deadlines ? Object.values(a.deadlines)[0] : null;
        const bDate = b.deadlines ? Object.values(b.deadlines)[0] : null;
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return aDate.localeCompare(bDate);
      });
    }

    return result;
  }, [query, category, sortMode, student, filterPaid, filterRemote, filterCareerStage, filterBenefit, filterKeyword, pathwayProgramSlugs]);

  const clearAll = () => {
    setQuery(''); setCategory('All');
    setFilterPaid(false); setFilterRemote(false);
    setFilterCareerStage(''); setFilterBenefit(''); setFilterKeyword('');
  };

  const handleSaveToggle = (id: string, saved: boolean) => {
    setSavedIds(prev => saved ? [...prev, id] : prev.filter(x => x !== id));
    if (student) {
      const newSaved = saved
        ? [...(student.savedPrograms || []), id]
        : (student.savedPrograms || []).filter(x => x !== id);
      saveStudentData(user.uid, { savedPrograms: newSaved });
    }
  };

  const activeFilterCount = [filterPaid, filterRemote, !!filterCareerStage, !!filterBenefit, !!filterKeyword].filter(Boolean).length;

  const STAGE_LABELS: Record<string, string> = {
    high_school: 'High School',
    undergraduate: 'Undergraduate',
    graduate: 'Graduate',
    phd: 'PhD',
    postdoc: 'Postdoc',
    professional: 'Working Professional',
  };

  return (
    <>
      <Nav />
      <main id="main">
        <div className="page-header">
          <div className="page-container">
            <h1>Browse Opportunities</h1>
            <p>{programs.length} curated STEM programs — with personalized match scores</p>
          </div>
        </div>

        {pathwayParam && (isLoadingPathway || pathwayTitle) && (
          <div style={{ background: 'var(--brand-50)', borderBottom: '1px solid var(--brand-200, #d1fae5)', padding: '0.625rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="page-container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: 0 }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--brand-700)' }}>
                {isLoadingPathway
                  ? 'Loading pathway programs…'
                  : <>Showing programs for pathway: <strong>{pathwayTitle}</strong>{pathwayProgramSlugs !== null && ` — ${filtered.length} matched`}</>
                }
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)' }}
                onClick={() => { setSearchParams({}); }}
              >
                ✕ Show all programs
              </button>
            </div>
          </div>
        )}

        {/* Career stage info banner — shown when a stage filter is auto-applied */}
        {filterCareerStage && !pathwayParam && (
          <div style={{ background: 'var(--surface-secondary, #f8fafc)', borderBottom: '1px solid var(--border, #e2e8f0)', padding: '0.5rem 1.25rem' }}>
            <div className="page-container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: 0 }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                Showing programs for: <strong style={{ color: 'var(--text-primary)' }}>{STAGE_LABELS[filterCareerStage] || filterCareerStage}</strong>
                {' '}— {filtered.length} matched
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)' }}
                onClick={() => setFilterCareerStage('')}
              >
                Show all stages
              </button>
            </div>
          </div>
        )}

        <div className="page-container" style={{ padding: 'var(--sp-lg) 1.25rem var(--sp-2xl)' }}>
          {/* Search, Sort & Filter Toggle */}
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
            <button
              type="button"
              className={`btn btn-sm ${showTagFilters ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setShowTagFilters(v => !v)}
              aria-expanded={showTagFilters}
            >
              Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </button>
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

          {/* Tag-based Filter Panel */}
          {showTagFilters && (
            <div style={{
              background: 'var(--surface-secondary, #f8fafc)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--sp-md)',
              marginBottom: 'var(--sp-md)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--sp-md)',
              alignItems: 'flex-start',
            }}>
              {/* Quick toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Quick Filters</label>
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                  <input type="checkbox" checked={filterPaid} onChange={e => setFilterPaid(e.target.checked)} />
                  Paid / Stipend
                </label>
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                  <input type="checkbox" checked={filterRemote} onChange={e => setFilterRemote(e.target.checked)} />
                  Remote / Virtual
                </label>
              </div>

              {/* Career stage */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Career Stage</label>
                <select
                  className="form-select"
                  style={{ width: 'auto' }}
                  value={filterCareerStage}
                  onChange={e => setFilterCareerStage(e.target.value)}
                >
                  <option value="">Any stage</option>
                  <option value="high_school">High School</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="graduate">Graduate</option>
                  <option value="phd">PhD</option>
                  <option value="postdoc">Postdoc</option>
                  <option value="professional">Working Professional</option>
                </select>
              </div>

              {/* Benefits */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Benefits</label>
                <select
                  className="form-select"
                  style={{ width: 'auto' }}
                  value={filterBenefit}
                  onChange={e => setFilterBenefit(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="housing">Housing</option>
                  <option value="travel_funding">Travel Funding</option>
                  <option value="academic_credit">Academic Credit</option>
                  <option value="health_insurance">Health Insurance</option>
                </select>
              </div>

              {/* Keywords */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Keywords</label>
                <select
                  className="form-select"
                  style={{ width: 'auto' }}
                  value={filterKeyword}
                  onChange={e => setFilterKeyword(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="prestigious">Prestigious</option>
                  <option value="beginner_friendly">Beginner Friendly</option>
                  <option value="research_intensive">Research Intensive</option>
                  <option value="federal_program">Federal Program</option>
                  <option value="industry_partner">Industry Partner</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ alignSelf: 'flex-end' }}
                  onClick={() => { setFilterPaid(false); setFilterRemote(false); setFilterCareerStage(''); setFilterBenefit(''); setFilterKeyword(''); }}
                >
                  Clear tag filters
                </button>
              )}
            </div>
          )}

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
              {hasActiveFilters ? ' (filtered)' : ''}
            </p>
            {(query || category !== 'All' || hasActiveFilters) && (
              <button onClick={clearAll} className="btn btn-ghost btn-sm">
                Clear all filters
              </button>
            )}
          </div>

          {/* Program list */}
          {isLoadingPathway ? (
            <div className="empty-state">
              <p style={{ color: 'var(--text-muted)' }}>Loading pathway programs…</p>
            </div>
          ) : filtered.length > 0 ? (
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
              <button onClick={clearAll} className="btn btn-outline" style={{ marginTop: 'var(--sp-md)' }}>
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
