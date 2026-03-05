import { useState } from 'react';
import type { ExperienceEntry, ExperienceType } from '../types';

// ─── Type metadata ─────────────────────────────────────────────────────────────

const TYPE_META: Record<ExperienceType, { label: string; color: string; bgColor: string; icon: string }> = {
  work: {
    label: 'Internship / Work',
    color: '#b45309',
    bgColor: 'rgba(251,191,36,0.12)',
    icon: '💼',
  },
  research: {
    label: 'Research',
    color: '#15803d',
    bgColor: 'rgba(154,184,46,0.12)',
    icon: '🔬',
  },
  education: {
    label: 'Education',
    color: '#1d4ed8',
    bgColor: 'rgba(59,130,246,0.10)',
    icon: '🎓',
  },
  leadership: {
    label: 'Leadership',
    color: '#7c3aed',
    bgColor: 'rgba(139,92,246,0.10)',
    icon: '⭐',
  },
  volunteer: {
    label: 'Volunteer',
    color: '#0f766e',
    bgColor: 'rgba(20,184,166,0.10)',
    icon: '🤝',
  },
  other: {
    label: 'Other',
    color: '#64748b',
    bgColor: 'rgba(100,116,139,0.10)',
    icon: '📌',
  },
};

const TYPES: ExperienceType[] = ['work', 'research', 'education', 'leadership', 'volunteer', 'other'];

// ─── Month/Year helpers ────────────────────────────────────────────────────────

function parseMonthYear(val: string): { month: string; year: string } {
  if (!val) return { month: '', year: '' };
  const [y, m] = val.split('-');
  return { month: m || '', year: y || '' };
}

function toStartDate(month: string, year: string): string {
  if (!year) return '';
  return `${year}-${month ? month.padStart(2, '0') : '01'}`;
}

const MONTHS = [
  { val: '01', label: 'Jan' }, { val: '02', label: 'Feb' }, { val: '03', label: 'Mar' },
  { val: '04', label: 'Apr' }, { val: '05', label: 'May' }, { val: '06', label: 'Jun' },
  { val: '07', label: 'Jul' }, { val: '08', label: 'Aug' }, { val: '09', label: 'Sep' },
  { val: '10', label: 'Oct' }, { val: '11', label: 'Nov' }, { val: '12', label: 'Dec' },
];

function formatDateDisplay(startDate?: string, endDate?: string | null): string {
  const fmt = (d: string) => {
    const { month, year } = parseMonthYear(d);
    const m = MONTHS.find(x => x.val === month);
    return m ? `${m.label} ${year}` : year;
  };
  if (!startDate) return '';
  const start = fmt(startDate);
  if (endDate === null || endDate === undefined) return `${start} – Present`;
  return `${start} – ${fmt(endDate)}`;
}

function randomHex8(): string {
  return Math.random().toString(16).slice(2, 10);
}

// ─── Entry Form (add/edit) ────────────────────────────────────────────────────

interface EntryFormProps {
  initial?: ExperienceEntry;
  onSave: (entry: ExperienceEntry) => void;
  onCancel: () => void;
}

