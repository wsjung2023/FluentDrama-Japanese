import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest, safeJsonParse } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getCharacterCopy } from '@/constants/uiCopy';

export default function Character() {
  const { 
    character, 
    audience, 
    scenario,
    uiLanguage,
    setCharacter, 
    setCurrentPage, 
    isLoading, 
    setLoading, 
    setError 
  } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [backgroundPrompt, setBackgroundPrompt] = useState<any>(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [showSavedCharacters, setShowSavedCharacters] = useState(false);
  const characterCopy = getCharacterCopy(uiLanguage);

  // Fetch saved characters
  const { data: savedCharacters, isLoading: loadingCharacters } = useQuery({
    queryKey: ['/api/saved-characters'],
    enabled: showSavedCharacters,
  });

  // Delete character mutation
  const deleteCharacterMutation = useMutation({
    mutationFn: (characterId: string) => 
      apiRequest('DELETE', `/api/saved-characters/${characterId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-characters'] });
      toast({
        title: characterCopy.deletedTitle,
        description: characterCopy.deletedDescription,
      });
    },
  });

  // 한글 조합 상태 추적
  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false);
  }, []);

  // 입력 처리 핸들러 - 최적화된 버전
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCharacter({ name: value });
  }, [setCharacter]);

  // 저장된 캐릭터 선택
  const handleSelectSavedCharacter = useCallback((savedChar: any) => {
    setCharacter({
      name: savedChar.name,
      gender: savedChar.gender,
      style: savedChar.style,
      imageUrl: savedChar.imageUrl,
    });
    
    // 배경 프롬프트가 있으면 복원
    if (savedChar.backgroundPrompt) {
      try {
        const parsed = JSON.parse(savedChar.backgroundPrompt);
        setBackgroundPrompt(parsed);
      } catch (e) {
        console.warn('Could not parse background prompt:', e);
      }
    }
    
    setShowSavedCharacters(false);
    toast({
      title: characterCopy.selectedTitle,
      description: characterCopy.selectedDescription(savedChar.name),
    });
  }, [setCharacter, toast]);

  // 커스텀 시나리오용 배경 프롬프트 생성
  const handleGenerateBackgroundPrompt = async () => {
    if (!scenario?.freeText) {
      toast({
        title: characterCopy.customScenarioRequiredTitle,
        description: characterCopy.customScenarioRequiredDescription,
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      const response = await apiRequest(
        'POST',
        '/api/generate-background-prompt',
        {
          customScenarioText: scenario.freeText,
          characterStyle: character.style,
          characterGender: character.gender
        }
      );

      const result = await safeJsonParse(response);
      setBackgroundPrompt(result);
      
      toast({
        title: characterCopy.backgroundPromptCreatedTitle,
        description: characterCopy.backgroundPromptCreatedDescription,
      });
    } catch (error) {
      toast({
        title: characterCopy.backgroundPromptFailedTitle,
        description: characterCopy.backgroundPromptFailedDescription,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleGenerateCharacter = async () => {
    if (!character.name || !character.gender || !character.style || !audience) {
      toast({
        title: characterCopy.missingInfoTitle,
        description: characterCopy.missingInfoDescription,
        variant: "destructive",
      });
      return;
    }

    // 커스텀 시나리오인데 배경 프롬프트가 없으면 자동 생성
    if (scenario?.freeText && !backgroundPrompt) {
      await handleGenerateBackgroundPrompt();
      return; // 배경 프롬프트 생성 후 사용자가 다시 클릭하도록
    }

    setIsGeneratingImage(true);
    setLoading(true, characterCopy.generatingTutor);

    try {
      const response = await apiRequest(
        'POST',
        '/api/generate-image',
        {
          name: character.name,
          gender: character.gender,
          style: character.style,
          audience: audience,
          scenario: scenario?.presetKey || 'restaurant',
          customScenarioText: scenario?.freeText || undefined,
          backgroundPrompt: backgroundPrompt || undefined
        }
      );

      const result = await safeJsonParse(response);
      setCharacter({ imageUrl: result.imageUrl });
      
      toast({
        title: characterCopy.generatedTitle,
        description: characterCopy.generatedDescription,
      });
    } catch (error: any) {
      console.error('Character generation failed:', error);
      
      // Check if it's an image limit error
      if (error.status === 429 && error.response?.type === 'image_limit_exceeded') {
        setError(characterCopy.imageLimitReachedError);
        toast({
          title: characterCopy.imageLimitTitle,
          description: characterCopy.imageLimitDescription,
          variant: "destructive",
        });
        
        // 자동으로 저장된 캐릭터 갤러리 표시
        setShowSavedCharacters(true);
      } else {
        setError(characterCopy.generationFailedError);
        toast({
          title: characterCopy.generationFailedTitle,
          description: characterCopy.generationFailedDescription,
          variant: "destructive",
        });
      }
    } finally {
      setIsGeneratingImage(false);
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!character.imageUrl) {
      toast({
        title: characterCopy.imageRequiredTitle,
        description: characterCopy.imageRequiredDescription,
        variant: "destructive",
      });
      return;
    }
    setCurrentPage('playground'); // 캐릭터 생성 후 바로 플레이그라운드
  };

  const handleBack = () => {
    setCurrentPage('scenario'); // 캐릭터에서 뒤로 = 시나리오
  };

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-poppins font-bold text-gray-900 mb-4">
          {characterCopy.title}
        </h2>
        <p className="text-gray-600">{characterCopy.subtitle}</p>
      </div>

      {/* 저장된 캐릭터 갤러리 */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            <i className="fas fa-bookmark mr-2 text-blue-500"></i>
            {characterCopy.myCharacters}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSavedCharacters(!showSavedCharacters)}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
            data-testid="toggle-saved-characters"
          >
            {showSavedCharacters ? (
              <>
                <i className="fas fa-eye-slash mr-1"></i>
                {characterCopy.hide}
              </>
            ) : (
              <>
                <i className="fas fa-eye mr-1"></i>
                {characterCopy.show}
              </>
            )}
          </Button>
        </div>

        {showSavedCharacters && (
          <div className="bg-gray-50 rounded-lg p-4 border">
            {loadingCharacters ? (
              <div className="text-center py-8">
                <i className="fas fa-spinner fa-spin text-blue-500 text-xl mb-2"></i>
                <p className="text-gray-600">{characterCopy.loadingCharacters}</p>
              </div>
            ) : savedCharacters && Array.isArray(savedCharacters) && savedCharacters.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {savedCharacters.map((char: any) => (
                  <div
                    key={char.id}
                    className="bg-white rounded-lg p-3 border shadow-sm hover:shadow-md transition-shadow"
                    data-testid={`saved-character-${char.id}`}
                  >
                    <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={char.imageUrl}
                        alt={char.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-character.png';
                        }}
                      />
                    </div>
                    
                    <div className="text-sm">
                      <h4 className="font-semibold text-gray-900 mb-1 truncate">{char.name}</h4>
                      <p className="text-gray-600 text-xs mb-1">
                        {char.gender === 'male' ? characterCopy.genderMale : characterCopy.genderFemale} • {
                          char.style === 'cheerful' ? characterCopy.styleCheerful :
                          char.style === 'calm' ? characterCopy.styleCalm : characterCopy.styleStrict
                        }
                      </p>
                      <p className="text-gray-500 text-xs mb-2">
                        {characterCopy.usageCount(char.usageCount || 0)}
                      </p>
                    </div>

                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelectSavedCharacter(char)}
                        className="flex-1 text-xs py-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                        data-testid={`select-character-${char.id}`}
                      >
                        <i className="fas fa-check mr-1"></i>
                        {characterCopy.select}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm(characterCopy.deleteConfirm(char.name))) {
                            deleteCharacterMutation.mutate(char.id);
                          }
                        }}
                        disabled={deleteCharacterMutation.isPending}
                        className="text-xs py-1 text-red-600 border-red-300 hover:bg-red-50"
                        data-testid={`delete-character-${char.id}`}
                      >
                        <i className="fas fa-trash mr-1"></i>
                        {characterCopy.delete}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-user-plus text-gray-400 text-3xl mb-3"></i>
                <p className="text-gray-600 mb-2">{characterCopy.noSavedCharacters}</p>
                <p className="text-gray-500 text-sm">
                  {characterCopy.noSavedCharactersDescription}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Character Preview */}
            <div className="text-center">
              <div className="w-64 h-80 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center character-image overflow-hidden">
                {character.imageUrl ? (
                  <img 
                    src={character.imageUrl} 
                    alt={`AI Tutor ${character.name}`}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <div className="text-center">
                    <i className="fas fa-robot text-6xl text-gray-400 mb-2"></i>
                    <p className="text-sm text-gray-500">{characterCopy.previewEmpty}</p>
                  </div>
                )}
              </div>
              <Button 
                onClick={handleGenerateCharacter}
                disabled={isGeneratingImage || isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGeneratingImage ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {characterCopy.generating}
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic mr-2"></i>
                    {characterCopy.generateCharacter}
                  </>
                )}
              </Button>
            </div>

            {/* Character Form */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2">
                  {characterCopy.characterName}
                </Label>
                <Input
                  id="name"
                  value={character.name}
                  onChange={handleNameChange}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  placeholder={characterCopy.characterNamePlaceholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* 배경 프롬프트 미리보기 (커스텀 시나리오만) */}
              {scenario?.freeText && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-semibold text-blue-700">
                      {characterCopy.backgroundPromptLabel}
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateBackgroundPrompt}
                      disabled={isGeneratingPrompt}
                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      {isGeneratingPrompt ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-1"></i>
                          {characterCopy.generatingPrompt}
                        </>
                      ) : (
                        <>
                          <i className="fas fa-magic mr-1"></i>
                          {characterCopy.generatePrompt}
                        </>
                      )}
                    </Button>
                  </div>
                  {backgroundPrompt ? (
                    <div className="text-xs text-blue-800 space-y-1">
                      <div><strong>{characterCopy.backgroundSetting}:</strong> {backgroundPrompt.backgroundSetting}</div>
                      <div><strong>{characterCopy.outfit}:</strong> {backgroundPrompt.appropriateOutfit}</div>
                      <div><strong>{characterCopy.pose}:</strong> {backgroundPrompt.characterPose}</div>
                      <div><strong>{characterCopy.atmosphere}:</strong> {backgroundPrompt.atmosphere}</div>
                    </div>
                  ) : (
                    <p className="text-xs text-blue-600">
                      {characterCopy.backgroundPromptHelp}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2">{characterCopy.gender}</Label>
                <RadioGroup 
                  value={character.gender} 
                  onValueChange={(value: 'male' | 'female') => setCharacter({ gender: value })}
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">{characterCopy.genderMale}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">{characterCopy.genderFemale}</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2">{characterCopy.teachingStyle}</Label>
                <Select 
                  value={character.style} 
                  onValueChange={(value: 'cheerful' | 'calm' | 'strict') => setCharacter({ style: value })}
                >
                  <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <SelectValue placeholder={characterCopy.stylePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cheerful">{characterCopy.styleCheerful}</SelectItem>
                    <SelectItem value="calm">{characterCopy.styleCalm}</SelectItem>
                    <SelectItem value="strict">{characterCopy.styleStrict}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-4">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="flex-1"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  {characterCopy.back}
                </Button>
                <Button 
                  onClick={handleNext}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {characterCopy.startScene}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
