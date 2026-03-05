import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TOKEN_KEY = 'cdp_token';
const USER_KEY = 'cdp_user';

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    // Validate dest to prevent open redirect — only allow internal routes
    const rawDest = params.get('dest') || '/dashboard';
    const dest = rawDest.startsWith('/') && !rawDest.startsWith('//') ? rawDest : '/dashboard';
    const firstName = params.get('firstName') || '';
    const error = params.get('error');

    if (error) {
      navigate('/signin?error=' + encodeURIComponent(
        error === 'oauth_cancelled' ? 'Google sign-in was cancelled.' : 'Google sign-in failed. Please try again.'
      ));
      return;
    }

    if (!token) {
      navigate('/signin');
      return;
    }

    localStorage.setItem(TOKEN_KEY, token);
    if (firstName) {
      localStorage.setItem(USER_KEY, JSON.stringify({ firstName }));
    }

    navigate(dest, { replace: true });
  }, [navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Signing you in…</p>
      </div>
    </div>
  );
}
