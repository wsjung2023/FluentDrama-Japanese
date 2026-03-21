import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getPolicyPageCopy } from "@/constants/uiCopy";
import type { LanguageCode } from "@shared/language";

type PolicyLocale = Extract<LanguageCode, "ko" | "en" | "ja">;
type RefundSection = {
  heading: string;
  paragraphs?: readonly string[];
  ordered?: readonly string[];
  unordered?: readonly string[];
  contacts?: readonly string[];
};

const REFUND_CONTENT = {
  ko: {
    title: "환불 정책",
    sections: [
      { heading: "제1조 (청약철회)", ordered: ["회원은 구매일로부터 7일 이내에 청약철회를 요청할 수 있습니다.", "청약철회 요청 시 서비스 이용 내역이 없는 경우 전액 환불됩니다.", "서비스 이용 내역이 있는 경우, 이용한 서비스에 해당하는 금액을 공제 후 환불됩니다."] },
      { heading: "제2조 (환불 절차)", ordered: ["환불 요청은 고객센터 또는 구독 관리 페이지를 통해 접수할 수 있습니다.", "환불 요청 접수 후 영업일 기준 3일 이내에 검토 및 처리됩니다.", "환불 승인 시, 결제 수단에 따라 3~7 영업일 이내에 환불이 완료됩니다."] },
      { heading: "제3조 (환불 제한)", paragraphs: ["다음의 경우 환불이 제한될 수 있습니다:"], unordered: ["구매일로부터 7일이 경과한 경우", "월 이용 한도의 50% 이상을 사용한 경우", "회원의 귀책사유로 서비스 이용이 불가능한 경우", "이용약관을 위반하여 서비스 이용이 정지된 경우"] },
      { heading: "제4조 (부분 환불)", ordered: ["청약철회 기간 경과 후 환불 요청 시, 잔여 기간에 대해 일할 계산하여 부분 환불됩니다.", "부분 환불 금액 = (결제 금액 ÷ 30) × 미사용 일수", "단, 프로모션 할인이 적용된 경우 할인 전 정가를 기준으로 계산됩니다."] },
      { heading: "제5조 (플랜 변경)", ordered: ["상위 플랜으로 변경 시, 기존 결제 금액은 잔여 기간에 비례하여 새 플랜에 크레딧으로 적용됩니다.", "하위 플랜으로 변경 시, 현재 결제 기간 종료 후 다음 결제부터 적용됩니다."] },
      { heading: "제6조 (구독 해지)", ordered: ["구독 해지는 언제든지 가능하며, 현재 결제 기간 종료 시까지 서비스를 이용할 수 있습니다.", "해지 후 자동 결제는 중단되며, 무료 플랜으로 전환됩니다.", "해지 후에도 기존 대화 기록은 일정 기간 보관됩니다."] },
      { heading: "제7조 (문의)", paragraphs: ["환불 관련 문의는 아래 연락처로 문의해 주시기 바랍니다."], contacts: ["이메일: support@fluentdrama.com", "고객센터 운영시간: 평일 09:00 ~ 18:00"] },
    ],
  },
  en: {
    title: "Refund Policy",
    sections: [
      { heading: "Article 1 (Withdrawal)", ordered: ["Members may request withdrawal within 7 days of the purchase date.", "If there is no service usage history at the time of withdrawal, a full refund will be issued.", "If the service has been used, the refund will be issued after deducting the value of the used service."] },
      { heading: "Article 2 (Refund Procedure)", ordered: ["Refund requests may be submitted through customer support or the subscription management page.", "Refund requests are reviewed and processed within 3 business days after receipt.", "Once approved, refunds are completed within 3 to 7 business days depending on the payment method."] },
      { heading: "Article 3 (Refund Restrictions)", paragraphs: ["Refunds may be restricted in the following cases:"], unordered: ["If more than 7 days have passed since the purchase date", "If more than 50% of the monthly usage allowance has been consumed", "If service use is impossible due to reasons attributable to the member", "If service access has been suspended for violation of the Terms"] },
      { heading: "Article 4 (Partial Refund)", ordered: ["If a refund is requested after the withdrawal period, a partial refund is calculated on a daily basis for the remaining period.", "Partial refund amount = (payment amount ÷ 30) × unused days", "If a promotional discount was applied, the calculation is based on the original price before discount."] },
      { heading: "Article 5 (Plan Changes)", ordered: ["When upgrading to a higher plan, the previous payment is applied as credit to the new plan in proportion to the remaining period.", "When downgrading to a lower plan, the change takes effect from the next billing cycle after the current paid period ends."] },
      { heading: "Article 6 (Subscription Cancellation)", ordered: ["Subscriptions may be canceled at any time, and the service remains available until the end of the current billing period.", "After cancellation, recurring billing stops and the account switches to the free plan.", "Existing conversation records may still be retained for a certain period after cancellation."] },
      { heading: "Article 7 (Contact)", paragraphs: ["For refund-related inquiries, please contact us using the information below."], contacts: ["Email: support@fluentdrama.com", "Support hours: Weekdays 09:00–18:00"] },
    ],
  },
  ja: {
    title: "返金ポリシー",
    sections: [
      { heading: "第1条（申込み撤回）", ordered: ["会員は購入日から7日以内に申込み撤回を申請できます。", "申込み撤回時にサービス利用履歴がない場合は全額返金されます。", "サービス利用履歴がある場合は、利用分に相当する金額を差し引いて返金されます。"] },
      { heading: "第2条（返金手続き）", ordered: ["返金申請は、カスタマーサポートまたは購読管理ページから受け付けます。", "返金申請受付後、3営業日以内に審査および処理が行われます。", "返金承認後、支払手段に応じて3〜7営業日以内に返金が完了します。"] },
      { heading: "第3条（返金制限）", paragraphs: ["次の場合、返金が制限されることがあります。"], unordered: ["購入日から7日を超えた場合", "月間利用上限の50%以上を使用した場合", "会員の責めに帰すべき事由によりサービス利用が不可能な場合", "利用規約違反によりサービス利用が停止された場合"] },
      { heading: "第4条（部分返金）", ordered: ["申込み撤回期間経過後に返金を申請する場合、残存期間に対して日割りで部分返金されます。", "部分返金額 = （決済金額 ÷ 30）× 未使用日数", "プロモーション割引が適用された場合は、割引前の定価を基準に計算します。"] },
      { heading: "第5条（プラン変更）", ordered: ["上位プランに変更する場合、既存決済金額は残存期間に比例して新プランのクレジットとして適用されます。", "下位プランに変更する場合、現在の決済期間終了後、次回請求から適用されます。"] },
      { heading: "第6条（購読解約）", ordered: ["購読はいつでも解約でき、現在の決済期間終了時までサービスを利用できます。", "解約後は自動決済が停止し、無料プランへ切り替わります。", "解約後も既存の会話記録は一定期間保管されることがあります。"] },
      { heading: "第7条（お問い合わせ）", paragraphs: ["返金に関するお問い合わせは、以下の連絡先までご連絡ください。"], contacts: ["メール: support@fluentdrama.com", "サポート時間: 平日 09:00〜18:00"] },
    ],
  },
} as const;

export default function Refund() {
  const { setCurrentPage, uiLanguage } = useAppStore();
  const copy = getPolicyPageCopy(uiLanguage);
  const locale: PolicyLocale = uiLanguage === "ko" || uiLanguage === "ja" ? uiLanguage : "en";
  const content = REFUND_CONTENT[locale];

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
            {content.sections.map((section: RefundSection) => (
              <section key={section.heading} className="mb-6 last:mb-0">
                <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 dark:text-white">{section.heading}</h2>
                {section.paragraphs?.map((paragraph: string) => (
                  <p key={paragraph} className="mb-2 text-gray-700 dark:text-gray-300 last:mb-0">{paragraph}</p>
                ))}
                {section.ordered && (
                  <ol className="list-decimal pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
                    {section.ordered.map((item: string) => <li key={item}>{item}</li>)}
                  </ol>
                )}
                {section.unordered && (
                  <ul className="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
                    {section.unordered.map((item: string) => <li key={item}>{item}</li>)}
                  </ul>
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
