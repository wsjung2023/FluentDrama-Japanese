import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getPolicyPageCopy } from "@/constants/uiCopy";
import type { LanguageCode } from "@shared/language";

type PolicyLocale = Extract<LanguageCode, "ko" | "en" | "ja">;
type TermsSection = {
  heading: string;
  paragraphs?: readonly string[];
  ordered?: readonly string[];
  unordered?: readonly string[];
  nested?: readonly string[];
};

const TERMS_CONTENT = {
  ko: {
    title: "이용약관",
    sections: [
      {
        heading: "제1조 (목적)",
        paragraphs: ['본 약관은 FluentDrama(이하 "회사")가 제공하는 AI 일본어 튜터링 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.'],
      },
      {
        heading: "제2조 (용어의 정의)",
        ordered: [
          '"서비스"란 회사가 제공하는 AI 기반 일본어 학습, 대화 연습, 캐릭터 생성 등의 서비스를 말합니다.',
          '"회원"이란 본 약관에 동의하고 회사와 이용계약을 체결한 자를 말합니다.',
          '"유료서비스"란 회원이 일정 금액을 결제하고 이용하는 서비스를 말합니다.',
        ],
      },
      {
        heading: "제3조 (약관의 효력 및 변경)",
        ordered: [
          "본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.",
          "회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.",
          "변경된 약관은 공지 후 7일이 경과한 날부터 효력이 발생합니다.",
        ],
      },
      {
        heading: "제4조 (서비스의 내용)",
        paragraphs: ["회사는 다음과 같은 서비스를 제공합니다:"],
        unordered: [
          "AI 캐릭터와의 일본어 대화 연습",
          "AI 이미지 생성을 통한 캐릭터 시각화",
          "음성 인식 및 TTS(Text-to-Speech) 기능",
          "대화 내용 분석 및 피드백 제공",
          "학습 진도 관리 및 통계",
        ],
      },
      {
        heading: "제5조 (회원가입)",
        ordered: [
          "회원가입은 이용자가 본 약관에 동의한 후 회원가입 신청을 하고, 회사가 이를 승낙함으로써 성립됩니다.",
          "회사는 다음 각 호에 해당하는 경우 회원가입을 거부할 수 있습니다:",
        ],
        nested: ["타인의 정보를 도용한 경우", "허위 정보를 기재한 경우", "기타 회원으로 등록하는 것이 부적절하다고 판단되는 경우"],
      },
      {
        heading: "제6조 (유료서비스)",
        ordered: [
          "유료서비스의 이용요금 및 결제방법은 서비스 내 안내에 따릅니다.",
          "유료서비스는 월 단위 정기결제 방식으로 제공됩니다.",
          "결제 취소 및 환불은 관련 법령 및 회사의 환불정책에 따릅니다.",
        ],
      },
      {
        heading: "제7조 (서비스 이용 제한)",
        paragraphs: ["회사는 회원이 다음 각 호에 해당하는 경우 서비스 이용을 제한할 수 있습니다:"],
        unordered: [
          "본 약관을 위반한 경우",
          "타인의 서비스 이용을 방해하거나 정보를 도용한 경우",
          "서비스를 이용하여 법령 또는 공서양속에 반하는 행위를 한 경우",
          "불법 콘텐츠를 생성하거나 유포한 경우",
        ],
      },
      {
        heading: "제8조 (면책조항)",
        ordered: [
          "회사는 천재지변, 전쟁 등 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.",
          "회사는 회원의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.",
          "AI가 생성한 콘텐츠의 정확성에 대해 회사는 보증하지 않습니다.",
        ],
      },
      {
        heading: "부칙",
        paragraphs: ["본 약관은 2025년 1월 25일부터 시행됩니다."],
      },
    ],
  },
  en: {
    title: "Terms of Service",
    sections: [
      {
        heading: "Article 1 (Purpose)",
        paragraphs: ['These Terms govern the rights, obligations, and responsibilities between FluentDrama ("the Company") and users in connection with the AI Japanese tutoring service ("the Service") provided by the Company.'],
      },
      {
        heading: "Article 2 (Definitions)",
        ordered: [
          '"Service" refers to AI-based Japanese learning, conversation practice, character generation, and related services provided by the Company.',
          '"Member" refers to a person who agrees to these Terms and enters into a service agreement with the Company.',
          '"Paid Service" refers to services used after payment of a specified fee.',
        ],
      },
      {
        heading: "Article 3 (Effect and Amendment of Terms)",
        ordered: [
          "These Terms take effect when posted on the service screen or otherwise notified to members.",
          "The Company may amend these Terms where necessary to the extent permitted by applicable law.",
          "Amended Terms take effect seven days after notice is given.",
        ],
      },
      {
        heading: "Article 4 (Service Contents)",
        paragraphs: ["The Company provides the following services:"],
        unordered: [
          "Japanese conversation practice with AI characters",
          "Character visualization through AI image generation",
          "Speech recognition and TTS (Text-to-Speech) features",
          "Conversation analysis and feedback",
          "Learning progress management and statistics",
        ],
      },
      {
        heading: "Article 5 (Membership Registration)",
        ordered: [
          "Membership is established when a user agrees to these Terms, applies for registration, and the Company accepts the application.",
          "The Company may refuse registration in the following cases:",
        ],
        nested: ["Using another person's information", "Providing false information", "Any other case deemed inappropriate for registration"],
      },
      {
        heading: "Article 6 (Paid Services)",
        ordered: [
          "Fees and payment methods for paid services follow the guidance provided in the Service.",
          "Paid services are provided on a monthly recurring billing basis.",
          "Payment cancellation and refunds are governed by applicable law and the Company's refund policy.",
        ],
      },
      {
        heading: "Article 7 (Restrictions on Service Use)",
        paragraphs: ["The Company may restrict service use in the following cases:"],
        unordered: [
          "Violation of these Terms",
          "Interfering with another person's use of the Service or misusing another person's information",
          "Using the Service for acts contrary to law or public order and morals",
          "Generating or distributing illegal content",
        ],
      },
      {
        heading: "Article 8 (Disclaimer)",
        ordered: [
          "The Company is not liable where it cannot provide the Service due to force majeure such as natural disasters or war.",
          "The Company is not liable for service 장애 caused by a member's fault.",
          "The Company does not guarantee the accuracy of AI-generated content.",
        ],
      },
      {
        heading: "Supplementary Provision",
        paragraphs: ["These Terms take effect on January 25, 2025."],
      },
    ],
  },
  ja: {
    title: "利用規約",
    sections: [
      {
        heading: "第1条（目的）",
        paragraphs: ['本規約は、FluentDrama（以下「会社」）が提供するAI日本語チュータリングサービス（以下「サービス」）の利用に関して、会社と利用者との権利・義務および責任事項を定めることを目的とします。'],
      },
      {
        heading: "第2条（用語の定義）",
        ordered: [
          '「サービス」とは、会社が提供するAIベースの日本語学習、会話練習、キャラクター生成などのサービスをいいます。',
          '「会員」とは、本規約に同意し、会社と利用契約を締結した者をいいます。',
          '「有料サービス」とは、会員が一定の料金を支払って利用するサービスをいいます。',
        ],
      },
      {
        heading: "第3条（規約の効力および変更）",
        ordered: [
          "本規約は、サービス画面への掲示またはその他の方法による通知によって効力を生じます。",
          "会社は、関連法令に違反しない範囲で本規約を変更できるものとします。",
          "変更後の規約は、告知後7日が経過した日から効力を生じます。",
        ],
      },
      {
        heading: "第4条（サービス内容）",
        paragraphs: ["会社は、次の各サービスを提供します。"],
        unordered: [
          "AIキャラクターとの日本語会話練習",
          "AI画像生成によるキャラクターの可視化",
          "音声認識およびTTS（Text-to-Speech）機能",
          "会話内容の分析とフィードバック提供",
          "学習進捗の管理および統計",
        ],
      },
      {
        heading: "第5条（会員登録）",
        ordered: [
          "会員登録は、利用者が本規約に同意したうえで会員登録を申請し、会社がこれを承認することで成立します。",
          "会社は、次の各号に該当する場合、会員登録を拒否することができます。",
        ],
        nested: ["他人の情報を盗用した場合", "虚偽の情報を記載した場合", "その他、会員登録が不適切と判断される場合"],
      },
      {
        heading: "第6条（有料サービス）",
        ordered: [
          "有料サービスの利用料金および支払方法は、サービス内の案内に従います。",
          "有料サービスは月単位の定期決済方式で提供されます。",
          "決済取消および返金は、関連法令および会社の返金ポリシーに従います。",
        ],
      },
      {
        heading: "第7条（サービス利用制限）",
        paragraphs: ["会社は、会員が次の各号に該当する場合、サービス利用を制限することがあります。"],
        unordered: [
          "本規約に違反した場合",
          "他人のサービス利用を妨害したり、他人の情報を盗用した場合",
          "サービスを利用して法令または公序良俗に反する行為をした場合",
          "違法コンテンツを生成または流布した場合",
        ],
      },
      {
        heading: "第8条（免責）",
        ordered: [
          "会社は、天災、戦争などの不可抗力によりサービスを提供できない場合、責任を負いません。",
          "会社は、会員の責めに帰すべき事由によるサービス利用障害について責任を負いません。",
          "会社は、AIが生成したコンテンツの正確性を保証しません。",
        ],
      },
      {
        heading: "附則",
        paragraphs: ["本規約は2025年1月25日から施行されます。"],
      },
    ],
  },
} as const;

