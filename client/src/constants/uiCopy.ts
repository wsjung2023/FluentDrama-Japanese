import type { LanguageCode } from '@shared/language';

interface NavigationCopy {
  logoTitle: string;
  targetLanguage: string;
  supportLanguage: string;
  uiLanguage: string;
  home: string;
  learning: string;
  character: string;
  subscription: string;
  admin: string;
  startLearning: string;
  logout: string;
  tierFree: string;
  tierStarter: string;
  tierPro: string;
  tierPremium: string;
}

interface UsageWarningCopy {
  title: string;
  description: string;
  usageLabel: string;
  countSuffix: string;
  limitReached: (daysUntilReset: number) => string;
  nearLimit: (remaining: number) => string;
  resetIn: (daysUntilReset: number) => string;
  upgrade: string;
}

interface HomeCopy {
  greeting: (name: string) => string;
  prompt: (targetLanguageLabel: string) => string;
  todayRecommendation: string;
  startNow: string;
  quickEntry: string;
  continueSession: string;
  openRecentConversation: string;
  reviewSavedExpressions: string;
  reviewProgress: (targetLanguageLabel: string) => string;
  premiumMode: string;
  premiumDescription: string;
  upgrade: string;
  logout: string;
  freeTier: string;
  guestName: string;
}

const NAVIGATION_COPY: Partial<Record<LanguageCode, NavigationCopy>> = {
  ko: {
    logoTitle: '🎭 AI 언어 튜터',
    targetLanguage: '학습',
    supportLanguage: '설명',
    uiLanguage: 'UI',
    home: '홈',
    learning: '학습',
    character: '캐릭터',
    subscription: '구독',
    admin: '관리자',
    startLearning: '학습 시작',
    logout: '로그아웃',
    tierFree: '무료',
    tierStarter: '스타터',
    tierPro: '프로',
    tierPremium: '프리미엄',
  },
  en: {
    logoTitle: '🎭 AI Language Tutor',
    targetLanguage: 'Target',
    supportLanguage: 'Support',
    uiLanguage: 'UI',
    home: 'Home',
    learning: 'Learn',
    character: 'Character',
    subscription: 'Subscription',
    admin: 'Admin',
    startLearning: 'Start learning',
    logout: 'Log out',
    tierFree: 'Free',
    tierStarter: 'Starter',
    tierPro: 'Pro',
    tierPremium: 'Premium',
  },
  ja: {
    logoTitle: '🎭 AI言語チューター',
    targetLanguage: '学習',
    supportLanguage: '説明',
    uiLanguage: 'UI',
    home: 'ホーム',
    learning: '学習',
    character: 'キャラクター',
    subscription: '購読',
    admin: '管理者',
    startLearning: '学習を開始',
    logout: 'ログアウト',
    tierFree: '無料',
    tierStarter: 'スターター',
    tierPro: 'プロ',
    tierPremium: 'プレミアム',
  },
};

const USAGE_WARNING_COPY: Partial<Record<LanguageCode, UsageWarningCopy>> = {
  ko: {
    title: '📊 이용량 현황',
    description: '무료 플랜 월간 대화 이용량',
    usageLabel: '사용량',
    countSuffix: '회',
    limitReached: (daysUntilReset) => `⛔ 이번 달 무료 대화 횟수를 모두 사용했습니다. ${daysUntilReset}일 후 초기화되거나 유료 플랜으로 업그레이드하세요.`,
    nearLimit: (remaining) => `⚠️ 무료 대화 횟수가 거의 소진되었습니다. ${remaining}회 남았습니다.`,
    resetIn: (daysUntilReset) => `다음 초기화: ${daysUntilReset}일 후`,
    upgrade: '유료 플랜으로 업그레이드',
  },
  en: {
    title: '📊 Usage overview',
    description: 'Monthly free-plan conversation usage',
    usageLabel: 'Usage',
    countSuffix: 'turns',
    limitReached: (daysUntilReset) => `⛔ You have used all free conversations for this month. They reset in ${daysUntilReset} days, or you can upgrade now.`,
    nearLimit: (remaining) => `⚠️ You are close to the free conversation limit. ${remaining} turns remaining.`,
    resetIn: (daysUntilReset) => `Next reset: in ${daysUntilReset} days`,
    upgrade: 'Upgrade plan',
  },
  ja: {
    title: '📊 利用状況',
    description: '無料プランの月間会話利用量',
    usageLabel: '使用量',
    countSuffix: '回',
    limitReached: (daysUntilReset) => `⛔ 今月の無料会話回数をすべて使いました。${daysUntilReset}日後にリセットされるか、今すぐアップグレードできます。`,
    nearLimit: (remaining) => `⚠️ 無料会話回数がまもなく上限です。残り${remaining}回です。`,
    resetIn: (daysUntilReset) => `次のリセット: ${daysUntilReset}日後`,
    upgrade: '有料プランにアップグレード',
  },
};

const HOME_COPY: Partial<Record<LanguageCode, HomeCopy>> = {
  ko: {
    greeting: (name) => `안녕하세요, ${name}님`,
    prompt: (targetLanguageLabel) => `오늘 어떤 ${targetLanguageLabel} 장면을 연습해볼까요?`,
    todayRecommendation: '오늘의 추천 장면',
    startNow: '바로 시작하기',
    quickEntry: '빠른 입장',
    continueSession: '이전 세션 이어하기',
    openRecentConversation: '최근 대화 열기',
    reviewSavedExpressions: '저장된 표현 복습',
    reviewProgress: (targetLanguageLabel) => `나의 ${targetLanguageLabel} 학습 진도를 확인하세요.`,
    premiumMode: '프리미엄 학습 모드',
    premiumDescription: '무제한 대화, 심화 피드백, 고급 시나리오를 이용해보세요.',
    upgrade: '업그레이드',
    logout: '로그아웃',
    freeTier: '무료',
    guestName: '학습자',
  },
  en: {
    greeting: (name) => `Hello, ${name}`,
    prompt: (targetLanguageLabel) => `Which ${targetLanguageLabel} scene would you like to practice today?`,
    todayRecommendation: "Today's recommended scene",
    startNow: 'Start now',
    quickEntry: 'Quick entry',
    continueSession: 'Continue previous session',
    openRecentConversation: 'Open recent conversation',
    reviewSavedExpressions: 'Review saved expressions',
    reviewProgress: (targetLanguageLabel) => `Check your ${targetLanguageLabel} learning progress.`,
    premiumMode: 'Premium learning mode',
    premiumDescription: 'Unlock unlimited conversations, deeper feedback, and advanced scenarios.',
    upgrade: 'Upgrade',
    logout: 'Log out',
    freeTier: 'Free',
    guestName: 'Learner',
  },
  ja: {
    greeting: (name) => `こんにちは、${name}さん`,
    prompt: (targetLanguageLabel) => `今日はどの${targetLanguageLabel}シーンを練習しますか？`,
    todayRecommendation: '今日のおすすめシーン',
    startNow: '今すぐ始める',
    quickEntry: 'クイック開始',
    continueSession: '前回のセッションを続ける',
    openRecentConversation: '最近の会話を開く',
    reviewSavedExpressions: '保存した表現を復習',
    reviewProgress: (targetLanguageLabel) => `${targetLanguageLabel}学習の進み具合を確認しましょう。`,
    premiumMode: 'プレミアム学習モード',
    premiumDescription: '無制限会話、深いフィードバック、高度なシナリオを利用できます。',
    upgrade: 'アップグレード',
    logout: 'ログアウト',
    freeTier: '無料',
    guestName: '学習者',
  },
};

const FALLBACK_HOME_COPY = HOME_COPY.en!;

export function getUsageWarningCopy(languageCode: LanguageCode): UsageWarningCopy {
  return USAGE_WARNING_COPY[languageCode] ?? USAGE_WARNING_COPY.en!;
}

export function getHomeCopy(languageCode: LanguageCode): HomeCopy {
  return HOME_COPY[languageCode] ?? FALLBACK_HOME_COPY;
}


interface ScenarioCopy {
  title: string;
  subtitle: string;
  customScenario: string;
  collapse: string;
  expand: string;
  customPlaceholder: string;
  start: string;
  durationMinutes: (minutes: number) => string;
}

