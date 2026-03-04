import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getStudentData, saveStudentData, updateCurrentUser } from '../auth';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'https://app.lablinkinitiative.org';

// Step -1 = Resume upload (pre-step, not shown in progress bar)
// Steps 0-3 = About You, Career Interests, Your Skills, Your Goals
const STEPS = ['About You', 'Career Interests', 'Your Skills', 'Your Goals'];

const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'PhD', 'Community College', 'Other'];
const GRAD_YEARS = ['2025', '2026', '2027', '2028', '2029', '2030'];

const INTERESTS = [
  'Research at a National Lab',
  'Federal Government Agency (NASA, EPA, DOE)',
  'Industry / Private Sector',
  'Business & Analytics',
  'Policy & Regulatory',
  'AI / Software / Data Science',
  'Engineering (Mechanical, Electrical, Civil)',
  'Biology / Life Sciences',
  'Chemistry / Materials Science',
  'Environmental Science',
  'Clean Energy',
  'Other',
];

const SKILL_GROUPS = [
  {
    label: 'Programming',
    skills: ['Python', 'MATLAB', 'R', 'Java', 'JavaScript', 'C/C++', 'SQL'],
  },
  {
    label: 'Data & Analysis',
    skills: ['Excel', 'Tableau', 'Statistics', 'Machine Learning', 'Data Visualization'],
  },
  {
    label: 'Lab & Research',
    skills: ['Lab Safety', 'Data Collection', 'Technical Writing', 'Lab Equipment Operation'],
  },
  {
    label: 'Engineering',
    skills: ['CAD/SolidWorks', 'ANSYS/FEA', 'Circuit Design', '3D Printing'],
  },
  {
    label: 'Communication',
    skills: ['Public Speaking', 'Grant Writing', 'Documentation', 'Spanish', 'Other language'],
  },
];

// All known skills for matching against resume-extracted skills
const ALL_KNOWN_SKILLS = SKILL_GROUPS.flatMap(g => g.skills);

const EXPERIENCE_LEVELS = [
  'No professional experience yet',
  '1 internship or research position',
  '2+ internships or research positions',
];

const GOALS = [
  'Get my first research experience',
  'Land a paid internship this summer',
  'Build specific technical skills',
  'Explore different career paths',
  'Get a recommendation letter / professional reference',
  'Publish research / contribute to papers',
  'Network with professionals in my field',
  'Prepare for graduate school',
];

const TIMELINES = [
  'This semester',
  'This summer',
  'Within 1 year',
  'Within 2 years',
  'Just exploring',
];

interface ParsedResume {
  name: string | null;
  email: string | null;
  gpa: string | null;
  school: string | null;
  major: string | null;
  year: string | null;
  gradYear: string | null;
  skills: string[];
  experience: { title: string; org: string; duration: string }[];
}

