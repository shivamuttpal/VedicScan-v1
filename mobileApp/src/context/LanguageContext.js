import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../i18n/en';
import hi from '../i18n/hi';

const STRINGS = { en, hi };
const LANG_KEY = 'vedicscan_language';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((saved) => {
      if (saved === 'en' || saved === 'hi') setLanguageState(saved);
    });
  }, []);

  const setLanguage = async (lang) => {
    setLanguageState(lang);
    await AsyncStorage.setItem(LANG_KEY, lang);
  };

  const toggleLanguage = () => setLanguage(language === 'en' ? 'hi' : 'en');

  const t = (key) => STRINGS[language]?.[key] ?? STRINGS.en[key] ?? key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