function EntryForm({ initial, onSave, onCancel }: EntryFormProps) {
  const [type, setType] = useState<ExperienceType>(initial?.type || 'work');
  const [title, setTitle] = useState(initial?.title || '');
  const [org, setOrg] = useState(initial?.org || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [skillsText, setSkillsText] = useState((initial?.skills || []).join(', '));
  const [isPresent, setIsPresent] = useState(initial ? initial.endDate === null : false);

  const startParsed = parseMonthYear(initial?.startDate || '');
  const endParsed = parseMonthYear(initial?.endDate || '');
  const [startMonth, setStartMonth] = useState(startParsed.month);
  const [startYear, setStartYear] = useState(startParsed.year);
  const [endMonth, setEndMonth] = useState(endParsed.month);
  const [endYear, setEndYear] = useState(endParsed.year);

  const [error, setError] = useState('');

  const yearOptions = Array.from({ length: 15 }, (_, i) => String(2015 + i));

  const handleSave = () => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (!org.trim()) { setError('Organization is required'); return; }
    if (!startYear) { setError('Start year is required'); return; }

    const sd = toStartDate(startMonth, startYear);
    const ed = isPresent ? null : (endYear ? toStartDate(endMonth, endYear) : null);

    const duration = formatDateDisplay(sd, ed);

    const skills = skillsText.split(',').map(s => s.trim()).filter(Boolean);

    onSave({
      id: initial?.id || randomHex8(),
      type,
      title: title.trim(),
      org: org.trim(),
      duration,
      startDate: sd,
      endDate: ed,
      description: description.trim() || undefined,
      skills: skills.length > 0 ? skills : undefined,
    });
  };

  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--sp-lg)',
      marginBottom: 'var(--sp-md)',
    }}>
      <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-strong)', marginBottom: 'var(--sp-md)' }}>
        {initial ? 'Edit Entry' : 'Add Entry'}
      </div>

      {error && (
        <div style={{ color: 'var(--error)', fontSize: 'var(--text-xs)', marginBottom: 'var(--sp-sm)', padding: '0.5rem', background: 'rgba(185,28,28,0.08)', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}

      {/* Type */}
      <div className="form-group">
        <label className="form-label">Type</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.25rem' }}>
          {TYPES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`btn btn-sm ${type === t ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.72rem' }}
            >
              {TYPE_META[t].icon} {TYPE_META[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Title + Org */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)', marginTop: 'var(--sp-md)' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="et-title">Title / Role / Degree</label>
          <input id="et-title" type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Research Intern" />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="et-org">Organization / University</label>
          <input id="et-org" type="text" className="form-input" value={org} onChange={e => setOrg(e.target.value)} placeholder="e.g. Argonne National Lab" />
        </div>
      </div>

      {/* Date range */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)', marginTop: 'var(--sp-md)' }}>
        <div className="form-group">
          <label className="form-label">Start date</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select className="form-select" value={startMonth} onChange={e => setStartMonth(e.target.value)} style={{ flex: 1 }}>
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
            </select>
            <select className="form-select" value={startYear} onChange={e => setStartYear(e.target.value)} style={{ flex: 1 }}>
              <option value="">Year</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">End date</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '0.375rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={isPresent} onChange={e => setIsPresent(e.target.checked)} />
            Current / Present
          </label>
          {!isPresent && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select className="form-select" value={endMonth} onChange={e => setEndMonth(e.target.value)} style={{ flex: 1 }}>
                <option value="">Month</option>
                {MONTHS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
              </select>
              <select className="form-select" value={endYear} onChange={e => setEndYear(e.target.value)} style={{ flex: 1 }}>
                <option value="">Year</option>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="form-group" style={{ marginTop: 'var(--sp-md)' }}>
        <label className="form-label" htmlFor="et-desc">Description (optional)</label>
        <textarea
          id="et-desc"
          className="form-input"
          rows={2}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Key responsibilities or achievements..."
          style={{ resize: 'vertical' }}
        />
      </div>

      {/* Skills */}
      <div className="form-group" style={{ marginTop: 'var(--sp-sm)' }}>
        <label className="form-label" htmlFor="et-skills">Skills used (optional, comma-separated)</label>
        <input id="et-skills" type="text" className="form-input" value={skillsText} onChange={e => setSkillsText(e.target.value)} placeholder="Python, LAMMPS, MATLAB" />
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-sm)', marginTop: 'var(--sp-md)', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>Save</button>
      </div>
    </div>
  );
}

// ─── Timeline Entry Card ───────────────────────────────────────────────────────

interface EntryCardProps {
  entry: ExperienceEntry;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function EntryCard({ entry, isLast, onEdit, onDelete }: EntryCardProps) {
  const meta = TYPE_META[entry.type] || TYPE_META.other;
  const dateLabel = entry.duration || formatDateDisplay(entry.startDate, entry.endDate);

  return (
    <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
      {/* Left: icon + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: meta.bgColor,
          border: `2px solid ${meta.color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          flexShrink: 0,
          zIndex: 1,
        }}>
          {meta.icon}
        </div>
        {!isLast && (
          <div style={{
            width: 2,
            flex: 1,
            minHeight: 24,
            background: 'linear-gradient(to bottom, var(--border), transparent)',
            marginTop: 4,
          }} />
        )}
      </div>

      {/* Right: card */}
      <div style={{
        flex: 1,
        background: meta.bgColor,
        border: `1px solid ${meta.color}28`,
        borderRadius: 'var(--radius-lg)',
        padding: '0.875rem 1rem',
        marginBottom: isLast ? 0 : 'var(--sp-md)',
        position: 'relative',
      }}>
        {/* Date badge */}
        {dateLabel && (
          <div style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: meta.color,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.25rem',
          }}>
            {dateLabel}
          </div>
        )}

        {/* Title */}
        <div style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontWeight: 700,
          fontSize: 'var(--text-sm)',
          color: 'var(--text-strong)',
          lineHeight: 1.3,
        }}>
          {entry.title}
        </div>

        {/* Org */}
        <div style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          marginTop: '0.125rem',
          fontWeight: 600,
        }}>
          {entry.org}
        </div>

        {/* Type badge */}
        <span style={{
          display: 'inline-block',
          fontSize: '0.65rem',
          fontWeight: 700,
          color: meta.color,
          background: `${meta.color}18`,
          border: `1px solid ${meta.color}40`,
          borderRadius: '999px',
          padding: '0.1rem 0.5rem',
          marginTop: '0.375rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {meta.label}
        </span>

        {/* Description */}
        {entry.description && (
          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-default)',
            lineHeight: 1.55,
            marginTop: '0.5rem',
          }}>
            {entry.description}
          </p>
        )}

        {/* Skills chips */}
        {entry.skills && entry.skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
            {entry.skills.map(s => (
              <span key={s} style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '999px',
                padding: '0.1rem 0.45rem',
              }}>
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Edit / Delete */}
        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.25rem' }}>
          <button
            type="button"
            onClick={onEdit}
            title="Edit"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              padding: '0.2rem 0.35rem',
              borderRadius: 'var(--radius-sm)',
              lineHeight: 1,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-strong)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              padding: '0.2rem 0.35rem',
              borderRadius: 'var(--radius-sm)',
              lineHeight: 1,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--error)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ExperienceTimelineProps {
  entries: ExperienceEntry[];
  onChange: (entries: ExperienceEntry[]) => void;
  onSave: (entries: ExperienceEntry[]) => void;
  saving?: boolean;
  saved?: boolean;
}