export default function Onboarding() {
  const navigate = useNavigate();
  const user = getCurrentUser()!;
  const existing = getStudentData(user.uid);

  // -1 = resume upload step, 0-3 = existing steps
  const [step, setStep] = useState(-1);
  const [firstName, setFirstName] = useState(existing?.profile?.firstName || '');
  const [lastName, setLastName] = useState(existing?.profile?.lastName || '');
  const [school, setSchool] = useState(existing?.profile?.school || '');
  const [year, setYear] = useState(existing?.profile?.year || '');
  const [major, setMajor] = useState(existing?.profile?.major || '');
  const [gradYear, setGradYear] = useState(existing?.profile?.gradYear || '');
  const [gpa, setGpa] = useState(existing?.gpa?.toString() || '');
  const [interests, setInterests] = useState<string[]>(existing?.interests || []);
  const [skills, setSkills] = useState<string[]>(existing?.skills || []);
  const [experienceLevel, setExperienceLevel] = useState(existing?.experienceLevel || '');
  const [goals, setGoals] = useState<string[]>(existing?.goals || []);
  const [timeline, setTimeline] = useState(existing?.targetTimeline || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Resume step state
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeParsed, setResumeParsed] = useState(false);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleItem = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  // Pre-fill form fields from parsed resume data
  const applyParsed = (parsed: ParsedResume) => {
    if (parsed.name) {
      const parts = parsed.name.trim().split(/\s+/);
      if (parts[0] && !firstName) setFirstName(parts[0]);
      if (parts.length > 1 && !lastName) setLastName(parts.slice(1).join(' '));
    }
    if (parsed.school && !school) setSchool(parsed.school);
    if (parsed.major && !major) setMajor(parsed.major);
    if (parsed.gpa && !gpa) setGpa(parsed.gpa);
    if (parsed.year && YEARS.includes(parsed.year) && !year) setYear(parsed.year);
    if (parsed.gradYear && GRAD_YEARS.includes(parsed.gradYear) && !gradYear) setGradYear(parsed.gradYear);
    if (parsed.skills && parsed.skills.length > 0) {
      // Match against our known skills list (case-insensitive partial match)
      const matched = ALL_KNOWN_SKILLS.filter(known =>
        parsed.skills.some(s =>
          s.toLowerCase().includes(known.toLowerCase()) ||
          known.toLowerCase().includes(s.toLowerCase())
        )
      );
      // Also keep any extra skills from resume that don't match known ones
      const extras = parsed.skills.filter(s =>
        !ALL_KNOWN_SKILLS.some(known =>
          s.toLowerCase().includes(known.toLowerCase()) ||
          known.toLowerCase().includes(s.toLowerCase())
        )
      );
      const merged = Array.from(new Set([...skills, ...matched, ...extras]));
      setSkills(merged);
    }
    // Infer experience level from number of positions
    if (parsed.experience && parsed.experience.length > 0 && !experienceLevel) {
      if (parsed.experience.length >= 2) setExperienceLevel('2+ internships or research positions');
      else setExperienceLevel('1 internship or research position');
    }
  };

  const pollResumeJob = async (jobId: string, token: string | null): Promise<ParsedResume> => {
    const maxAttempts = 45; // poll every 2s, max 90s
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await fetch(`${API_BASE}/api/cdp/resume/status/${jobId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!statusRes.ok) throw new Error('Could not check parse status');
      const status = await statusRes.json();
      if (status.status === 'complete') return status.parsed as ParsedResume;
      if (status.status === 'error') throw new Error(status.error || 'Parse failed');
      // still processing — keep polling
    }
    throw new Error('Parsing timed out. You can enter your info manually.');
  };

  const handleResumeFile = async (file: File) => {
    if (!file) return;
    const allowed = /\.(pdf|doc|docx|txt)$/i;
    if (!allowed.test(file.name)) {
      setParseError('Please upload a PDF, Word document, or plain text file.');
      return;
    }
    setResumeFileName(file.name);
    setUploading(true);
    setParseError('');
    setResumeParsed(false);

    try {
      const token = localStorage.getItem('cdp_token');
      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch(`${API_BASE}/api/cdp/resume/parse`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Parse failed (${res.status})`);
      }

      const { job_id } = await res.json();
      const parsed = await pollResumeJob(job_id, token);
      applyParsed(parsed);
      setResumeParsed(true);
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse resume. You can enter your info manually.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleResumeFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleResumeFile(file);
  };

  const skipResume = () => {
    setStep(0);
  };

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!firstName.trim() || !lastName.trim() || !school.trim() || !year || !major.trim() || !gradYear) {
        return 'Please fill in all required fields.';
      }
    }
    if (step === 1 && interests.length === 0) return 'Please select at least one career interest.';
    if (step === 2 && skills.length === 0) return 'Please select at least one skill (or choose "None yet").';
    if (step === 3 && (goals.length === 0 || !timeline)) return 'Please select at least one goal and a target timeline.';
    return null;
  };

  const handleNext = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');

    const partial: Record<string, unknown> = {};
    if (step === 0) {
      partial.profile = {
        firstName, lastName, school, year, major, gradYear,
        email: user.email,
        createdAt: existing?.profile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (gpa) partial.gpa = parseFloat(gpa);
    }
    if (step === 1) partial.interests = interests;
    if (step === 2) { partial.skills = skills; partial.experienceLevel = experienceLevel; }
    if (step === 3) { partial.goals = goals; partial.targetTimeline = timeline; }

    saveStudentData(user.uid, partial);

    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      setSaving(true);
      updateCurrentUser({ firstName, lastName, onboardingComplete: true });
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    setError('');
    if (step === 0) setStep(-1);
    else setStep(s => s - 1);
  };

  return (
    <div className="onboarding-page">
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--sp-lg)' }}>
          <a href="https://lablinkinitiative.org" style={{ color: 'var(--brand-700)', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, textDecoration: 'none', fontSize: 'var(--text-lg)', display: 'block', marginBottom: 'var(--sp-md)' }}>
            Lab<em style={{ fontStyle: 'normal', color: 'var(--accent-lime)' }}>Link</em> CDP
          </a>
          <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-strong)', marginBottom: '0.25rem' }}>
            {step === -1 ? 'Set up your profile' : `Set up your profile`}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            {step === -1
              ? 'Upload your resume to get started instantly'
              : `Step ${step + 1} of ${STEPS.length} — ${STEPS[step]}`}
          </p>
        </div>

        {/* Progress — only show on steps 0-3 */}
        {step >= 0 && (
          <div className="onboarding-progress" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
            {STEPS.map((_, i) => (
              <div key={i} className={`onboarding-step-dot ${i < step ? 'complete' : i === step ? 'active' : ''}`} />
            ))}
          </div>
        )}

        {/* Card */}
        <div className="card" style={{ padding: 'var(--sp-xl)' }}>
          {error && (
            <div className="alert alert-error mb-md" role="alert">{error}</div>
          )}

          {/* Step -1 — Resume Upload */}
          {step === -1 && (
            <div>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'var(--text-xl)', marginBottom: '0.375rem' }}>
                Upload your resume
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-lg)' }}>
                We'll extract your info automatically — review and confirm before finishing.
              </p>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Upload resume — click or drag and drop"
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? 'var(--brand-500)' : resumeParsed ? 'var(--success)' : 'var(--border)'}`,
                  background: dragging ? 'var(--brand-50)' : resumeParsed ? 'var(--success-bg)' : 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center',
                  padding: '3.5rem var(--sp-lg)',
                  cursor: uploading ? 'wait' : 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: 'var(--sp-md)',
                  minHeight: 260,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  maxWidth: 340,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                  aria-hidden="true"
                />
                {uploading ? (
                  <div>
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--sp-sm)' }}>⏳</div>
                    <p style={{ color: 'var(--text-default)', fontWeight: 600, marginBottom: '0.25rem' }}>Analyzing your resume with AI…</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Extracting your info from {resumeFileName} (may take ~30s)</p>
                  </div>
                ) : resumeParsed ? (
                  <div>
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--sp-sm)' }}>✓</div>
                    <p style={{ color: 'var(--success)', fontWeight: 700, marginBottom: '0.25rem' }}>Resume parsed successfully!</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{resumeFileName}</p>
                    <p style={{ color: 'var(--text-faint)', fontSize: 'var(--text-xs)', marginTop: '0.5rem' }}>Click to upload a different file</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <svg style={{ marginBottom: '0.75rem', opacity: 0.35 }} width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p style={{ color: 'var(--text-default)', fontWeight: 700, fontSize: 'var(--text-lg)', margin: 0 }}>Drop your resume here</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>or click to browse files</p>
                    <p style={{ color: 'var(--text-faint)', fontSize: 'var(--text-xs)', marginTop: '0.25rem' }}>PDF, Word, or plain text · Max 5MB</p>
                  </div>
                )}
              </div>

              {parseError && (
                <div className="alert alert-error mb-md" role="alert" style={{ fontSize: 'var(--text-sm)' }}>
                  {parseError}
                </div>
              )}

              {/* CTA row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--sp-sm)' }}>
                <button
                  type="button"
                  onClick={skipResume}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}
                >
                  I'll enter my info manually →
                </button>
                {resumeParsed && !uploading && (
                  <button
                    type="button"
                    onClick={() => { setError(''); setStep(0); }}
                    className="btn btn-primary"
                  >
                    Continue →
                  </button>
                )}
              </div>

              {/* Note */}
              <p style={{ color: 'var(--text-faint)', fontSize: 'var(--text-xs)', marginTop: 'var(--sp-md)', textAlign: 'center' }}>
                Your file is processed and not stored on our servers.
              </p>
            </div>
          )}

          {/* Step 0 — About You */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'var(--text-xl)', marginBottom: 'var(--sp-xs)' }}>About You</h2>
              {resumeParsed && (
                <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-sm) var(--sp-md)', fontSize: 'var(--text-sm)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  Fields pre-filled from your resume — review and edit as needed.
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="firstName">First name <span aria-hidden="true">*</span></label>
                  <input id="firstName" type="text" className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Alex" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="lastName">Last name <span aria-hidden="true">*</span></label>
                  <input id="lastName" type="text" className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Rivera" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="school">School / University <span aria-hidden="true">*</span></label>
                <input id="school" type="text" className="form-input" value={school} onChange={e => setSchool(e.target.value)} placeholder="University of New Mexico" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="year">Year <span aria-hidden="true">*</span></label>
                  <select id="year" className="form-select" value={year} onChange={e => setYear(e.target.value)} required>
                    <option value="">Select year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="gradYear">Expected graduation <span aria-hidden="true">*</span></label>
                  <select id="gradYear" className="form-select" value={gradYear} onChange={e => setGradYear(e.target.value)} required>
                    <option value="">Select year</option>
                    {GRAD_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="major">Major / Field of Study <span aria-hidden="true">*</span></label>
                <input id="major" type="text" className="form-input" value={major} onChange={e => setMajor(e.target.value)} placeholder="Mechanical Engineering" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="gpa">GPA (optional)</label>
                <input id="gpa" type="number" className="form-input" value={gpa} onChange={e => setGpa(e.target.value)} placeholder="3.5" min="0" max="4.0" step="0.01" />
                <span className="form-hint">Helps match you with programs that have GPA requirements.</span>
              </div>
            </div>
          )}

          {/* Step 1 — Career Interests */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'var(--text-xl)', marginBottom: '0.375rem' }}>Career Interests</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-md)' }}>What type of career experience are you most interested in? Select all that apply.</p>
              <div className="checkbox-group">
                {INTERESTS.map(i => (
                  <label key={i} className="checkbox-option">
                    <input type="checkbox" checked={interests.includes(i)} onChange={() => toggleItem(interests, setInterests, i)} />
                    <span>{i}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Skills */}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'var(--text-xl)', marginBottom: '0.375rem' }}>Your Skills</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-md)' }}>
                What skills do you already have? Check all that apply.
                {resumeParsed && <span style={{ color: 'var(--success)', fontWeight: 600 }}> We pre-selected skills found in your resume.</span>}
              </p>
              {SKILL_GROUPS.map(group => (
                <div key={group.label} style={{ marginBottom: 'var(--sp-md)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {group.label}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {group.skills.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleItem(skills, setSkills, skill)}
                        className={`btn btn-sm ${skills.includes(skill) ? 'btn-primary' : 'btn-ghost'}`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 'var(--sp-md)', borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-md)' }}>
                <div className="form-group">
                  <label className="form-label">Experience level</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {EXPERIENCE_LEVELS.map(lvl => (
                      <label key={lvl} className="checkbox-option">
                        <input type="radio" name="experience" checked={experienceLevel === lvl} onChange={() => setExperienceLevel(lvl)} />
                        <span style={{ fontSize: 'var(--text-sm)' }}>{lvl}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 'var(--sp-sm)' }}>
                <button
                  type="button"
                  onClick={() => { setSkills(['None yet']); setExperienceLevel('No professional experience yet'); }}
                  className="btn btn-ghost btn-sm"
                >
                  None yet — just starting out
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Goals */}
          {step === 3 && (
            <div>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'var(--text-xl)', marginBottom: '0.375rem' }}>Your Goals</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-md)' }}>What are you hoping to achieve? Select all that apply.</p>
              <div className="checkbox-group mb-lg">
                {GOALS.map(g => (
                  <label key={g} className="checkbox-option">
                    <input type="checkbox" checked={goals.includes(g)} onChange={() => toggleItem(goals, setGoals, g)} />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
              <div className="form-group" style={{ marginTop: 'var(--sp-md)', borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-md)' }}>
                <label className="form-label">Target timeline</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {TIMELINES.map(t => (
                    <label key={t} className="checkbox-option">
                      <input type="radio" name="timeline" checked={timeline === t} onChange={() => setTimeline(t)} />
                      <span style={{ fontSize: 'var(--text-sm)' }}>{t}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation — only on steps 0-3 */}
        {step >= 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--sp-md)' }}>
            <button onClick={handleBack} className="btn btn-ghost">← Back</button>
            <button onClick={handleNext} disabled={saving} className="btn btn-primary">
              {saving ? 'Saving…' : step === STEPS.length - 1 ? 'Complete Setup →' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
