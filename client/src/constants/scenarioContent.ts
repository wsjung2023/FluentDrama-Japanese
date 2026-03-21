import type { LanguageCode } from '@shared/language';
import { SCENARIO_CORE, type ScenarioDifficultyLevel, type ScenarioId, type ScenarioTone } from './scenarioCore';

export interface ScenarioLocaleContent {
  title: string;
  description: string;
  level: ScenarioDifficultyLevel;
  tone: ScenarioTone;
  situation: string;
  userRole: string;
  characterRole: string;
  objective: string;
  expressions: string[];
}

type ScenarioTranslationSeed = Omit<ScenarioLocaleContent, 'level' | 'tone'>;

type ScenarioTranslationDictionary = Record<ScenarioId, ScenarioTranslationSeed>;

const SCENARIO_METADATA_BY_LANGUAGE: Partial<Record<LanguageCode, Record<ScenarioId, Pick<ScenarioLocaleContent, 'level' | 'tone'>>>> = {
  ko: {
    cafeteria: { level: 'TOPIK1', tone: '캐주얼' },
    club: { level: 'TOPIK2', tone: '캐주얼' },
    homework: { level: 'TOPIK2', tone: '존댓말' },
    school_trip: { level: 'TOPIK3', tone: '캐주얼' },
    new_friend: { level: 'TOPIK1', tone: '캐주얼' },
    confidence_talk: { level: 'TOPIK3', tone: '존댓말' },
    travel: { level: 'TOPIK2', tone: '공손체' },
    cafe_order: { level: 'TOPIK1', tone: '캐주얼' },
    job_interview: { level: 'TOPIK3', tone: '존댓말' },
    roommate_chat: { level: 'TOPIK2', tone: '캐주얼' },
    hobby_club: { level: 'TOPIK2', tone: '캐주얼' },
    presentation_basics: { level: 'TOPIK3', tone: '공손체' },
    email_etiquette: { level: 'TOPIK4', tone: '비즈니스' },
    meeting_opener: { level: 'TOPIK4', tone: '비즈니스' },
    negotiation_basics: { level: 'TOPIK4', tone: '비즈니스' },
    small_talk: { level: 'TOPIK3', tone: '공손체' },
    deadline_followup: { level: 'TOPIK4', tone: '비즈니스' },
    presentation_qa: { level: 'TOPIK4', tone: '비즈니스' },
  },
  fr: {
    cafeteria: { level: 'A1', tone: 'Casual' },
    club: { level: 'A2', tone: 'Casual' },
    homework: { level: 'A2', tone: 'Polite' },
    school_trip: { level: 'B1', tone: 'Casual' },
    new_friend: { level: 'A1', tone: 'Casual' },
    confidence_talk: { level: 'B1', tone: 'Polite' },
    travel: { level: 'A2', tone: 'Polite' },
    cafe_order: { level: 'A1', tone: 'Casual' },
    job_interview: { level: 'B1', tone: 'Polite' },
    roommate_chat: { level: 'A2', tone: 'Casual' },
    hobby_club: { level: 'A2', tone: 'Casual' },
    presentation_basics: { level: 'B1', tone: 'Polite' },
    email_etiquette: { level: 'B2', tone: 'Business' },
    meeting_opener: { level: 'B2', tone: 'Business' },
    negotiation_basics: { level: 'B2', tone: 'Business' },
    small_talk: { level: 'B1', tone: 'Polite' },
    deadline_followup: { level: 'B2', tone: 'Business' },
    presentation_qa: { level: 'B2', tone: 'Business' },
  },
  es: {
    cafeteria: { level: 'A1', tone: 'Casual' },
    club: { level: 'A2', tone: 'Casual' },
    homework: { level: 'A2', tone: 'Polite' },
    school_trip: { level: 'B1', tone: 'Casual' },
    new_friend: { level: 'A1', tone: 'Casual' },
    confidence_talk: { level: 'B1', tone: 'Polite' },
    travel: { level: 'A2', tone: 'Polite' },
    cafe_order: { level: 'A1', tone: 'Casual' },
    job_interview: { level: 'B1', tone: 'Polite' },
    roommate_chat: { level: 'A2', tone: 'Casual' },
    hobby_club: { level: 'A2', tone: 'Casual' },
    presentation_basics: { level: 'B1', tone: 'Polite' },
    email_etiquette: { level: 'B2', tone: 'Business' },
    meeting_opener: { level: 'B2', tone: 'Business' },
    negotiation_basics: { level: 'B2', tone: 'Business' },
    small_talk: { level: 'B1', tone: 'Polite' },
    deadline_followup: { level: 'B2', tone: 'Business' },
    presentation_qa: { level: 'B2', tone: 'Business' },
  },
  en: {
    cafeteria: { level: 'A1', tone: 'Casual' },
    club: { level: 'A2', tone: 'Casual' },
    homework: { level: 'A2', tone: 'Polite' },
    school_trip: { level: 'B1', tone: 'Casual' },
    new_friend: { level: 'A1', tone: 'Casual' },
    confidence_talk: { level: 'B1', tone: 'Polite' },
    travel: { level: 'A2', tone: 'Polite' },
    cafe_order: { level: 'A1', tone: 'Casual' },
    job_interview: { level: 'B1', tone: 'Polite' },
    roommate_chat: { level: 'A2', tone: 'Casual' },
    hobby_club: { level: 'A2', tone: 'Casual' },
    presentation_basics: { level: 'B1', tone: 'Polite' },
    email_etiquette: { level: 'B2', tone: 'Business' },
    meeting_opener: { level: 'B2', tone: 'Business' },
    negotiation_basics: { level: 'B2', tone: 'Business' },
    small_talk: { level: 'B1', tone: 'Polite' },
    deadline_followup: { level: 'B2', tone: 'Business' },
    presentation_qa: { level: 'B2', tone: 'Business' },
  },
  ja: {
    cafeteria: { level: 'N5', tone: 'カジュアル' },
    club: { level: 'N4', tone: 'カジュアル' },
    homework: { level: 'N4', tone: '丁寧' },
    school_trip: { level: 'N3', tone: 'カジュアル' },
    new_friend: { level: 'N5', tone: 'カジュアル' },
    confidence_talk: { level: 'N3', tone: '丁寧' },
    travel: { level: 'N4', tone: '丁寧' },
    cafe_order: { level: 'N5', tone: 'カジュアル' },
    job_interview: { level: 'N3', tone: '丁寧' },
    roommate_chat: { level: 'N4', tone: 'カジュアル' },
    hobby_club: { level: 'N4', tone: 'カジュアル' },
    presentation_basics: { level: 'N3', tone: '丁寧' },
    email_etiquette: { level: 'N2', tone: 'ビジネス' },
    meeting_opener: { level: 'N2', tone: 'ビジネス' },
    negotiation_basics: { level: 'N2', tone: 'ビジネス' },
    small_talk: { level: 'N3', tone: '丁寧' },
    deadline_followup: { level: 'N2', tone: 'ビジネス' },
    presentation_qa: { level: 'N2', tone: 'ビジネス' },
  },
};

