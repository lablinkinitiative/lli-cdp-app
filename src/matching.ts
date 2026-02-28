// ─── Match & Gap Analysis Engine ──────────────────────────────────────────────
// Pure functions for computing program match scores and gap analysis.
// No Firebase needed — pure client-side computation.

import type { Program, StudentData, Pathway, GapAnalysis, RadarData, SkillBreakdownItem, Recommendation } from './types';

// ─── Program Match Score ──────────────────────────────────────────────────────

export function computeMatchScore(program: Program, student: StudentData): number {
  if (!student.profile.firstName) return 0;

  let score = 0;
  let maxScore = 0;

  // Eligibility check (25 pts)
  maxScore += 25;
  const yearEligible = isEligibleByYear(program, student.profile.year);
  if (yearEligible) score += 25;
  else score += 0;

  // Interests alignment (30 pts)
  maxScore += 30;
  const categoryKeywords = getCategoryKeywords(program.category);
  const interestMatch = student.interests.some(i =>
    categoryKeywords.some(kw => i.toLowerCase().includes(kw.toLowerCase()))
  );
  if (interestMatch) score += 30;
  else score += 5;

  // Skills match (30 pts)
  maxScore += 30;
  const programAreas = program.researchAreas || [];
  const studentSkills = student.skills || [];
  const skillMatch = programAreas.some(area =>
    studentSkills.some(s => s.toLowerCase().includes(area.toLowerCase()) ||
      area.toLowerCase().includes(s.toLowerCase()))
  );
  if (skillMatch) score += 30;
  else if (studentSkills.length > 0) score += 10;

  // GPA eligibility (15 pts)
  maxScore += 15;
  const requiredGpa = program.eligibility.gpa;
  if (!requiredGpa) {
    score += 15;
  } else if (student.gpa && student.gpa >= requiredGpa) {
    score += 15;
  } else if (student.gpa && student.gpa >= requiredGpa - 0.3) {
    score += 8;
  } else if (!student.gpa) {
    score += 10; // Unknown, give benefit of doubt
  }

  return Math.round((score / maxScore) * 100);
}

function isEligibleByYear(program: Program, year: string): boolean {
  const levels = program.eligibility.level.map(l => l.toLowerCase());

  if (!year) return true; // Unknown — optimistic

  if (year === 'Community College' || year === 'community college') {
    return levels.some(l => l.includes('community college') || l.includes('undergraduate'));
  }
  if (year === 'Graduate' || year === 'PhD') {
    return levels.some(l => l.includes('graduate') || l.includes('phd') || l.includes('postdoc'));
  }
  if (['Freshman', 'Sophomore', 'Junior', 'Senior'].includes(year)) {
    return levels.some(l => l.includes('undergraduate') || l.includes(year.toLowerCase()));
  }
  return true;
}

function getCategoryKeywords(category: string): string[] {
  const map: Record<string, string[]> = {
    'DOE National Labs': ['National Lab', 'DOE', 'research', 'STEM', 'energy', 'nuclear', 'physics', 'chemistry'],
    'Federal / Space': ['NASA', 'space', 'aerospace', 'engineering', 'STEM'],
    'Federal / Environment': ['environmental', 'EPA', 'climate', 'NOAA', 'atmosphere', 'ocean'],
    'Federal / Biomedical': ['biology', 'biomedical', 'NIH', 'medicine', 'life sciences'],
    'Federal / Science': ['NIST', 'science', 'STEM', 'measurement', 'technology'],
    'Federal / Defense': ['AFRL', 'military', 'defense', 'engineering', 'security'],
    'Academic Research': ['research', 'academic', 'graduate school', 'NSF'],
    'Industry / Tech': ['software', 'tech', 'CS', 'AI', 'data science', 'computer science'],
    'Industry / Defense & Aerospace': ['defense', 'aerospace', 'engineering', 'security'],
    'Industry / Clean Energy': ['clean energy', 'energy', 'engineering', 'solar', 'wind'],
    'Equity / Federal': ['federal', 'Hispanic', 'HACU', 'underrepresented'],
    'Equity / Professional': ['NSBE', 'SWE', 'engineering', 'professional'],
    'Platform': ['job search', 'career', 'internship', 'application'],
    'Academic / Community College': ['PTK', 'community college', 'transfer'],
  };
  return map[category] || [];
}

// ─── Eligibility Status ───────────────────────────────────────────────────────

export type EligibilityStatus = 'eligible' | 'check' | 'unlikely';

export function getEligibilityStatus(program: Program, student: StudentData): EligibilityStatus {
  const year = student.profile.year;
  if (!year) return 'check';

  const eligible = isEligibleByYear(program, year);
  if (!eligible) return 'unlikely';

  // GPA check
  const requiredGpa = program.eligibility.gpa;
  if (requiredGpa && student.gpa && student.gpa < requiredGpa - 0.5) {
    return 'unlikely';
  }

  return 'eligible';
}