export default function ExperienceTimeline({ entries, onChange, onSave, saving, saved }: ExperienceTimelineProps) {
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const sorted = [...entries].sort((a, b) => {
    const da = a.startDate || '0000-00';
    const db2 = b.startDate || '0000-00';
    return db2.localeCompare(da);
  });

  const handleAdd = (entry: ExperienceEntry) => {
    const next = [...entries, entry].sort((a, b) => {
      const da = a.startDate || '0000-00';
      const db2 = b.startDate || '0000-00';
      return db2.localeCompare(da);
    });
    onChange(next);
    setDirty(true);
    setAddingNew(false);
  };

  const handleEdit = (entry: ExperienceEntry) => {
    const next = entries.map(e => e.id === entry.id ? entry : e).sort((a, b) => {
      const da = a.startDate || '0000-00';
      const db2 = b.startDate || '0000-00';
      return db2.localeCompare(da);
    });
    onChange(next);
    setDirty(true);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remove this entry from your timeline?')) return;
    const next = entries.filter(e => e.id !== id);
    onChange(next);
    setDirty(true);
  };

  const handleSave = () => {
    onSave(entries);
    setDirty(false);
  };

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-md)' }}>
        <div>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-strong)', marginBottom: '0.125rem' }}>
            Experience &amp; Education
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {entries.length === 0
              ? 'Add your experience and education — or upload a resume to auto-populate.'
              : `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center' }}>
          {saved && !dirty && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              Saved
            </span>
          )}
          {dirty && (
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          )}
          {!addingNew && (
            <button className="btn btn-ghost btn-sm" onClick={() => setAddingNew(true)}>
              + Add entry
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {addingNew && (
        <EntryForm
          onSave={handleAdd}
          onCancel={() => setAddingNew(false)}
        />
      )}

      {/* Timeline */}
      {sorted.length === 0 && !addingNew ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem 1rem',
          border: '2px dashed var(--border)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--text-faint)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            No experience entries yet
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>
            Upload a resume to auto-populate, or click "+ Add entry" to add manually.
          </div>
        </div>
      ) : (
        <div>
          {sorted.map((entry, idx) => (
            editingId === entry.id ? (
              <EntryForm
                key={entry.id}
                initial={entry}
                onSave={handleEdit}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <EntryCard
                key={entry.id}
                entry={entry}
                isLast={idx === sorted.length - 1}
                onEdit={() => setEditingId(entry.id)}
                onDelete={() => handleDelete(entry.id)}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
}
