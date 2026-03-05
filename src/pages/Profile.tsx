import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import ExperienceTimeline from '../components/ExperienceTimeline';
import { getCurrentUser, getStudentData, saveStudentData, updateCurrentUser, refreshStudentData, signOut } from '../auth';
import type { StudentData, ExperienceEntry } from '../types';

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
  { label: 'Programming', skills: ['Python', 'MATLAB', 'R', 'Java', 'JavaScript', 'C/C++', 'SQL'] },
  { label: 'Data & Analysis', skills: ['Excel', 'Tableau', 'Statistics', 'Machine Learning', 'Data Visualization'] },
  { label: 'Lab & Research', skills: ['Lab Safety', 'Data Collection', 'Technical Writing', 'Lab Equipment Operation'] },
  { label: 'Engineering', skills: ['CAD/SolidWorks', 'ANSYS/FEA', 'Circuit Design', '3D Printing'] },
  { label: 'Communication', skills: ['Public Speaking', 'Grant Writing', 'Documentation', 'Spanish', 'Other language'] },
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

const TIMELINES = ['This semester', 'This summer', 'Within 1 year', 'Within 2 years', 'Just exploring'];
const EXPERIENCE_LEVELS = [
  'No professional experience yet',
  '1 internship or research position',
  '2+ internships or research positions',
];

type Section = 'about' | 'interests' | 'skills' | 'goals';

