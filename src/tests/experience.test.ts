/**
 * Tests for ExperienceEntry data model and logic
 */

import { describe, it, expect } from 'vitest';
import type { ExperienceEntry, StudentData, ExperienceType } from '../types';

// ─── Type completeness tests ──────────────────────────────────────────────────

describe('ExperienceEntry type', () => {
  it('accepts all valid experience types', () => {
    const types: ExperienceType[] = ['work', 'research', 'education', 'leadership', 'volunteer', 'other'];
    types.forEach(type => {
      const entry: ExperienceEntry = {
        id: 'abc12345',
        type,
        title: 'Test Title',
        org: 'Test Org',
        duration: 'Jan 2023 – Present',
      };
      expect(entry.type).toBe(type);
    });
  });

  it('allows optional fields to be undefined', () => {
    const entry: ExperienceEntry = {
      id: 'abc12345',
      type: 'work',
      title: 'Intern',
      org: 'AFRL',
      duration: 'May 2025 – Aug 2025',
    };
    expect(entry.startDate).toBeUndefined();
    expect(entry.endDate).toBeUndefined();
    expect(entry.description).toBeUndefined();
    expect(entry.skills).toBeUndefined();
  });

  it('allows endDate to be null (ongoing)', () => {
    const entry: ExperienceEntry = {
      id: 'abc12345',
      type: 'research',
      title: 'PhD Researcher',
      org: 'CU Boulder',
      duration: 'Aug 2024 – Present',
      startDate: '2024-08',
      endDate: null,
    };
    expect(entry.endDate).toBeNull();
  });

  it('captures full entry from NS resume scenario', () => {
    const entry: ExperienceEntry = {
      id: 'a1b2c3d4',
      type: 'work',
      title: 'High Performance Computing Intern',
      org: 'Air Force Research Laboratory',
      duration: 'May 2025 – Aug 2025',
      startDate: '2025-05',
      endDate: '2025-08',
      description: 'Built shear-testing MD workflow in LAMMPS for MXenes; 1000+ trajectories on DoD HPC.',
      skills: ['LAMMPS', 'Python', 'HPC', 'Slurm'],
    };
    expect(entry.type).toBe('work');
    expect(entry.skills).toContain('LAMMPS');
    expect(entry.endDate).toBe('2025-08');
  });
});

// ─── StudentData.experience field ─────────────────────────────────────────────

