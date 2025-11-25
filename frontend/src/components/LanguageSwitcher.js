import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import './LanguageSwitcher.css';

const languages = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' }
];

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const currentLang = i18n.language?.startsWith('zh') ? 'zh' : 'en';
  const currentLabel = languages.find(l => l.code === currentLang)?.label || 'English';
  
  const handleSelect = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="lang-switcher-container" ref={dropdownRef}>
      <button 
        className="lang-switcher"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe size={16} />
        <span>{currentLabel}</span>
        <ChevronDown size={14} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="lang-dropdown">
          {languages.map((lang) => (
            <div
              key={lang.code}
              className={`lang-option ${currentLang === lang.code ? 'active' : ''}`}
              onClick={() => handleSelect(lang.code)}
            >
              {lang.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
