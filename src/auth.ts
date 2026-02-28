// ─── Mock Auth Layer ───────────────────────────────────────────────────────────
// TODO: Replace with Firebase Auth when credentials are available.
// All functions mirror the Firebase Auth API surface so swapping is mechanical.

import type { User, StudentData } from './types';

const AUTH_KEY = 'cdp_user';
const DATA_KEY = 'cdp_student_data';

// ─── Auth State ───────────────────────────────────────────────────────────────

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function signOut(): void {
  localStorage.removeItem(AUTH_KEY);
}

// ─── Sign Up ─────────────────────────────────────────────────────────────────

export async function signUp(email: string, _password: string): Promise<User> {
  // TODO: Replace with Firebase Auth createUserWithEmailAndPassword
  const existing = getAllUsers().find(u => u.email === email);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const user: User = {
    uid: `mock-uid-${Date.now()}`,
    email,
    onboardingComplete: false,
  };

  saveUser(user);
  setCurrentUser(user);
  initStudentData(user.uid, email);
  return user;
}

// ─── Sign In ─────────────────────────────────────────────────────────────────

export async function signIn(email: string, _password: string): Promise<User> {
  // TODO: Replace with Firebase Auth signInWithEmailAndPassword
  const user = getAllUsers().find(u => u.email === email);
  if (!user) {
    // In mock mode, create user on first sign-in
    return signUp(email, _password);
  }

  setCurrentUser(user);
  return user;
}

// ─── Google OAuth (Mock) ─────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<User> {
  // TODO: Replace with Firebase Auth signInWithPopup(googleProvider)
  const email = `google-user-${Date.now()}@gmail.com`;
  const user: User = {
    uid: `google-uid-${Date.now()}`,
    email,
    firstName: 'Google',
    lastName: 'User',
    onboardingComplete: false,
  };
  saveUser(user);
  setCurrentUser(user);
  initStudentData(user.uid, email);
  return user;
}

// ─── Student Data (Mock Firestore) ───────────────────────────────────────────
// TODO: Replace with Firestore reads/writes

export function getStudentData(uid: string): StudentData | null {
  try {
    const raw = localStorage.getItem(`${DATA_KEY}_${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStudentData(uid: string, data: Partial<StudentData>): void {
  // TODO: Replace with Firestore setDoc / updateDoc
  const existing = getStudentData(uid) || getDefaultStudentData('', '');
  const merged = { ...existing, ...data, updatedAt: new Date().toISOString() };
  merged.profileCompleteness = calculateCompleteness(merged);
  localStorage.setItem(`${DATA_KEY}_${uid}`, JSON.stringify(merged));
}

export function initStudentData(uid: string, email: string): void {
  if (!getStudentData(uid)) {
    const data = getDefaultStudentData(uid, email);
    localStorage.setItem(`${DATA_KEY}_${uid}`, JSON.stringify(data));
  }
}

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
  if (data.skills.length > 0) score += 15;
  if (data.goals.length > 0) score += 10;
  if (data.targetTimeline) score += 5;
  if (data.gpa) score += 5;
  if (data.resumeUploaded) score += 5;
  return Math.min(100, score);
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

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getAllUsers(): User[] {
  try {
    const raw = localStorage.getItem('cdp_all_users');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUser(user: User): void {
  const users = getAllUsers().filter(u => u.uid !== user.uid);
  users.push(user);
  localStorage.setItem('cdp_all_users', JSON.stringify(users));
}

export function updateCurrentUser(updates: Partial<User>): void {
  const user = getCurrentUser();
  if (!user) return;
  const updated = { ...user, ...updates };
  saveUser(updated);
  setCurrentUser(updated);
}