const KOREAN_SCENARIO_CONTENT: ScenarioTranslationDictionary = {
  cafeteria: { title: '급식실 대화', description: '급식 주문과 친구와의 짧은 대화', situation: '학교 급식실에서 점심을 주문하는 상황', userRole: '학생', characterRole: '급식 담당자', objective: '정중하게 음식 주문과 추가 요청하기', expressions: ['이거 주세요.', '추천 메뉴가 뭐예요?'] },
  club: { title: '동아리 첫 만남', description: '동아리에 가입하며 자기소개하기', situation: '동아리 신입 회원으로 첫 인사하는 상황', userRole: '신입 부원', characterRole: '선배 부원', objective: '자기소개와 관심사를 자연스럽게 전달하기', expressions: ['안녕하세요, 반가워요.', '잘 부탁드립니다.'] },
  homework: { title: '숙제 도움 요청', description: '숙제 질문을 정중하게 물어보기', situation: '선생님에게 숙제 질문을 하는 상황', userRole: '학생', characterRole: '선생님', objective: '모르는 부분을 한국어로 명확히 질문하기', expressions: ['이 문제가 어려워요.', '한 번 더 설명해 주실 수 있나요?'] },
  school_trip: { title: '수학여행 계획', description: '일정을 상의하고 역할 분담하기', situation: '수학여행 일정 계획 회의', userRole: '조장', characterRole: '친구', objective: '일정 제안과 의견 조율하기', expressions: ['어디에 가고 싶어요?', '이 계획은 어때요?'] },
  new_friend: { title: '새 친구 사귀기', description: '새 학기 친구에게 먼저 말 걸기', situation: '새 반에서 처음 만난 친구와 대화', userRole: '학생', characterRole: '반 친구', objective: '관심사 질문으로 자연스럽게 친해지기', expressions: ['무엇을 좋아해요?', '같이 갈래요?'] },
  confidence_talk: { title: '자신감 있게 발표', description: '짧은 의견 발표와 질문 응답', situation: '수업 시간 짧은 발표를 하는 상황', userRole: '발표 학생', characterRole: '교사', objective: '의견을 또렷하게 전달하고 질문에 답하기', expressions: ['제 의견은 ~입니다.', '질문해 주셔서 감사합니다.'] },
  travel: { title: '여행 체크인', description: '공항/호텔 체크인 핵심 표현', situation: '공항 체크인 또는 호텔 체크인 상황', userRole: '여행자', characterRole: '항공사/호텔 직원', objective: '체크인하고 필요한 사항을 요청하기', expressions: ['예약했어요.', '체크인 부탁드립니다.'] },
  cafe_order: { title: '카페 주문', description: '음료 주문과 간단한 스몰토크', situation: '카페에서 음료 주문하기', userRole: '손님', characterRole: '바리스타', objective: '원하는 음료를 자연스럽게 주문하기', expressions: ['아이스 라테 주세요.', '매장에서 마실게요.'] },
  job_interview: { title: '면접 기초', description: '기본 자기소개와 지원동기', situation: '초급 한국어 면접 상황', userRole: '지원자', characterRole: '면접관', objective: '자기소개와 강점을 간결히 전달하기', expressions: ['지원 동기를 말씀드리겠습니다.', '잘 부탁드립니다.'] },
  roommate_chat: { title: '룸메이트 대화', description: '생활 규칙 조율과 부탁 표현', situation: '룸메이트와 생활 규칙을 맞추는 상황', userRole: '룸메이트', characterRole: '룸메이트', objective: '예의 있게 요청하고 합의하기', expressions: ['조금만 조용히 해줄래?', '청소 당번을 정하자.'] },
  hobby_club: { title: '취미 모임', description: '취미 소개와 모임 참여 대화', situation: '취미 모임에서 처음 인사하는 상황', userRole: '신규 참가자', characterRole: '모임 리더', objective: '취미와 참여 목적을 설명하기', expressions: ['사진 찍는 게 취미예요.', '다음에도 참여하고 싶어요.'] },
  presentation_basics: { title: '발표 기본', description: '짧은 발표 시작/마무리 문장 연습', situation: '간단한 발표를 진행하는 상황', userRole: '발표자', characterRole: '청중', objective: '발표 흐름에 맞춰 설명하고 질문 받기', expressions: ['오늘은 ~에 대해 발표하겠습니다.', '경청해 주셔서 감사합니다.'] },
  email_etiquette: { title: '이메일 예절', description: '비즈니스 이메일 기본 문구', situation: '업무 이메일 초안을 검토하는 상황', userRole: '사원', characterRole: '팀 리더', objective: '격식 있는 문구로 이메일 작성하기', expressions: ['안녕하세요, 항상 감사드립니다.', '검토 부탁드립니다.'] },
  meeting_opener: { title: '미팅 오프닝', description: '회의 시작 인사와 안건 소개', situation: '비즈니스 미팅 시작과 자기소개', userRole: '프로젝트 담당자', characterRole: '시니어 임원', objective: '회의 오프닝을 정중하게 진행하기', expressions: ['오늘의 안건을 공유드리겠습니다.', '잘 부탁드립니다.'] },
  negotiation_basics: { title: '협상 기초', description: '조건 제안과 조율 표현', situation: '납기와 가격 조건을 조율하는 상황', userRole: '영업 담당자', characterRole: '거래처 담당자', objective: '상호 이익이 되는 조건을 제시하기', expressions: ['이 조건은 어떠신가요?', '다시 한번 검토해 주실 수 있을까요?'] },
  small_talk: { title: '비즈니스 스몰토크', description: '미팅 전 자연스러운 아이스브레이킹', situation: '미팅 전 가벼운 대화를 나누는 상황', userRole: '참석자', characterRole: '거래처 담당자', objective: '공손하면서도 자연스럽게 친밀감 형성하기', expressions: ['요즘 어떻게 지내세요?', '오늘 잘 부탁드립니다.'] },
  deadline_followup: { title: '마감 팔로업', description: '진행 상황 확인과 일정 조정', situation: '프로젝트 마감 일정 점검 상황', userRole: 'PM', characterRole: '개발 담당자', objective: '일정 리스크를 확인하고 조정안 제시하기', expressions: ['진행 상황이 어떠신가요?', '마감 일정을 조정할 수 있을까요?'] },
  presentation_qa: { title: '발표 Q&A', description: '질의응답 대응과 보완 설명', situation: '발표 후 질의응답 상황', userRole: '발표자', characterRole: '청중/임원', objective: '핵심 질문에 정확히 답하고 후속 조치 제시하기', expressions: ['질문해 주셔서 감사합니다.', '보충해서 설명드리겠습니다.'] },
};

