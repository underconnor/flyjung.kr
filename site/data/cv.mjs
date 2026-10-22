// Approved public CV content from Figma v1 UI / CV.
// This is shared data for the CV and the Home experience list.
export const cvIdentity = 'flyjung · 숭실대학교 1학년';

export const experiences = [
  {
    organization: '숭실대학교 IT지원위원회',
    role: 'PM',
    period: '2026.08 — 현재',
  },
  {
    organization: 'AI대학 학생회',
    role: '학생회 활동',
    period: '2026.03 — 현재',
  },
  {
    organization: '프로그래밍 동아리 PRON',
    role: '2024 기장',
    period: '2023 — 2024',
  },
];

export const cvExperiences = experiences.map(({ organization, role, period }) => ({
  title: organization,
  role,
  period,
}));

export const cvProjects = [
  {
    organization: '신성인',
    role: 'Full Stack',
    period: '2023.06 — 2025.03',
    href: '/projects/#shinsungin',
  },
  {
    organization: 'MOMU / 모무',
    role: 'UNITHON',
    period: '2026.08',
    href: '/projects/#momu',
  },
];

export const education = [
  { organization: '숭실대학교', period: '2026 — 현재' },
];

export const awards = [
  { title: 'SSU Bug Bounty', distinction: '장려상' },
];
