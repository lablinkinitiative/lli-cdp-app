// ─── Core Types for LLI CDP App ───────────────────────────────────────────────

export interface User {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  onboardingComplete?: boolean;
}

export interface StudentProfile {
  firstName: string;
  lastName: string;
  school: string;
  year: string;
  major: string;
  gradYear: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentData {
  profile: StudentProfile;
  interests: string[];
  skills: string[];
  goals: string[];
  targetTimeline: string;
  gpa: number | null;
  experienceLevel: string;
  profileCompleteness: number;
  savedPrograms: string[];
  gapAnalyses: GapAnalysis[];
  resumeUploaded: boolean;
}

export interface GapAnalysis {
  id: string;
  pathwayId: string;
  createdAt: string;
  overallMatch: number;
  radarData: RadarData;
  skillBreakdown: SkillBreakdownItem[];
  recommendations: Recommendation[];
}

export interface RadarData {
  axes: string[];
  studentScores: number[];
  requiredScores: number[];
}

export interface SkillBreakdownItem {
  skill: string;
  studentLevel: number;
  requiredLevel: number;
  gap: number;
  status: 'meets' | 'partial' | 'gap';
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  text: string;
  resource?: string;
}

export interface ProgramTags {
  career_stage?: string[];
  benefits?: string[];
  duration?: string[];
  location_type?: string[];
  focus_type?: string[];
  special_eligibility?: string[];
  keywords?: string[];
}

export interface Program {
  id: string;
  name: string;
  shortName: string;
  category: string;
  type: string;
  eligibility: {
    level: string[];
    citizenship: string[];
    gpa?: number;
    notes?: string;
  };
  duration: {
    weeks: number | null;
    terms: string[];
  };
  compensation: {
    paid: boolean;
    stipend: string;
    housing?: string;
    travel?: string;
  };
  locations: string[];
  researchAreas: string[];
  deadlines: Record<string, string>;
  applicationUrl: string;
  applicationPlatform: string;
  keyFacts: string[];
  lliBridgeNote: string;
  tags?: ProgramTags | null;
  sector?: string;
}

export interface Pathway {
  id: string;
  name: string;
  shortName: string;
  track: string;
  targetLevel: string[];
  targetPrograms: string[];
  description: string;
  timeToReady: string;
  skills: PathwaySkill[];
  radarAxes?: RadarAxis[];
  recommendedCourses?: string[];
  careerOutcomes?: string[];
  corePrograms?: string[];
}

export interface PathwaySkill {
  name: string;
  weight: number;
  category: string;
}

export interface RadarAxis {
  name: string;
  skills: string[];
  weight: number;
}
