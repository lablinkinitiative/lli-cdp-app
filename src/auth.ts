// ─── Real Auth Layer — LabLink CDP API ─────────────────────────────────────────
// Uses the backend at VITE_API_URL for real auth + persistence.
// localStorage acts as a sync cache so all pages stay compatible.

import type { User, StudentData } from './types';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'https://app.lablinkinitiative.org';
const TOKEN_KEY = 'cdp_token';
const DATA_KEY  = 'cdp_student_data';
const USER_KEY  = 'cdp_user';

// ─── Token helpers ─────────────────────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Auth State ───────────────────────────────────────────────────────────────

export function getCurrentUser(): User | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp < Date.now() / 1000) { signOut(); return null; }
    const cached = localStorage.getItem(USER_KEY);
    const extra: Partial<User> = cached ? JSON.parse(cached) : {};
    return { uid: payload.uid, email: payload.email, ...extra };
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User): void {
  const { uid: _uid, email: _email, ...extra } = user;
  localStorage.setItem(USER_KEY, JSON.stringify(extra));
}

export function signOut(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ─── Sign Up ─────────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_BASE}/api/cdp/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, firstName: '', lastName: '' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');

  setToken(data.token);
  const user: User = { uid: data.uid, email: data.email, onboardingComplete: false };
  setCurrentUser(user);
  if (!getStudentData(data.uid)) {
    localStorage.setItem(`${DATA_KEY}_${data.uid}`, JSON.stringify(getDefaultStudentData(data.uid, email)));
  }
  return user;
}

// ─── Sign In ─────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_BASE}/api/cdp/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Invalid email or password');

  setToken(data.token);
  const user: User = {
    uid: data.uid,
    email: data.email,
    firstName: data.firstName || undefined,
    lastName: data.lastName || undefined,
    onboardingComplete: true,
  };
  setCurrentUser(user);
  // Fetch full student data and cache (enables cross-device sync)
  await syncStudentDataFromApi(data.uid);
  return user;
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export function signInWithGoogle(): void {
  window.location.href = `${API_BASE}/api/cdp/auth/google`;
}

// ─── Student Data — sync read from localStorage ────────────────────────────────

export function getStudentData(uid: string): StudentData | null {
  try {
    const raw = localStorage.getItem(`${DATA_KEY}_${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStudentData(uid: string, data: Partial<StudentData>): void {
  const existing = getStudentData(uid) || getDefaultStudentData(uid, '');
  const merged: StudentData = {
    ...existing,
    ...data,
    profile: { ...existing.profile, ...(data.profile || {}), updatedAt: new Date().toISOString() },
  };
  merged.profileCompleteness = calculateCompleteness(merged);
  localStorage.setItem(`${DATA_KEY}_${uid}`, JSON.stringify(merged));
  // Fire-and-forget API sync
  syncStudentDataToApi(merged).catch(() => {});
}

export function initStudentData(uid: string, email: string): void {
  if (!getStudentData(uid)) {
    localStorage.setItem(`${DATA_KEY}_${uid}`, JSON.stringify(getDefaultStudentData(uid, email)));
  }
}

// ─── Saved Programs ───────────────────────────────────────────────────────────

export function saveProgram(uid: string, programId: string): void {
  const data = getStudentData(uid);
  if (!data) return;
  if (!data.savedPrograms.includes(programId)) {
    data.savedPrograms = [...data.savedPrograms, programId];
    saveStudentData(uid, { savedPrograms: data.savedPrograms });
  }
}

export function unsaveProgram(uid: string, programId: string): void {
  const data = getStudentData(uid);
  if (!data) return;
  data.savedPrograms = data.savedPrograms.filter(id => id !== programId);
  saveStudentData(uid, { savedPrograms: data.savedPrograms });
}

// ─── Update current user metadata ─────────────────────────────────────────────

export function updateCurrentUser(updates: Partial<User>): void {
  const cached = localStorage.getItem(USER_KEY);
  const extra = cached ? JSON.parse(cached) : {};
  localStorage.setItem(USER_KEY, JSON.stringify({ ...extra, ...updates }));
}

// ─── API sync helpers ──────────────────────────────────────────────────────────

async function syncStudentDataFromApi(uid: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/cdp/students/me/full-data`, {
      headers: authHeader(),
    });
    if (!res.ok) return;
    const data: StudentData = await res.json();
    localStorage.setItem(`${DATA_KEY}_${uid}`, JSON.stringify(data));
  } catch {
    // Network error — local cache is the fallback
  }
}

async function syncStudentDataToApi(data: StudentData): Promise<void> {
  await fetch(`${API_BASE}/api/cdp/students/me/full-data`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data),
  });
}

// ─── Public refresh — call after async backend updates (e.g. resume parse) ────

export async function refreshStudentData(uid: string): Promise<void> {
  await syncStudentDataFromApi(uid);
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

function getDefaultStudentData(_uid: string, email: string): StudentData {
  return {
    profile: {
      firstName: '',
      lastName: '',
      school: '',
      year: '',
      major: '',
      gradYear: '',
      email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    interests: [],
    skills: [],
    goals: [],
    targetTimeline: '',
    gpa: null,
    experienceLevel: '',
    profileCompleteness: 0,
    savedPrograms: [],
    gapAnalyses: [],
    resumeUploaded: false,
    experience: [],
  };
}

function calculateCompleteness(data: StudentData): number {
  let score = 0;
  if (data.profile.firstName) score += 10;
  if (data.profile.lastName) score += 5;
  if (data.profile.school) score += 10;
  if (data.profile.year) score += 10;
  if (data.profile.major) score += 10;
  if (data.interests.length > 0) score += 15;
  if (data.skills.length > 0) score += 10;
  if (data.goals.length > 0) score += 10;
  if (data.targetTimeline) score += 5;
  if (data.gpa) score += 5;
  if (data.resumeUploaded) score += 5;
  if (data.experience && data.experience.length > 0) score += 5;
  return Math.min(100, score);
}
