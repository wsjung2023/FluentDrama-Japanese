import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function Terms() {
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
            <CardTitle className="text-2xl">이용약관</CardTitle>
            <p className="text-sm text-gray-500">최종 수정일: 2025년 1월 25일</p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold mt-6">제1조 (목적)</h2>
            <p>
              본 약관은 FluentDrama(이하 "회사")가 제공하는 AI 일본어 튜터링 서비스(이하 "서비스")의 이용과 관련하여 
              회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>

            <h2 className="text-xl font-semibold mt-6">제2조 (용어의 정의)</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>"서비스"란 회사가 제공하는 AI 기반 일본어 학습, 대화 연습, 캐릭터 생성 등의 서비스를 말합니다.</li>
              <li>"회원"이란 본 약관에 동의하고 회사와 이용계약을 체결한 자를 말합니다.</li>
              <li>"유료서비스"란 회원이 일정 금액을 결제하고 이용하는 서비스를 말합니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-6">제3조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</li>
              <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
              <li>변경된 약관은 공지 후 7일이 경과한 날부터 효력이 발생합니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-6">제4조 (서비스의 내용)</h2>
            <p>회사는 다음과 같은 서비스를 제공합니다:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>AI 캐릭터와의 일본어 대화 연습</li>
              <li>AI 이미지 생성을 통한 캐릭터 시각화</li>
              <li>음성 인식 및 TTS(Text-to-Speech) 기능</li>
              <li>대화 내용 분석 및 피드백 제공</li>
              <li>학습 진도 관리 및 통계</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6">제5조 (회원가입)</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>회원가입은 이용자가 본 약관에 동의한 후 회원가입 신청을 하고, 회사가 이를 승낙함으로써 성립됩니다.</li>
              <li>회사는 다음 각 호에 해당하는 경우 회원가입을 거부할 수 있습니다:
                <ul className="list-disc pl-6 mt-2">
                  <li>타인의 정보를 도용한 경우</li>
                  <li>허위 정보를 기재한 경우</li>
                  <li>기타 회원으로 등록하는 것이 부적절하다고 판단되는 경우</li>
                </ul>
              </li>
            </ol>

            <h2 className="text-xl font-semibold mt-6">제6조 (유료서비스)</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>유료서비스의 이용요금 및 결제방법은 서비스 내 안내에 따릅니다.</li>
              <li>유료서비스는 월 단위 정기결제 방식으로 제공됩니다.</li>
              <li>결제 취소 및 환불은 관련 법령 및 회사의 환불정책에 따릅니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-6">제7조 (서비스 이용 제한)</h2>
            <p>회사는 회원이 다음 각 호에 해당하는 경우 서비스 이용을 제한할 수 있습니다:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>본 약관을 위반한 경우</li>
              <li>타인의 서비스 이용을 방해하거나 정보를 도용한 경우</li>
              <li>서비스를 이용하여 법령 또는 공서양속에 반하는 행위를 한 경우</li>
              <li>불법 콘텐츠를 생성하거나 유포한 경우</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6">제8조 (면책조항)</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>회사는 천재지변, 전쟁 등 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.</li>
              <li>회사는 회원의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</li>
              <li>AI가 생성한 콘텐츠의 정확성에 대해 회사는 보증하지 않습니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-6">제9조 (분쟁해결)</h2>
            <p>
              본 약관과 관련하여 분쟁이 발생한 경우, 회사와 회원은 원만한 해결을 위해 성실히 협의합니다.
              협의가 이루어지지 않는 경우, 관할 법원은 회사 소재지를 관할하는 법원으로 합니다.
            </p>

            <h2 className="text-xl font-semibold mt-6">부칙</h2>
            <p>본 약관은 2025년 1월 25일부터 시행됩니다.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
