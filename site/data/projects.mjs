// Public project copy and media, transcribed from the approved Figma v1 frames.
export const projects = [
  {
    id: 'shinsungin',
    title: '신성인',
    category: 'PERSONAL PROJECT',
    number: '01',
    summary: '급식·공지·계정 정보를 한곳에 모은 학생 생활정보 앱.',
    description: '급식·공지·계정 정보를 모은 학생 생활 앱.',
    meta: '학교생활 앱 · Full Stack · 2023—2025',
    role: 'Full Stack · 2023.06 — 2025.03',
    images: [
      { src: '/assets/projects/shinsungin-meals.png', alt: '신성인 앱의 급식 목록과 별점 화면', width: 1206, height: 2622 },
      { src: '/assets/projects/shinsungin-reviews.png', alt: '신성인 앱의 급식 상세와 한줄평 화면', width: 1206, height: 2622 },
    ],
    details: [
      { label: '역할 · 기간', paragraphs: ['Full Stack · 2023.06 — 2025.03'] },
      { label: '직접 만든 부분', paragraphs: ['급식 조회·별점·한줄평', '학교 계정 인증', '앱 화면과 사용자 데이터 연결'] },
      { label: '설계 결정', paragraphs: ['Provider로 화면 상태와 데이터를 분리하고, Firebase 인증과 사용자 정보를 연결했습니다.'] },
    ],
  },
  {
    id: 'momu',
    title: 'MOMU / 모무',
    category: 'HACKATHON PROJECT',
    number: '02',
    summary: '일상에 작은 미션을 더하는 앱.',
    description: '일상에 작은 미션을 더하는 앱.',
    meta: '일상 미션 앱 · UNITHON · 2026',
    role: 'UNITHON · 2026.08',
    images: [
      { src: '/assets/projects/momu-mission.png', alt: '모무 앱의 오늘의 미션 화면', width: 390, height: 844 },
      { src: '/assets/projects/momu-feed.png', alt: '모무 앱의 미션 기록 피드 화면', width: 390, height: 844 },
    ],
    details: [
      { label: '참여', paragraphs: ['UNITHON · 2026.08'] },
      { label: '주요 화면', paragraphs: ['오늘의 미션', '미션 기록과 피드'] },
    ],
  },
];