interface CharacterCopy {
  title: string;
  subtitle: string;
  myCharacters: string;
  hide: string;
  show: string;
  loadingCharacters: string;
  deletedTitle: string;
  deletedDescription: string;
  selectedTitle: string;
  selectedDescription: (name: string) => string;
  customScenarioRequiredTitle: string;
  customScenarioRequiredDescription: string;
  backgroundPromptCreatedTitle: string;
  backgroundPromptCreatedDescription: string;
  backgroundPromptFailedTitle: string;
  backgroundPromptFailedDescription: string;
  missingInfoTitle: string;
  missingInfoDescription: string;
  generatingTutor: string;
  generatedTitle: string;
  generatedDescription: string;
  imageLimitReachedError: string;
  imageLimitTitle: string;
  imageLimitDescription: string;
  generationFailedError: string;
  generationFailedTitle: string;
  generationFailedDescription: string;
  imageRequiredTitle: string;
  imageRequiredDescription: string;
  genderMale: string;
  genderFemale: string;
  styleCheerful: string;
  styleCalm: string;
  styleStrict: string;
  usageCount: (count: number) => string;
  select: string;
  delete: string;
  deleteConfirm: (name: string) => string;
  noSavedCharacters: string;
  noSavedCharactersDescription: string;
  previewEmpty: string;
  generating: string;
  generateCharacter: string;
  characterName: string;
  characterNamePlaceholder: string;
  backgroundPromptLabel: string;
  generatingPrompt: string;
  generatePrompt: string;
  backgroundSetting: string;
  outfit: string;
  pose: string;
  atmosphere: string;
  backgroundPromptHelp: string;
  gender: string;
  teachingStyle: string;
  stylePlaceholder: string;
  back: string;
  startScene: string;
}

interface DramaSceneCopy {
  defaultTutorName: string;
  startFailedTitle: string;
  startFailedDescription: string;
  sessionErrorTitle: string;
  responseFailedTitle: string;
  responseFailedDescription: string;
  voiceInputErrorTitle: string;
  customScene: string;
  supportTranslationKo: string;
  supportTranslationGeneric: string;
  romanization: string;
  supportTranslationLabel: string;
  pronunciationLabel: string;
  correction: string;
  betterExpression: string;
  explanation: string;
  tips: string;
  inputPlaceholderJa: string;
  inputPlaceholderGeneric: string;
  send: string;
  recording: string;
  processingVoice: string;
  hintFallback: string;
  qualityNatural: string;
  qualityClear: string;
  qualityAwkward: string;
  qualityRetry: string;
}

interface PracticePageCopy {
  defaultTutorName: string;
  voiceChatNotice: string;
  inputPlaceholder: string;
  send: string;
}

interface ConversationHookCopy {
  defaultError: string;
  userGoal: (audience: string, language: string) => string;
  invalidStartResponse: string;
  sessionNotInitialized: string;
  emptyInput: string;
  invalidTurnResponse: string;
  invalidResumeResponse: string;
}

interface RecorderCopy {
  microphoneAccessFailed: string;
  audioEncodingFailed: string;
  audioReadFailed: string;
  audioConversionFailed: string;
  emptyRecording: string;
  noSpeechRecognized: string;
  speechProcessingFailed: string;
}

interface PolicyPageCopy {
  back: string;
  updatedOn: string;
  originalNotice: string;
}

interface AdminCopy {
  error: string;
  usersLoadFailed: string;
  enterEmail: string;
  searchCompleted: string;
  userFound: (email: string) => string;
  userNotFound: string;
  selectUserAndTier: string;
  updateCompleted: string;
  updatedSubscription: (email: string, tier: string) => string;
  updateFailed: string;
  selectUser: string;
  resetCompleted: string;
  usageReset: (email: string) => string;
  resetFailed: string;
  tierPremium: string;
  tierPro: string;
  tierStarter: string;
  tierFree: string;
  title: string;
  subtitle: string;
  backHome: string;
  userSearch: string;
  userSearchDescription: string;
  searchEmailPlaceholder: string;
  searching: string;
  search: string;
  userInfo: string;
  basicInfo: string;
  email: string;
  name: string;
  joinedAt: string;
  subscriptionInfo: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  monthlyImageUsage: string;
  selectNewTier: string;
  changeSubscription: string;
  resetUsage: string;
  recentUsers: string;
  recentUsersDescription: string;
  select: string;
  noUsers: string;
}

interface LandingCopy {
  heroDescription: string;
  startFree: string;
  featuresTitle: [string, string, string];
  featuresDescription: [string, string, string];
  pricingTitle: string;
  perMonth: string;
  premiumBadge: string;
  planFeatures: {
    free: string[];
    starter: string[];
    pro: string[];
    premium: string[];
  };
  footer: string;
}

interface SubscriptionCopy {
  loginRequired: string;
  loginRequiredDescription: string;
  paymentError: string;
  paymentErrorDescription: string;
  genericError: string;
  billingPageErrorDescription: string;
  cancelScheduled: string;
  cancelFailed: string;
  cancelFailedDescription: string;
  freePlan: string;
  freePlanDescription: string;
  cancelConfirm: string;
  freePrice: string;
  conversationPerMonth: (count: number) => string;
  imagesPerMonth: (count: number) => string;
  ttsPerMonth: (count: number) => string;
  title: string;
  subtitle: string;
  backHome: string;
  currentSubscription: string;
  canceling: string;
  active: string;
  expiresOn: string;
  nextBilling: string;
  manageBilling: string;
  cancelSubscription: string;
  premiumBadge: string;
  perMonth: string;
  currentPlan: string;
  startPlan: (name: string) => string;
  paymentInfo: string;
  autoRenew: string;
  autoRenewDescription: string;
  securePayment: string;
  securePaymentDescription: string;
  refundPolicy: string;
  refundPolicyDescription: string;
  terms: string;
  privacy: string;
  refund: string;
}

interface AuthCopy {
  loginFailed: string;
  loginFailedDescription: string;
  signupFailed: string;
  signupFailedDescription: string;
  inputError: string;
  inputErrorDescription: string;
  copied: string;
  copiedDescription: string;
  back: string;
  subtitle: string;
  inAppTitle: string;
  inAppDescription: string;
  inAppDescriptionLine2: string;
  login: string;
  signup: string;
  loginDescription: string;
  signupDescription: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  or: string;
  externalBrowserRequired: string;
  externalBrowserDescription: string;
  externalBrowserDescriptionLine2: string;
  openExternalBrowser: string;
  copyLink: string;
  cancel: string;
  continueWithGoogle: string;
  toggleAuth: string;
  toggleSignup: string;
}

interface AudienceOptionCopy {
  title: string;
  description: string;
  scenarios: [string, string, string];
  startButton: string;
}

interface AudienceSelectionCopy {
  title: string;
  subtitle: string;
  cefrLabel: string;
  options: {
    student: AudienceOptionCopy;
    general: AudienceOptionCopy;
    business: AudienceOptionCopy;
  };
}

interface QuickChipCopy {
  label: string;
  scenarioId: string;
  audience: 'student' | 'general' | 'business';
}

const SCENARIO_COPY: Partial<Record<LanguageCode, ScenarioCopy>> = {
  ko: {
    title: '어떤 장면으로 들어갈까요?',
    subtitle: '오늘 연습할 시나리오를 선택하세요.',
    customScenario: '커스텀 시나리오',
    collapse: '접기',
    expand: '직접 입력하기',
    customPlaceholder: '또는 직접 시나리오를 입력해보세요...',
    start: '시작하기 →',
    durationMinutes: (minutes) => `${minutes}분`,
  },
  en: {
    title: 'Which scene would you like to enter?',
    subtitle: 'Choose a scenario to practice today.',
    customScenario: 'Custom scenario',
    collapse: 'Collapse',
    expand: 'Write my own',
    customPlaceholder: 'Or type your own scenario...',
    start: 'Start →',
    durationMinutes: (minutes) => `${minutes} min`,
  },
  ja: {
    title: 'どのシーンに入りますか？',
    subtitle: '今日練習するシナリオを選んでください。',
    customScenario: 'カスタムシナリオ',
    collapse: '閉じる',
    expand: '直接入力',
    customPlaceholder: 'またはシナリオを直接入力してください...',
    start: '開始 →',
    durationMinutes: (minutes) => `${minutes}分`,
  },
};

