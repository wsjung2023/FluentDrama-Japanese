import { Button } from '@/components/ui/button';

interface AudienceCardProps {
  audience: 'student' | 'general' | 'business';
  title: string;
  description: string;
  icon: string;
  scenarios: Array<{ icon: string; text: string }>;
  cefr: string;
  theme: {
    name: string;
    colors: {
      primary: string;
      background: string;
      card: string;
    };
    cefr: string;
  };
  onClick: () => void;
}

export function AudienceCard({
  audience,
  title,
  description,
  icon,
  scenarios,
  cefr,
  theme,
  onClick
}: AudienceCardProps) {
  const isBusinessTheme = audience === 'business';
  
  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group-hover:-translate-y-2">
        <div className={`${theme.colors.background} p-8 text-center`}>
          <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce-gentle">
            <i className={`${icon} text-3xl ${
              isBusinessTheme 
                ? 'text-business-primary' 
                : audience === 'student' 
                  ? 'text-student-primary' 
                  : 'text-general-primary'
            }`}></i>
          </div>
          
          <h3 className={`text-2xl font-poppins font-bold mb-2 ${
            isBusinessTheme ? 'text-white' : 'text-gray-900'
          }`}>
            {title}
          </h3>
          
          <p className={`mb-6 ${
            isBusinessTheme ? 'text-blue-100' : 'text-gray-700'
          }`}>
            {description}
          </p>
          
          <div className="space-y-2 text-sm mb-6">
            {scenarios.map((scenario, index) => (
              <div key={index} className="flex items-center justify-center space-x-2">
                <i className={`${scenario.icon} w-4 ${
                  isBusinessTheme ? 'text-blue-100' : 'text-gray-600'
                }`}></i>
                <span className={isBusinessTheme ? 'text-blue-100' : 'text-gray-600'}>
                  {scenario.text}
                </span>
              </div>
            ))}
          </div>
          
          <div className={`rounded-lg p-3 backdrop-blur-sm ${
            isBusinessTheme 
              ? 'bg-white bg-opacity-20' 
              : 'bg-white bg-opacity-50'
          }`}>
            <span className={`text-sm font-semibold ${
              isBusinessTheme ? 'text-white' : 'text-gray-700'
            }`}>
              CEFR Level: {cefr}
            </span>
          </div>
        </div>
        
        <div className="p-6 bg-white">
          <Button 
            className={`w-full py-3 font-semibold transition-colors ${
              audience === 'student' 
                ? 'bg-pink-500 hover:bg-pink-600 text-white'
                : audience === 'general'
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Start {title.split('/')[0]} Journey
          </Button>
        </div>
      </div>
    </div>
  );
}
