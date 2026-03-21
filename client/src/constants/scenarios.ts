// Scenario core/content facade for the current app while preparing multilingual expansion.
import { DAILY_SCENES, SCENARIO_CORE, type ScenarioAudience, type ScenarioDifficultyLevel, type ScenarioId, type ScenarioTone } from './scenarioCore';
import { getScenarioConfigMap } from './scenarioContent';

export type { ScenarioAudience, ScenarioId } from './scenarioCore';

export interface ScenarioConfig {
  id: ScenarioId;
  title: string;
  description: string;
  icon: string;
  level: ScenarioDifficultyLevel;
  tone: ScenarioTone;
  estimatedMinutes: number;
  audience: ScenarioAudience;
  background: string;
  situation: string;
  userRole: string;
  characterRole: string;
  objective: string;
  expressions: string[];
}

export { DAILY_SCENES, SCENARIO_CORE, getScenarioConfigMap };
