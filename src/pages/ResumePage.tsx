import { useState, useRef } from 'react';
import Nav from '../components/Nav';
import { getCurrentUser, getStudentData, saveStudentData } from '../auth';

interface ParsedResume {
  name: string;
  email: string;
  education: { school: string; degree: string; year: string }[];
  experience: { title: string; org: string; duration: string; bullets: string[] }[];
  skills: string[];
  gpa?: string;
}

// Mock parsed resume — in production this would call OpenAI
function mockParseResume(_fileName: string): ParsedResume {
  return {
    name: 'Alex Rivera',
    email: 'alex.rivera@university.edu',
    education: [
      { school: 'University of New Mexico', degree: 'B.S. Mechanical Engineering', year: 'Expected May 2026' },
    ],
    experience: [
      {
        title: 'Undergraduate Research Assistant',
        org: 'UNM Center for Advanced Research Computing',
        duration: 'Jan 2024 – Present',
        bullets: [
          'Assisted with computational fluid dynamics simulations using ANSYS Fluent',
          'Processed and visualized experimental data using Python and Matplotlib',
          'Co-authored a conference paper submitted to AIAA SciTech 2025',
        ],
      },
      {
        title: 'Engineering Intern',
        org: 'Sandia National Laboratories (STEM Scholars)',
        duration: 'May – Aug 2024',
        bullets: [
          'Contributed to additive manufacturing research under DOE mandate',
          'Designed and 3D-printed test fixtures using SolidWorks',
          'Presented findings to a 12-person engineering team',
        ],
      },
    ],
    skills: ['Python', 'MATLAB', 'SolidWorks', 'ANSYS/FEA', 'Technical Writing', 'Data Visualization', 'Lab Equipment Operation'],
    gpa: '3.72',
  };
}

