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
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Widget Settings</h2>
      <p className="text-gray-600 mb-8">
        Configure how the chatbot widget appears and behaves on the website. These are default settings - users can customize them in WordPress.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="space-y-6">
          {/* Welcome Message */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4" />
              Welcome Message
            </label>
            <textarea
              value={config.widget.welcomeMessage}
              onChange={(e) => updateWidget({ welcomeMessage: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Hello! How can I help you today?"
            />
            <p className="text-xs text-gray-500 mt-1">
              This message is shown when users first open the chat
            </p>
          </div>

          {/* Placeholder Text */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Input Placeholder
            </label>
            <input
              type="text"
              value={config.widget.placeholder}
              onChange={(e) => updateWidget({ placeholder: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your message..."
            />
          </div>

          {/* Position */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <MapPin className="w-4 h-4" />
              Widget Position
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateWidget({ position: 'bottom-right' })}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  config.widget.position === 'bottom-right'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-16 h-10 border border-gray-300 rounded relative bg-white">
                    <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-blue-600" />
                  </div>
                </div>
                <p className="text-sm mt-2 text-center">Bottom Right</p>
              </button>
              <button
                onClick={() => updateWidget({ position: 'bottom-left' })}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  config.widget.position === 'bottom-left'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-16 h-10 border border-gray-300 rounded relative bg-white">
                    <div className="absolute bottom-1 left-1 w-3 h-3 rounded-full bg-blue-600" />
                  </div>
                </div>
                <p className="text-sm mt-2 text-center">Bottom Left</p>
              </button>
            </div>
          </div>

          {/* Custom Icon URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <ImageIcon className="w-4 h-4" />
              Custom Icon URL (Optional)
            </label>
            <input
              type="url"
              value={config.widget.iconUrl}
              onChange={(e) => updateWidget({ iconUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/icon.png"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use the default icon. In WordPress, users can select an icon from the media library.
            </p>
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-3 block">Widget Preview</label>
          <div className="relative bg-gray-100 rounded-xl h-96 overflow-hidden">
            {/* Fake website content */}
            <div className="p-4">
              <div className="h-8 w-48 bg-gray-300 rounded mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-5/6 bg-gray-200 rounded" />
                <div className="h-4 w-4/6 bg-gray-200 rounded" />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="h-24 bg-gray-200 rounded" />
                <div className="h-24 bg-gray-200 rounded" />
                <div className="h-24 bg-gray-200 rounded" />
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
              } bg-white rounded-lg shadow-lg p-3 max-w-[200px]`}
            >
              <p className="text-sm text-gray-800">{config.widget.welcomeMessage}</p>
              <div
                className={`absolute -bottom-2 ${
                  config.widget.position === 'bottom-right' ? 'right-4' : 'left-4'
                } w-4 h-4 bg-white transform rotate-45`}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            This shows how the widget will appear on the website. The actual icon can be customized in WordPress using the Media Library.
          </p>
        </div>
      </div>
    </div>
  );
}
