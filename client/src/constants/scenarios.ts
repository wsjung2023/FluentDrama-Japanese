// Central scenario catalog and metadata for the Japanese conversation experience.
export type ScenarioId =
  | 'cafeteria'
  | 'club'
  | 'homework'
  | 'school_trip'
  | 'new_friend'
  | 'confidence_talk'
  | 'travel'
  | 'cafe_order'
  | 'job_interview'
  | 'roommate_chat'
  | 'hobby_club'
  | 'presentation_basics'
  | 'email_etiquette'
  | 'meeting_opener'
  | 'negotiation_basics'
  | 'small_talk'
  | 'deadline_followup'
  | 'presentation_qa';

export type ScenarioAudience = 'student' | 'general' | 'business' | 'all';

export interface ScenarioConfig {
  id: ScenarioId;
  title: string;
  description: string;
  icon: string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  tone: '캐주얼' | '공손체' | '존댓말' | '비즈니스';
  estimatedMinutes: number;
  audience: ScenarioAudience;
  background: string;
  situation: string;
  userRole: string;
  characterRole: string;
  objective: string;
  expressions: string[];
}

export const SCENARIO_CONFIGS: Record<ScenarioId, ScenarioConfig> = {
  cafeteria: { id: 'cafeteria', title: '급식실 대화', description: '급식 주문과 친구와의 짧은 대화', icon: '🍱', level: 'N5', tone: '캐주얼', estimatedMinutes: 8, audience: 'student', background: 'linear-gradient(135deg, #3D3D3D 0%, #515151 100%)', situation: '학교 급식실에서 점심을 주문하는 상황', userRole: '학생', characterRole: '급식 담당자', objective: '정중하게 음식 주문과 추가 요청하기', expressions: ['これをください。', 'おすすめはありますか？'] },
  club: { id: 'club', title: '동아리 첫 만남', description: '동아리에 가입하며 자기소개하기', icon: '🎸', level: 'N4', tone: '캐주얼', estimatedMinutes: 10, audience: 'student', background: 'linear-gradient(135deg, #3B2A52 0%, #221F3B 100%)', situation: '동아리 신입 회원으로 첫 인사하는 상황', userRole: '신입 부원', characterRole: '선배 부원', objective: '자기소개와 관심사를 자연스럽게 전달하기', expressions: ['はじめまして。', 'よろしくお願いします。'] },
  homework: { id: 'homework', title: '숙제 도움 요청', description: '숙제 질문을 정중하게 물어보기', icon: '📚', level: 'N4', tone: '존댓말', estimatedMinutes: 9, audience: 'student', background: 'linear-gradient(135deg, #354F52 0%, #52796F 100%)', situation: '선생님에게 숙제 질문을 하는 상황', userRole: '학생', characterRole: '선생님', objective: '모르는 부분을 일본어로 명확히 질문하기', expressions: ['この問題が難しいです。', 'もう一度説明していただけますか。'] },
  school_trip: { id: 'school_trip', title: '수학여행 계획', description: '일정을 상의하고 역할 분담하기', icon: '🗺️', level: 'N3', tone: '캐주얼', estimatedMinutes: 12, audience: 'student', background: 'linear-gradient(135deg, #1D3557 0%, #457B9D 100%)', situation: '수학여행 일정 계획 회의', userRole: '조장', characterRole: '친구', objective: '일정 제안과 의견 조율하기', expressions: ['どこに行きたいですか？', 'この案はどうですか？'] },
  new_friend: { id: 'new_friend', title: '새 친구 사귀기', description: '새 학기 친구에게 먼저 말 걸기', icon: '🤝', level: 'N5', tone: '캐주얼', estimatedMinutes: 7, audience: 'student', background: 'linear-gradient(135deg, #2D6A4F 0%, #40916C 100%)', situation: '새 반에서 처음 만난 친구와 대화', userRole: '학생', characterRole: '반 친구', objective: '관심사 질문으로 자연스럽게 친해지기', expressions: ['何が好きですか？', '一緒に行きませんか？'] },
  confidence_talk: { id: 'confidence_talk', title: '자신감 있게 발표', description: '짧은 의견 발표와 질문 응답', icon: '🎤', level: 'N3', tone: '존댓말', estimatedMinutes: 11, audience: 'student', background: 'linear-gradient(135deg, #264653 0%, #2A9D8F 100%)', situation: '수업 시간 짧은 발표를 하는 상황', userRole: '발표 학생', characterRole: '교사', objective: '의견을 또렷하게 전달하고 질문에 답하기', expressions: ['私の意見は〜です。', '質問ありがとうございます。'] },
  travel: { id: 'travel', title: '여행 체크인', description: '공항/호텔 체크인 핵심 표현', icon: '🛫', level: 'N4', tone: '공손체', estimatedMinutes: 12, audience: 'general', background: 'linear-gradient(135deg, #1D3557 0%, #457B9D 100%)', situation: '공항 체크인 또는 호텔 체크인 상황', userRole: '여행자', characterRole: '항공사/호텔 직원', objective: '체크인하고 필요한 사항을 요청하기', expressions: ['予約しています。', 'チェックインをお願いします。'] },
  cafe_order: { id: 'cafe_order', title: '카페 주문', description: '음료 주문과 간단한 스몰토크', icon: '☕', level: 'N5', tone: '캐주얼', estimatedMinutes: 8, audience: 'general', background: 'linear-gradient(135deg, #6F4E37 0%, #A67B5B 100%)', situation: '카페에서 음료 주문하기', userRole: '손님', characterRole: '바리스타', objective: '원하는 음료를 자연스럽게 주문하기', expressions: ['アイスラテをください。', '店内で飲みます。'] },
  job_interview: { id: 'job_interview', title: '면접 기초', description: '기본 자기소개와 지원동기', icon: '🧳', level: 'N3', tone: '존댓말', estimatedMinutes: 14, audience: 'general', background: 'linear-gradient(135deg, #3A506B 0%, #5BC0BE 100%)', situation: '초급 일본어 면접 상황', userRole: '지원자', characterRole: '면접관', objective: '자기소개와 강점을 간결히 전달하기', expressions: ['志望動機をお話しします。', 'よろしくお願いいたします。'] },
  roommate_chat: { id: 'roommate_chat', title: '룸메이트 대화', description: '생활 규칙 조율과 부탁 표현', icon: '🏠', level: 'N4', tone: '캐주얼', estimatedMinutes: 9, audience: 'general', background: 'linear-gradient(135deg, #3A3D40 0%, #586F7C 100%)', situation: '룸메이트와 생활 규칙을 맞추는 상황', userRole: '룸메이트', characterRole: '룸메이트', objective: '예의 있게 요청하고 합의하기', expressions: ['少し静かにしてくれる？', '掃除の当番を決めよう。'] },
  hobby_club: { id: 'hobby_club', title: '취미 모임', description: '취미 소개와 모임 참여 대화', icon: '🎨', level: 'N4', tone: '캐주얼', estimatedMinutes: 10, audience: 'general', background: 'linear-gradient(135deg, #334E68 0%, #627D98 100%)', situation: '취미 모임에서 처음 인사하는 상황', userRole: '신규 참가자', characterRole: '모임 리더', objective: '취미와 참여 목적을 설명하기', expressions: ['写真が趣味です。', '次回も参加したいです。'] },
  presentation_basics: { id: 'presentation_basics', title: '발표 기본', description: '짧은 발표 시작/마무리 문장 연습', icon: '📊', level: 'N3', tone: '공손체', estimatedMinutes: 13, audience: 'general', background: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)', situation: '간단한 발표를 진행하는 상황', userRole: '발표자', characterRole: '청중', objective: '발표 흐름에 맞춰 설명하고 질문 받기', expressions: ['本日は〜について発表します。', 'ご清聴ありがとうございました。'] },
  email_etiquette: { id: 'email_etiquette', title: '이메일 예절', description: '비즈니스 이메일 기본 문구', icon: '📧', level: 'N2', tone: '비즈니스', estimatedMinutes: 12, audience: 'business', background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)', situation: '업무 이메일 초안을 검토하는 상황', userRole: '사원', characterRole: '팀 리더', objective: '격식 있는 문구로 이메일 작성하기', expressions: ['お世話になっております。', 'ご確認のほどよろしくお願いいたします。'] },
  meeting_opener: { id: 'meeting_opener', title: '미팅 오프닝', description: '회의 시작 인사와 안건 소개', icon: '🧑‍💼', level: 'N2', tone: '비즈니스', estimatedMinutes: 14, audience: 'business', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', situation: '비즈니스 미팅 시작과 자기소개', userRole: '프로젝트 담당자', characterRole: '시니어 임원', objective: '회의 오프닝을 정중하게 진행하기', expressions: ['本日の議題を共有します。', 'よろしくお願いいたします。'] },
  negotiation_basics: { id: 'negotiation_basics', title: '협상 기초', description: '조건 제안과 조율 표현', icon: '📈', level: 'N2', tone: '비즈니스', estimatedMinutes: 15, audience: 'business', background: 'linear-gradient(135deg, #172554 0%, #1E3A8A 100%)', situation: '납기와 가격 조건을 조율하는 상황', userRole: '영업 담당자', characterRole: '거래처 담당자', objective: '상호 이익이 되는 조건을 제시하기', expressions: ['こちらの条件はいかがでしょうか。', '再度ご検討いただけますか。'] },
  small_talk: { id: 'small_talk', title: '비즈니스 스몰토크', description: '미팅 전 자연스러운 아이스브레이킹', icon: '💬', level: 'N3', tone: '공손체', estimatedMinutes: 10, audience: 'business', background: 'linear-gradient(135deg, #3F3CBB 0%, #1D2671 100%)', situation: '미팅 전 가벼운 대화를 나누는 상황', userRole: '참석자', characterRole: '거래처 담당자', objective: '공손하면서도 자연스럽게 친밀감 형성하기', expressions: ['最近いかがですか。', '本日はよろしくお願いします。'] },
  deadline_followup: { id: 'deadline_followup', title: '마감 팔로업', description: '진행 상황 확인과 일정 조정', icon: '⏱️', level: 'N2', tone: '비즈니스', estimatedMinutes: 13, audience: 'business', background: 'linear-gradient(135deg, #312E81 0%, #4338CA 100%)', situation: '프로젝트 마감 일정 점검 상황', userRole: 'PM', characterRole: '개발 담당자', objective: '일정 리스크를 확인하고 조정안 제시하기', expressions: ['進捗はいかがでしょうか。', '締切の調整が可能でしょうか。'] },
  presentation_qa: { id: 'presentation_qa', title: '발표 Q&A', description: '질의응답 대응과 보완 설명', icon: '❓', level: 'N2', tone: '비즈니스', estimatedMinutes: 16, audience: 'business', background: 'linear-gradient(135deg, #111827 0%, #374151 100%)', situation: '발표 후 질의응답 상황', userRole: '발표자', characterRole: '청중/임원', objective: '핵심 질문에 정확히 답하고 후속 조치 제시하기', expressions: ['ご質問ありがとうございます。', '補足してご説明します。'] },
};

export const DAILY_SCENES: ScenarioId[] = ['travel', 'cafe_order', 'meeting_opener', 'cafeteria', 'small_talk', 'club', 'negotiation_basics'];
