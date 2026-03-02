import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getStudentData, saveStudentData, updateCurrentUser } from '../auth';

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

export default function Onboarding() {
  const navigate = useNavigate();
  const user = getCurrentUser()!;
  const existing = getStudentData(user.uid);

  const [step, setStep] = useState(0);
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

  const toggleItem = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
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

    // Save current step data
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
      // Complete onboarding
      setSaving(true);
      updateCurrentUser({ firstName, lastName, onboardingComplete: true });
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    setError('');
    setStep(s => s - 1);
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
            Set up your profile
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>

        {/* Progress */}
        <div className="onboarding-progress" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
          {STEPS.map((_, i) => (
            <div key={i} className={`onboarding-step-dot ${i < step ? 'complete' : i === step ? 'active' : ''}`} />
          ))}
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 'var(--sp-xl)' }}>
          {error && (
            <div className="alert alert-error mb-md" role="alert">{error}</div>
          )}

          {/* Step 0 — About You */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'var(--text-xl)', marginBottom: 'var(--sp-xs)' }}>About You</h2>
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
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-md)' }}>What skills do you already have? Check all that apply.</p>
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

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--sp-md)' }}>
          {step > 0 ? (
            <button onClick={handleBack} className="btn btn-ghost">← Back</button>
          ) : (
            <div />
          )}
          <button onClick={handleNext} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving…' : step === STEPS.length - 1 ? 'Complete Setup →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