const CHARACTER_COPY: Partial<Record<LanguageCode, CharacterCopy>> = {
  ko: {
    title: '나만의 AI 튜터 만들기',
    subtitle: '학습 스타일에 맞는 튜터를 직접 구성해보세요.',
    myCharacters: '내 캐릭터',
    hide: '숨기기',
    show: '보기',
    loadingCharacters: '캐릭터를 불러오는 중...',
    deletedTitle: '캐릭터 삭제됨',
    deletedDescription: '선택한 캐릭터가 삭제되었습니다.',
    selectedTitle: '캐릭터 불러오기 완료!',
    selectedDescription: (name) => `${name} 캐릭터를 선택했습니다.`,
    customScenarioRequiredTitle: '커스텀 시나리오 필요',
    customScenarioRequiredDescription: '먼저 커스텀 시나리오를 입력해주세요.',
    backgroundPromptCreatedTitle: '배경 프롬프트 생성 완료!',
    backgroundPromptCreatedDescription: '이제 캐릭터를 생성할 수 있습니다.',
    backgroundPromptFailedTitle: '배경 프롬프트 생성 실패',
    backgroundPromptFailedDescription: '다시 시도해주세요.',
    missingInfoTitle: '정보가 부족합니다',
    missingInfoDescription: '캐릭터 정보를 모두 입력한 뒤 생성해주세요.',
    generatingTutor: 'AI 튜터를 생성하는 중...',
    generatedTitle: '캐릭터 생성 완료!',
    generatedDescription: 'AI 튜터가 학습을 도울 준비를 마쳤습니다.',
    imageLimitReachedError: '이미지 생성 한도에 도달했습니다.',
    imageLimitTitle: '이미지 생성 한도 초과',
    imageLimitDescription: '위에서 저장된 캐릭터를 선택하거나 구독을 업그레이드해주세요.',
    generationFailedError: '캐릭터 생성에 실패했습니다. 다시 시도해주세요.',
    generationFailedTitle: '생성 실패',
    generationFailedDescription: '캐릭터 이미지 생성에 실패했습니다. 연결을 확인하고 다시 시도해주세요.',
    imageRequiredTitle: '캐릭터 이미지가 필요합니다',
    imageRequiredDescription: '먼저 AI 튜터 이미지를 생성해주세요.',
    genderMale: '남성',
    genderFemale: '여성',
    styleCheerful: '쾌활함',
    styleCalm: '차분함',
    styleStrict: '엄격함',
    usageCount: (count) => `사용: ${count}회`,
    select: '선택',
    delete: '삭제',
    deleteConfirm: (name) => `정말로 ${name} 캐릭터를 삭제하시겠습니까?`,
    noSavedCharacters: '아직 저장된 캐릭터가 없습니다',
    noSavedCharactersDescription: '캐릭터를 생성하면 자동으로 저장되어 재사용할 수 있습니다',
    previewEmpty: '캐릭터 미리보기',
    generating: '생성 중...',
    generateCharacter: '캐릭터 생성',
    characterName: '캐릭터 이름',
    characterNamePlaceholder: '튜터 이름을 입력하세요...',
    backgroundPromptLabel: '배경 설정 프롬프트',
    generatingPrompt: '생성 중...',
    generatePrompt: '프롬프트 생성',
    backgroundSetting: '배경',
    outfit: '복장',
    pose: '포즈',
    atmosphere: '분위기',
    backgroundPromptHelp: '커스텀 시나리오에 맞는 배경과 복장을 자동 생성해보세요',
    gender: '성별',
    teachingStyle: '티칭 스타일',
    stylePlaceholder: '스타일을 선택하세요...',
    back: '뒤로',
    startScene: '장면 시작',
  },
  en: {
    title: 'Create your AI tutor',
    subtitle: 'Design a personalized tutor that matches your learning style.',
    myCharacters: 'My characters',
    hide: 'Hide',
    show: 'Show',
    loadingCharacters: 'Loading your characters...',
    deletedTitle: 'Character deleted',
    deletedDescription: 'The selected character has been deleted.',
    selectedTitle: 'Character loaded!',
    selectedDescription: (name) => `${name} has been selected.`,
    customScenarioRequiredTitle: 'Custom scenario required',
    customScenarioRequiredDescription: 'Please enter a custom scenario first.',
    backgroundPromptCreatedTitle: 'Background prompt ready!',
    backgroundPromptCreatedDescription: 'You can now generate the character.',
    backgroundPromptFailedTitle: 'Background prompt failed',
    backgroundPromptFailedDescription: 'Please try again.',
    missingInfoTitle: 'Missing information',
    missingInfoDescription: 'Please fill in all character details before generating.',
    generatingTutor: 'Generating your AI tutor...',
    generatedTitle: 'Character generated!',
    generatedDescription: 'Your AI tutor is ready to help you learn.',
    imageLimitReachedError: 'You have reached the image generation limit.',
    imageLimitTitle: 'Image generation limit reached',
    imageLimitDescription: 'Choose a saved character above or upgrade your subscription.',
    generationFailedError: 'Failed to generate character. Please try again.',
    generationFailedTitle: 'Generation failed',
    generationFailedDescription: 'Failed to create the character image. Check your connection and try again.',
    imageRequiredTitle: 'Character image required',
    imageRequiredDescription: 'Please generate your AI tutor image first.',
    genderMale: 'Male',
    genderFemale: 'Female',
    styleCheerful: 'Cheerful',
    styleCalm: 'Calm',
    styleStrict: 'Strict',
    usageCount: (count) => `Used ${count} times`,
    select: 'Select',
    delete: 'Delete',
    deleteConfirm: (name) => `Are you sure you want to delete ${name}?`,
    noSavedCharacters: 'No saved characters yet',
    noSavedCharactersDescription: 'Generated characters are saved automatically so you can reuse them later.',
    previewEmpty: 'Character preview',
    generating: 'Generating...',
    generateCharacter: 'Generate character',
    characterName: 'Character name',
    characterNamePlaceholder: 'Enter tutor name...',
    backgroundPromptLabel: 'Background prompt',
    generatingPrompt: 'Generating...',
    generatePrompt: 'Generate prompt',
    backgroundSetting: 'Background',
    outfit: 'Outfit',
    pose: 'Pose',
    atmosphere: 'Mood',
    backgroundPromptHelp: 'Auto-generate a background and outfit that match your custom scenario.',
    gender: 'Gender',
    teachingStyle: 'Teaching style',
    stylePlaceholder: 'Select a style...',
    back: 'Back',
    startScene: 'Start scene',
  },
  ja: {
    title: '自分だけのAIチューターを作成',
    subtitle: '学習スタイルに合うチューターを作ってみましょう。',
    myCharacters: 'マイキャラクター',
    hide: '隠す',
    show: '表示',
    loadingCharacters: 'キャラクターを読み込んでいます...',
    deletedTitle: 'キャラクターを削除しました',
    deletedDescription: '選択したキャラクターを削除しました。',
    selectedTitle: 'キャラクターを読み込みました！',
    selectedDescription: (name) => `${name}を選択しました。`,
    customScenarioRequiredTitle: 'カスタムシナリオが必要です',
    customScenarioRequiredDescription: '先にカスタムシナリオを入力してください。',
    backgroundPromptCreatedTitle: '背景プロンプト生成完了！',
    backgroundPromptCreatedDescription: 'これでキャラクターを生成できます。',
    backgroundPromptFailedTitle: '背景プロンプト生成失敗',
    backgroundPromptFailedDescription: 'もう一度お試しください。',
    missingInfoTitle: '情報が不足しています',
    missingInfoDescription: 'キャラクター情報をすべて入力してから生成してください。',
    generatingTutor: 'AIチューターを生成しています...',
    generatedTitle: 'キャラクター生成完了！',
    generatedDescription: 'AIチューターが学習をサポートする準備ができました。',
    imageLimitReachedError: '画像生成上限に達しました。',
    imageLimitTitle: '画像生成上限超過',
    imageLimitDescription: '上の保存済みキャラクターを選ぶか、サブスクリプションをアップグレードしてください。',
    generationFailedError: 'キャラクター生成に失敗しました。もう一度お試しください。',
    generationFailedTitle: '生成失敗',
    generationFailedDescription: 'キャラクター画像の生成に失敗しました。接続を確認して再試行してください。',
    imageRequiredTitle: 'キャラクター画像が必要です',
    imageRequiredDescription: '先にAIチューター画像を生成してください。',
    genderMale: '男性',
    genderFemale: '女性',
    styleCheerful: '明るい',
    styleCalm: '落ち着いた',
    styleStrict: '厳格',
    usageCount: (count) => `使用 ${count}回`,
    select: '選択',
    delete: '削除',
    deleteConfirm: (name) => `本当に${name}を削除しますか？`,
    noSavedCharacters: 'まだ保存されたキャラクターがありません',
    noSavedCharactersDescription: 'キャラクターを生成すると自動保存され、あとで再利用できます。',
    previewEmpty: 'キャラクタープレビュー',
    generating: '生成中...',
    generateCharacter: 'キャラクター生成',
    characterName: 'キャラクター名',
    characterNamePlaceholder: 'チューター名を入力してください...',
    backgroundPromptLabel: '背景設定プロンプト',
    generatingPrompt: '生成中...',
    generatePrompt: 'プロンプト生成',
    backgroundSetting: '背景',
    outfit: '服装',
    pose: 'ポーズ',
    atmosphere: '雰囲気',
    backgroundPromptHelp: 'カスタムシナリオに合う背景や服装を自動生成してみましょう。',
    gender: '性別',
    teachingStyle: '指導スタイル',
    stylePlaceholder: 'スタイルを選択してください...',
    back: '戻る',
    startScene: 'シーン開始',
  },
};

