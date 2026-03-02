import { Link } from 'react-router-dom';
import { getCurrentUser } from '../auth';

const FEATURES = [
  {
    icon: '🎯',
    title: 'Personalized Match Scores',
    desc: 'Tell us your major, skills, and goals. We\'ll rank every program by how well it fits you.',
  },
  {
    icon: '📊',
    title: 'Skills Gap Analysis',
    desc: 'See exactly where you stand vs. your target pathway — with a radar chart and action plan.',
  },
  {
    icon: '📄',
    title: 'Resume Intelligence',
    desc: 'Upload your resume. We extract your skills and show you which programs you\'re already qualified for.',
  },
  {
    icon: '🔖',
    title: 'Save & Track Programs',
    desc: 'Bookmark programs and track your application progress across 35+ curated opportunities.',
  },
];

const PATHWAYS = [
  'DOE National Lab Research',
  'Nuclear Engineering',
  'Computational Science',
  'AI / ML Research',
  'Materials Science',
  'Environmental Science',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Software / CS',
  'Life Sciences Research',
  'Business Analytics',
  'Energy Policy',
  'Cybersecurity',
  'Robotics Engineering',
];

export default function Landing() {
  const user = getCurrentUser();
  if (user) {
    window.location.href = '/dashboard';
    return null;
  }

  return (
    <>
      {/* Nav */}
      <nav style={{ background: 'var(--brand-900)', height: 'var(--nav-height)', display: 'flex', alignItems: 'center', padding: '0 1.25rem', position: 'sticky', top: 0, zIndex: 200 }}>
        <div style={{ maxWidth: 1160, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <a href="https://lablinkinitiative.org" style={{ color: 'var(--white)', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'var(--text-lg)', fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.01em' }}>
            Lab<em style={{ fontStyle: 'normal', color: 'var(--accent-lime)' }}>Link</em> Initiative
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/signin" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
              Sign in
            </Link>
            <Link to="/signup" className="btn btn-lime btn-sm">
              Create Free Account
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div style={{ display: 'inline-block', background: 'var(--accent-lime)', color: 'var(--on-lime)', fontSize: 'var(--text-xs)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0.25rem 0.75rem', borderRadius: '99px', marginBottom: '1rem' }}>
            Career Development Platform
          </div>
          <h1>Your personalized path to a national lab career</h1>
          <p>
            Create your profile, discover your best-fit internships, and get a personalized gap analysis — free, no fluff, built for students.
          </p>
          <div className="landing-hero-actions">
            <Link to="/signup" className="btn btn-lime btn-lg">
              Create free account →
            </Link>
            <a href="https://intern.lablinkinitiative.org" className="btn" style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--white)', border: '1px solid rgba(255,255,255,0.25)', minHeight: '52px', padding: '0.875rem 2rem', fontSize: 'var(--text-base)' }}>
              Browse programs first
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: 'var(--sp-2xl) 1.25rem', background: 'var(--canvas)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--sp-xl)' }}>
            <h2 style={{ fontSize: 'var(--text-3xl)', color: 'var(--text-strong)', marginBottom: '0.5rem' }}>
              What the CDP does for you
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-lg)', maxWidth: 540, margin: '0 auto' }}>
              The intern site shows you programs. The CDP shows you <em>your</em> path.
            </p>
          </div>
          <div className="grid-2" style={{ gap: 'var(--sp-md)' }}>
            {FEATURES.map(f => (
              <div key={f.title} className="card" style={{ display: 'flex', gap: 'var(--sp-md)', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '2rem', lineHeight: 1 }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'var(--text-lg)', color: 'var(--text-strong)', marginBottom: '0.375rem' }}>
                    {f.title}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pathways */}
      <section style={{ padding: 'var(--sp-xl) 1.25rem', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--sp-lg)' }}>
            <h2 style={{ fontSize: 'var(--text-3xl)', color: 'var(--text-strong)', marginBottom: '0.375rem' }}>
              14 career pathways mapped
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-base)' }}>
              Each pathway has a skills radar, gap analysis, and matched programs.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {PATHWAYS.map(p => (
              <span key={p} className="badge badge-green" style={{ fontSize: 'var(--text-sm)', padding: '0.375rem 0.875rem' }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--brand-900)', padding: 'var(--sp-2xl) 1.25rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ color: 'var(--white)', fontSize: 'var(--text-3xl)', marginBottom: 'var(--sp-sm)' }}>
            Free for every student. Always.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'var(--text-base)', marginBottom: 'var(--sp-lg)' }}>
            No premium tier. No paywall. LabLink Initiative is a 501(c)(3) nonprofit — the CDP will always be free.
          </p>
          <Link to="/signup" className="btn btn-lime btn-lg">
            Create your free account →
          </Link>
          <div style={{ marginTop: 'var(--sp-md)', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.4)' }}>
            Already have an account? <Link to="/signin" style={{ color: 'var(--accent-lime)' }}>Sign in</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--brand-900)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'var(--sp-md) 1.25rem' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <a href="https://lablinkinitiative.org" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'var(--text-xs)', textDecoration: 'none' }}>
            &copy; 2026 LabLink Initiative &middot; 501(c)(3) Nonprofit
          </a>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="https://intern.lablinkinitiative.org" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'var(--text-xs)', textDecoration: 'none' }}>Browse Programs</a>
            <a href="https://newsletter.lablinkinitiative.org" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'var(--text-xs)', textDecoration: 'none' }}>Newsletter</a>
            <a href="mailto:lablinkinitiative@gmail.com" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'var(--text-xs)', textDecoration: 'none' }}>Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
}
