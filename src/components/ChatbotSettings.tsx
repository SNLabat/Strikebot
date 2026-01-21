'use client';

import { ChatbotConfig, AVAILABLE_MODELS, TIER_CONFIGS } from '@/types/chatbot';
import { Key, Bot, Link, Hash } from 'lucide-react';

interface ChatbotSettingsProps {
  config: ChatbotConfig;
  onConfigChange: (config: ChatbotConfig) => void;
}

export default function ChatbotSettings({ config, onConfigChange }: ChatbotSettingsProps) {
  const tierConfig = TIER_CONFIGS[config.tier];

  // Define tier hierarchy for model access
  const tierHierarchy = ['starter', 'professional', 'business', 'enterprise'];
  const currentTierIndex = tierHierarchy.indexOf(config.tier);

  // Filter models based on tier hierarchy
  const availableModels = AVAILABLE_MODELS.filter(model => {
    const modelTierIndex = tierHierarchy.indexOf(model.tier as string);
    return modelTierIndex <= currentTierIndex;
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Chatbot Settings</h2>
      <p className="text-slate-400 mb-8">
        Configure the core settings for your chatbot including API credentials and model selection.
      </p>

      <div className="max-w-2xl space-y-6">
        {/* Chatbot Name */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Bot className="w-4 h-4" />
            Chatbot Name
          </label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => onConfigChange({ ...config, name: e.target.value })}
            className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder:text-slate-400"
            placeholder="Enter chatbot name"
          />
          <p className="text-xs text-slate-400 mt-1">
            This name will be used to identify your chatbot in WordPress
          </p>
        </div>

        {/* Model Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Hash className="w-4 h-4" />
            AI Model
          </label>
          <select
            value={config.model}
            onChange={(e) => onConfigChange({ ...config, model: e.target.value })}
            className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
          >
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          {config.tier === 'starter' && (
            <p className="text-xs text-amber-400 mt-1">
              Upgrade to Professional or higher to access more models
            </p>
          )}
        </div>

        {/* API Key */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Key className="w-4 h-4" />
            API Key
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => onConfigChange({ ...config, apiKey: e.target.value })}
            className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder:text-slate-400"
            placeholder="Enter your API key"
          />
          <p className="text-xs text-slate-400 mt-1">
            Your API key will be encrypted and stored securely in the WordPress plugin
          </p>
        </div>

        {/* API Endpoint */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Link className="w-4 h-4" />
            API Endpoint
          </label>
          <input
            type="url"
            value={config.apiEndpoint}
            onChange={(e) => onConfigChange({ ...config, apiEndpoint: e.target.value })}
            className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder:text-slate-400"
            placeholder="https://api.openai.com/v1"
          />
          <p className="text-xs text-slate-400 mt-1">
            Custom API endpoint for OpenAI-compatible providers (e.g., Azure, local LLMs)
          </p>
        </div>

        {/* Limits Summary */}
        <div className="bg-slate-700/30 rounded-lg p-4 mt-8 border border-slate-600/50">
          <h3 className="font-medium text-white mb-4">Current Limits ({tierConfig.displayName})</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Message Credits</p>
              <p className="font-medium text-white">{config.limits.messageCreditsPerMonth.toLocaleString()}/month</p>
            </div>
            <div>
              <p className="text-slate-400">Storage</p>
              <p className="font-medium text-white">
                {config.limits.storageLimitMB >= 1
                  ? `${config.limits.storageLimitMB} MB`
                  : `${config.limits.storageLimitMB * 1024} KB`}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Training Links</p>
              <p className="font-medium text-white">
                {config.limits.linkTrainingLimit === null
                  ? 'Unlimited'
                  : config.limits.linkTrainingLimit}
              </p>
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
          <h3 className="font-medium text-white mb-4">Enabled Features</h3>
          <div className="flex flex-wrap gap-2">
            {config.features.apiAccess && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30">
                API Access
              </span>
            )}
            {config.features.analytics !== 'none' && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30">
                {config.features.analytics === 'advanced' ? 'Advanced' : 'Basic'} Analytics
              </span>
            )}
            {config.features.autoRetrain && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30">
                Auto Retrain
              </span>
            )}
            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm border border-orange-500/30">
              {availableModels.length} Model{availableModels.length > 1 ? 's' : ''} Available
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