const DRAMA_SCENE_COPY: Partial<Record<LanguageCode, DramaSceneCopy>> = {
  ko: {
    defaultTutorName: '튜터',
    startFailedTitle: '시작 실패',
    startFailedDescription: '세션을 시작하지 못했습니다.',
    sessionErrorTitle: '세션 오류',
    responseFailedTitle: '응답 실패',
    responseFailedDescription: '잠시 후 다시 시도해주세요.',
    voiceInputErrorTitle: '음성 입력 오류',
    customScene: '커스텀 장면',
    supportTranslationKo: '한국어 번역 표시',
    supportTranslationGeneric: '보조 번역 표시',
    romanization: '발음/로마나이즈 표시',
    supportTranslationLabel: '번역',
    pronunciationLabel: '발음',
    correction: '교정',
    betterExpression: '더 자연스럽게',
    explanation: '설명',
    tips: '팁',
    inputPlaceholderJa: '일본어로 말해보세요...',
    inputPlaceholderGeneric: '학습 언어로 말해보세요...',
    send: '전송',
    recording: '녹음 중... 버튼에서 손을 떼면 전송됩니다.',
    processingVoice: '음성을 인식하는 중입니다...',
    hintFallback: '상황에 맞는 인사와 요청 표현을 먼저 말해보세요.',
    qualityNatural: '자연스러움',
    qualityClear: '명확함',
    qualityAwkward: '조금 어색함',
    qualityRetry: '다시 시도',
  },
  en: {
    defaultTutorName: 'Tutor',
    startFailedTitle: 'Failed to start',
    startFailedDescription: 'Could not start the session.',
    sessionErrorTitle: 'Session error',
    responseFailedTitle: 'Response failed',
    responseFailedDescription: 'Please try again in a moment.',
    voiceInputErrorTitle: 'Voice input error',
    customScene: 'Custom scene',
    supportTranslationKo: 'Show Korean translation',
    supportTranslationGeneric: 'Show support translation',
    romanization: 'Show pronunciation/romanization',
    supportTranslationLabel: 'Translation',
    pronunciationLabel: 'Pronunciation',
    correction: 'Correction',
    betterExpression: 'More natural',
    explanation: 'Explanation',
    tips: 'Tips',
    inputPlaceholderJa: 'Try speaking in Japanese...',
    inputPlaceholderGeneric: 'Try speaking in your target language...',
    send: 'Send',
    recording: 'Recording... release the button to send.',
    processingVoice: 'Recognizing speech...',
    hintFallback: 'Try starting with a greeting or request that fits the situation.',
    qualityNatural: 'Natural',
    qualityClear: 'Clear',
    qualityAwkward: 'Slightly awkward',
    qualityRetry: 'Try this',
  },
  ja: {
    defaultTutorName: 'チューター',
    startFailedTitle: '開始失敗',
    startFailedDescription: 'セッションを開始できませんでした。',
    sessionErrorTitle: 'セッションエラー',
    responseFailedTitle: '応答失敗',
    responseFailedDescription: 'しばらくしてからもう一度お試しください。',
    voiceInputErrorTitle: '音声入力エラー',
    customScene: 'カスタムシーン',
    supportTranslationKo: '韓国語訳を表示',
    supportTranslationGeneric: '補助翻訳を表示',
    romanization: '発音/ローマ字を表示',
    supportTranslationLabel: '訳',
    pronunciationLabel: '読み',
    correction: '修正',
    betterExpression: 'より自然に',
    explanation: '説明',
    tips: 'ヒント',
    inputPlaceholderJa: '日本語で話してみましょう...',
    inputPlaceholderGeneric: '学習言語で話してみましょう...',
    send: '送信',
    recording: '録音中... ボタンを離すと送信されます。',
    processingVoice: '音声を認識しています...',
    hintFallback: '状況に合う挨拶や依頼表現から始めてみましょう。',
    qualityNatural: '自然',
    qualityClear: '明確',
    qualityAwkward: 'やや不自然',
    qualityRetry: '試してみましょう',
  },
};

const PRACTICE_PAGE_COPY: Partial<Record<LanguageCode, PracticePageCopy>> = {
  ko: {
    defaultTutorName: '튜터',
    voiceChatNotice: '음성 인식은 추후 고도화 예정이며 현재는 텍스트 입력으로 동작합니다.',
    inputPlaceholder: '학습 언어로 말해보세요...',
    send: '전송',
  },
  en: {
    defaultTutorName: 'Tutor',
    voiceChatNotice: 'Voice recognition will be improved later; for now this screen works with text input.',
    inputPlaceholder: 'Try speaking in your target language...',
    send: 'Send',
  },
  ja: {
    defaultTutorName: 'チューター',
    voiceChatNotice: '音声認識は今後改善予定で、現在はテキスト入力で動作します。',
    inputPlaceholder: '学習言語で話してみましょう...',
    send: '送信',
  },
};

const CONVERSATION_HOOK_COPY: Partial<Record<LanguageCode, ConversationHookCopy>> = {
  ko: {
    defaultError: '요청 처리 중 오류가 발생했습니다.',
    userGoal: (audience, language) => `${audience} ${language} 대화 연습`,
    invalidStartResponse: '세션 응답 형식이 올바르지 않습니다.',
    sessionNotInitialized: '세션이 초기화되지 않았습니다.',
    emptyInput: '입력 문장이 비어 있습니다.',
    invalidTurnResponse: '대화 응답 형식이 올바르지 않습니다.',
    invalidResumeResponse: '세션 복원 응답 형식이 올바르지 않습니다.',
  },
  en: {
    defaultError: 'An error occurred while processing your request.',
    userGoal: (audience, language) => `${audience} ${language} conversation practice`,
    invalidStartResponse: 'The session response format is invalid.',
    sessionNotInitialized: 'The session has not been initialized.',
    emptyInput: 'The input message is empty.',
    invalidTurnResponse: 'The conversation response format is invalid.',
    invalidResumeResponse: 'The resume-session response format is invalid.',
  },
  ja: {
    defaultError: 'リクエスト処理中にエラーが発生しました。',
    userGoal: (audience, language) => `${audience} ${language}会話練習`,
    invalidStartResponse: 'セッション応答の形式が正しくありません。',
    sessionNotInitialized: 'セッションが初期化されていません。',
    emptyInput: '入力文が空です。',
    invalidTurnResponse: '会話応答の形式が正しくありません。',
    invalidResumeResponse: 'セッション復元応答の形式が正しくありません。',
  },
};

const RECORDER_COPY: Partial<Record<LanguageCode, RecorderCopy>> = {
  ko: {
    microphoneAccessFailed: '마이크 접근에 실패했습니다.',
    audioEncodingFailed: '오디오 인코딩에 실패했습니다.',
    audioReadFailed: '오디오 파일 읽기에 실패했습니다.',
    audioConversionFailed: '오디오 변환에 실패했습니다.',
    emptyRecording: '녹음 데이터가 비어 있습니다.',
    noSpeechRecognized: '음성을 인식하지 못했습니다. 다시 시도해주세요.',
    speechProcessingFailed: '음성 처리에 실패했습니다.',
  },
  en: {
    microphoneAccessFailed: 'Failed to access the microphone.',
    audioEncodingFailed: 'Failed to encode audio.',
    audioReadFailed: 'Failed to read the audio file.',
    audioConversionFailed: 'Failed to convert audio.',
    emptyRecording: 'The recording data is empty.',
    noSpeechRecognized: 'No speech was recognized. Please try again.',
    speechProcessingFailed: 'Failed to process speech.',
  },
  ja: {
    microphoneAccessFailed: 'マイクへのアクセスに失敗しました。',
    audioEncodingFailed: '音声のエンコードに失敗しました。',
    audioReadFailed: '音声ファイルの読み取りに失敗しました。',
    audioConversionFailed: '音声変換に失敗しました。',
    emptyRecording: '録音データが空です。',
    noSpeechRecognized: '音声を認識できませんでした。もう一度お試しください。',
    speechProcessingFailed: '音声処理に失敗しました。',
  },
};

const POLICY_PAGE_COPY: Partial<Record<LanguageCode, PolicyPageCopy>> = {
  ko: {
    back: '뒤로 가기',
    updatedOn: '최종 수정일: 2025년 1월 25일',
    originalNotice: '현재 정책 본문은 한국어 원문으로 제공됩니다.',
  },
  en: {
    back: 'Back',
    updatedOn: 'Last updated: January 25, 2025',
    originalNotice: 'The policy body is currently provided in the original Korean.',
  },
  ja: {
    back: '戻る',
    updatedOn: '最終更新日: 2025年1月25日',
    originalNotice: '現在、ポリシー本文は韓国語原文で提供されています。',
  },
};