export default function ResumePage() {
  const user = getCurrentUser()!;
  const student = getStudentData(user.uid);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [fileName, setFileName] = useState('');
  const [saved, setSaved] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      alert('Please upload a PDF, Word document, or plain text file.');
      return;
    }
    setFileName(file.name);
    setUploading(true);
    setParsed(null);
    setSaved(false);

    // Simulate upload + AI parsing delay
    setTimeout(() => {
      const result = mockParseResume(file.name);
      setParsed(result);
      setUploading(false);
    }, 1800);
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

  const handleSaveToProfile = () => {
    if (!parsed) return;
    const updates: Record<string, unknown> = {
      resumeUploaded: true,
      resumeFileName: fileName,
      resumeParsedAt: new Date().toISOString(),
    };
    // Merge parsed skills into student skills
    if (parsed.skills.length > 0) {
      const existing = student?.skills || [];
      const merged = Array.from(new Set([...existing, ...parsed.skills]));
      updates.skills = merged;
    }
    // Update GPA if parsed
    if (parsed.gpa) {
      const gpaNum = parseFloat(parsed.gpa);
      if (!isNaN(gpaNum)) updates.gpa = gpaNum;
    }
    // Update profile name if not set
    if (!student?.profile?.firstName && parsed.name) {
      const parts = parsed.name.split(' ');
      updates.profile = {
        ...(student?.profile || {}),
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
      };
    }
    saveStudentData(user.uid, updates as Parameters<typeof saveStudentData>[1]);
    setSaved(true);
  };

  return (
    <>
      <Nav />
      <main id="main">
        <div className="page-header">
          <div className="page-container">
            <h1>Resume Upload</h1>
            <p>Upload your resume — we'll parse it to enhance your profile and match scores</p>
          </div>
        </div>

        <div className="page-container" style={{ padding: 'var(--sp-lg) 1.25rem var(--sp-2xl)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: parsed ? '1fr 1.5fr' : '1fr', gap: 'var(--sp-xl)', alignItems: 'start', maxWidth: parsed ? '100%' : 640 }}>

            {/* Upload column */}
            <div>
              {/* Upload zone */}
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
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  marginBottom: 'var(--sp-md)',
                }}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Upload resume — click or drag and drop"
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
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
                    <p style={{ color: 'var(--text-default)', fontWeight: 600, marginBottom: '0.25rem' }}>Parsing resume…</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>AI parsing in progress</p>
                  </div>
                ) : fileName && parsed ? (
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--sp-sm)' }}>✓</div>
                    <p style={{ color: 'var(--success)', fontWeight: 600, marginBottom: '0.25rem' }}>Resume parsed successfully</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{fileName}</p>
                    <p style={{ color: 'var(--brand-700)', fontSize: 'var(--text-xs)', marginTop: '0.5rem' }}>Click to upload a different file</p>
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

              {/* AI parsing note */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-md)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-default)', display: 'block', marginBottom: '0.25rem' }}>How resume parsing works</strong>
                Our AI extracts your education, experience, and skills — then automatically updates your profile and match scores. Review the results before saving.
                <br /><br />
                <span style={{ color: 'var(--text-faint)' }}>AI parsing powered by OpenAI. Your resume is not stored on our servers.</span>
              </div>

              {/* Current resume status */}
              {student?.resumeUploaded && !parsed && (
                <div className="card" style={{ marginTop: 'var(--sp-md)', background: 'var(--success-bg)', border: '1px solid rgba(5,150,105,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--success)', fontWeight: 600 }}>Resume on file</span>
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    You've already uploaded a resume. Upload a new one to refresh your profile.
                  </p>
                </div>
              )}
            </div>

            {/* Parsed results column */}
            {parsed && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-md)' }}>
                  <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--text-strong)' }}>Parsed Resume</h2>
                  <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
                    {saved ? (
                      <span style={{ color: 'var(--success)', fontSize: 'var(--text-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        Saved to profile
                      </span>
                    ) : (
                      <button onClick={handleSaveToProfile} className="btn btn-primary btn-sm">
                        Save to profile →
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>

                  {/* Contact */}
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-sm)' }}>
                      <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contact</h3>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingSection(editingSection === 'contact' ? null : 'contact')} style={{ fontSize: 'var(--text-xs)' }}>
                        {editingSection === 'contact' ? 'Done' : 'Edit'}
                      </button>
                    </div>
                    <p style={{ fontWeight: 700, color: 'var(--text-strong)', marginBottom: '0.125rem' }}>{parsed.name}</p>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{parsed.email}</p>
                    {parsed.gpa && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>GPA: {parsed.gpa}</p>}
                  </div>

                  {/* Education */}
                  <div className="card">
                    <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--sp-sm)' }}>Education</h3>
                    {parsed.education.map((edu, i) => (
                      <div key={i} style={{ paddingBottom: i < parsed.education.length - 1 ? 'var(--sp-sm)' : 0, borderBottom: i < parsed.education.length - 1 ? '1px solid var(--border)' : 'none', marginBottom: i < parsed.education.length - 1 ? 'var(--sp-sm)' : 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: 'var(--text-sm)' }}>{edu.school}</div>
                        <div style={{ color: 'var(--text-default)', fontSize: 'var(--text-sm)' }}>{edu.degree}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: '0.125rem' }}>{edu.year}</div>
                      </div>
                    ))}
                  </div>

                  {/* Experience */}
                  <div className="card">
                    <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--sp-sm)' }}>Experience</h3>
                    {parsed.experience.map((exp, i) => (
                      <div key={i} style={{ paddingBottom: i < parsed.experience.length - 1 ? 'var(--sp-md)' : 0, borderBottom: i < parsed.experience.length - 1 ? '1px solid var(--border)' : 'none', marginBottom: i < parsed.experience.length - 1 ? 'var(--sp-md)' : 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: 'var(--text-sm)' }}>{exp.title}</div>
                        <div style={{ color: 'var(--text-default)', fontSize: 'var(--text-sm)' }}>{exp.org}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: '0.125rem', marginBottom: '0.375rem' }}>{exp.duration}</div>
                        <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                          {exp.bullets.map((b, j) => (
                            <li key={j} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-default)', lineHeight: 1.6, marginBottom: '0.125rem' }}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Skills */}
                  <div className="card">
                    <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--sp-sm)' }}>
                      Skills detected
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {parsed.skills.map(skill => (
                        <span key={skill} className="badge badge-green">{skill}</span>
                      ))}
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--sp-sm)' }}>
                      These will be merged with your existing skills when you save.
                    </p>
                  </div>

                  {/* Save CTA */}
                  {!saved && (
                    <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
                      <button onClick={handleSaveToProfile} className="btn btn-primary">
                        Save parsed data to my profile
                      </button>
                      <button onClick={() => { setParsed(null); setFileName(''); }} className="btn btn-ghost">
                        Discard
                      </button>
                    </div>
                  )}
                  {saved && (
                    <div className="card" style={{ background: 'var(--success-bg)', border: '1px solid rgba(5,150,105,0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span style={{ fontWeight: 600, color: 'var(--success)' }}>Profile updated</span>
                      </div>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Skills and GPA merged into your profile. Match scores will reflect this data.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
