"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDirection = exports.i18n = void 0;
exports.i18n = {
    locales: [
        { code: 'en-US', name: 'English', icon: '🇺🇸' },
        { code: 'fr', name: 'Français', icon: '🇫🇷' },
        { code: 'ar', name: 'العربية', icon: '🇸🇦' },
    ],
    defaultLocale: 'en-US',
};
var getDirection = function (locale) {
    return locale === 'ar' ? 'rtl' : 'ltr';
};
exports.getDirection = getDirection;
