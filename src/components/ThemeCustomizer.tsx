'use client';

import { ChatbotConfig } from '@/types/chatbot';
import { Sun, Moon } from 'lucide-react';

interface ThemeCustomizerProps {
  config: ChatbotConfig;
  onConfigChange: (config: ChatbotConfig) => void;
}

const presetThemes = [
  {
    name: 'Blue',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
  },
  {
    name: 'Green',
    primaryColor: '#10B981',
    secondaryColor: '#047857',
  },
  {
    name: 'Purple',
    primaryColor: '#8B5CF6',
    secondaryColor: '#6D28D9',
  },
  {
    name: 'Red',
    primaryColor: '#EF4444',
    secondaryColor: '#B91C1C',
  },
  {
    name: 'Orange',
    primaryColor: '#F97316',
    secondaryColor: '#C2410C',
  },
  {
    name: 'Teal',
    primaryColor: '#14B8A6',
    secondaryColor: '#0F766E',
  },
];

export default function ThemeCustomizer({ config, onConfigChange }: ThemeCustomizerProps) {
  const updateTheme = (updates: Partial<ChatbotConfig['theme']>) => {
    onConfigChange({
      ...config,
      theme: { ...config.theme, ...updates },
    });
  };

  const applyPreset = (preset: typeof presetThemes[0]) => {
    updateTheme({
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Theme Customization</h2>
      <p className="text-slate-400 mb-8">
        Customize the appearance of your chatbot widget. Users can also change these settings in WordPress after installation.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-3 block">Display Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateTheme({
                  mode: 'light',
                  backgroundColor: '#FFFFFF',
                  textColor: '#1F2937',
                })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                  config.theme.mode === 'light'
                    ? 'border-orange-500 bg-orange-500/20 text-white'
                    : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-slate-500'
                }`}
              >
                <Sun className="w-4 h-4" />
                Light Mode
              </button>
              <button
                onClick={() => updateTheme({
                  mode: 'dark',
                  backgroundColor: '#1F2937',
                  textColor: '#F9FAFB',
                })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                  config.theme.mode === 'dark'
                    ? 'border-orange-500 bg-orange-500/20 text-white'
                    : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-slate-500'
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark Mode
              </button>
            </div>
          </div>

          {/* Preset Themes */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-3 block">Preset Themes</label>
            <div className="flex flex-wrap gap-2">
              {presetThemes.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 bg-slate-700/30 text-slate-300 hover:border-slate-500 hover:text-white transition-all"
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: preset.primaryColor }}
                  />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Color */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.theme.primaryColor}
                onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                className="w-12 h-12 rounded-lg cursor-pointer border border-gray-300"
              />
              <input
                type="text"
                value={config.theme.primaryColor}
                onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg uppercase text-white"
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Secondary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.theme.secondaryColor}
                onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                className="w-12 h-12 rounded-lg cursor-pointer border border-slate-600"
              />
              <input
                type="text"
                value={config.theme.secondaryColor}
                onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg uppercase text-white"
              />
            </div>
          </div>

          {/* Background Color */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Background Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.theme.backgroundColor}
                onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                className="w-12 h-12 rounded-lg cursor-pointer border border-slate-600"
              />
              <input
                type="text"
                value={config.theme.backgroundColor}
                onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg uppercase text-white"
              />
            </div>
          </div>

          {/* Text Color */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Text Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.theme.textColor}
                onChange={(e) => updateTheme({ textColor: e.target.value })}
                className="w-12 h-12 rounded-lg cursor-pointer border border-slate-600"
              />
              <input
                type="text"
                value={config.theme.textColor}
                onChange={(e) => updateTheme({ textColor: e.target.value })}
                className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg uppercase text-white"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-3 block">Preview</label>
          <div
            className="rounded-xl p-4 h-96 flex flex-col"
            style={{
              backgroundColor: config.theme.backgroundColor,
              color: config.theme.textColor,
            }}
          >
            {/* Header */}
            <div
              className="rounded-t-lg p-4 flex items-center gap-3"
              style={{ backgroundColor: config.theme.primaryColor }}
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-lg">B</span>
              </div>
              <div className="text-white">
                <p className="font-semibold">{config.name}</p>
                <p className="text-sm opacity-75">Online</p>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* Bot Message */}
              <div className="flex gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                  style={{ backgroundColor: config.theme.primaryColor }}
                >
                  B
                </div>
                <div
                  className="px-4 py-2 rounded-lg rounded-tl-none max-w-[80%]"
                  style={{
                    backgroundColor: config.theme.mode === 'dark' ? '#374151' : '#F3F4F6',
                  }}
                >
                  <p className="text-sm">{config.widget.welcomeMessage}</p>
                </div>
              </div>

              {/* User Message */}
              <div className="flex gap-2 justify-end">
                <div
                  className="px-4 py-2 rounded-lg rounded-tr-none max-w-[80%] text-white"
                  style={{ backgroundColor: config.theme.primaryColor }}
                >
                  <p className="text-sm">Hello! I have a question.</p>
                </div>
              </div>
            </div>

            {/* Input */}
            <div
              className="p-3 border-t flex gap-2"
              style={{
                borderColor: config.theme.mode === 'dark' ? '#374151' : '#E5E7EB',
              }}
            >
              <input
                type="text"
                placeholder={config.widget.placeholder}
                disabled
                className="flex-1 px-4 py-2 rounded-full text-sm"
                style={{
                  backgroundColor: config.theme.mode === 'dark' ? '#374151' : '#F3F4F6',
                  color: config.theme.textColor,
                }}
              />
              <button
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: config.theme.primaryColor }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
