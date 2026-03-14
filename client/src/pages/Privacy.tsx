import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function Privacy() {
  const { setCurrentPage } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-safe">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-3xl">
        <div className="mb-4 sm:mb-8">
          <Button variant="ghost" size="sm" onClick={() => setCurrentPage('user-home')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            뒤로 가기
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
            <CardTitle className="text-xl sm:text-2xl">개인정보처리방침</CardTitle>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">최종 수정일: 2025년 1월 25일</p>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6 text-sm sm:text-base leading-relaxed">
            <section className="mb-6">
              <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 dark:text-white">제1조 (개인정보의 수집 항목)</h2>
              <p className="mb-2 text-gray-700 dark:text-gray-300">회사는 다음과 같은 개인정보를 수집합니다:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
                <li>필수항목: 이메일 주소, 비밀번호(암호화 저장)</li>
                <li>선택항목: 이름, 프로필 이미지</li>
                <li>소셜 로그인 시: 소셜 계정 고유 ID, 이메일, 프로필 정보</li>
                <li>자동 수집: 서비스 이용 기록, 접속 로그, IP 주소</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 dark:text-white">제2조 (수집 및 이용 목적)</h2>
              <p className="mb-2 text-gray-700 dark:text-gray-300">수집한 개인정보는 다음의 목적으로 이용됩니다:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
                <li>회원 가입 및 관리</li>
                <li>서비스 제공 및 개선</li>
                <li>결제 및 환불 처리</li>
                <li>고객 문의 응대</li>
                <li>서비스 관련 공지사항 전달</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 dark:text-white">제3조 (보유 및 이용 기간)</h2>
              <ol className="list-decimal pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
                <li>회원 탈퇴 시까지 보유하며, 탈퇴 후 즉시 파기합니다.</li>
                <li>단, 관련 법령에 의해 보존이 필요한 경우:
                  <ul className="list-disc pl-5 mt-1.5 space-y-1">
                    <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                    <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                    <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section className="mb-6">
              <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 dark:text-white">제4조 (개인정보의 제3자 제공)</h2>
              <p className="mb-2 text-gray-700 dark:text-gray-300">
                회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 dark:text-white">제5조 (개인정보 처리 위탁)</h2>
              <p className="mb-3 text-gray-700 dark:text-gray-300">회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁합니다:</p>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="min-w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">수탁업체</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">위탁업무</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 dark:text-gray-300">
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Stripe</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">결제 처리</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">OpenAI</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">AI 대화 생성</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Neon</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">데이터베이스 호스팅</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-6">
              <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 dark:text-white">제6조 (이용자의 권리)</h2>
              <p className="mb-2 text-gray-700 dark:text-gray-300">이용자는 다음과 같은 권리를 행사할 수 있습니다:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
                <li>개인정보 열람 요구</li>
                <li>오류 등이 있을 경우 정정 요구</li>
                <li>삭제 요구</li>
                <li>처리정지 요구</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 dark:text-white">제7조 (안전성 확보 조치)</h2>
              <p className="mb-2 text-gray-700 dark:text-gray-300">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취합니다:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
                <li>개인정보의 암호화</li>
                <li>해킹 등에 대비한 기술적 대책</li>
                <li>개인정보에 대한 접근 제한</li>
                <li>개인정보 취급 직원의 최소화 및 교육</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 dark:text-white">제8조 (개인정보 보호책임자)</h2>
              <ul className="list-none space-y-1 text-gray-700 dark:text-gray-300">
                <li>담당자: 개인정보보호팀</li>
                <li>이메일: privacy@fluentdrama.com</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 dark:text-white">부칙</h2>
              <p className="text-gray-700 dark:text-gray-300">본 개인정보처리방침은 2025년 1월 25일부터 시행됩니다.</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
