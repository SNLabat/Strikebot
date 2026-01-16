'use client';

import { ChatbotConfig } from '@/types/chatbot';
import { MessageSquare, ImageIcon, MapPin } from 'lucide-react';

interface WidgetSettingsProps {
  config: ChatbotConfig;
  onConfigChange: (config: ChatbotConfig) => void;
}

export default function WidgetSettings({ config, onConfigChange }: WidgetSettingsProps) {
  const updateWidget = (updates: Partial<ChatbotConfig['widget']>) => {
    onConfigChange({
      ...config,
      widget: { ...config.widget, ...updates },
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Widget Settings</h2>
      <p className="text-slate-400 mb-8">
        Configure how the chatbot widget appears and behaves on the website. These are default settings - users can customize them in WordPress.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="space-y-6">
          {/* Welcome Message */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <MessageSquare className="w-4 h-4" />
              Welcome Message
            </label>
            <textarea
              value={config.widget.welcomeMessage}
              onChange={(e) => updateWidget({ welcomeMessage: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder:text-slate-400"
              rows={3}
              placeholder="Hello! How can I help you today?"
            />
            <p className="text-xs text-slate-400 mt-1">
              This message is shown when users first open the chat
            </p>
          </div>

          {/* Placeholder Text */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Input Placeholder
            </label>
            <input
              type="text"
              value={config.widget.placeholder}
              onChange={(e) => updateWidget({ placeholder: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder:text-slate-400"
              placeholder="Type your message..."
            />
          </div>

          {/* Position */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
              <MapPin className="w-4 h-4" />
              Widget Position
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateWidget({ position: 'bottom-right' })}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  config.widget.position === 'bottom-right'
                    ? 'border-orange-500 bg-orange-500/20'
                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-16 h-10 border border-slate-500 rounded relative bg-slate-800">
                    <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-orange-500" />
                  </div>
                </div>
                <p className="text-sm mt-2 text-center text-slate-300">Bottom Right</p>
              </button>
              <button
                onClick={() => updateWidget({ position: 'bottom-left' })}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  config.widget.position === 'bottom-left'
                    ? 'border-orange-500 bg-orange-500/20'
                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-16 h-10 border border-slate-500 rounded relative bg-slate-800">
                    <div className="absolute bottom-1 left-1 w-3 h-3 rounded-full bg-orange-500" />
                  </div>
                </div>
                <p className="text-sm mt-2 text-center text-slate-300">Bottom Left</p>
              </button>
            </div>
          </div>

          {/* Custom Icon URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <ImageIcon className="w-4 h-4" />
              Custom Icon URL (Optional)
            </label>
            <input
              type="url"
              value={config.widget.iconUrl}
              onChange={(e) => updateWidget({ iconUrl: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder:text-slate-400"
              placeholder="https://example.com/icon.png"
            />
            <p className="text-xs text-slate-400 mt-1">
              Leave empty to use the default icon. In WordPress, users can select an icon from the media library.
            </p>
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-3 block">Widget Preview</label>
          <div className="relative bg-slate-800 rounded-xl h-96 overflow-hidden">
            {/* Fake website content */}
            <div className="p-4">
              <div className="h-8 w-48 bg-slate-700 rounded mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-700 rounded" />
                <div className="h-4 w-5/6 bg-slate-700 rounded" />
                <div className="h-4 w-4/6 bg-slate-700 rounded" />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="h-24 bg-slate-700 rounded" />
                <div className="h-24 bg-slate-700 rounded" />
                <div className="h-24 bg-slate-700 rounded" />
              </div>
            </div>

            {/* Chat Widget Button */}
            <div
              className={`absolute bottom-4 ${
                config.widget.position === 'bottom-right' ? 'right-4' : 'left-4'
              }`}
            >
              <button
                className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110"
                style={{ backgroundColor: config.theme.primaryColor }}
              >
                {config.widget.iconUrl ? (
                  <img
                    src={config.widget.iconUrl}
                    alt="Chat"
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <MessageSquare className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Tooltip */}
            <div
              className={`absolute bottom-20 ${
                config.widget.position === 'bottom-right' ? 'right-4' : 'left-4'
              } bg-slate-700 rounded-lg shadow-lg p-3 max-w-[200px] border border-slate-600`}
            >
              <p className="text-sm text-slate-200">{config.widget.welcomeMessage}</p>
              <div
                className={`absolute -bottom-2 ${
                  config.widget.position === 'bottom-right' ? 'right-4' : 'left-4'
                } w-4 h-4 bg-slate-700 border-r border-b border-slate-600 transform rotate-45`}
              />
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-3">
            This shows how the widget will appear on the website. The actual icon can be customized in WordPress using the Media Library.
          </p>
        </div>
      </div>
    </div>
  );
}