const FRENCH_SCENARIO_CONTENT: ScenarioTranslationDictionary = {
  cafeteria: { title: "Conversation à la cafétéria", description: "Commander le déjeuner et discuter brièvement", situation: "Vous commandez votre déjeuner à la cafétéria de l'école", userRole: "Étudiant", characterRole: "Personnel de la cafétéria", objective: "Commander poliment et demander un supplément", expressions: ["Je voudrais ceci, s'il vous plaît.", "Qu'est-ce que vous recommandez ?"] },
  club: { title: "Première rencontre du club", description: "Vous présenter en rejoignant un club", situation: "Vous saluez les autres membres lors de votre première réunion", userRole: "Nouveau membre", characterRole: "Membre expérimenté", objective: "Vous présenter et parler naturellement de vos centres d'intérêt", expressions: ["Enchanté(e).", "J'ai hâte de bien travailler avec vous."] },
  homework: { title: "Aide pour les devoirs", description: "Poser une question sur les devoirs avec politesse", situation: "Vous posez une question au professeur sur un exercice", userRole: "Étudiant", characterRole: "Professeur", objective: "Expliquer clairement ce que vous ne comprenez pas", expressions: ["Cet exercice est difficile pour moi.", "Pourriez-vous l'expliquer encore une fois ?"] },
  school_trip: { title: "Plan du voyage scolaire", description: "Discuter du programme et répartir les rôles", situation: "Vous organisez l'itinéraire d'un voyage scolaire", userRole: "Chef de groupe", characterRole: "Camarade de classe", objective: "Proposer des idées et coordonner les avis du groupe", expressions: ["Où veux-tu aller ?", "Que penses-tu de ce plan ?"] },
  new_friend: { title: "Se faire un nouvel ami", description: "Engager la conversation avec un nouveau camarade", situation: "Vous parlez avec un camarade que vous venez de rencontrer", userRole: "Étudiant", characterRole: "Camarade", objective: "Créer un lien en demandant ses centres d'intérêt", expressions: ["Qu'est-ce que tu aimes ?", "Tu veux y aller avec moi ?"] },
  confidence_talk: { title: "Présentation avec assurance", description: "Donner un avis et répondre à une question", situation: "Vous faites une courte présentation en classe", userRole: "Étudiant qui présente", characterRole: "Professeur", objective: "Exprimer votre opinion clairement et répondre à une question", expressions: ["Mon avis est que...", "Merci pour votre question."] },
  travel: { title: "Enregistrement de voyage", description: "Expressions essentielles pour l'aéroport ou l'hôtel", situation: "Vous faites l'enregistrement à l'aéroport ou à l'hôtel", userRole: "Voyageur", characterRole: "Personnel de compagnie ou d'hôtel", objective: "Faire l'enregistrement facilement et demander ce dont vous avez besoin", expressions: ["J'ai une réservation.", "Je voudrais faire l'enregistrement."] },
  cafe_order: { title: "Commande au café", description: "Commander une boisson et échanger quelques mots", situation: "Vous commandez une boisson dans un café", userRole: "Client", characterRole: "Barista", objective: "Commander naturellement et répondre à une question simple", expressions: ["Je voudrais un latte glacé, s'il vous plaît.", "Sur place, s'il vous plaît."] },
  job_interview: { title: "Entretien de base", description: "Vous présenter et expliquer votre motivation", situation: "Vous êtes dans un entretien d'embauche débutant", userRole: "Candidat", characterRole: "Recruteur", objective: "Faire une brève présentation et mettre en avant vos points forts", expressions: ["Je voudrais expliquer ma motivation.", "Merci pour votre temps aujourd'hui."] },
  roommate_chat: { title: "Conversation avec le colocataire", description: "Parler des règles de vie commune et faire une demande", situation: "Vous discutez des règles de vie avec votre colocataire", userRole: "Colocataire", characterRole: "Colocataire", objective: "Faire des demandes polies et trouver un accord", expressions: ["Tu pourrais parler un peu moins fort ?", "Décidons d'un tour de ménage."] },
  hobby_club: { title: "Rencontre de loisir", description: "Présenter votre hobby et rejoindre la discussion", situation: "Vous rencontrez un groupe de loisir pour la première fois", userRole: "Nouveau participant", characterRole: "Chef du groupe", objective: "Expliquer votre hobby et pourquoi vous avez rejoint le groupe", expressions: ["La photographie est mon hobby.", "J'aimerais revenir la prochaine fois."] },
  presentation_basics: { title: "Bases de la présentation", description: "Pratiquer l'ouverture et la conclusion d'un court exposé", situation: "Vous faites une courte présentation", userRole: "Présentateur", characterRole: "Membre du public", objective: "Guider les auditeurs et conclure avec politesse", expressions: ["Aujourd'hui, je vais parler de...", "Merci de votre attention."] },
  email_etiquette: { title: "Étiquette des e-mails", description: "Utiliser des formules standard dans un e-mail professionnel", situation: "Vous relisez un brouillon d'e-mail professionnel", userRole: "Employé", characterRole: "Chef d'équipe", objective: "Rédiger un e-mail formel et professionnel", expressions: ["Merci pour votre soutien constant.", "Je vous remercie pour votre relecture."] },
  meeting_opener: { title: "Ouverture de réunion", description: "Ouvrir une réunion et présenter l'ordre du jour", situation: "Vous commencez une réunion d'affaires et vous vous présentez", userRole: "Responsable du projet", characterRole: "Cadre supérieur", objective: "Mener l'ouverture de la réunion avec clarté et politesse", expressions: ["Permettez-moi de partager l'ordre du jour.", "Merci d'être avec nous aujourd'hui."] },
  negotiation_basics: { title: "Bases de la négociation", description: "Proposer des conditions et les ajuster", situation: "Vous discutez des délais et des prix avec un partenaire", userRole: "Commercial", characterRole: "Représentant du client", objective: "Suggérer des conditions avantageuses pour les deux parties", expressions: ["Que pensez-vous de cette proposition ?", "Pourriez-vous le revoir une fois de plus ?"] },
  small_talk: { title: "Petit échange professionnel", description: "Briser la glace avant une réunion", situation: "Vous parlez légèrement avant le début d'une réunion", userRole: "Participant", characterRole: "Représentant du client", objective: "Créer de la proximité tout en restant professionnel", expressions: ["Comment allez-vous ces derniers temps ?", "Je suis ravi de vous voir aujourd'hui."] },
  deadline_followup: { title: "Suivi d'échéance", description: "Vérifier l'avancement et ajuster le planning", situation: "Vous vérifiez l'état du projet avant l'échéance", userRole: "Chef de projet", characterRole: "Développeur", objective: "Identifier les risques et proposer les prochaines étapes", expressions: ["Où en est l'avancement ?", "Serait-il possible d'ajuster l'échéance ?"] },
  presentation_qa: { title: "Questions-réponses de présentation", description: "Répondre aux questions et clarifier des points", situation: "Vous répondez aux questions après une présentation", userRole: "Présentateur", characterRole: "Public ou cadre", objective: "Répondre précisément aux questions clés et proposer une suite", expressions: ["Merci pour votre question.", "Permettez-moi de préciser davantage."] },
};

