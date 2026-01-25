import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function Refund() {
  const { setCurrentPage } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => setCurrentPage('user-home')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로 가기
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">환불 정책</CardTitle>
            <p className="text-sm text-gray-500">최종 수정일: 2025년 1월 25일</p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold mt-6">제1조 (청약철회)</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>회원은 구매일로부터 7일 이내에 청약철회를 요청할 수 있습니다.</li>
              <li>청약철회 요청 시 서비스 이용 내역이 없는 경우 전액 환불됩니다.</li>
              <li>서비스 이용 내역이 있는 경우, 이용한 서비스에 해당하는 금액을 공제 후 환불됩니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-6">제2조 (환불 절차)</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>환불 요청은 고객센터 또는 구독 관리 페이지를 통해 접수할 수 있습니다.</li>
              <li>환불 요청 접수 후 영업일 기준 3일 이내에 검토 및 처리됩니다.</li>
              <li>환불 승인 시, 결제 수단에 따라 3~7 영업일 이내에 환불이 완료됩니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-6">제3조 (환불 제한)</h2>
            <p>다음의 경우 환불이 제한될 수 있습니다:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>구매일로부터 7일이 경과한 경우</li>
              <li>월 이용 한도의 50% 이상을 사용한 경우</li>
              <li>회원의 귀책사유로 서비스 이용이 불가능한 경우</li>
              <li>이용약관을 위반하여 서비스 이용이 정지된 경우</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6">제4조 (부분 환불)</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>청약철회 기간 경과 후 환불 요청 시, 잔여 기간에 대해 일할 계산하여 부분 환불됩니다.</li>
              <li>부분 환불 금액 = (결제 금액 ÷ 30) × 미사용 일수</li>
              <li>단, 프로모션 할인이 적용된 경우 할인 전 정가를 기준으로 계산됩니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-6">제5조 (플랜 변경)</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>상위 플랜으로 변경 시, 기존 결제 금액은 잔여 기간에 비례하여 새 플랜에 크레딧으로 적용됩니다.</li>
              <li>하위 플랜으로 변경 시, 현재 결제 기간 종료 후 다음 결제부터 적용됩니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-6">제6조 (구독 해지)</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>구독 해지는 언제든지 가능하며, 현재 결제 기간 종료 시까지 서비스를 이용할 수 있습니다.</li>
              <li>해지 후 자동 결제는 중단되며, 무료 플랜으로 전환됩니다.</li>
              <li>해지 후에도 기존 대화 기록은 일정 기간 보관됩니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-6">제7조 (문의)</h2>
            <p>
              환불 관련 문의는 아래 연락처로 문의해 주시기 바랍니다.
            </p>
            <ul className="list-none pl-6 space-y-1">
              <li>이메일: support@fluentdrama.com</li>
              <li>고객센터 운영시간: 평일 09:00 ~ 18:00 (공휴일 제외)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
