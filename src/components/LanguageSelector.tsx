import type { AppLanguage } from "../types";
import { LANGUAGES } from "../lib/languages";

interface Props {
  selected: AppLanguage;
  onChange: (lang: AppLanguage) => void;
}

export default function LanguageSelector({ selected, onChange }: Props) {
  return (
    <div className="lang-selector">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          className={`lang-btn ${selected === lang.code ? "lang-active" : ""}`}
          onClick={() => onChange(lang.code)}
          title={lang.label}
        >
          <span className="lang-flag">{lang.flag}</span>
          <span className="lang-native">{lang.nativeLabel}</span>
        </button>
      ))}
    </div>
  );
}
