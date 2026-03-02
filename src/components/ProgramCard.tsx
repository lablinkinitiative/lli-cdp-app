import type { Program, StudentData } from '../types';
import { computeMatchScore, getEligibilityStatus } from '../matching';
import { saveProgram, unsaveProgram } from '../auth';

interface ProgramCardProps {
  program: Program;
  student?: StudentData | null;
  userId?: string;
  savedIds?: string[];
  onSaveToggle?: (id: string, saved: boolean) => void;
  showMatch?: boolean;
}

function getMatchClass(score: number) {
  if (score >= 70) return 'match-high';
  if (score >= 45) return 'match-medium';
  return 'match-low';
}

function formatLocation(locs: string[]): string {
  if (!locs || locs.length === 0) return 'Various';
  if (locs.length === 1) return locs[0];
  return `${locs[0]} + ${locs.length - 1} more`;
}

export default function ProgramCard({ program, student, userId, savedIds = [], onSaveToggle, showMatch = true }: ProgramCardProps) {
  const matchScore = student && showMatch ? computeMatchScore(program, student) : null;
  const eligStatus = student ? getEligibilityStatus(program, student) : null;
  const isSaved = savedIds.includes(program.id);

  const handleSave = () => {
    if (!userId) return;
    if (isSaved) {
      unsaveProgram(userId, program.id);
      onSaveToggle?.(program.id, false);
    } else {
      saveProgram(userId, program.id);
      onSaveToggle?.(program.id, true);
    }
  };

  const deadlineText = program.deadlines
    ? Object.entries(program.deadlines).map(([k, v]) => `${k}: ${v}`).join(' | ') || 'Rolling'
    : 'Rolling';

  const stipend = program.compensation?.stipend || 'See program';
  const location = formatLocation(program.locations || []);
  const isOpen = program.compensation?.paid;

  return (
    <article className="program-card card-hover">
      {/* Header */}
      <div className="flex items-center gap-sm flex-wrap">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--brand-500)', marginBottom: '0.1rem' }}>
            {program.category}
          </div>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-strong)', lineHeight: 1.3, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {program.name}
          </h3>
        </div>
        <div className="flex gap-sm items-center" style={{ flexShrink: 0 }}>
          {matchScore !== null && (
            <span className={`match-badge ${getMatchClass(matchScore)}`}>
              {matchScore}% match
            </span>
          )}
          {eligStatus && (
            <span className={`badge ${eligStatus === 'eligible' ? 'badge-green' : eligStatus === 'unlikely' ? 'badge-error' : 'badge-warning'}`}>
              {eligStatus === 'eligible' ? 'Eligible' : eligStatus === 'unlikely' ? 'Check req.' : 'Check req.'}
            </span>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-sm" style={{ gap: '0.375rem' }}>
        {isOpen && (
          <span className="badge badge-lime">Paid</span>
        )}
        {program.eligibility.level.map(l => (
          <span key={l} className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{l}</span>
        ))}
        {program.researchAreas?.slice(0, 3).map(area => (
          <span key={area} className="badge badge-muted">{area}</span>
        ))}
      </div>

      {/* Key facts */}
      {program.keyFacts && program.keyFacts.length > 0 && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {program.keyFacts[0]}
        </p>
      )}

      {/* Stats */}
      <div className="flex flex-wrap" style={{ gap: '0.5rem 1.25rem' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          {stipend}
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {location}
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          {deadlineText}
        </span>
      </div>

      {/* LLI Bridge note */}
      {program.lliBridgeNote && (
        <div style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-100)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', fontSize: 'var(--text-xs)', color: 'var(--brand-700)' }}>
          <strong>LLI note:</strong> {program.lliBridgeNote}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-sm flex-wrap" style={{ marginTop: '0.25rem' }}>
        <a
          href={program.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-sm"
        >
          Apply ↗
        </a>
        {userId && (
          <button
            onClick={handleSave}
            className={`btn btn-sm ${isSaved ? 'btn-lime' : 'btn-ghost'}`}
            aria-label={isSaved ? 'Unsave program' : 'Save program'}
          >
            {isSaved ? '★ Saved' : '☆ Save'}
          </button>
        )}
      </div>
    </article>
  );
}
