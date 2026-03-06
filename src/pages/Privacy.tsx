import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <>
      <nav style={{ background: 'var(--brand-900)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 1.25rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ color: 'var(--white)', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 'var(--text-lg)', textDecoration: 'none', letterSpacing: '-0.02em' }}>
          LabLink CDP
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link to="/signin" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>Sign in</Link>
          <Link to="/signup" className="btn btn-lime" style={{ padding: '0.375rem 1rem', fontSize: 'var(--text-sm)', minHeight: 'unset' }}>Get started</Link>
        </div>
      </nav>

      <main style={{ background: 'var(--canvas)', minHeight: '100vh', padding: 'var(--sp-2xl) 1.25rem' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ marginBottom: 'var(--sp-xl)' }}>
            <span style={{ display: 'inline-block', background: 'var(--accent-lime)', color: 'var(--on-lime)', fontSize: 'var(--text-xs)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0.25rem 0.75rem', borderRadius: '99px', marginBottom: '1rem' }}>
              Legal
            </span>
            <h1 style={{ fontSize: 'var(--text-4xl)', color: 'var(--text-strong)', marginBottom: '0.5rem' }}>Privacy Policy</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Last updated: March 2026</p>
          </div>

          <div className="card" style={{ padding: 'var(--sp-xl)', lineHeight: 1.75 }}>
            <p style={{ color: 'var(--text-body)', marginBottom: 'var(--sp-lg)', fontStyle: 'italic' }}>
              LabLink Initiative is a nonprofit. We collect only what we need to provide the CDP, we never sell your data, and you can delete everything at any time.
            </p>

            <Section title="1. Who We Are">
              <p>LabLink Initiative is a 501(c)(3) nonprofit organization. The Career Development Platform (CDP) at <a href="https://cdp.lablinkinitiative.org" style={{ color: 'var(--accent-lime)' }}>cdp.lablinkinitiative.org</a> is operated by LabLink Initiative and is provided free to students.</p>
              <p>Contact: <a href="mailto:lablinkinitiative@gmail.com" style={{ color: 'var(--accent-lime)' }}>lablinkinitiative@gmail.com</a></p>
            </Section>

            <Section title="2. What We Collect">
              <p><strong style={{ color: 'var(--text-strong)' }}>Account information:</strong> Email address, name, and password hash (or Google account ID if you use Google sign-in).</p>
              <p><strong style={{ color: 'var(--text-strong)' }}>Profile information:</strong> Major, graduation year, institution, GPA, skills, career interests, and goals — whatever you choose to provide.</p>
              <p><strong style={{ color: 'var(--text-strong)' }}>Resumes:</strong> PDF files you upload are stored securely and used to extract skills and experience for your profile.</p>
              <p><strong style={{ color: 'var(--text-strong)' }}>Platform activity:</strong> Programs you save, pathways you generate, and gap analyses you run.</p>
              <p><strong style={{ color: 'var(--text-strong)' }}>Technical data:</strong> Basic request logs (IP addresses, timestamps) for security and debugging. These are not retained long-term.</p>
            </Section>

            <Section title="3. How We Use Your Data">
              <ul style={{ paddingLeft: '1.5rem', margin: '0.75rem 0' }}>
                <li>To provide personalized program matching and gap analyses</li>
                <li>To generate and store your career pathway recommendations</li>
                <li>To sync your data across devices</li>
                <li>To improve the platform based on aggregate, anonymized usage patterns</li>
                <li>To send transactional emails (account confirmation, password reset) — when email is enabled</li>
              </ul>
              <p>We do <strong>not</strong> use your data for advertising. We do <strong>not</strong> sell your data. We do <strong>not</strong> share your personally identifiable information with third parties except as described in Section 5.</p>
            </Section>

            <Section title="4. AI and Data Processing">
              <p>The CDP uses AI models (via Anthropic's Claude API) to generate pathway recommendations, gap analyses, and research. When you request a gap analysis or pathway generation, relevant portions of your profile are sent to Anthropic's API for processing. This data is subject to <a href="https://www.anthropic.com/privacy" style={{ color: 'var(--accent-lime)' }} target="_blank" rel="noopener noreferrer">Anthropic's Privacy Policy</a>.</p>
              <p>We do not send your raw resumes or full profile to AI APIs — only structured, anonymized data relevant to the specific request.</p>
            </Section>

            <Section title="5. Data Sharing">
              <p>We share data only with:</p>
              <ul style={{ paddingLeft: '1.5rem', margin: '0.75rem 0' }}>
                <li><strong style={{ color: 'var(--text-strong)' }}>Anthropic</strong> — for AI-powered features (gap analysis, pathway research)</li>
                <li><strong style={{ color: 'var(--text-strong)' }}>Google</strong> — if you use Google OAuth sign-in</li>
                <li><strong style={{ color: 'var(--text-strong)' }}>Vercel</strong> — our frontend hosting provider</li>
              </ul>
              <p>We do not share your data with internship sponsors, recruiters, or any other third parties.</p>
            </Section>

            <Section title="6. Data Storage and Security">
              <p>Your data is stored on servers operated by LabLink Initiative. We use industry-standard security practices including:</p>
              <ul style={{ paddingLeft: '1.5rem', margin: '0.75rem 0' }}>
                <li>HTTPS encryption for all data in transit</li>
                <li>Hashed passwords (bcrypt) — we never store plain-text passwords</li>
                <li>JWT authentication with expiring tokens</li>
                <li>Rate limiting and security headers</li>
                <li>Daily encrypted database backups</li>
              </ul>
              <p>No security system is perfect. If you discover a security issue, please contact us immediately at <a href="mailto:lablinkinitiative@gmail.com" style={{ color: 'var(--accent-lime)' }}>lablinkinitiative@gmail.com</a>.</p>
            </Section>

            <Section title="7. Your Rights and Controls">
              <p>You have full control over your data:</p>
              <ul style={{ paddingLeft: '1.5rem', margin: '0.75rem 0' }}>
                <li><strong style={{ color: 'var(--text-strong)' }}>Access:</strong> All your data is visible in your Profile and Dashboard</li>
                <li><strong style={{ color: 'var(--text-strong)' }}>Edit:</strong> Update your profile information at any time</li>
                <li><strong style={{ color: 'var(--text-strong)' }}>Delete:</strong> Use the "Wipe Account" button in Profile settings to permanently delete all your data</li>
                <li><strong style={{ color: 'var(--text-strong)' }}>Export:</strong> Contact us to request a copy of your data</li>
              </ul>
              <p>Account deletion is permanent and irreversible. We delete all personal data within 24 hours of your request.</p>
            </Section>

            <Section title="8. Cookies and Local Storage">
              <p>The CDP uses browser localStorage (not traditional cookies) to maintain your session and cache profile data for offline performance. This data stays in your browser and is used only to improve your experience. You can clear it at any time through your browser settings.</p>
            </Section>

            <Section title="9. Children's Privacy">
              <p>The CDP is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will promptly delete it.</p>
            </Section>

            <Section title="10. Changes to This Policy">
              <p>We may update this Privacy Policy as our practices change. We will post the updated policy on this page with a new "last updated" date. Material changes will be announced in our Slack community and newsletter.</p>
            </Section>

            <Section title="11. Contact Us">
              <p>For privacy questions, data requests, or security concerns:</p>
              <p><a href="mailto:lablinkinitiative@gmail.com" style={{ color: 'var(--accent-lime)' }}>lablinkinitiative@gmail.com</a></p>
              <p>LabLink Initiative &middot; 501(c)(3) Nonprofit</p>
            </Section>
          </div>
        </div>
      </main>

      <footer style={{ background: 'var(--brand-900)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'var(--sp-md) 1.25rem' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <a href="https://lablinkinitiative.org" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'var(--text-xs)', textDecoration: 'none' }}>
            &copy; 2026 LabLink Initiative &middot; 501(c)(3) Nonprofit
          </a>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/terms" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'var(--text-xs)', textDecoration: 'none' }}>Terms</Link>
            <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'var(--text-xs)', textDecoration: 'none' }}>Privacy</Link>
            <a href="mailto:lablinkinitiative@gmail.com" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'var(--text-xs)', textDecoration: 'none' }}>Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--sp-lg)' }}>
      <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'var(--text-xl)', color: 'var(--text-strong)', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>{title}</h2>
      <div style={{ color: 'var(--text-body)', fontSize: 'var(--text-base)' }}>{children}</div>
    </div>
  );
}
