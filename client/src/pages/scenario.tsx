import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { SCENARIO_PRESETS } from '@/constants/presets';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Scenario() {
  const { 
    audience, 
    scenario, 
    setScenario, 
    setCurrentPage,
    subtitleSettings,
    setSubtitleSettings
  } = useAppStore();
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(scenario.presetKey || null);
  const [isComposing, setIsComposing] = useState(false);

  const presets = audience ? SCENARIO_PRESETS[audience] : [];

  const handlePresetSelect = (presetKey: string) => {
    setSelectedPreset(presetKey);
    setScenario({ presetKey, freeText: '' });
  };

  // 한글 조합 상태 추적
  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false);
  }, []);

  // 한글 입력 처리를 위한 핸들러 - 더 안정적인 접근법
  const handleCustomTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    // 즉시 상태 업데이트
    setScenario({ freeText: text, presetKey: undefined });
    setSelectedPreset(null);
  }, [setScenario]);

  const handleNext = () => {
    if (!scenario.presetKey && !scenario.freeText?.trim()) {
      toast({
        title: "Scenario Required",
        description: "Please select a preset scenario or write a custom one.",
        variant: "destructive",
      });
      return;
    }
    setCurrentPage('character'); // 시나리오 선택 후 캐릭터
  };

  const handleBack = () => {
    setCurrentPage('home'); // 시나리오에서 뒤로 = 대상선택
  };

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-poppins font-bold text-gray-900 mb-4">
          Choose Your Learning Scenario
        </h2>
        <p className="text-gray-600">Pick a situation to practice or create your own custom scenario</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Preset Scenarios */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                <i className="fas fa-list-ul mr-2 text-blue-600"></i>Preset Scenarios
              </h3>
              <div className="space-y-3">
                {presets.map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => handlePresetSelect(preset.key)}
                    className={`w-full text-left p-4 border rounded-lg transition-colors ${
                      selectedPreset === preset.key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <i className={`${preset.icon} text-blue-600`}></i>
                      <div>
                        <p className="font-medium text-gray-900">{preset.title}</p>
                        <p className="text-sm text-gray-600">{preset.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Scenario */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                <i className="fas fa-edit mr-2 text-purple-600"></i>커스텀 시나리오
              </h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <Label htmlFor="custom-scenario" className="block text-sm font-semibold text-gray-700 mb-2">
                  원하는 상황을 설명해주세요
                </Label>
                <Textarea
                  id="custom-scenario"
                  value={scenario.freeText || ''}
                  onChange={handleCustomTextChange}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  rows={6}
                  placeholder="연습하고 싶은 상황을 한국어로 자세히 설명해주세요...
예시: 
- 해외 출장 중 호텔에서 룸서비스 주문하기
- 외국인 친구와 한국 음식 소개하며 식사하기  
- 국제 회의에서 프레젠테이션 질문 답변하기
- 공항에서 항공편 변경 요청하기"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  상황, 등장인물, 목표를 구체적으로 작성해주세요
                </p>
              </div>
            </div>
          </div>

          {/* Subtitle Settings */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-closed-captioning text-blue-600"></i>
                  자막 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">자막 표시</Label>
                    <p className="text-xs text-gray-500">일본어 대화에 자막을 표시합니다</p>
                  </div>
                  <Switch
                    checked={subtitleSettings.enabled}
                    onCheckedChange={(checked) => setSubtitleSettings({ enabled: checked })}
                  />
                </div>
                
                {subtitleSettings.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">한국어 번역</Label>
                        <p className="text-xs text-gray-500">일본어 밑에 한국어 번역을 표시합니다</p>
                      </div>
                      <Switch
                        checked={subtitleSettings.showKoreanTranslation}
                        onCheckedChange={(checked) => setSubtitleSettings({ showKoreanTranslation: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">발음 표기</Label>
                        <p className="text-xs text-gray-500">일본어 발음을 로마자로 표시합니다</p>
                      </div>
                      <Switch
                        checked={subtitleSettings.showPronunciation}
                        onCheckedChange={(checked) => setSubtitleSettings({ showPronunciation: checked })}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="px-6 py-3"
            >
              <i className="fas fa-arrow-left mr-2"></i>Back
            </Button>
            <Button 
              onClick={handleNext}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700"
            >
              Next: Character <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