const SPANISH_SCENARIO_CONTENT: ScenarioTranslationDictionary = {
  cafeteria: { title: 'Conversación en la cafetería', description: 'Pedir el almuerzo y charlar brevemente', situation: 'Estás pidiendo el almuerzo en la cafetería de la escuela', userRole: 'Estudiante', characterRole: 'Personal de la cafetería', objective: 'Pedir comida con cortesía y solicitar algo extra', expressions: ['Quisiera esto, por favor.', '¿Qué me recomienda?'] },
  club: { title: 'Primer encuentro del club', description: 'Presentarte al unirte a un club', situation: 'Saludas a otros miembros en tu primera reunión del club', userRole: 'Nuevo miembro', characterRole: 'Miembro veterano', objective: 'Presentarte y hablar con naturalidad sobre tus intereses', expressions: ['Mucho gusto.', 'Espero llevarme bien con ustedes.'] },
  homework: { title: 'Ayuda con la tarea', description: 'Hacer una pregunta sobre la tarea con cortesía', situation: 'Le haces una pregunta al profesor sobre un problema de la tarea', userRole: 'Estudiante', characterRole: 'Profesor', objective: 'Explicar con claridad qué parte no entiendes', expressions: ['Este problema es difícil para mí.', '¿Podría explicarlo una vez más?'] },
  school_trip: { title: 'Plan del viaje escolar', description: 'Hablar del horario y repartir funciones', situation: 'Estás organizando el itinerario de un viaje escolar', userRole: 'Líder del grupo', characterRole: 'Compañero de clase', objective: 'Proponer ideas y coordinar opiniones', expressions: ['¿A dónde quieres ir?', '¿Qué te parece este plan?'] },
  new_friend: { title: 'Hacer un nuevo amigo', description: 'Iniciar conversación con un compañero nuevo', situation: 'Hablas con un compañero al que acabas de conocer', userRole: 'Estudiante', characterRole: 'Compañero', objective: 'Crear cercanía preguntando por sus intereses', expressions: ['¿Qué te gusta?', '¿Quieres ir conmigo?'] },
  confidence_talk: { title: 'Presentación con confianza', description: 'Dar una opinión y responder una pregunta', situation: 'Estás haciendo una presentación corta en clase', userRole: 'Estudiante que presenta', characterRole: 'Profesor', objective: 'Expresar tu opinión con claridad y responder una pregunta', expressions: ['Mi opinión es...', 'Gracias por su pregunta.'] },
  travel: { title: 'Check-in de viaje', description: 'Expresiones clave para aeropuerto u hotel', situation: 'Haces el check-in en un aeropuerto o en un hotel', userRole: 'Viajero', characterRole: 'Personal de aerolínea u hotel', objective: 'Completar el check-in sin problemas y pedir lo necesario', expressions: ['Tengo una reserva.', 'Quisiera hacer el check-in.'] },
  cafe_order: { title: 'Pedido en la cafetería', description: 'Pedir una bebida y hacer un poco de charla', situation: 'Estás pidiendo una bebida en una cafetería', userRole: 'Cliente', characterRole: 'Barista', objective: 'Pedir de forma natural y responder una pregunta sencilla', expressions: ['Quisiera un latte helado, por favor.', 'Para tomar aquí, por favor.'] },
  job_interview: { title: 'Entrevista básica', description: 'Presentarte y explicar tu motivación', situation: 'Estás en una entrevista de trabajo de nivel inicial', userRole: 'Postulante', characterRole: 'Entrevistador', objective: 'Dar una presentación breve y destacar tus fortalezas', expressions: ['Me gustaría explicar mi motivación.', 'Gracias por su tiempo hoy.'] },
  roommate_chat: { title: 'Conversación con el compañero de piso', description: 'Hablar de reglas de convivencia y pedir algo con cortesía', situation: 'Estás acordando reglas de convivencia con tu compañero de piso', userRole: 'Compañero de piso', characterRole: 'Compañero de piso', objective: 'Hacer peticiones con respeto y llegar a un acuerdo', expressions: ['¿Podrías hablar un poco más bajo?', 'Vamos a decidir un turno de limpieza.'] },
  hobby_club: { title: 'Reunión de hobby', description: 'Presentar tu hobby y unirte a la conversación', situation: 'Conoces a un grupo de hobby por primera vez', userRole: 'Nuevo participante', characterRole: 'Líder del grupo', objective: 'Explicar tu hobby y por qué te uniste', expressions: ['La fotografía es mi hobby.', 'Me gustaría participar otra vez.'] },
  presentation_basics: { title: 'Fundamentos de presentación', description: 'Practicar la apertura y el cierre de una presentación corta', situation: 'Estás dando una presentación breve', userRole: 'Presentador', characterRole: 'Miembro del público', objective: 'Guiar al público y cerrar con cortesía', expressions: ['Hoy voy a hablar sobre...', 'Gracias por escuchar.'] },
  email_etiquette: { title: 'Etiqueta de correo', description: 'Usar frases estándar en un correo de negocios', situation: 'Estás revisando un borrador de correo profesional', userRole: 'Empleado', characterRole: 'Líder del equipo', objective: 'Redactar un correo formal y profesional', expressions: ['Muchas gracias por su apoyo de siempre.', 'Agradezco su revisión.'] },
  meeting_opener: { title: 'Inicio de reunión', description: 'Abrir una reunión y presentar la agenda', situation: 'Comienzas una reunión de negocios y te presentas', userRole: 'Responsable del proyecto', characterRole: 'Ejecutivo senior', objective: 'Liderar la apertura con claridad y cortesía', expressions: ['Permítame compartir la agenda de hoy.', 'Gracias por acompañarnos hoy.'] },
  negotiation_basics: { title: 'Negociación básica', description: 'Proponer condiciones y ajustarlas', situation: 'Estás hablando de fechas de entrega y precios con un socio', userRole: 'Representante de ventas', characterRole: 'Representante del cliente', objective: 'Sugerir condiciones convenientes para ambas partes', expressions: ['¿Qué le parece esta propuesta?', '¿Podría revisarlo una vez más?'] },
  small_talk: { title: 'Conversación informal de negocios', description: 'Romper el hielo antes de una reunión', situation: 'Conversas ligeramente antes de que empiece una reunión', userRole: 'Asistente', characterRole: 'Representante del cliente', objective: 'Generar cercanía manteniendo un tono profesional', expressions: ['¿Cómo ha estado últimamente?', 'Es un gusto verle hoy.'] },
  deadline_followup: { title: 'Seguimiento de la fecha límite', description: 'Revisar el progreso y ajustar el calendario', situation: 'Revisas el estado del proyecto antes de la fecha límite', userRole: 'Jefe de proyecto', characterRole: 'Desarrollador', objective: 'Detectar riesgos de calendario y proponer próximos pasos', expressions: ['¿Cómo va el progreso?', '¿Sería posible ajustar la fecha límite?'] },
  presentation_qa: { title: 'Preguntas y respuestas de la presentación', description: 'Responder preguntas y aclarar puntos', situation: 'Respondes preguntas después de una presentación', userRole: 'Presentador', characterRole: 'Público o ejecutivo', objective: 'Responder preguntas clave con precisión y proponer acciones de seguimiento', expressions: ['Gracias por la pregunta.', 'Permítame aclararlo un poco más.'] },
};