const ADMIN_COPY: Partial<Record<LanguageCode, AdminCopy>> = {
  ko: {
    error: '오류',
    usersLoadFailed: '사용자 목록을 불러올 수 없습니다.',
    enterEmail: '이메일을 입력해주세요.',
    searchCompleted: '검색 완료',
    userFound: (email) => `${email} 사용자를 찾았습니다.`,
    userNotFound: '사용자를 찾을 수 없습니다.',
    selectUserAndTier: '사용자와 새 구독 등급을 선택해주세요.',
    updateCompleted: '업데이트 완료',
    updatedSubscription: (email, tier) => `${email}의 구독을 ${tier}로 변경했습니다.`,
    updateFailed: '구독 업데이트에 실패했습니다.',
    selectUser: '사용자를 선택해주세요.',
    resetCompleted: '초기화 완료',
    usageReset: (email) => `${email}의 사용량을 초기화했습니다.`,
    resetFailed: '사용량 초기화에 실패했습니다.',
    tierPremium: '프리미엄',
    tierPro: '프로',
    tierStarter: '스타터',
    tierFree: '무료',
    title: '관리자 패널 🔧',
    subtitle: '사용자 구독 및 데이터 관리',
    backHome: '홈으로',
    userSearch: '사용자 검색',
    userSearchDescription: '이메일로 사용자를 검색하고 관리하세요',
    searchEmailPlaceholder: '사용자 이메일 입력',
    searching: '검색 중...',
    search: '검색',
    userInfo: '사용자 정보',
    basicInfo: '기본 정보',
    email: '이메일',
    name: '이름',
    joinedAt: '가입일',
    subscriptionInfo: '구독 정보',
    subscriptionTier: '구독 등급',
    subscriptionStatus: '구독 상태',
    monthlyImageUsage: '월간 이미지 사용량',
    selectNewTier: '새 구독 등급 선택',
    changeSubscription: '구독 변경',
    resetUsage: '사용량 초기화',
    recentUsers: '최근 사용자 목록',
    recentUsersDescription: '최근에 가입한 사용자들',
    select: '선택',
    noUsers: '사용자가 없습니다.',
  },
  en: {
    error: 'Error',
    usersLoadFailed: 'Unable to load the user list.',
    enterEmail: 'Please enter an email address.',
    searchCompleted: 'Search complete',
    userFound: (email) => `Found user ${email}.`,
    userNotFound: 'Unable to find the user.',
    selectUserAndTier: 'Please select a user and a new subscription tier.',
    updateCompleted: 'Update complete',
    updatedSubscription: (email, tier) => `Changed ${email}'s subscription to ${tier}.`,
    updateFailed: 'Failed to update the subscription.',
    selectUser: 'Please select a user.',
    resetCompleted: 'Reset complete',
    usageReset: (email) => `Reset usage for ${email}.`,
    resetFailed: 'Failed to reset usage.',
    tierPremium: 'Premium',
    tierPro: 'Pro',
    tierStarter: 'Starter',
    tierFree: 'Free',
    title: 'Admin panel 🔧',
    subtitle: 'Manage user subscriptions and data',
    backHome: 'Back home',
    userSearch: 'User search',
    userSearchDescription: 'Search for and manage users by email',
    searchEmailPlaceholder: 'Enter user email',
    searching: 'Searching...',
    search: 'Search',
    userInfo: 'User details',
    basicInfo: 'Basic info',
    email: 'Email',
    name: 'Name',
    joinedAt: 'Joined',
    subscriptionInfo: 'Subscription info',
    subscriptionTier: 'Subscription tier',
    subscriptionStatus: 'Subscription status',
    monthlyImageUsage: 'Monthly image usage',
    selectNewTier: 'Select new subscription tier',
    changeSubscription: 'Change subscription',
    resetUsage: 'Reset usage',
    recentUsers: 'Recent users',
    recentUsersDescription: 'Most recently registered users',
    select: 'Select',
    noUsers: 'No users found.',
  },
  ja: {
    error: 'エラー',
    usersLoadFailed: 'ユーザー一覧を読み込めませんでした。',
    enterEmail: 'メールアドレスを入力してください。',
    searchCompleted: '検索完了',
    userFound: (email) => `${email} ユーザーが見つかりました。`,
    userNotFound: 'ユーザーが見つかりません。',
    selectUserAndTier: 'ユーザーと新しい購読ランクを選択してください。',
    updateCompleted: '更新完了',
    updatedSubscription: (email, tier) => `${email} の購読を ${tier} に変更しました。`,
    updateFailed: '購読更新に失敗しました。',
    selectUser: 'ユーザーを選択してください。',
    resetCompleted: '初期化完了',
    usageReset: (email) => `${email} の使用量を初期化しました。`,
    resetFailed: '使用量の初期化に失敗しました。',
    tierPremium: 'プレミアム',
    tierPro: 'プロ',
    tierStarter: 'スターター',
    tierFree: '無料',
    title: '管理者パネル 🔧',
    subtitle: 'ユーザーの購読とデータを管理',
    backHome: 'ホームへ',
    userSearch: 'ユーザー検索',
    userSearchDescription: 'メールアドレスでユーザーを検索して管理します',
    searchEmailPlaceholder: 'ユーザーメールを入力',
    searching: '検索中...',
    search: '検索',
    userInfo: 'ユーザー情報',
    basicInfo: '基本情報',
    email: 'メール',
    name: '名前',
    joinedAt: '登録日',
    subscriptionInfo: '購読情報',
    subscriptionTier: '購読ランク',
    subscriptionStatus: '購読状態',
    monthlyImageUsage: '月間画像使用量',
    selectNewTier: '新しい購読ランクを選択',
    changeSubscription: '購読変更',
    resetUsage: '使用量初期化',
    recentUsers: '最近のユーザー一覧',
    recentUsersDescription: '最近登録したユーザー',
    select: '選択',
    noUsers: 'ユーザーがいません。',
  },
};

const LANDING_COPY: Partial<Record<LanguageCode, LandingCopy>> = {
  ko: {
    heroDescription: '드라마틱한 시나리오로 목표 언어를 배워보세요. AI 캐릭터와 실제 상황을 연습하며 자연스럽게 실력을 향상시킬 수 있습니다.',
    startFree: '🚀 무료로 시작하기',
    featuresTitle: ['🎬 실감나는 시나리오', '🎯 실시간 피드백', '🤖 개성 있는 AI 캐릭터'],
    featuresDescription: [
      '비즈니스 미팅, 카페 주문, 여행 등 실제 상황을 바탕으로 한 드라마틱한 시나리오로 목표 언어를 연습하세요.',
      '발음, 문법, 어휘를 실시간으로 분석하여 정확한 한국어 피드백을 제공합니다.',
      '다양한 성격과 배경을 가진 AI 캐릭터들과 자연스러운 대화를 나누며 목표 언어를 배워보세요.',
    ],
    pricingTitle: '요금제',
    perMonth: '/월',
    premiumBadge: '최고급',
    planFeatures: {
      free: ['✅ 월 30회 대화', '✅ 이미지 생성 1장', '✅ 기본 TTS 음성', '✅ 워터마크 포함'],
      starter: ['✅ 월 300회 대화', '✅ 이미지 생성 15장', '✅ 프리미엄 TTS 음성 5종', '✅ 대화 저장/내보내기'],
      pro: ['✅ 월 600회 대화', '✅ 이미지 생성 25장', '✅ 모든 TTS 음성 10종', '✅ 시나리오 커스터마이징', '✅ 발음 교정 AI'],
      premium: ['✅ 월 1,200회 대화', '✅ 이미지 생성 60장', '✅ HD 이미지 생성 무제한', '✅ 실시간 음성 대화', '✅ 개인 맞춤 학습 분석', '✅ API 접근 권한', '✅ 우선 고객지원'],
    },
    footer: '지금 바로 시작하여 목표 언어 실력을 한 단계 업그레이드하세요! 🌟',
  },
  en: {
    heroDescription: 'Learn your target language through dramatic scenarios. Practice real-life situations with AI characters and improve naturally through immersive conversation.',
    startFree: '🚀 Start for free',
    featuresTitle: ['🎬 Immersive scenarios', '🎯 Real-time feedback', '🤖 Distinct AI characters'],
    featuresDescription: [
      'Practice your target language with dramatic scenarios based on real situations like business meetings, cafe orders, and travel.',
      'Get accurate feedback in real time on pronunciation, grammar, and vocabulary.',
      'Build fluency through natural conversations with AI characters that have diverse personalities and backgrounds.',
    ],
    pricingTitle: 'Pricing',
    perMonth: '/month',
    premiumBadge: 'Most advanced',
    planFeatures: {
      free: ['✅ 30 conversations/month', '✅ 1 image generation', '✅ Basic TTS voice', '✅ Includes watermark'],
      starter: ['✅ 300 conversations/month', '✅ 15 image generations', '✅ 5 premium TTS voices', '✅ Save/export conversations'],
      pro: ['✅ 600 conversations/month', '✅ 25 image generations', '✅ All 10 TTS voices', '✅ Scenario customization', '✅ AI pronunciation coaching'],
      premium: ['✅ 1,200 conversations/month', '✅ 60 image generations', '✅ Unlimited HD image generation', '✅ Real-time voice chat', '✅ Personalized learning analytics', '✅ API access', '✅ Priority support'],
    },
    footer: 'Start today and take your target language to the next level! 🌟',
  },
  ja: {
    heroDescription: 'ドラマチックなシナリオで目標言語を学びましょう。AIキャラクターと実際の場面を練習しながら、自然に実力を伸ばせます。',
    startFree: '🚀 無料で始める',
    featuresTitle: ['🎬 臨場感あるシナリオ', '🎯 リアルタイムフィードバック', '🤖 個性豊かなAIキャラクター'],
    featuresDescription: [
      'ビジネス会議、カフェでの注文、旅行など、実際の状況をもとにしたドラマチックなシナリオで目標言語を練習しましょう。',
      '発音、文法、語彙をリアルタイムで分析し、正確なフィードバックを提供します。',
      'さまざまな性格や背景を持つAIキャラクターとの自然な会話を通じて目標言語を学べます。',
    ],
    pricingTitle: '料金プラン',
    perMonth: '/月',
    premiumBadge: '最上位',
    planFeatures: {
      free: ['✅ 月30回の会話', '✅ 画像生成1枚', '✅ 基本TTS音声', '✅ ウォーターマーク付き'],
      starter: ['✅ 月300回の会話', '✅ 画像生成15枚', '✅ プレミアムTTS音声5種', '✅ 会話の保存/書き出し'],
      pro: ['✅ 月600回の会話', '✅ 画像生成25枚', '✅ 全10種のTTS音声', '✅ シナリオのカスタマイズ', '✅ 発音矯正AI'],
      premium: ['✅ 月1,200回の会話', '✅ 画像生成60枚', '✅ HD画像生成無制限', '✅ リアルタイム音声会話', '✅ 個別学習分析', '✅ APIアクセス', '✅ 優先サポート'],
    },
    footer: '今すぐ始めて、目標言語の実力をもう一段レベルアップしましょう！🌟',
  },
};

