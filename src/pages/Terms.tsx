import { Link } from 'react-router-dom';

export default function Terms() {
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
            <h1 style={{ fontSize: 'var(--text-4xl)', color: 'var(--text-strong)', marginBottom: '0.5rem' }}>Terms of Service</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Last updated: March 2026</p>
          </div>

          <div className="card" style={{ padding: 'var(--sp-xl)', lineHeight: 1.75 }}>
            <Section title="1. About LabLink Initiative">
              <p>LabLink Initiative is a 501(c)(3) nonprofit organization dedicated to connecting underrepresented students with STEM internship and research opportunities. The Career Development Platform (CDP) is provided free of charge as part of our mission.</p>
            </Section>

            <Section title="2. Acceptance of Terms">
              <p>By creating an account or using the CDP, you agree to these Terms of Service. If you do not agree, please do not use the platform. We reserve the right to update these terms at any time — continued use after changes constitutes acceptance.</p>
            </Section>

            <Section title="3. Eligibility">
              <p>The CDP is designed for students currently enrolled in or recently graduated from undergraduate or graduate programs. You must be at least 13 years old to create an account. By registering, you confirm you meet these requirements.</p>
            </Section>

            <Section title="4. Your Account">
              <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information and keep your profile up to date. You may not share your account with others or use another person's account.</p>
              <p>You can delete your account at any time from the Profile settings page. Deletion is permanent and removes all your data from our servers.</p>
            </Section>

            <Section title="5. Acceptable Use">
              <p>You agree not to:</p>
              <ul style={{ paddingLeft: '1.5rem', margin: '0.75rem 0' }}>
                <li>Upload false, misleading, or fraudulent information</li>
                <li>Use the platform to harass, impersonate, or harm others</li>
                <li>Attempt to access other users' data or compromise platform security</li>
                <li>Scrape, copy, or redistribute platform data without permission</li>
                <li>Use automated tools to interact with the platform in ways that degrade performance</li>
              </ul>
            </Section>

            <Section title="6. Your Data and Content">
              <p>You retain ownership of the content you upload (resumes, profile information, etc.). By uploading content, you grant LabLink Initiative a limited license to process and display that content within the platform to provide our services.</p>
              <p>We do not sell your personal data. See our <Link to="/privacy" style={{ color: 'var(--accent-lime)' }}>Privacy Policy</Link> for full details on how we handle your information.</p>
            </Section>

            <Section title="7. Platform Availability">
              <p>The CDP is provided "as is." While we strive for high availability, we do not guarantee uninterrupted access. We may perform maintenance, updates, or modifications at any time. We are not liable for any downtime or service interruptions.</p>
            </Section>

            <Section title="8. Third-Party Integrations">
              <p>The CDP integrates with Google OAuth for authentication. Your use of Google's services is governed by Google's own Terms of Service and Privacy Policy. We are not responsible for third-party services.</p>
            </Section>

            <Section title="9. Program Information">
              <p>Information about internship and research programs on the CDP is provided for informational purposes and may not be complete or fully current. We make no guarantees about program availability, deadlines, or eligibility requirements. Always verify information directly with the sponsoring organization.</p>
            </Section>

            <Section title="10. Limitation of Liability">
              <p>LabLink Initiative is a nonprofit providing this service free of charge. To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the CDP. Our total liability for any claims is limited to $0, as no fees are charged.</p>
            </Section>

            <Section title="11. Governing Law">
              <p>These terms are governed by the laws of the United States. Any disputes shall be resolved through good-faith negotiation or, if necessary, binding arbitration.</p>
            </Section>

            <Section title="12. Contact">
              <p>Questions about these terms? Reach us at <a href="mailto:lablinkinitiative@gmail.com" style={{ color: 'var(--accent-lime)' }}>lablinkinitiative@gmail.com</a>.</p>
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
