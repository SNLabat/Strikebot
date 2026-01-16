'use client';

import { ChatbotConfig, AVAILABLE_MODELS, TIER_CONFIGS } from '@/types/chatbot';
import { Key, Bot, Link, Hash } from 'lucide-react';

interface ChatbotSettingsProps {
  config: ChatbotConfig;
  onConfigChange: (config: ChatbotConfig) => void;
}

export default function ChatbotSettings({ config, onConfigChange }: ChatbotSettingsProps) {
  const tierConfig = TIER_CONFIGS[config.tier];
  const availableModels = AVAILABLE_MODELS.filter(
    m => tierConfig.features.modelAccess === 'advanced' || m.tier === 'limited'
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Chatbot Settings</h2>
      <p className="text-gray-600 mb-8">
        Configure the core settings for your chatbot including API credentials and model selection.
      </p>

      <div className="max-w-2xl space-y-6">
        {/* Chatbot Name */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Bot className="w-4 h-4" />
            Chatbot Name
          </label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => onConfigChange({ ...config, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter chatbot name"
          />
          <p className="text-xs text-gray-500 mt-1">
            This name will be used to identify your chatbot in WordPress
          </p>
        </div>

        {/* Model Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Hash className="w-4 h-4" />
            AI Model
          </label>
          <select
            value={config.model}
            onChange={(e) => onConfigChange({ ...config, model: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          {tierConfig.features.modelAccess === 'limited' && (
            <p className="text-xs text-amber-600 mt-1">
              Upgrade to Hobby or higher to access advanced models
            </p>
          )}
        </div>

        {/* API Key */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Key className="w-4 h-4" />
            API Key
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => onConfigChange({ ...config, apiKey: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your API key"
          />
          <p className="text-xs text-gray-500 mt-1">
            Your API key will be encrypted and stored securely in the WordPress plugin
          </p>
        </div>

        {/* API Endpoint */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Link className="w-4 h-4" />
            API Endpoint
          </label>
          <input
            type="url"
            value={config.apiEndpoint}
            onChange={(e) => onConfigChange({ ...config, apiEndpoint: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://api.openai.com/v1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Custom API endpoint for OpenAI-compatible providers (e.g., Azure, local LLMs)
          </p>
        </div>

        {/* Limits Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mt-8">
          <h3 className="font-medium text-gray-900 mb-4">Current Limits ({tierConfig.displayName})</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Message Credits</p>
              <p className="font-medium">{config.limits.messageCreditsPerMonth.toLocaleString()}/month</p>
            </div>
            <div>
              <p className="text-gray-500">Storage</p>
              <p className="font-medium">
                {config.limits.storageLimitMB >= 1
                  ? `${config.limits.storageLimitMB} MB`
                  : `${config.limits.storageLimitMB * 1024} KB`}
              </p>
            </div>
            <div>
              <p className="text-gray-500">AI Actions</p>
              <p className="font-medium">
                {config.limits.aiActionsPerAgent > 0
                  ? `${config.limits.aiActionsPerAgent} per agent`
                  : 'Not available'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Training Links</p>
              <p className="font-medium">
                {config.limits.linkTrainingLimit === null
                  ? 'Unlimited'
                  : config.limits.linkTrainingLimit}
              </p>
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-4">Enabled Features</h3>
          <div className="flex flex-wrap gap-2">
            {config.features.integrations && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                Integrations
              </span>
            )}
            {config.features.apiAccess && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                API Access
              </span>
            )}
            {config.features.analytics !== 'none' && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                {config.features.analytics === 'advanced' ? 'Advanced' : 'Basic'} Analytics
              </span>
            )}
            {config.features.autoRetrain && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                Auto Retrain
              </span>
            )}
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {config.features.modelAccess === 'advanced' ? 'Advanced' : 'Basic'} Models
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