const SUBSCRIPTION_COPY: Partial<Record<LanguageCode, SubscriptionCopy>> = {
  ko: {
    loginRequired: '로그인 필요',
    loginRequiredDescription: '다시 로그인해주세요.',
    paymentError: '결제 오류',
    paymentErrorDescription: '결제 페이지를 불러오는데 실패했습니다.',
    genericError: '오류',
    billingPageErrorDescription: '구독 관리 페이지를 불러올 수 없습니다.',
    cancelScheduled: '구독 해지 예약',
    cancelFailed: '해지 실패',
    cancelFailedDescription: '구독 해지 중 오류가 발생했습니다.',
    freePlan: '무료 플랜',
    freePlanDescription: '무료 플랜은 결제가 필요하지 않습니다.',
    cancelConfirm: '정말로 구독을 해지하시겠습니까?\n\n해지 후에도 현재 결제 기간이 끝날 때까지 서비스를 이용하실 수 있습니다.',
    freePrice: '무료',
    conversationPerMonth: (count) => `월 ${count}회 대화`,
    imagesPerMonth: (count) => `이미지 ${count}장`,
    ttsPerMonth: (count) => `TTS ${count}회`,
    title: '요금제 선택',
    subtitle: '나에게 맞는 플랜을 선택하세요',
    backHome: '홈으로',
    currentSubscription: '현재 구독 상태',
    canceling: '해지 예정',
    active: '활성',
    expiresOn: '만료일:',
    nextBilling: '다음 결제:',
    manageBilling: '결제 관리',
    cancelSubscription: '구독 해지',
    premiumBadge: '최고급',
    perMonth: '/월',
    currentPlan: '현재 플랜',
    startPlan: (name) => `${name} 시작`,
    paymentInfo: '결제 안내',
    autoRenew: '자동 갱신',
    autoRenewDescription: '월 단위 자동 갱신, 언제든 해지 가능',
    securePayment: '안전한 결제',
    securePaymentDescription: 'Stripe 보안 결제',
    refundPolicy: '환불 정책',
    refundPolicyDescription: '7일 이내 청약철회 가능',
    terms: '이용약관',
    privacy: '개인정보처리방침',
    refund: '환불정책',
  },
  en: {
    loginRequired: 'Login required',
    loginRequiredDescription: 'Please sign in again.',
    paymentError: 'Payment error',
    paymentErrorDescription: 'Failed to load the checkout page.',
    genericError: 'Error',
    billingPageErrorDescription: 'Unable to open the billing management page.',
    cancelScheduled: 'Cancellation scheduled',
    cancelFailed: 'Cancellation failed',
    cancelFailedDescription: 'An error occurred while canceling your subscription.',
    freePlan: 'Free plan',
    freePlanDescription: 'The free plan does not require payment.',
    cancelConfirm: 'Are you sure you want to cancel your subscription?\n\nYou can still use the service until the end of your current billing period.',
    freePrice: 'Free',
    conversationPerMonth: (count) => `${count} conversations/month`,
    imagesPerMonth: (count) => `${count} images/month`,
    ttsPerMonth: (count) => `${count} TTS uses/month`,
    title: 'Choose your plan',
    subtitle: 'Pick the plan that fits you best',
    backHome: 'Back home',
    currentSubscription: 'Current subscription',
    canceling: 'Canceling',
    active: 'Active',
    expiresOn: 'Expires on:',
    nextBilling: 'Next billing:',
    manageBilling: 'Manage billing',
    cancelSubscription: 'Cancel subscription',
    premiumBadge: 'Most advanced',
    perMonth: '/month',
    currentPlan: 'Current plan',
    startPlan: (name) => `Start ${name}`,
    paymentInfo: 'Billing info',
    autoRenew: 'Auto-renewal',
    autoRenewDescription: 'Renews monthly and can be canceled anytime',
    securePayment: 'Secure payment',
    securePaymentDescription: 'Protected by Stripe',
    refundPolicy: 'Refund policy',
    refundPolicyDescription: 'Eligible for withdrawal within 7 days',
    terms: 'Terms',
    privacy: 'Privacy',
    refund: 'Refund policy',
  },
  ja: {
    loginRequired: 'ログインが必要です',
    loginRequiredDescription: 'もう一度ログインしてください。',
    paymentError: '決済エラー',
    paymentErrorDescription: '決済ページの読み込みに失敗しました。',
    genericError: 'エラー',
    billingPageErrorDescription: '請求管理ページを開けませんでした。',
    cancelScheduled: '解約予約',
    cancelFailed: '解約失敗',
    cancelFailedDescription: '解約処理中にエラーが発生しました。',
    freePlan: '無料プラン',
    freePlanDescription: '無料プランでは支払いは不要です。',
    cancelConfirm: '本当にサブスクリプションを解約しますか？\n\n解約後も現在の請求期間の終了まではサービスを利用できます。',
    freePrice: '無料',
    conversationPerMonth: (count) => `月${count}回の会話`,
    imagesPerMonth: (count) => `画像${count}枚`,
    ttsPerMonth: (count) => `TTS ${count}回`,
    title: '料金プランを選択',
    subtitle: '自分に合ったプランを選んでください',
    backHome: 'ホームへ',
    currentSubscription: '現在の契約状況',
    canceling: '解約予定',
    active: '有効',
    expiresOn: '有効期限:',
    nextBilling: '次回請求:',
    manageBilling: '支払い管理',
    cancelSubscription: '解約する',
    premiumBadge: '最上位',
    perMonth: '/月',
    currentPlan: '現在のプラン',
    startPlan: (name) => `${name}を開始`,
    paymentInfo: 'お支払い案内',
    autoRenew: '自動更新',
    autoRenewDescription: '毎月自動更新、いつでも解約可能',
    securePayment: '安全な決済',
    securePaymentDescription: 'Stripeによる安全な決済',
    refundPolicy: '返金ポリシー',
    refundPolicyDescription: '7日以内は撤回可能',
    terms: '利用規約',
    privacy: 'プライバシーポリシー',
    refund: '返金ポリシー',
  },
};

