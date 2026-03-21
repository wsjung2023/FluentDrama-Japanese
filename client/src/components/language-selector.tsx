import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getLanguageLabel } from '@/constants/languages';
import type { LanguageCode } from '@shared/language';

interface LanguageSelectorProps {
  label: string;
  value: LanguageCode;
  onChange: (value: LanguageCode) => void;
  options: LanguageCode[];
}

export function LanguageSelector({ label, value, onChange, options }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      <Select value={value} onValueChange={(next) => onChange(next as LanguageCode)}>
        <SelectTrigger className="h-8 min-w-[140px] text-xs">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((languageCode) => (
            <SelectItem key={languageCode} value={languageCode} className="text-xs">
              {getLanguageLabel(languageCode)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
