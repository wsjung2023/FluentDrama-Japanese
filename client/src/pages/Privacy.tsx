import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getPolicyPageCopy } from "@/constants/uiCopy";
import type { LanguageCode } from "@shared/language";

type PolicyLocale = Extract<LanguageCode, "ko" | "en" | "ja">;
type PrivacySection = {
  heading: string;
  paragraphs?: readonly string[];
  ordered?: readonly string[];
  unordered?: readonly string[];
  nested?: readonly string[];
  tableHeaders?: readonly string[];
  tableRows?: ReadonlyArray<readonly string[]>;
  contacts?: readonly string[];
};

const PRIVACY_CONTENT = {
  ko: {
    title: "개인정보처리방침",
    sections: [
      { heading: "제1조 (개인정보의 수집 항목)", paragraphs: ["회사는 다음과 같은 개인정보를 수집합니다:"], unordered: ["필수항목: 이메일 주소, 비밀번호(암호화 저장)", "선택항목: 이름, 프로필 이미지", "소셜 로그인 시: 소셜 계정 고유 ID, 이메일, 프로필 정보", "자동 수집: 서비스 이용 기록, 접속 로그, IP 주소"] },
      { heading: "제2조 (수집 및 이용 목적)", paragraphs: ["수집한 개인정보는 다음의 목적으로 이용됩니다:"], unordered: ["회원 가입 및 관리", "서비스 제공 및 개선", "결제 및 환불 처리", "고객 문의 응대", "서비스 관련 공지사항 전달"] },
      { heading: "제3조 (보유 및 이용 기간)", ordered: ["회원 탈퇴 시까지 보유하며, 탈퇴 후 즉시 파기합니다.", "단, 관련 법령에 의해 보존이 필요한 경우:"], nested: ["계약 또는 청약철회 등에 관한 기록: 5년", "대금결제 및 재화 등의 공급에 관한 기록: 5년", "소비자 불만 또는 분쟁처리에 관한 기록: 3년"] },
      { heading: "제4조 (개인정보의 제3자 제공)", paragraphs: ["회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:"], unordered: ["이용자가 사전에 동의한 경우", "법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우"] },
      { heading: "제5조 (개인정보 처리 위탁)", paragraphs: ["회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁합니다:"], tableHeaders: ["수탁업체", "위탁업무"], tableRows: [["Stripe", "결제 처리"], ["OpenAI", "AI 대화 생성"], ["Neon", "데이터베이스 호스팅"]] },
      { heading: "제6조 (이용자의 권리)", paragraphs: ["이용자는 다음과 같은 권리를 행사할 수 있습니다:"], unordered: ["개인정보 열람 요구", "오류 등이 있을 경우 정정 요구", "삭제 요구", "처리정지 요구"] },
      { heading: "제7조 (안전성 확보 조치)", paragraphs: ["회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취합니다:"], unordered: ["개인정보의 암호화", "해킹 등에 대비한 기술적 대책", "개인정보에 대한 접근 제한", "개인정보 취급 직원의 최소화 및 교육"] },
      { heading: "제8조 (개인정보 보호책임자)", contacts: ["담당자: 개인정보보호팀", "이메일: privacy@fluentdrama.com"] },
      { heading: "부칙", paragraphs: ["본 개인정보처리방침은 2025년 1월 25일부터 시행됩니다."] },
    ],
  },
  en: {
    title: "Privacy Policy",
    sections: [
      { heading: "Article 1 (Items of Personal Information Collected)", paragraphs: ["The Company collects the following personal information:"], unordered: ["Required: email address, password (stored in encrypted form)", "Optional: name, profile image", "For social login: social account unique ID, email, profile information", "Automatically collected: service usage history, access logs, IP address"] },
      { heading: "Article 2 (Purpose of Collection and Use)", paragraphs: ["Collected personal information is used for the following purposes:"], unordered: ["Membership registration and management", "Service provision and improvement", "Payment and refund processing", "Responding to customer inquiries", "Delivering service-related notices"] },
      { heading: "Article 3 (Retention and Use Period)", ordered: ["Personal information is retained until the member account is deleted and destroyed immediately after withdrawal.", "However, where retention is required by applicable law:"], nested: ["Records on contracts or withdrawals: 5 years", "Records on payments and supply of goods/services: 5 years", "Records on consumer complaints or dispute resolution: 3 years"] },
      { heading: "Article 4 (Provision to Third Parties)", paragraphs: ["As a rule, the Company does not provide users' personal information to third parties. Exceptions include the following cases:"], unordered: ["Where the user has given prior consent", "Where disclosure is required by law or requested by investigative authorities under legally prescribed procedures"] },
      { heading: "Article 5 (Outsourcing of Personal Information Processing)", paragraphs: ["For service operation, the Company entrusts personal information processing as follows:"], tableHeaders: ["Provider", "Entrusted task"], tableRows: [["Stripe", "Payment processing"], ["OpenAI", "AI conversation generation"], ["Neon", "Database hosting"]] },
      { heading: "Article 6 (User Rights)", paragraphs: ["Users may exercise the following rights:"], unordered: ["Request access to personal information", "Request correction of errors", "Request deletion", "Request suspension of processing"] },
      { heading: "Article 7 (Security Measures)", paragraphs: ["The Company takes the following measures to ensure the security of personal information:"], unordered: ["Encryption of personal information", "Technical measures against hacking and similar risks", "Access restriction to personal information", "Minimization and training of staff handling personal information"] },
      { heading: "Article 8 (Data Protection Officer)", contacts: ["Department: Privacy Protection Team", "Email: privacy@fluentdrama.com"] },
      { heading: "Supplementary Provision", paragraphs: ["This Privacy Policy takes effect on January 25, 2025."] },
    ],
  },
  ja: {
    title: "プライバシーポリシー",
    sections: [
      { heading: "第1条（収集する個人情報）", paragraphs: ["会社は次の個人情報を収集します。"], unordered: ["必須項目: メールアドレス、パスワード（暗号化保存）", "任意項目: 名前、プロフィール画像", "ソーシャルログイン時: ソーシャルアカウント固有ID、メール、プロフィール情報", "自動収集: サービス利用履歴、アクセスログ、IPアドレス"] },
      { heading: "第2条（収集および利用目的）", paragraphs: ["収集した個人情報は次の目的で利用されます。"], unordered: ["会員登録および管理", "サービス提供および改善", "決済および返金処理", "お問い合わせ対応", "サービス関連のお知らせ配信"] },
      { heading: "第3条（保有および利用期間）", ordered: ["会員退会時まで保有し、退会後は直ちに破棄します。", "ただし、関連法令により保存が必要な場合:"], nested: ["契約または申込み撤回等に関する記録: 5年", "代金決済および財貨等の供給に関する記録: 5年", "消費者苦情または紛争処理に関する記録: 3年"] },
      { heading: "第4条（第三者提供）", paragraphs: ["会社は原則として利用者の個人情報を第三者に提供しません。ただし、次の場合は例外とします。"], unordered: ["利用者が事前に同意した場合", "法令に基づく場合、または捜査目的で適法な手続により捜査機関から要請がある場合"] },
      { heading: "第5条（個人情報処理の委託）", paragraphs: ["会社はサービス提供のため、次のとおり個人情報処理を委託します。"], tableHeaders: ["委託先", "委託業務"], tableRows: [["Stripe", "決済処理"], ["OpenAI", "AI会話生成"], ["Neon", "データベースホスティング"]] },
      { heading: "第6条（利用者の権利）", paragraphs: ["利用者は次の権利を行使できます。"], unordered: ["個人情報の閲覧請求", "誤り等がある場合の訂正請求", "削除請求", "処理停止請求"] },
      { heading: "第7条（安全性確保措置）", paragraphs: ["会社は個人情報の安全性を確保するため、次の措置を講じます。"], unordered: ["個人情報の暗号化", "ハッキング等に備えた技術的対策", "個人情報へのアクセス制限", "個人情報取扱担当者の最小化および教育"] },
      { heading: "第8条（個人情報保護責任者）", contacts: ["担当部署: 個人情報保護チーム", "メール: privacy@fluentdrama.com"] },
      { heading: "附則", paragraphs: ["本プライバシーポリシーは2025年1月25日から施行されます。"] },
    ],
  },
} as const;

export default function Privacy() {
  const { setCurrentPage, uiLanguage } = useAppStore();
  const copy = getPolicyPageCopy(uiLanguage);
  const locale: PolicyLocale = uiLanguage === "ko" || uiLanguage === "ja" ? uiLanguage : "en";
  const content = PRIVACY_CONTENT[locale];

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
            {content.sections.map((section: PrivacySection) => (
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
                {section.tableHeaders && section.tableRows && (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="min-w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800">
                          {section.tableHeaders.map((header: string) => (
                            <th key={header} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-gray-700 dark:text-gray-300">
                        {section.tableRows.map((row: readonly string[]) => (
                          <tr key={row.join("-")}>
                            {row.map((cell: string) => (
                              <td key={cell} className="border border-gray-300 dark:border-gray-600 px-3 py-2">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {section.contacts && (
                  <ul className="list-none space-y-1 text-gray-700 dark:text-gray-300">
                    {section.contacts.map((item: string) => <li key={item}>{item}</li>)}
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