export default function Profile() {
  const user = getCurrentUser()!;
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [wiping, setWiping] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSection, setSavedSection] = useState<Section | null>(null);

  // About You fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [school, setSchool] = useState('');
  const [year, setYear] = useState('');
  const [major, setMajor] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [gpa, setGpa] = useState('');

  // Arrays
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [timeline, setTimeline] = useState('');

  // Experience timeline
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [savingTimeline, setSavingTimeline] = useState(false);
  const [savedTimeline, setSavedTimeline] = useState(false);

  function applyStudentData(data: StudentData) {
    setStudent(data);
    setFirstName(data.profile.firstName || '');
    setLastName(data.profile.lastName || '');
    setSchool(data.profile.school || '');
    setYear(data.profile.year || '');
    setMajor(data.profile.major || '');
    setGradYear(data.profile.gradYear || '');
    setGpa(data.gpa?.toString() || '');
    setInterests(data.interests || []);
    setSkills(data.skills || []);
    setExperienceLevel(data.experienceLevel || '');
    setGoals(data.goals || []);
    setTimeline(data.targetTimeline || '');
    setExperience(data.experience || []);
  }

  useEffect(() => {
    // Load from localStorage immediately for instant render
    const cached = getStudentData(user.uid);
    if (cached) applyStudentData(cached);

    // Sync from API in the background to pick up resume-parsed skills/experience
    refreshStudentData(user.uid).then(() => {
      const fresh = getStudentData(user.uid);
      if (fresh) applyStudentData(fresh);
    }).catch(() => {});
  }, [user.uid]);

  const toggleItem = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const saveSection = async (section: Section) => {
    setSaving(true);
    const updates: Partial<StudentData> = {};
    if (section === 'about') {
      updates.profile = {
        firstName, lastName, school, year, major, gradYear,
        email: user.email,
        createdAt: student?.profile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (gpa) updates.gpa = parseFloat(gpa);
      else updates.gpa = null;
      updateCurrentUser({ firstName, lastName });
    }
    if (section === 'interests') updates.interests = interests;
    if (section === 'skills') { updates.skills = skills; updates.experienceLevel = experienceLevel; }
    if (section === 'goals') { updates.goals = goals; updates.targetTimeline = timeline; }

    saveStudentData(user.uid, updates);
    const refreshed = getStudentData(user.uid);
    setStudent(refreshed);
    setSaving(false);
    setSavedSection(section);
    setEditingSection(null);
    setTimeout(() => setSavedSection(null), 2500);
  };

  const saveTimeline = async (entries: ExperienceEntry[]) => {
    setSavingTimeline(true);
    saveStudentData(user.uid, { experience: entries });
    setExperience(entries);
    const refreshed = getStudentData(user.uid);
    setStudent(refreshed);
    setSavingTimeline(false);
    setSavedTimeline(true);
    setTimeout(() => setSavedTimeline(false), 2500);
  };

  const cancelEdit = (section: Section) => {
    // Restore from student data
    if (student) {
      if (section === 'about') {
        setFirstName(student.profile.firstName || '');
        setLastName(student.profile.lastName || '');
        setSchool(student.profile.school || '');
        setYear(student.profile.year || '');
        setMajor(student.profile.major || '');
        setGradYear(student.profile.gradYear || '');
        setGpa(student.gpa?.toString() || '');
      }
      if (section === 'interests') setInterests(student.interests || []);
      if (section === 'skills') { setSkills(student.skills || []); setExperienceLevel(student.experienceLevel || ''); }
      if (section === 'goals') { setGoals(student.goals || []); setTimeline(student.targetTimeline || ''); }
    }
    setEditingSection(null);
  };

  const completeness = student?.profileCompleteness || 0;
  const isEditing = (s: Section) => editingSection === s;
  const wasSaved = (s: Section) => savedSection === s;

  const SectionHeader = ({ section, title }: { section: Section; title: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-md)' }}>
      <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-strong)' }}>{title}</h2>
      <div style={{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center' }}>
        {wasSaved(section) && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            Saved
          </span>
        )}
        {isEditing(section) ? (
          <>
            <button onClick={() => cancelEdit(section)} className="btn btn-ghost btn-sm" disabled={saving}>Cancel</button>
            <button onClick={() => saveSection(section)} className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </>
        ) : (
          <button onClick={() => setEditingSection(section)} className="btn btn-ghost btn-sm">Edit</button>
        )}
      </div>
    </div>
  );

  async function wipeAccount() {
    const confirmed = window.confirm(
      'PERMANENT ACCOUNT WIPE\n\nThis will permanently delete your account and ALL your data:\n• Profile and settings\n• Saved programs\n• Gap analyses\n• Uploaded resumes\n• Career pathways\n\nThis CANNOT be undone. Click OK to confirm.'
    );
    if (!confirmed) return;

    setWiping(true);
    try {
      const token = localStorage.getItem('cdp_token');
      const apiBase = (import.meta.env.VITE_API_URL as string) || 'https://app.lablinkinitiative.org';
      const res = await fetch(`${apiBase}/api/cdp/students/me`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || 'Failed to wipe account');
      }
      // Clear all local storage and redirect
      signOut();
      localStorage.removeItem(`cdp_student_data_${user.uid}`);
      navigate('/');
    } catch (e) {
      alert('Error wiping account: ' + (e instanceof Error ? e.message : String(e)));
      setWiping(false);
    }
  }

  return (
    <>
      <Nav />
      <main id="main">
        <div className="page-header">
          <div className="page-container">
            <h1>Your Profile</h1>
            <p>Keep your profile current for the most accurate match scores</p>
          </div>
        </div>

        <div className="page-container" style={{ padding: 'var(--sp-lg) 1.25rem var(--sp-2xl)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 'var(--sp-xl)', alignItems: 'start' }}>

            {/* Left sidebar */}
            <div>
              {/* Profile completeness */}
              <div className="card" style={{ marginBottom: 'var(--sp-md)', textAlign: 'center' }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `conic-gradient(var(--brand-500) ${completeness * 3.6}deg, var(--surface-2) 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--sp-sm)',
                  position: 'relative',
                }}>
                  <div style={{
                    width: 62,
                    height: 62,
                    borderRadius: '50%',
                    background: 'var(--card-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}>
                    <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--brand-700)', lineHeight: 1 }}>{completeness}%</span>
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: 'var(--text-sm)', marginBottom: '0.25rem' }}>
                  Profile {completeness >= 80 ? 'Complete' : completeness >= 50 ? 'Good Progress' : 'Incomplete'}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {completeness >= 80
                    ? 'Your profile is fully set up'
                    : 'Complete your profile for better matches'}
                </div>
              </div>

              {/* Quick stats */}
              <div className="card" style={{ marginBottom: 'var(--sp-md)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 'var(--sp-sm)' }}>Activity</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Saved programs</span>
                    <strong style={{ color: 'var(--text-strong)' }}>{student?.savedPrograms?.length || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Gap analyses</span>
                    <strong style={{ color: 'var(--text-strong)' }}>{student?.gapAnalyses?.length || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Skills listed</span>
                    <strong style={{ color: 'var(--text-strong)' }}>{student?.skills?.length || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Resume uploaded</span>
                    <strong style={{ color: student?.resumeUploaded ? 'var(--success)' : 'var(--text-muted)' }}>
                      {student?.resumeUploaded ? 'Yes' : 'No'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Quick links */}
              <div className="card">
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 'var(--sp-sm)' }}>Quick Links</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <Link to="/resume" className="btn btn-ghost btn-sm btn-block" style={{ justifyContent: 'flex-start' }}>
                    {student?.resumeUploaded ? 'Update resume' : 'Upload resume →'}
                  </Link>
                  <Link to="/opportunities" className="btn btn-ghost btn-sm btn-block" style={{ justifyContent: 'flex-start' }}>
                    Browse programs →
                  </Link>
                  <Link to="/pathway/doe-research-stem" className="btn btn-ghost btn-sm btn-block" style={{ justifyContent: 'flex-start' }}>
                    Run gap analysis →
                  </Link>
                  <Link to="/saved" className="btn btn-ghost btn-sm btn-block" style={{ justifyContent: 'flex-start' }}>
                    View saved programs →
                  </Link>
                </div>
              </div>
            </div>

            {/* Right — editable sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>

              {/* About You */}
              <div className="card">
                <SectionHeader section="about" title="About You" />
                {isEditing('about') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="p-firstName">First name</label>
                        <input id="p-firstName" type="text" className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="p-lastName">Last name</label>
                        <input id="p-lastName" type="text" className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="p-school">School / University</label>
                      <input id="p-school" type="text" className="form-input" value={school} onChange={e => setSchool(e.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="p-year">Year</label>
                        <select id="p-year" className="form-select" value={year} onChange={e => setYear(e.target.value)}>
                          <option value="">Select year</option>
                          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="p-gradYear">Expected graduation</label>
                        <select id="p-gradYear" className="form-select" value={gradYear} onChange={e => setGradYear(e.target.value)}>
                          <option value="">Select year</option>
                          {GRAD_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="p-major">Major / Field of Study</label>
                      <input id="p-major" type="text" className="form-input" value={major} onChange={e => setMajor(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="p-gpa">GPA (optional)</label>
                      <input id="p-gpa" type="number" className="form-input" value={gpa} onChange={e => setGpa(e.target.value)} min="0" max="4.0" step="0.01" style={{ maxWidth: 120 }} />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 2rem', fontSize: 'var(--text-sm)' }}>
                    {[
                      { label: 'Name', value: firstName || lastName ? `${firstName} ${lastName}`.trim() : null },
                      { label: 'Email', value: user.email },
                      { label: 'School', value: school || null },
                      { label: 'Year', value: year || null },
                      { label: 'Major', value: major || null },
                      { label: 'Graduation', value: gradYear || null },
                      { label: 'GPA', value: gpa || null },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                        <div style={{ color: value ? 'var(--text-default)' : 'var(--text-faint)', marginTop: '0.125rem' }}>
                          {value || <span style={{ fontStyle: 'italic' }}>Not set</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Experience Timeline */}
              <div className="card">
                <ExperienceTimeline
                  entries={experience}
                  onChange={setExperience}
                  onSave={saveTimeline}
                  saving={savingTimeline}
                  saved={savedTimeline}
                />
              </div>

              {/* Career Interests */}
              <div className="card">
                <SectionHeader section="interests" title="Career Interests" />
                {isEditing('interests') ? (
                  <div className="checkbox-group">
                    {INTERESTS.map(i => (
                      <label key={i} className="checkbox-option">
                        <input type="checkbox" checked={interests.includes(i)} onChange={() => toggleItem(interests, setInterests, i)} />
                        <span style={{ fontSize: 'var(--text-sm)' }}>{i}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  interests.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {interests.map(i => <span key={i} className="badge badge-green">{i}</span>)}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-faint)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>No interests selected yet. Click Edit to add some.</p>
                  )
                )}
              </div>

              {/* Skills */}
              <div className="card">
                <SectionHeader section="skills" title="Skills & Experience" />
                {isEditing('skills') ? (
                  <div>
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
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-md)', marginTop: 'var(--sp-sm)' }}>
                      <label className="form-label">Experience level</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {EXPERIENCE_LEVELS.map(lvl => (
                          <label key={lvl} className="checkbox-option">
                            <input type="radio" name="p-experience" checked={experienceLevel === lvl} onChange={() => setExperienceLevel(lvl)} />
                            <span style={{ fontSize: 'var(--text-sm)' }}>{lvl}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {skills.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: 'var(--sp-sm)' }}>
                        {skills.filter(s => s !== 'None yet').map(s => <span key={s} className="badge badge-lime">{s}</span>)}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-faint)', fontSize: 'var(--text-sm)', fontStyle: 'italic', marginBottom: 'var(--sp-sm)' }}>No skills listed yet.</p>
                    )}
                    {experienceLevel && (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        <strong>Experience:</strong> {experienceLevel}
                      </p>
                    )}
                    {student?.resumeUploaded && (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Skills imported from resume. <Link to="/resume" style={{ color: 'var(--brand-700)' }}>Update resume →</Link>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Goals */}
              <div className="card">
                <SectionHeader section="goals" title="Goals & Timeline" />
                {isEditing('goals') ? (
                  <div>
                    <div className="checkbox-group" style={{ marginBottom: 'var(--sp-md)' }}>
                      {GOALS.map(g => (
                        <label key={g} className="checkbox-option">
                          <input type="checkbox" checked={goals.includes(g)} onChange={() => toggleItem(goals, setGoals, g)} />
                          <span style={{ fontSize: 'var(--text-sm)' }}>{g}</span>
                        </label>
                      ))}
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-md)' }}>
                      <label className="form-label">Target timeline</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {TIMELINES.map(t => (
                          <label key={t} className="checkbox-option">
                            <input type="radio" name="p-timeline" checked={timeline === t} onChange={() => setTimeline(t)} />
                            <span style={{ fontSize: 'var(--text-sm)' }}>{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {goals.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: 'var(--sp-sm)' }}>
                        {goals.map(g => <span key={g} className="badge badge-muted">{g}</span>)}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-faint)', fontSize: 'var(--text-sm)', fontStyle: 'italic', marginBottom: 'var(--sp-sm)' }}>No goals selected yet.</p>
                    )}
                    {timeline && (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        <strong>Timeline:</strong> {timeline}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Saved gap analyses */}
              {student?.gapAnalyses && student.gapAnalyses.length > 0 && (
                <div className="card">
                  <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-strong)', marginBottom: 'var(--sp-md)' }}>
                    Saved Gap Analyses
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {student.gapAnalyses.map(analysis => (
                      <div key={analysis.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-strong)' }}>
                            {analysis.pathwayId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            {new Date(analysis.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}>
                          <span className={`match-badge ${analysis.overallMatch >= 70 ? 'match-high' : analysis.overallMatch >= 45 ? 'match-medium' : 'match-low'}`}>
                            {analysis.overallMatch}%
                          </span>
                          <Link to={`/pathway/${analysis.pathwayId}`} className="btn btn-ghost btn-sm">
                            View →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Danger zone */}
              <div className="card" style={{ border: '1px solid rgba(185,28,28,0.2)' }}>
                <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-strong)', marginBottom: 'var(--sp-sm)' }}>Account</h2>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--sp-md)' }}>
                  Signed in as <strong>{user.email}</strong>
                </p>
                <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      if (confirm('Clear all your profile data? This cannot be undone.')) {
                        saveStudentData(user.uid, {
                          profile: { firstName: '', lastName: '', school: '', year: '', major: '', gradYear: '', email: user.email, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                          interests: [], skills: [], goals: [], targetTimeline: '', gpa: null, experienceLevel: '',
                          savedPrograms: [], gapAnalyses: [], resumeUploaded: false,
                        });
                        window.location.reload();
                      }
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--error)', fontSize: 'var(--text-xs)' }}
                  >
                    Clear all profile data
                  </button>
                  <button
                    onClick={wipeAccount}
                    disabled={wiping}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--error)', fontSize: 'var(--text-xs)', fontWeight: 700, border: '1px solid rgba(185,28,28,0.4)' }}
                  >
                    {wiping ? 'Wiping…' : 'Wipe Account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
