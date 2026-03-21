import { useAppStore } from '@/store/useAppStore';
import { AudienceCard } from '@/components/audience-card';
import { getAudienceSelectionCopy } from '@/constants/uiCopy';

export default function AudienceSelection() {
  const { setCurrentPage, setAudience, uiLanguage } = useAppStore();
  const copy = getAudienceSelectionCopy(uiLanguage);

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
            {copy.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {copy.subtitle}
          </p>
        </div>

        {/* Audience Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <AudienceCard
            audience="student"
            title={copy.options.student.title}
            description={copy.options.student.description}
            icon="fas fa-graduation-cap"
            cefr="A2-B2"
            cefrLabel={copy.cefrLabel}
            buttonLabel={copy.options.student.startButton}
            scenarios={[
              { icon: "fas fa-book", text: copy.options.student.scenarios[0] },
              { icon: "fas fa-users", text: copy.options.student.scenarios[1] },
              { icon: "fas fa-presentation", text: copy.options.student.scenarios[2] }
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
            title={copy.options.general.title}
            description={copy.options.general.description}
            icon="fas fa-globe"
            cefr="A1-B2"
            cefrLabel={copy.cefrLabel}
            buttonLabel={copy.options.general.startButton}
            scenarios={[
              { icon: "fas fa-plane", text: copy.options.general.scenarios[0] },
              { icon: "fas fa-shopping-cart", text: copy.options.general.scenarios[1] },
              { icon: "fas fa-utensils", text: copy.options.general.scenarios[2] }
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
            title={copy.options.business.title}
            description={copy.options.business.description}
            icon="fas fa-briefcase"
            cefr="B1-C1"
            cefrLabel={copy.cefrLabel}
            buttonLabel={copy.options.business.startButton}
            scenarios={[
              { icon: "fas fa-handshake", text: copy.options.business.scenarios[0] },
              { icon: "fas fa-chart-line", text: copy.options.business.scenarios[1] },
              { icon: "fas fa-envelope", text: copy.options.business.scenarios[2] }
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