const AUTH_COPY: Partial<Record<LanguageCode, AuthCopy>> = {
  ko: {
    loginFailed: '로그인 실패',
    loginFailedDescription: '이메일과 비밀번호를 확인해주세요.',
    signupFailed: '회원가입 실패',
    signupFailedDescription: '회원가입 중 오류가 발생했습니다.',
    inputError: '입력 오류',
    inputErrorDescription: '모든 필드를 입력해주세요.',
    copied: '복사 완료',
    copiedDescription: '링크가 클립보드에 복사되었습니다.',
    back: '뒤로가기',
    subtitle: '드라마틱한 시나리오로 목표 언어를 배워보세요',
    inAppTitle: '📱 카카오톡에서 보고 계신가요?',
    inAppDescription: '구글 로그인은 크롬이나 사파리 브라우저에서만 가능해요.',
    inAppDescriptionLine2: '구글 로그인 버튼을 누르면 자동으로 외부 브라우저로 이동됩니다.',
    login: '로그인',
    signup: '회원가입',
    loginDescription: '계정에 로그인하세요',
    signupDescription: '새 계정을 만드세요',
    firstName: '이름',
    lastName: '성',
    email: '이메일',
    password: '비밀번호',
    or: '또는',
    externalBrowserRequired: '외부 브라우저 필요',
    externalBrowserDescription: '구글 로그인은 보안상 카카오톡 브라우저에서는 사용할 수 없습니다.',
    externalBrowserDescriptionLine2: '크롬이나 사파리 브라우저에서 열어주세요.',
    openExternalBrowser: '외부 브라우저에서 열기',
    copyLink: '링크 복사하기',
    cancel: '취소',
    continueWithGoogle: '구글로 로그인',
    toggleAuth: '이미 계정이 있으신가요? 로그인',
    toggleSignup: '계정이 없으신가요? 회원가입',
  },
  en: {
    loginFailed: 'Login failed',
    loginFailedDescription: 'Please check your email and password.',
    signupFailed: 'Sign-up failed',
    signupFailedDescription: 'An error occurred during sign-up.',
    inputError: 'Input error',
    inputErrorDescription: 'Please fill in all fields.',
    copied: 'Copied',
    copiedDescription: 'The link has been copied to your clipboard.',
    back: 'Back',
    subtitle: 'Learn your target language through dramatic scenarios',
    inAppTitle: '📱 Are you viewing this in KakaoTalk?',
    inAppDescription: 'Google sign-in works only in Chrome or Safari.',
    inAppDescriptionLine2: 'Press the Google sign-in button to open an external browser automatically.',
    login: 'Log in',
    signup: 'Sign up',
    loginDescription: 'Log in to your account',
    signupDescription: 'Create a new account',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    password: 'Password',
    or: 'Or',
    externalBrowserRequired: 'External browser required',
    externalBrowserDescription: 'For security reasons, Google sign-in is not available in the KakaoTalk browser.',
    externalBrowserDescriptionLine2: 'Please open this page in Chrome or Safari.',
    openExternalBrowser: 'Open in external browser',
    copyLink: 'Copy link',
    cancel: 'Cancel',
    continueWithGoogle: 'Continue with Google',
    toggleAuth: 'Already have an account? Log in',
    toggleSignup: `Don't have an account? Sign up`,
  },
  ja: {
    loginFailed: 'ログイン失敗',
    loginFailedDescription: 'メールアドレスとパスワードを確認してください。',
    signupFailed: '会員登録失敗',
    signupFailedDescription: '会員登録中にエラーが発生しました。',
    inputError: '入力エラー',
    inputErrorDescription: 'すべての項目を入力してください。',
    copied: 'コピー完了',
    copiedDescription: 'リンクをクリップボードにコピーしました。',
    back: '戻る',
    subtitle: 'ドラマチックなシナリオで目標言語を学びましょう',
    inAppTitle: '📱 KakaoTalk内で開いていますか？',
    inAppDescription: 'GoogleログインはChromeまたはSafariでのみ利用できます。',
    inAppDescriptionLine2: 'Googleログインボタンを押すと外部ブラウザへ自動移動します。',
    login: 'ログイン',
    signup: '会員登録',
    loginDescription: 'アカウントにログインしてください',
    signupDescription: '新しいアカウントを作成してください',
    firstName: '名',
    lastName: '姓',
    email: 'メールアドレス',
    password: 'パスワード',
    or: 'または',
    externalBrowserRequired: '外部ブラウザが必要です',
    externalBrowserDescription: 'セキュリティ上、GoogleログインはKakaoTalkブラウザでは利用できません。',
    externalBrowserDescriptionLine2: 'ChromeまたはSafariで開いてください。',
    openExternalBrowser: '外部ブラウザで開く',
    copyLink: 'リンクをコピー',
    cancel: 'キャンセル',
    continueWithGoogle: 'Googleでログイン',
    toggleAuth: 'すでにアカウントをお持ちですか？ ログイン',
    toggleSignup: 'アカウントをお持ちでないですか？ 会員登録',
  },
};

const AUDIENCE_SELECTION_COPY: Partial<Record<LanguageCode, AudienceSelectionCopy>> = {
  ko: {
    title: '어떤 분야를 학습하고 싶으신가요?',
    subtitle: '당신의 목표에 맞는 학습 과정을 선택해주세요',
    cefrLabel: 'CEFR 레벨',
    options: {
      student: { title: '중고등학생', description: '학교·시험·발표 상황에 맞춘 체계적 학습', scenarios: ['교실 상황', '친구들과 대화', '발표 연습'], startButton: '학생 코스 시작' },
      general: { title: '일반인', description: '일상생활과 여행에서 바로 쓰는 실용 회화 학습', scenarios: ['여행 상황', '쇼핑', '레스토랑'], startButton: '일상 코스 시작' },
      business: { title: '비즈니스', description: '업무와 비즈니스 상황에 맞춘 전문 회화 학습', scenarios: ['미팅', '프레젠테이션', '이메일'], startButton: '비즈니스 코스 시작' },
    },
  },
  en: {
    title: 'Which track would you like to study?',
    subtitle: 'Choose the learning path that matches your goals',
    cefrLabel: 'CEFR level',
    options: {
      student: { title: 'Students', description: 'Structured practice for school, exams, and presentations', scenarios: ['Classroom scenes', 'Talking with friends', 'Presentation practice'], startButton: 'Start student track' },
      general: { title: 'General', description: 'Practical conversation for daily life and travel', scenarios: ['Travel situations', 'Shopping', 'Restaurants'], startButton: 'Start daily-life track' },
      business: { title: 'Business', description: 'Professional conversation for work and business settings', scenarios: ['Meetings', 'Presentations', 'Email'], startButton: 'Start business track' },
    },
  },
  ja: {
    title: 'どの分野を学びたいですか？',
    subtitle: 'あなたの目標に合った学習コースを選んでください',
    cefrLabel: 'CEFRレベル',
    options: {
      student: { title: '学生', description: '学校・試験・発表に向けた体系的な学習', scenarios: ['教室の場面', '友だちとの会話', '発表練習'], startButton: '学生コースを始める' },
      general: { title: '一般', description: '日常生活や旅行で使う実用会話の学習', scenarios: ['旅行シーン', '買い物', 'レストラン'], startButton: '日常コースを始める' },
      business: { title: 'ビジネス', description: '業務やビジネス場面に向けた専門会話の学習', scenarios: ['ミーティング', 'プレゼン', 'メール'], startButton: 'ビジネスコースを始める' },
    },
  },
};

const HOME_QUICK_CHIPS: Partial<Record<LanguageCode, QuickChipCopy[]>> = {
  ko: [
    { label: '여행', scenarioId: 'travel', audience: 'general' },
    { label: '카페', scenarioId: 'cafe_order', audience: 'general' },
    { label: '학교', scenarioId: 'cafeteria', audience: 'student' },
    { label: '비즈니스', scenarioId: 'meeting_opener', audience: 'business' },
    { label: '자유대화', scenarioId: 'roommate_chat', audience: 'general' },
  ],
  en: [
    { label: 'Travel', scenarioId: 'travel', audience: 'general' },
    { label: 'Cafe', scenarioId: 'cafe_order', audience: 'general' },
    { label: 'School', scenarioId: 'cafeteria', audience: 'student' },
    { label: 'Business', scenarioId: 'meeting_opener', audience: 'business' },
    { label: 'Free talk', scenarioId: 'roommate_chat', audience: 'general' },
  ],
  ja: [
    { label: '旅行', scenarioId: 'travel', audience: 'general' },
    { label: 'カフェ', scenarioId: 'cafe_order', audience: 'general' },
    { label: '学校', scenarioId: 'cafeteria', audience: 'student' },
    { label: 'ビジネス', scenarioId: 'meeting_opener', audience: 'business' },
    { label: '自由会話', scenarioId: 'roommate_chat', audience: 'general' },
  ],
};


NAVIGATION_COPY.fr = {
  ...NAVIGATION_COPY.en!,
  logoTitle: '🎭 Tuteur de langues IA',
  targetLanguage: 'Cible',
  supportLanguage: 'Support',
  uiLanguage: 'Interface',
  home: 'Accueil',
  learning: 'Apprendre',
  character: 'Personnage',
  subscription: 'Abonnement',
  admin: 'Admin',
  startLearning: 'Commencer',
  logout: 'Déconnexion',
};