export default function Terms() {
  const { setCurrentPage, uiLanguage } = useAppStore();
  const copy = getPolicyPageCopy(uiLanguage);
  const locale: PolicyLocale = uiLanguage === "ko" || uiLanguage === "ja" ? uiLanguage : "en";
  const content = TERMS_CONTENT[locale];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-safe">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-3xl">
        <div className="mb-4 sm:mb-8">
          <Button variant="ghost" size="sm" onClick={() => setCurrentPage('user-home')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {copy.back}
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
            <CardTitle className="text-xl sm:text-2xl">{content.title}</CardTitle>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{copy.updatedOn}</p>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6 text-sm sm:text-base leading-relaxed">
            {content.sections.map((section: TermsSection) => (
              <section key={section.heading} className="mb-6 last:mb-0">
                <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 dark:text-white">{section.heading}</h2>
                {section.paragraphs?.map((paragraph: string) => (
                  <p key={paragraph} className="mb-2 text-gray-700 dark:text-gray-300 last:mb-0">{paragraph}</p>
                ))}
                {section.ordered && (
                  <ol className="list-decimal pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
                    {section.ordered.map((item: string, index: number, orderedItems: readonly string[]) => (
                      <li key={item}>
                        {item}
                        {index === orderedItems.length - 1 && section.nested && (
                          <ul className="list-disc pl-5 mt-1.5 space-y-1">
                            {section.nested.map((nestedItem: string) => <li key={nestedItem}>{nestedItem}</li>)}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
                {section.unordered && (
                  <ul className="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
                    {section.unordered.map((item: string) => <li key={item}>{item}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
