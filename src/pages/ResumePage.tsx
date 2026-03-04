import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import { getCurrentUser } from '../auth'; // auth check only

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'https://app.lablinkinitiative.org';

export default function ResumePage() {
  getCurrentUser(); // ensure auth check
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      setError('Please upload a PDF, Word document, or plain text file.');
      return;
    }

    setFileName(file.name);
    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('cdp_token');
      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch(`${API_BASE}/api/cdp/resume/parse`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Store job ID for background polling notification
      localStorage.setItem('cdp_resume_job', JSON.stringify({
        job_id: data.job_id,
        file_name: file.name,
        started_at: Date.now(),
      }));

      // Navigate to opportunities immediately — parsing continues in background
      navigate('/opportunities');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <>
      <Nav />
      <main id="main">
        <div className="page-header">
          <div className="page-container">
            <h1>Upload Resume</h1>
            <p>Upload your resume — we'll parse it in the background and update your profile automatically</p>
          </div>
        </div>

        <div className="page-container" style={{ padding: 'var(--sp-lg) 1.25rem var(--sp-2xl)' }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>

            <div
              className="card"
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragging ? 'var(--brand-500)' : 'var(--border)'}`,
                background: dragging ? 'var(--brand-50)' : 'var(--surface)',
                textAlign: 'center',
                padding: 'var(--sp-2xl) var(--sp-xl)',
                cursor: uploading ? 'default' : 'pointer',
                transition: 'all 0.15s',
                marginBottom: 'var(--sp-md)',
              }}
              onClick={() => !uploading && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload resume — click or drag and drop"
              onKeyDown={e => e.key === 'Enter' && !uploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleInputChange}
                style={{ display: 'none' }}
                aria-hidden="true"
              />
              {uploading ? (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--sp-sm)' }}>⏳</div>
                  <p style={{ color: 'var(--text-default)', fontWeight: 600, marginBottom: '0.25rem' }}>Uploading {fileName}…</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Starting background parse — you'll be redirected to search shortly</p>
                </div>
              ) : (
                <div>
                  <svg style={{ marginBottom: 'var(--sp-sm)', opacity: 0.4 }} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p style={{ color: 'var(--text-default)', fontWeight: 600, marginBottom: '0.25rem' }}>Drop your resume here</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-sm)' }}>or click to browse</p>
                  <p style={{ color: 'var(--text-faint)', fontSize: 'var(--text-xs)' }}>PDF, Word, or plain text · Max 5MB</p>
                </div>
              )}
            </div>

            {error && (
              <div style={{ color: 'var(--error, #dc2626)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-md)', padding: 'var(--sp-sm)', background: '#fef2f2', borderRadius: 'var(--radius-md)', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-md)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-default)', display: 'block', marginBottom: '0.25rem' }}>How it works</strong>
              Upload your resume and we'll extract your skills, education, and experience using AI.
              You'll be taken to the opportunities page immediately while parsing runs in the background.
              A notification will appear when your profile has been updated.
              <br /><br />
              <span style={{ color: 'var(--text-faint)' }}>Your file is not stored on our servers — only the extracted data is saved.</span>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