NAVIGATION_COPY.es = {
  ...NAVIGATION_COPY.en!,
  logoTitle: '🎭 Tutor de idiomas con IA',
  targetLanguage: 'Objetivo',
  supportLanguage: 'Apoyo',
  uiLanguage: 'Interfaz',
  home: 'Inicio',
  learning: 'Aprender',
  character: 'Personaje',
  subscription: 'Suscripción',
  admin: 'Admin',
  startLearning: 'Empezar',
  logout: 'Cerrar sesión',
};

USAGE_WARNING_COPY.fr = {
  ...USAGE_WARNING_COPY.en!,
  title: "📊 Aperçu de l'utilisation",
  description: 'Utilisation mensuelle des conversations du forfait gratuit',
  usageLabel: 'Utilisation',
  countSuffix: 'tours',
  limitReached: (daysUntilReset) => `⛔ Vous avez utilisé toutes les conversations gratuites du mois. Réinitialisation dans ${daysUntilReset} jours, ou passez à une offre payante maintenant.`,
  nearLimit: (remaining) => `⚠️ Vous approchez de la limite gratuite. Il reste ${remaining} tours.`,
  resetIn: (daysUntilReset) => `Prochaine réinitialisation : dans ${daysUntilReset} jours`,
  upgrade: 'Passer à une offre payante',
};

USAGE_WARNING_COPY.es = {
  ...USAGE_WARNING_COPY.en!,
  title: '📊 Resumen de uso',
  description: 'Uso mensual de conversaciones del plan gratuito',
  usageLabel: 'Uso',
  countSuffix: 'turnos',
  limitReached: (daysUntilReset) => `⛔ Ya usaste todas las conversaciones gratuitas de este mes. Se restablecen en ${daysUntilReset} días, o puedes mejorar tu plan ahora.`,
  nearLimit: (remaining) => `⚠️ Estás cerca del límite gratuito. Quedan ${remaining} turnos.`,
  resetIn: (daysUntilReset) => `Próximo reinicio: en ${daysUntilReset} días`,
  upgrade: 'Mejorar plan',
};

HOME_COPY.fr = {
  ...HOME_COPY.en!,
  greeting: (name) => `Bonjour, ${name}`,
  prompt: (targetLanguageLabel) => `Quelle scène en ${targetLanguageLabel} voulez-vous pratiquer aujourd'hui ?`,
  todayRecommendation: "Scène recommandée du jour",
  startNow: 'Commencer',
  quickEntry: 'Accès rapide',
  continueSession: 'Reprendre la session',
  openRecentConversation: 'Ouvrir la conversation récente',
  reviewSavedExpressions: 'Réviser les expressions enregistrées',
  reviewProgress: (targetLanguageLabel) => `Consultez vos progrès en ${targetLanguageLabel}.`,
  premiumMode: "Mode d'apprentissage premium",
  premiumDescription: 'Débloquez des conversations illimitées, des retours plus détaillés et des scénarios avancés.',
  upgrade: 'Mettre à niveau',
  logout: 'Déconnexion',
  freeTier: 'Gratuit',
  guestName: 'Apprenant',
};

HOME_COPY.es = {
  ...HOME_COPY.en!,
  greeting: (name) => `Hola, ${name}`,
  prompt: (targetLanguageLabel) => `¿Qué escena en ${targetLanguageLabel} quieres practicar hoy?`,
  todayRecommendation: 'Escena recomendada de hoy',
  startNow: 'Empezar ahora',
  quickEntry: 'Acceso rápido',
  continueSession: 'Continuar sesión anterior',
  openRecentConversation: 'Abrir conversación reciente',
  reviewSavedExpressions: 'Repasar expresiones guardadas',
  reviewProgress: (targetLanguageLabel) => `Consulta tu progreso en ${targetLanguageLabel}.`,
  premiumMode: 'Modo de aprendizaje premium',
  premiumDescription: 'Desbloquea conversaciones ilimitadas, comentarios más profundos y escenarios avanzados.',
  upgrade: 'Mejorar',
  logout: 'Cerrar sesión',
  freeTier: 'Gratis',
  guestName: 'Estudiante',
};

const PHASE3_UI_FALLBACKS: LanguageCode[] = ['fr', 'es', 'zh', 'th', 'de', 'ar', 'vi'];
for (const languageCode of PHASE3_UI_FALLBACKS) {
  SCENARIO_COPY[languageCode] ??= SCENARIO_COPY.en!;
  CHARACTER_COPY[languageCode] ??= CHARACTER_COPY.en!;
  DRAMA_SCENE_COPY[languageCode] ??= DRAMA_SCENE_COPY.en!;
  PRACTICE_PAGE_COPY[languageCode] ??= PRACTICE_PAGE_COPY.en!;
  CONVERSATION_HOOK_COPY[languageCode] ??= CONVERSATION_HOOK_COPY.en!;
  RECORDER_COPY[languageCode] ??= RECORDER_COPY.en!;
  POLICY_PAGE_COPY[languageCode] ??= POLICY_PAGE_COPY.en!;
  ADMIN_COPY[languageCode] ??= ADMIN_COPY.en!;
  LANDING_COPY[languageCode] ??= LANDING_COPY.en!;
  SUBSCRIPTION_COPY[languageCode] ??= SUBSCRIPTION_COPY.en!;
  AUTH_COPY[languageCode] ??= AUTH_COPY.en!;
  AUDIENCE_SELECTION_COPY[languageCode] ??= AUDIENCE_SELECTION_COPY.en!;
  HOME_QUICK_CHIPS[languageCode] ??= HOME_QUICK_CHIPS.en!;
}

export function getScenarioCopy(languageCode: LanguageCode): ScenarioCopy {
  return SCENARIO_COPY[languageCode] ?? SCENARIO_COPY.en!;
}

export function getCharacterCopy(languageCode: LanguageCode): CharacterCopy {
  return CHARACTER_COPY[languageCode] ?? CHARACTER_COPY.en!;
}

export function getDramaSceneCopy(languageCode: LanguageCode): DramaSceneCopy {
  return DRAMA_SCENE_COPY[languageCode] ?? DRAMA_SCENE_COPY.en!;
}

export function getPracticePageCopy(languageCode: LanguageCode): PracticePageCopy {
  return PRACTICE_PAGE_COPY[languageCode] ?? PRACTICE_PAGE_COPY.en!;
}

export function getConversationHookCopy(languageCode: LanguageCode): ConversationHookCopy {
  return CONVERSATION_HOOK_COPY[languageCode] ?? CONVERSATION_HOOK_COPY.en!;
}

export function getRecorderCopy(languageCode: LanguageCode): RecorderCopy {
  return RECORDER_COPY[languageCode] ?? RECORDER_COPY.en!;
}

export function getPolicyPageCopy(languageCode: LanguageCode): PolicyPageCopy {
  return POLICY_PAGE_COPY[languageCode] ?? POLICY_PAGE_COPY.en!;
}

export function getAdminCopy(languageCode: LanguageCode): AdminCopy {
  return ADMIN_COPY[languageCode] ?? ADMIN_COPY.en!;
}

export function getLandingCopy(languageCode: LanguageCode): LandingCopy {
  return LANDING_COPY[languageCode] ?? LANDING_COPY.en!;
}

export function getSubscriptionCopy(languageCode: LanguageCode): SubscriptionCopy {
  return SUBSCRIPTION_COPY[languageCode] ?? SUBSCRIPTION_COPY.en!;
}

export function getAuthCopy(languageCode: LanguageCode): AuthCopy {
  return AUTH_COPY[languageCode] ?? AUTH_COPY.en!;
}

export function getAudienceSelectionCopy(languageCode: LanguageCode): AudienceSelectionCopy {
  return AUDIENCE_SELECTION_COPY[languageCode] ?? AUDIENCE_SELECTION_COPY.en!;
}

export function getHomeQuickChips(languageCode: LanguageCode): QuickChipCopy[] {
  return HOME_QUICK_CHIPS[languageCode] ?? HOME_QUICK_CHIPS.en!;
}

export function getNavigationCopy(languageCode: LanguageCode): NavigationCopy {
  return NAVIGATION_COPY[languageCode] ?? NAVIGATION_COPY.en!;
}

export function getTierLabel(languageCode: LanguageCode, tier: string): string {
  const copy = getNavigationCopy(languageCode);
  switch (tier) {
    case 'free':
    case 'fluent_free':
      return copy.tierFree;
    case 'starter':
    case 'fluent_starter':
      return copy.tierStarter;
    case 'pro':
    case 'fluent_pro':
      return copy.tierPro;
    case 'premium':
    case 'fluent_premium':
      return copy.tierPremium;
    default:
      return tier;
  }
}