const ENGLISH_SCENARIO_CONTENT: ScenarioTranslationDictionary = {
  cafeteria: { title: 'Cafeteria Chat', description: 'Ordering lunch and making brief small talk', situation: 'You are ordering lunch in the school cafeteria', userRole: 'Student', characterRole: 'Cafeteria staff member', objective: 'Order food politely and ask for an extra item', expressions: ['Can I get this, please?', 'What do you recommend?'] },
  club: { title: 'First Club Meeting', description: 'Introduce yourself as you join a club', situation: 'You are greeting other members at your first club meeting', userRole: 'New club member', characterRole: 'Senior club member', objective: 'Introduce yourself and talk naturally about your interests', expressions: ['Nice to meet you.', 'I am looking forward to working with you.'] },
  homework: { title: 'Homework Help', description: 'Ask a homework question politely', situation: 'You are asking a teacher about a homework problem', userRole: 'Student', characterRole: 'Teacher', objective: 'Explain clearly which part you do not understand', expressions: ['This problem is difficult for me.', 'Could you explain it one more time?'] },
  school_trip: { title: 'School Trip Planning', description: 'Discuss the schedule and divide roles', situation: 'You are planning the itinerary for a school trip', userRole: 'Group leader', characterRole: 'Classmate', objective: 'Suggest ideas and coordinate the group\'s opinions', expressions: ['Where do you want to go?', 'How about this plan?'] },
  new_friend: { title: 'Making a New Friend', description: 'Start a conversation with a classmate in a new semester', situation: 'You are talking to a classmate you just met', userRole: 'Student', characterRole: 'Classmate', objective: 'Build rapport by asking about interests', expressions: ['What do you like?', 'Do you want to go together?'] },
  confidence_talk: { title: 'Confident Presentation', description: 'Share an opinion and answer a follow-up question', situation: 'You are giving a short presentation in class', userRole: 'Presenting student', characterRole: 'Teacher', objective: 'State your opinion clearly and answer a question', expressions: ['My opinion is...', 'Thank you for your question.'] },
  travel: { title: 'Travel Check-in', description: 'Essential expressions for airport or hotel check-in', situation: 'You are checking in at an airport counter or hotel desk', userRole: 'Traveler', characterRole: 'Airline or hotel staff member', objective: 'Complete check-in smoothly and ask for what you need', expressions: ['I have a reservation.', 'I would like to check in.'] },
  cafe_order: { title: 'Cafe Order', description: 'Order a drink and make simple small talk', situation: 'You are ordering a drink at a cafe', userRole: 'Customer', characterRole: 'Barista', objective: 'Order naturally and answer a simple follow-up question', expressions: ['I\'d like an iced latte, please.', 'For here, please.'] },
  job_interview: { title: 'Interview Basics', description: 'Introduce yourself and explain your motivation', situation: 'You are in an entry-level job interview', userRole: 'Applicant', characterRole: 'Interviewer', objective: 'Give a concise self-introduction and highlight your strengths', expressions: ['I would like to explain my motivation.', 'Thank you for your time today.'] },
  roommate_chat: { title: 'Roommate Conversation', description: 'Discuss house rules and make requests politely', situation: 'You are aligning on shared living rules with your roommate', userRole: 'Roommate', characterRole: 'Roommate', objective: 'Make polite requests and reach agreement', expressions: ['Could you keep it a little quieter?', 'Let\'s decide a cleaning schedule.'] },
  hobby_club: { title: 'Hobby Meetup', description: 'Introduce your hobby and join the group conversation', situation: 'You are meeting a hobby group for the first time', userRole: 'New participant', characterRole: 'Group leader', objective: 'Explain your hobby and why you joined', expressions: ['Photography is my hobby.', 'I would like to join again next time.'] },
  presentation_basics: { title: 'Presentation Basics', description: 'Practice opening and closing lines for a short talk', situation: 'You are giving a brief presentation', userRole: 'Presenter', characterRole: 'Audience member', objective: 'Guide listeners through your talk and close politely', expressions: ['Today I will talk about...', 'Thank you for listening.'] },
  email_etiquette: { title: 'Email Etiquette', description: 'Use standard phrases in a business email', situation: 'You are reviewing a draft business email', userRole: 'Employee', characterRole: 'Team lead', objective: 'Write an email with formal and professional wording', expressions: ['Thank you for your continued support.', 'I appreciate your review.'] },
  meeting_opener: { title: 'Meeting Opener', description: 'Open a meeting and introduce the agenda', situation: 'You are starting a business meeting and introducing yourself', userRole: 'Project owner', characterRole: 'Senior executive', objective: 'Lead the meeting opening in a clear and polite way', expressions: ['Let me share today\'s agenda.', 'Thank you for joining us today.'] },
  negotiation_basics: { title: 'Negotiation Basics', description: 'Propose terms and adjust conditions', situation: 'You are discussing delivery dates and pricing with a partner', userRole: 'Sales representative', characterRole: 'Client representative', objective: 'Suggest terms that work for both sides', expressions: ['How does this proposal sound?', 'Could you review it once more?'] },
  small_talk: { title: 'Business Small Talk', description: 'Start a meeting with natural icebreakers', situation: 'You are making light conversation before a meeting begins', userRole: 'Attendee', characterRole: 'Client representative', objective: 'Build rapport while staying polite and professional', expressions: ['How have you been lately?', 'It\'s great to meet you today.'] },
  deadline_followup: { title: 'Deadline Follow-up', description: 'Check progress and adjust the schedule', situation: 'You are reviewing project status before a deadline', userRole: 'Project manager', characterRole: 'Developer', objective: 'Identify schedule risks and suggest next steps', expressions: ['How is the progress going?', 'Would it be possible to adjust the deadline?'] },
  presentation_qa: { title: 'Presentation Q&A', description: 'Handle questions and add clarification', situation: 'You are answering questions after a presentation', userRole: 'Presenter', characterRole: 'Audience or executive', objective: 'Answer key questions accurately and offer follow-up actions', expressions: ['Thank you for the question.', 'Let me add some clarification.'] },
};

