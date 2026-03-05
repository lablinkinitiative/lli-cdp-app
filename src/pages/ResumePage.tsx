import { useState, useRef, useEffect, useCallback } from 'react';
import Nav from '../components/Nav';
import { getCurrentUser, refreshStudentData } from '../auth';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'https://app.lablinkinitiative.org';

interface ResumeRecord {
  id: string;
  label: string;
  original_name: string;
  file_size: number;
  status: 'processing' | 'parsed' | 'error';
  parsed_summary: { skills_count: number; experience_count: number; skills: string[] } | null;
  error: string | null;
  created_at: string;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Resume Card ──────────────────────────────────────────────────────────────

interface ResumeCardProps {
  resume: ResumeRecord;
  onDelete: (id: string) => void;
  onRename: (id: string, label: string) => void;
  onStatusUpdate: (id: string, updated: Partial<ResumeRecord>) => void;
}

function ResumeCard({ resume, onDelete, onRename, onStatusUpdate }: ResumeCardProps) {
  const token = localStorage.getItem('cdp_token');
  const [editing, setEditing] = useState(false);
  const [labelDraft, setLabelDraft] = useState(resume.label);
  const [deleting, setDeleting] = useState(false);

  // Poll status while processing
  useEffect(() => {
    if (resume.status !== 'processing') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/cdp/resumes/${resume.id}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.status && data.status !== 'processing') {
          onStatusUpdate(resume.id, { status: data.status, parsed_summary: data.parsed_summary, error: data.error });
          clearInterval(interval);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [resume.id, resume.status, token, onStatusUpdate]);

  const handleRename = async () => {
    if (!labelDraft.trim() || labelDraft === resume.label) { setEditing(false); return; }
    try {
      await fetch(`${API_BASE}/api/cdp/resumes/${resume.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: labelDraft }),
      });
      onRename(resume.id, labelDraft);
    } catch {}
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${resume.label}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/api/cdp/resumes/${resume.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      onDelete(resume.id);
    } catch { setDeleting(false); }
  };

  const handleDownload = () => {
    fetch(`${API_BASE}/api/cdp/resumes/${resume.id}/download`, {
      headers: { Authorization: `Bearer ${token || ''}` },
    }).then(r => r.blob()).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resume.original_name;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const iconColor = resume.status === 'parsed' ? '#15803d' : resume.status === 'error' ? '#dc2626' : '#94a3b8';
  const iconBg = resume.status === 'parsed' ? 'rgba(154,184,46,0.12)' : resume.status === 'error' ? 'rgba(220,38,38,0.08)' : 'rgba(148,163,184,0.1)';

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--sp-md)',
      opacity: deleting ? 0.5 : 1,
      transition: 'opacity 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              <input
                autoFocus
                value={labelDraft}
                onChange={e => setLabelDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') { setEditing(false); setLabelDraft(resume.label); } }}
                style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 600, border: '1px solid var(--brand-500)', borderRadius: 'var(--radius-sm)', padding: '2px 6px', background: 'var(--surface)' }}
              />
              <button className="btn btn-primary btn-sm" onClick={handleRename} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>Save</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setLabelDraft(resume.label); }} style={{ padding: '2px 6px', fontSize: '0.7rem' }}>✕</button>
            </div>
          ) : (
            <div
              onClick={() => setEditing(true)}
              title="Click to rename"
              style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-strong)', cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {resume.label} <span style={{ fontSize: '0.6rem', color: 'var(--text-faint)', fontWeight: 400 }}>✎</span>
            </div>
          )}
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            {formatBytes(resume.file_size)} · {timeAgo(resume.created_at)}
          </div>
        </div>
      </div>

      {resume.status === 'processing' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', animation: 'rPulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 'var(--text-xs)', color: '#b45309', fontWeight: 500 }}>Parsing with AI…</span>
        </div>
      )}

      {resume.status === 'parsed' && resume.parsed_summary && (
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 600, marginBottom: '0.25rem' }}>
            ✓ Parsed — {resume.parsed_summary.skills_count} skills · {resume.parsed_summary.experience_count} experience entries
          </div>
          {resume.parsed_summary.skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {resume.parsed_summary.skills.map(s => (
                <span key={s} style={{ fontSize: '0.65rem', background: 'rgba(154,184,46,0.12)', color: '#15803d', borderRadius: 4, padding: '1px 6px', fontWeight: 500 }}>{s}</span>
              ))}
              {resume.parsed_summary.skills_count > 5 && (
                <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>+{resume.parsed_summary.skills_count - 5} more</span>
              )}
            </div>
          )}
        </div>
      )}

      {resume.status === 'error' && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--error)', marginBottom: '0.5rem' }}>
          ✗ Parse failed — {resume.error || 'unknown error'}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem' }}>
        <button onClick={handleDownload} className="btn btn-ghost btn-sm" style={{ fontSize: '0.7rem', padding: '3px 10px' }}>
          ↓ Download
        </button>
        <button onClick={handleDelete} className="btn btn-ghost btn-sm" style={{ fontSize: '0.7rem', padding: '3px 10px', color: 'var(--error, #dc2626)' }} disabled={deleting}>
          {deleting ? 'Deleting…' : '✕ Delete'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResumePage() {
  const user = getCurrentUser()!;
  const token = localStorage.getItem('cdp_token');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const loadResumes = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cdp/resumes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) setResumes(data.resumes || []);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { loadResumes(); }, [loadResumes]);

  const handleFile = async (file: File) => {
    if (!/\.(pdf|doc|docx|txt)$/i.test(file.name)) {
      setUploadError('Please upload a PDF, Word (.doc/.docx), or plain text (.txt) file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be under 5MB.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch(`${API_BASE}/api/cdp/resume/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Upload failed');

      // Optimistic card
      const newResume: ResumeRecord = {
        id: data.resume_id,
        label: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        original_name: file.name,
        file_size: file.size,
        status: 'processing',
        parsed_summary: null,
        error: null,
        created_at: new Date().toISOString(),
      };
      setResumes(prev => [newResume, ...prev]);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDelete = (id: string) => setResumes(prev => prev.filter(r => r.id !== id));
  const handleRename = (id: string, label: string) => setResumes(prev => prev.map(r => r.id === id ? { ...r, label } : r));
  const handleStatusUpdate = useCallback((id: string, updated: Partial<ResumeRecord>) => {
    setResumes(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
    // When parse completes, sync profile from backend so skills/experience appear on Profile page
    if (updated.status === 'parsed') {
      refreshStudentData(user.uid).catch(() => {});
    }
  }, [user.uid]);

  return (
    <>
      <Nav />
      <main id="main">
        <div className="page-header">
          <div className="page-container">
            <h1>Your Resumes</h1>
            <p>Upload and manage multiple resumes — skills and experience merge automatically across all uploads</p>
          </div>
        </div>

        <div className="page-container" style={{ padding: 'var(--sp-lg) 1.25rem var(--sp-2xl)' }}>
          <div className="resume-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-xl)', alignItems: 'start' }}>

            {/* ── Left: Resume list ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: 'var(--sp-md)' }}>
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-strong)' }}>Your Resumes</h2>
                {resumes.length > 0 && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', background: 'var(--surface-2)', borderRadius: 99, padding: '1px 8px', fontWeight: 600 }}>{resumes.length}</span>
                )}
              </div>

              {loading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Loading…</p>
              ) : resumes.length === 0 ? (
                <div style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <svg style={{ opacity: 0.25, marginBottom: '0.5rem' }} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <p style={{ fontSize: 'var(--text-sm)' }}>No resumes yet</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', marginTop: '0.25rem' }}>Upload your first resume →</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
                  {resumes.map(r => (
                    <ResumeCard
                      key={r.id}
                      resume={r}
                      onDelete={handleDelete}
                      onRename={handleRename}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
                </div>
              )}

              {resumes.length > 0 && (
                <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: 'var(--sp-md)', lineHeight: 1.6 }}>
                  Skills from all resumes are merged into your profile. Deleting a resume doesn't remove already-merged data.
                </p>
              )}
            </div>

            {/* ── Right: Upload widget ── */}
            <div>
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-strong)', marginBottom: 'var(--sp-md)' }}>
                Upload New Resume
              </h2>

              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Upload resume — click or drag and drop"
                onKeyDown={e => e.key === 'Enter' && !uploading && fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? 'var(--brand-500)' : 'var(--border)'}`,
                  background: dragging ? 'rgba(154,184,46,0.05)' : 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center',
                  padding: 'var(--sp-2xl) var(--sp-lg)',
                  cursor: uploading ? 'default' : 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                  marginBottom: 'var(--sp-md)',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
                  style={{ display: 'none' }}
                  aria-hidden="true"
                />
                {uploading ? (
                  <div>
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⏳</div>
                    <p style={{ fontWeight: 600, color: 'var(--text-default)', marginBottom: '0.25rem', fontSize: 'var(--text-sm)' }}>Uploading…</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Parsing will run in the background</p>
                  </div>
                ) : (
                  <div>
                    <svg style={{ marginBottom: '0.625rem', opacity: 0.3 }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p style={{ fontWeight: 600, color: 'var(--text-default)', marginBottom: '0.25rem', fontSize: 'var(--text-sm)' }}>Drop your resume here</p>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>or click to browse</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>PDF, Word, or TXT · Max 5MB</p>
                  </div>
                )}
              </div>

              {uploadError && (
                <div style={{ fontSize: 'var(--text-sm)', color: '#dc2626', marginBottom: 'var(--sp-md)', padding: 'var(--sp-sm)', background: '#fef2f2', borderRadius: 'var(--radius-md)', border: '1px solid #fecaca' }}>
                  {uploadError}
                </div>
              )}

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-md)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                <strong style={{ color: 'var(--text-default)', display: 'block', marginBottom: '0.375rem' }}>How it works</strong>
                Upload multiple resumes for different opportunity types (e.g. one for research, one for industry). Each upload:
                <ul style={{ margin: '0.375rem 0 0 1rem', padding: 0 }}>
                  <li>Extracts skills and merges them into your profile (additive — nothing is overwritten)</li>
                  <li>Adds new experience entries (deduplicates existing ones)</li>
                  <li>Fills in missing profile info (school, major, GPA) if not already set</li>
                </ul>
                <br />
                Your files are stored securely and can be downloaded or deleted at any time.
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 680px) {
          .resume-two-col { grid-template-columns: 1fr !important; }
        }
        @keyframes rPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </>
  );
}
