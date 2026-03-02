import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../auth';

export default function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!email || !password || !confirm) return 'All fields are required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    if (!agreed) return 'Please agree to the terms to continue.';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    setError('');
    try {
      await signUp(email, password);
      navigate('/onboarding');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Account creation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = password.length === 0 ? null : password.length < 8 ? 'weak' : password.length < 12 ? 'medium' : 'strong';
  const strengthColor = passwordStrength === 'strong' ? 'var(--success)' : passwordStrength === 'medium' ? 'var(--warning)' : 'var(--error)';

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <a href="https://lablinkinitiative.org" style={{ color: 'var(--brand-700)', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, textDecoration: 'none', fontSize: 'var(--text-lg)' }}>
            Lab<em style={{ fontStyle: 'normal', color: 'var(--accent-lime)' }}>Link</em> CDP
          </a>
        </div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Free forever. No credit card required.</p>

        {error && (
          <div className="alert alert-error mb-md" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@university.edu"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              minLength={8}
            />
            {passwordStrength && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'var(--surface-2)' }}>
                  <div style={{
                    height: '100%',
                    borderRadius: 99,
                    background: strengthColor,
                    width: passwordStrength === 'strong' ? '100%' : passwordStrength === 'medium' ? '60%' : '30%',
                    transition: 'width 0.3s',
                  }} />
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: strengthColor, textTransform: 'capitalize', minWidth: 50 }}>{passwordStrength}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              className="form-input"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
              required
            />
          </div>

          <label className="checkbox-option">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              I agree to LabLink Initiative's <a href="https://lablinkinitiative.org" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="https://lablinkinitiative.org" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            </span>
          </label>

          <button type="submit" disabled={loading} className="btn btn-lime btn-block">
            {loading ? 'Creating account…' : 'Create free account →'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/signin">Sign in</Link>
        </div>
        <div className="auth-footer" style={{ marginTop: '0.5rem' }}>
          <a href="https://intern.lablinkinitiative.org" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
            Browse programs without an account →
          </a>
        </div>
      </div>
    </div>
  );
}