const JAPANESE_SCENARIO_CONTENT: ScenarioTranslationDictionary = {
  cafeteria: { title: '学食での会話', description: '学食で注文しながら短く会話する', situation: '学校の食堂で昼食を注文している場面', userRole: '学生', characterRole: '食堂スタッフ', objective: '丁寧に注文し、追加のお願いも伝える', expressions: ['これをください。', 'おすすめはありますか？'] },
  club: { title: '部活での初対面', description: '部活に入りながら自己紹介する', situation: '部活の新入部員として最初のあいさつをする場面', userRole: '新入部員', characterRole: '先輩部員', objective: '自己紹介と興味を自然に伝える', expressions: ['はじめまして。', 'よろしくお願いします。'] },
  homework: { title: '宿題の質問', description: '宿題について丁寧に質問する', situation: '先生に宿題のことで質問している場面', userRole: '学生', characterRole: '先生', objective: 'わからない部分をはっきり質問する', expressions: ['この問題が難しいです。', 'もう一度説明していただけますか。'] },
  school_trip: { title: '修学旅行の計画', description: '日程を相談して役割を分担する', situation: '修学旅行のスケジュールを話し合う場面', userRole: '班長', characterRole: '友だち', objective: '予定を提案し、意見をまとめる', expressions: ['どこに行きたいですか？', 'この案はどうですか？'] },
  new_friend: { title: '新しい友だち作り', description: '新学期にクラスメートへ声をかける', situation: '新しいクラスで初めて会う友だちと話す場面', userRole: '学生', characterRole: 'クラスメート', objective: '興味を聞きながら自然に仲良くなる', expressions: ['何が好きですか？', '一緒に行きませんか？'] },
  confidence_talk: { title: '自信を持って発表', description: '短く意見を述べて質問に答える', situation: '授業で短い発表をしている場面', userRole: '発表する学生', characterRole: '先生', objective: '自分の意見をはっきり伝え、質問にも答える', expressions: ['私の意見は〜です。', '質問ありがとうございます。'] },
  travel: { title: '旅行のチェックイン', description: '空港やホテルで使う基本表現', situation: '空港カウンターまたはホテルでチェックインする場面', userRole: '旅行者', characterRole: '航空会社・ホテルのスタッフ', objective: 'スムーズにチェックインし、必要なことを伝える', expressions: ['予約しています。', 'チェックインをお願いします。'] },
  cafe_order: { title: 'カフェで注文', description: '飲み物を注文し、軽く会話する', situation: 'カフェで飲み物を注文している場面', userRole: '客', characterRole: 'バリスタ', objective: '希望の飲み物を自然に注文する', expressions: ['アイスラテをください。', '店内で飲みます。'] },
  job_interview: { title: '面接の基本', description: '自己紹介と志望動機を伝える', situation: '初級レベルの面接を受けている場面', userRole: '応募者', characterRole: '面接官', objective: '自己紹介と自分の強みを簡潔に話す', expressions: ['志望動機をお話しします。', 'よろしくお願いいたします。'] },
  roommate_chat: { title: 'ルームメイトとの会話', description: '生活ルールを相談し、お願いを伝える', situation: 'ルームメイトと生活ルールを合わせる場面', userRole: 'ルームメイト', characterRole: 'ルームメイト', objective: '丁寧にお願いし、合意を作る', expressions: ['少し静かにしてくれる？', '掃除の当番を決めよう。'] },
  hobby_club: { title: '趣味サークル', description: '趣味を紹介して集まりに参加する', situation: '趣味の集まりで初めてあいさつする場面', userRole: '新しい参加者', characterRole: 'サークルリーダー', objective: '趣味と参加した理由を説明する', expressions: ['写真が趣味です。', '次回も参加したいです。'] },
  presentation_basics: { title: '発表の基本', description: '短い発表の始め方と終わり方を練習する', situation: '簡単な発表をしている場面', userRole: '発表者', characterRole: '聞き手', objective: '発表の流れに沿って話し、最後まで丁寧に締める', expressions: ['本日は〜について発表します。', 'ご清聴ありがとうございました。'] },
  email_etiquette: { title: 'メールのマナー', description: 'ビジネスメールの基本表現を使う', situation: '仕事のメール草案を確認している場面', userRole: '社員', characterRole: 'チームリーダー', objective: '丁寧でフォーマルな文面を書く', expressions: ['お世話になっております。', 'ご確認のほどよろしくお願いいたします。'] },
  meeting_opener: { title: '会議のオープニング', description: '会議の始まりのあいさつと議題紹介', situation: 'ビジネス会議を始めて自己紹介する場面', userRole: 'プロジェクト担当者', characterRole: '上級役員', objective: '会議の始まりを丁寧に進行する', expressions: ['本日の議題を共有します。', 'よろしくお願いいたします。'] },
  negotiation_basics: { title: '交渉の基本', description: '条件を提案しながら調整する', situation: '納期や価格の条件を調整している場面', userRole: '営業担当者', characterRole: '取引先担当者', objective: 'お互いにとって良い条件を提案する', expressions: ['こちらの条件はいかがでしょうか。', '再度ご検討いただけますか。'] },
  small_talk: { title: 'ビジネスの雑談', description: '会議前に自然なアイスブレイクをする', situation: '会議が始まる前に軽い会話をしている場面', userRole: '参加者', characterRole: '取引先担当者', objective: '丁寧さを保ちながら親しみを作る', expressions: ['最近いかがですか。', '本日はよろしくお願いします。'] },
  deadline_followup: { title: '締切フォローアップ', description: '進捗を確認し、日程を調整する', situation: 'プロジェクトの締切前に状況を確認する場面', userRole: 'PM', characterRole: '開発担当者', objective: 'スケジュール上のリスクを確認し、対応案を出す', expressions: ['進捗はいかがでしょうか。', '締切の調整が可能でしょうか。'] },
  presentation_qa: { title: '発表Q&A', description: '質疑応答に対応して補足説明をする', situation: '発表後の質疑応答に対応している場面', userRole: '発表者', characterRole: '聞き手・役員', objective: '重要な質問に正確に答え、次の対応も示す', expressions: ['ご質問ありがとうございます。', '補足してご説明します。'] },
};

