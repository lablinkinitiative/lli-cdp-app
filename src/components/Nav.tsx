import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getCurrentUser, signOut } from '../auth';

export default function Nav() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    signOut();
    navigate('/signin');
  };

  const initials = user
    ? ((user.firstName?.[0] || '') + (user.lastName?.[0] || '') || user.email.slice(0, 2)).toUpperCase()
    : '?';

  return (
    <nav className="app-nav" role="navigation" aria-label="Main navigation">
      <div className="nav-inner">
        <a href="https://lablinkinitiative.org" className="nav-logo" target="_blank" rel="noopener noreferrer">
          Lab<em>Link</em> Initiative
        </a>

        {user && (
          <ul className="nav-links-list" role="list">
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/opportunities" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Opportunities
              </NavLink>
            </li>
            <li>
              <NavLink to="/pathways" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Pathways
              </NavLink>
            </li>
            <li>
              <NavLink to="/pathways" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Gap Analysis
              </NavLink>
            </li>
            <li>
              <NavLink to="/resume" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Resume
              </NavLink>
            </li>
            <li>
              <NavLink to="/saved" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Saved
              </NavLink>
            </li>
          </ul>
        )}

        <div className="nav-right">
          {user ? (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                className="nav-avatar-btn"
                onClick={() => setDropdownOpen(o => !o)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="Account menu"
              >
                {initials}
              </button>
              {dropdownOpen && (
                <div className="nav-dropdown" role="menu">
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>Signed in as</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                  </div>
                  <NavLink to="/profile" role="menuitem" onClick={() => setDropdownOpen(false)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Profile
                  </NavLink>
                  <hr />
                  <button onClick={handleSignOut} role="menuitem">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink to="/signin" className="nav-link">Sign in</NavLink>
              <NavLink to="/signup" className="btn btn-lime btn-sm">Create account</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
