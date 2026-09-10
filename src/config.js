// Apps Script 배포 후 발급받은 웹 앱 URL로 교체하세요.
// 예: https://script.google.com/macros/s/AKfycb.../exec
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxs3ql1zk30wwCgIxCsfBEC-gkf5C1CKotEoERXnAFnNcE0anHkcDpjz-8mn8urTwzv4A/exec';

// DATA 탭에 저장할 필드 정의 (라벨 + 입력 방식)
// Code.gs의 DATA_FIELDS 배열과 key가 반드시 일치해야 합니다.
export const FORM_SECTIONS = [
  {
    id: 'section1',
    title: '1학기 되돌아보기',
    description: '1학기에 읽은 책과 발표를 정리하며 시작해볼까요.',
    fields: [
      { key: 'bookTitle', label: '읽은 책 제목', type: 'text', required: true },
      { key: 'bookAuthor', label: '저자', type: 'text', required: false },
      { key: 'bookReason', label: '이 책을 선택한 이유', type: 'textarea', required: true },
      { key: 'presentationSummary', label: '발표에서 다룬 핵심 내용 요약', type: 'textarea', required: true },
      { key: 'presentationReflection', label: '발표 후 느낀 점', type: 'textarea', required: true },
      { key: 'peerFeedback', label: '기억나는 친구 피드백 (선택)', type: 'textarea', required: false },
    ],
  },
  {
    id: 'section2',
    title: '진로 탐색 심화',
    description: '지금 생각하는 진로에 대해 조금 더 깊이 적어보세요.',
    fields: [
      { key: 'careerGoal', label: '현재 희망 진로', type: 'text', required: true },
      {
        key: 'careerChanged',
        label: '1학기 대비 변화가 있나요?',
        type: 'radio',
        options: ['동일', '변경됨'],
        required: true,
      },
      { key: 'careerChangeReason', label: '변경된 경우, 그 이유 (선택)', type: 'textarea', required: false },
      { key: 'careerReason', label: '이 진로를 선택한 이유 또는 계기', type: 'textarea', required: true },
      { key: 'majorCandidates', label: '관심 학과/전공 후보', type: 'text', required: false },
      { key: 'wantToKnow', label: '진로에 대해 더 알고 싶은 점', type: 'textarea', required: false },
    ],
  },
  {
    id: 'section3',
    title: '역량·활동 연계',
    description: '독서와 활동을 통해 쌓은 역량을 정리해보세요.',
    fields: [
      { key: 'newLearnings', label: '1학기 독서를 통해 새로 알게 된 점', type: 'textarea', required: true },
      { key: 'activities', label: '관련 교내외 활동 (동아리·대회·봉사 등)', type: 'text', required: false },
      { key: 'neededSkills', label: '진로 실현에 필요하다고 생각하는 역량', type: 'text', required: false },
    ],
  },
  {
    id: 'section4',
    title: '2학기 계획',
    description: '2학기 활동을 위한 계획을 세워볼까요.',
    fields: [
      { key: 'nextBooks', label: '2학기에 읽고 싶은 책 (1~3개)', type: 'textarea', required: true, librarySearchable: true },
      {
        key: 'presentationPreference',
        label: '발표 방식 선호',
        type: 'radio',
        options: ['개인', '모둠'],
        required: true,
      },
      { key: 'growthGoal', label: '2학기 동안 이루고 싶은 성장 목표', type: 'textarea', required: true },
    ],
  },
];