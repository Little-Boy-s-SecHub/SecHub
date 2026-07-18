import { en } from './en';
import { vi } from './vi';

export const translations = { en, vi };

export type Language = 'en' | 'vi';
export type TranslationKeys = typeof en;
export type TranslationKeyPath = string; // standard dot notation key path
