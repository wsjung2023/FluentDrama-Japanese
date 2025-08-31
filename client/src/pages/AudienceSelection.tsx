import { useAppStore } from '@/store/useAppStore';
import { AudienceCard } from '@/components/audience-card';

export default function AudienceSelection() {
  const { setCurrentPage, setAudience } = useAppStore();

  const handleAudienceSelect = (audience: 'student' | 'general' | 'business') => {
    setAudience(audience);
    setCurrentPage('scenario'); // 대상 선택 후 시나리오로 이동
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-poppins font-bold text-gray-900 mb-4">
            어떤 분야를 학습하고 싶으신가요?
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            당신의 목표에 맞는 일본어 학습 과정을 선택해주세요
          </p>
        </div>

        {/* Audience Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <AudienceCard
            audience="student"
            title="중고등학생"
            description="학교 일본어와 대학 입시를 위한 체계적 학습"
            icon="fas fa-graduation-cap"
            cefr="A2-B2"
            scenarios={[
              { icon: "fas fa-book", text: "교실 상황" },
              { icon: "fas fa-users", text: "친구들과 대화" },
              { icon: "fas fa-presentation", text: "발표 연습" }
            ]}
            theme={{
              name: "student",
              colors: {
                primary: "text-student-primary",
                background: "bg-gradient-to-br from-pink-100 to-purple-100",
                card: "student-pink"
              },
              cefr: "A2-B2"
            }}
            onClick={() => handleAudienceSelect('student')}
          />

          <AudienceCard
            audience="general"
            title="일반인"
            description="일상생활과 여행에서 사용하는 실용 일본어"
            icon="fas fa-globe"
            cefr="A1-B2"
            scenarios={[
              { icon: "fas fa-plane", text: "여행 상황" },
              { icon: "fas fa-shopping-cart", text: "쇼핑" },
              { icon: "fas fa-utensils", text: "레스토랑" }
            ]}
            theme={{
              name: "general",
              colors: {
                primary: "text-general-primary",
                background: "bg-gradient-to-br from-green-100 to-blue-100",
                card: "general-beige"
              },
              cefr: "A1-B2"
            }}
            onClick={() => handleAudienceSelect('general')}
          />

          <AudienceCard
            audience="business"
            title="비즈니스"
            description="업무와 비즈니스 상황에서의 전문 일본어"
            icon="fas fa-briefcase"
            cefr="B1-C1"
            scenarios={[
              { icon: "fas fa-handshake", text: "미팅" },
              { icon: "fas fa-chart-line", text: "프레젠테이션" },
              { icon: "fas fa-envelope", text: "이메일" }
            ]}
            theme={{
              name: "business",
              colors: {
                primary: "text-business-primary",
                background: "bg-gradient-to-br from-blue-600 to-purple-700",
                card: "business-pale"
              },
              cefr: "B1-C1"
            }}
            onClick={() => handleAudienceSelect('business')}
          />
        </div>
      </div>
    </div>
  );
}