describe('StudentData.experience field', () => {
  it('is optional (backward compatible)', () => {
    const data: StudentData = {
      profile: {
        firstName: 'Sean',
        lastName: 'Florez',
        school: 'CU Boulder',
        year: 'PhD',
        major: 'Materials Science',
        gradYear: '2028',
        email: 'sean@test.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      interests: [],
      skills: ['Python', 'LAMMPS'],
      goals: [],
      targetTimeline: '',
      gpa: 3.9,
      experienceLevel: '2+ internships or research positions',
      profileCompleteness: 65,
      savedPrograms: [],
      gapAnalyses: [],
      resumeUploaded: true,
      // experience intentionally omitted — must be valid
    };
    expect(data.experience).toBeUndefined();
  });

  it('accepts an array of experience entries', () => {
    const data: StudentData = {
      profile: {
        firstName: 'Sean',
        lastName: 'Florez',
        school: 'CU Boulder',
        year: 'PhD',
        major: 'Materials Science',
        gradYear: '2028',
        email: 'sean@test.com',
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
      experience: [
        {
          id: 'a1b2c3d4',
          type: 'education',
          title: 'Ph.D., Materials Science & Engineering',
          org: 'University of Colorado Boulder',
          duration: 'Aug 2024 – Present',
          startDate: '2024-08',
          endDate: null,
        },
        {
          id: 'e5f6g7h8',
          type: 'education',
          title: 'B.S., Materials Science & Engineering',
          org: 'University of Florida',
          duration: 'Aug 2020 – May 2024',
          startDate: '2020-08',
          endDate: '2024-05',
        },
      ],
    };
    expect(data.experience).toHaveLength(2);
    expect(data.experience![0].type).toBe('education');
  });
});

// ─── Sort order logic ─────────────────────────────────────────────────────────

describe('Timeline sort order', () => {
  const entries: ExperienceEntry[] = [
    { id: '1', type: 'work', title: 'Old Job', org: 'Org A', duration: 'Jan 2021 – May 2021', startDate: '2021-01', endDate: '2021-05' },
    { id: '2', type: 'research', title: 'Recent Research', org: 'Lab B', duration: 'Oct 2024 – Present', startDate: '2024-10', endDate: null },
    { id: '3', type: 'education', title: 'Undergrad', org: 'UF', duration: 'Aug 2020 – May 2024', startDate: '2020-08', endDate: '2024-05' },
    { id: '4', type: 'work', title: 'Mid Intern', org: 'Org C', duration: 'May 2023 – Aug 2023', startDate: '2023-05', endDate: '2023-08' },
  ];

  it('sorts entries by startDate descending', () => {
    const sorted = [...entries].sort((a, b) => {
      const da = a.startDate || '0000-00';
      const db = b.startDate || '0000-00';
      return db.localeCompare(da);
    });
    expect(sorted[0].id).toBe('2'); // 2024-10 most recent
    expect(sorted[1].id).toBe('4'); // 2023-05
    expect(sorted[2].id).toBe('1'); // 2021-01
    expect(sorted[3].id).toBe('3'); // 2020-08
  });
});

// ─── Resume parse schema validation ──────────────────────────────────────────

describe('Resume parse result schema', () => {
  // Simulate what Claude returns with the new parse prompt
  const mockParsed = {
    name: 'Sean P. Florez',
    email: 'sean.florez@colorado.edu',
    gpa: '3.9',
    school: 'University of Colorado Boulder',
    major: 'Materials Science & Engineering',
    year: 'PhD',
    gradYear: '2028',
    skills: ['Python', 'LAMMPS', 'NAMD', 'VASP', 'NumPy', 'pandas', 'MDAnalysis', 'Slurm'],
    experience: [
      {
        id: 'a1b2c3d4',
        type: 'work',
        title: 'S&T Scouting Intern',
        org: 'The Joint Staff (J7 / Future Technology Office)',
        duration: 'Aug 2025 – Oct 2025',
        startDate: '2025-08',
        endDate: '2025-10',
        description: 'Prioritized propulsion/energy concepts; delivered 8 decision-ready briefs informing J7 project proposals.',
        skills: ['Technical Writing', 'DoD R&D'],
      },
      {
        id: 'b2c3d4e5',
        type: 'work',
        title: 'High Performance Computing Intern',
        org: 'Air Force Research Laboratory, Wright-Patterson AFB',
        duration: 'May 2025 – Aug 2025',
        startDate: '2025-05',
        endDate: '2025-08',
        description: 'Built MD workflow in LAMMPS for MXenes; 1000+ trajectories on DoD HPC.',
        skills: ['LAMMPS', 'Python', 'HPC', 'Slurm'],
      },
      {
        id: 'c3d4e5f6',
        type: 'research',
        title: 'Computational Chemistry Researcher',
        org: 'Heinz Interfaces Lab (CU Boulder)',
        duration: 'Oct 2024 – Present',
        startDate: '2024-10',
        endDate: null,
        description: 'pH-resolved MD of hydrated alumina; atomistic MD of Pt-nanoparticle catalysis.',
        skills: ['NAMD', 'LAMMPS', 'Python', 'MDAnalysis'],
      },
      {
        id: 'd4e5f6g7',
        type: 'education',
        title: 'Ph.D., Materials Science & Engineering',
        org: 'University of Colorado Boulder',
        duration: 'Aug 2024 – Present',
        startDate: '2024-08',
        endDate: null,
        description: null,
        skills: [],
      },
    ],
  };

  it('has required top-level fields', () => {
    expect(mockParsed.name).toBeTruthy();
    expect(mockParsed.skills).toBeInstanceOf(Array);
    expect(mockParsed.experience).toBeInstanceOf(Array);
  });

  it('each experience entry has required fields', () => {
    mockParsed.experience.forEach(entry => {
      expect(entry.id).toBeTruthy();
      expect(['work', 'research', 'education', 'leadership', 'volunteer', 'other']).toContain(entry.type);
      expect(entry.title).toBeTruthy();
      expect(entry.org).toBeTruthy();
      expect(entry.duration).toBeTruthy();
      expect(entry.startDate).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  it('ongoing entries have null endDate', () => {
    const ongoing = mockParsed.experience.filter(e => e.endDate === null);
    expect(ongoing.length).toBeGreaterThan(0);
    ongoing.forEach(e => expect(e.endDate).toBeNull());
  });

  it('completed entries have string endDate', () => {
    const completed = mockParsed.experience.filter(e => e.endDate !== null);
    completed.forEach(e => {
      if (e.endDate) expect(e.endDate).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  it('experience is sorted most recent first', () => {
    const dates = mockParsed.experience.map(e => e.startDate);
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]! >= dates[i + 1]!).toBe(true);
    }
  });
});

// ─── Merge logic (backend simulation) ────────────────────────────────────────

describe('Experience merge logic', () => {
  const mergeExperience = (
    existing: ExperienceEntry[],
    parsed: ExperienceEntry[]
  ): ExperienceEntry[] => {
    const existingKeys = new Set(existing.map(e => `${e.title}||${e.org}`));
    const newEntries = parsed.filter(e => !existingKeys.has(`${e.title}||${e.org}`));
    return [...existing, ...newEntries].sort((a, b) => {
      const da = a.startDate || '0000-00';
      const db = b.startDate || '0000-00';
      return db.localeCompare(da);
    });
  };

  it('adds new entries from parsed resume', () => {
    const existing: ExperienceEntry[] = [];
    const parsed: ExperienceEntry[] = [
      { id: 'a1b2c3d4', type: 'work', title: 'Intern', org: 'AFRL', duration: 'May 2025 – Aug 2025', startDate: '2025-05', endDate: '2025-08' },
    ];
    const result = mergeExperience(existing, parsed);
    expect(result).toHaveLength(1);
    expect(result[0].org).toBe('AFRL');
  });

  it('does not duplicate existing entries', () => {
    const existing: ExperienceEntry[] = [
      { id: 'a1b2c3d4', type: 'work', title: 'Intern', org: 'AFRL', duration: 'May 2025 – Aug 2025', startDate: '2025-05', endDate: '2025-08' },
    ];
    const parsed: ExperienceEntry[] = [
      { id: 'newid123', type: 'work', title: 'Intern', org: 'AFRL', duration: 'May 2025 – Aug 2025', startDate: '2025-05', endDate: '2025-08' },
    ];
    const result = mergeExperience(existing, parsed);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a1b2c3d4'); // keeps original id
  });

  it('preserves manually added entries alongside parsed ones', () => {
    const existing: ExperienceEntry[] = [
      { id: 'manual01', type: 'volunteer', title: 'Tutor', org: 'Community Center', duration: 'Jan 2022 – May 2022', startDate: '2022-01', endDate: '2022-05' },
    ];
    const parsed: ExperienceEntry[] = [
      { id: 'a1b2c3d4', type: 'work', title: 'HPC Intern', org: 'AFRL', duration: 'May 2025 – Aug 2025', startDate: '2025-05', endDate: '2025-08' },
    ];
    const result = mergeExperience(existing, parsed);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('a1b2c3d4'); // most recent first
    expect(result[1].id).toBe('manual01');
  });

  it('sorts merged result descending by startDate', () => {
    const existing: ExperienceEntry[] = [
      { id: '1', type: 'education', title: 'BS', org: 'UF', duration: '2020-2024', startDate: '2020-08', endDate: '2024-05' },
    ];
    const parsed: ExperienceEntry[] = [
      { id: '2', type: 'work', title: 'Intern', org: 'Lab', duration: '2025', startDate: '2025-05', endDate: '2025-08' },
      { id: '3', type: 'research', title: 'RA', org: 'Hennig', duration: '2021-2024', startDate: '2021-10', endDate: '2024-05' },
    ];
    const result = mergeExperience(existing, parsed);
    const dates = result.map(e => e.startDate!);
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i] >= dates[i + 1]).toBe(true);
    }
  });
});