const SCENARIO_CONTENT_BY_LANGUAGE: Partial<Record<LanguageCode, ScenarioTranslationDictionary>> = {
  ko: KOREAN_SCENARIO_CONTENT,
  fr: FRENCH_SCENARIO_CONTENT,
  es: SPANISH_SCENARIO_CONTENT,
  en: ENGLISH_SCENARIO_CONTENT,
  ja: JAPANESE_SCENARIO_CONTENT,
};


const PHASE3_FALLBACK_CONTENT_LANGUAGES: LanguageCode[] = ['zh', 'th', 'de', 'ar', 'vi'];
for (const languageCode of PHASE3_FALLBACK_CONTENT_LANGUAGES) {
  SCENARIO_CONTENT_BY_LANGUAGE[languageCode] ??= ENGLISH_SCENARIO_CONTENT;
  SCENARIO_METADATA_BY_LANGUAGE[languageCode] ??= SCENARIO_METADATA_BY_LANGUAGE.en!;
}

export function getScenarioLocaleContent(languageCode: LanguageCode, scenarioId: ScenarioId): ScenarioLocaleContent {
  const localized = SCENARIO_CONTENT_BY_LANGUAGE[languageCode]?.[scenarioId] ?? JAPANESE_SCENARIO_CONTENT[scenarioId];
  const metadata = SCENARIO_METADATA_BY_LANGUAGE[languageCode]?.[scenarioId] ?? SCENARIO_METADATA_BY_LANGUAGE.ja![scenarioId];
  return {
    ...metadata,
    ...localized,
  };
}

export function getScenarioConfigMap(languageCode: LanguageCode) {
  return Object.fromEntries(
    Object.entries(SCENARIO_CORE).map(([scenarioId, core]) => [
      scenarioId,
      {
        ...core,
        ...getScenarioLocaleContent(languageCode, scenarioId as ScenarioId),
      },
    ]),
  ) as Record<ScenarioId, ScenarioLocaleContent & typeof SCENARIO_CORE[ScenarioId]>;
}