// ─── Gap Analysis ─────────────────────────────────────────────────────────────

export function computeGapAnalysis(pathway: Pathway, student: StudentData): GapAnalysis {
  const studentSkills = student.skills || [];
  const pathwaySkills = pathway.skills || [];

  // Build radar axes by category
  const categories = new Map<string, { required: number; student: number; totalWeight: number }>();

  for (const skill of pathwaySkills) {
    const cat = skill.category || 'Other';
    if (!categories.has(cat)) {
      categories.set(cat, { required: 0, student: 0, totalWeight: 0 });
    }
    const c = categories.get(cat)!;
    c.totalWeight += skill.weight;
    c.required += skill.weight;

    // Check if student has this skill
    const hasSkill = studentSkills.some(s =>
      skill.name.toLowerCase().includes(s.toLowerCase()) ||
      s.toLowerCase().includes(skill.name.toLowerCase().split(' ')[0])
    );
    if (hasSkill) {
      c.student += skill.weight;
    }
  }

  // Build radar data (take top 6 categories by weight)
  const sortedCats = [...categories.entries()]
    .sort((a, b) => b[1].totalWeight - a[1].totalWeight)
    .slice(0, 6);

  const axes = sortedCats.map(([name]) => name);
  const requiredScores = sortedCats.map(([, v]) => Math.min(1, v.required / (v.totalWeight * 1.2)));
  const studentScores = sortedCats.map(([, v]) => {
    const raw = v.required > 0 ? v.student / v.required : 0;
    return Math.min(1, raw * 0.9 + 0.1); // small floor
  });

  const radarData: RadarData = { axes, studentScores, requiredScores };

  // Skill breakdown
  const skillBreakdown: SkillBreakdownItem[] = pathwaySkills.slice(0, 10).map(skill => {
    const hasSkill = studentSkills.some(s =>
      skill.name.toLowerCase().includes(s.toLowerCase()) ||
      s.toLowerCase().includes(skill.name.toLowerCase().split(' ')[0])
    );
    const studentLevel = hasSkill ? 0.8 : 0.15;
    const requiredLevel = skill.weight / 5;
    const gap = Math.max(0, requiredLevel - studentLevel);
    let status: 'meets' | 'partial' | 'gap' = 'gap';
    if (studentLevel >= requiredLevel * 0.9) status = 'meets';
    else if (studentLevel >= requiredLevel * 0.5) status = 'partial';

    return { skill: skill.name, studentLevel, requiredLevel, gap, status };
  });

  // Overall match
  const overallMatch = Math.round(
    studentScores.reduce((sum, s, i) => sum + (s / Math.max(0.01, requiredScores[i])), 0) /
    studentScores.length * 70
  ) + (student.gpa && student.gpa >= 3.0 ? 10 : 5);

  // Recommendations
  const recommendations: Recommendation[] = buildRecommendations(pathway, skillBreakdown, student);

  return {
    id: `ga-${Date.now()}`,
    pathwayId: pathway.id,
    createdAt: new Date().toISOString(),
    overallMatch: Math.min(95, Math.max(10, overallMatch)),
    radarData,
    skillBreakdown,
    recommendations,
  };
}

function buildRecommendations(
  pathway: Pathway,
  breakdown: SkillBreakdownItem[],
  student: StudentData
): Recommendation[] {
  const recs: Recommendation[] = [];

  // Top gap items
  const gaps = breakdown.filter(s => s.status === 'gap').slice(0, 2);
  for (const gap of gaps) {
    recs.push({
      priority: 'high',
      text: `Develop skills in: ${gap.skill}. This is a high-weight requirement for ${pathway.shortName}.`,
    });
  }

  // Experience level
  if (!student.experienceLevel || student.experienceLevel === 'No professional experience yet') {
    recs.push({
      priority: 'high',
      text: 'Join a research group at your college or university to build hands-on experience before applying.',
    });
  }

  // GPA note
  if (!student.gpa) {
    recs.push({
      priority: 'medium',
      text: 'Add your GPA to your profile to get more accurate eligibility matching for programs with GPA requirements.',
    });
  }

  // Core program recommendation
  if (pathway.corePrograms && pathway.corePrograms.length > 0) {
    recs.push({
      priority: 'medium',
      text: `You are already a candidate for programs in this pathway. Apply to ${pathway.shortName} programs via Zintellect or the program portals listed in Browse Opportunities.`,
      resource: 'https://zintellect.com',
    });
  }

  // Resume
  if (!student.resumeUploaded) {
    recs.push({
      priority: 'low',
      text: 'Upload your resume to get more precise gap analysis based on your actual experience and coursework.',
    });
  }

  return recs.slice(0, 5);
}
