'use client';

import { ChatbotConfig, TIER_CONFIGS, AVAILABLE_MODELS } from '@/types/chatbot';
import { Check, X, FileCode, Database, MessageSquare, Palette, Shield } from 'lucide-react';

interface PluginPreviewProps {
  config: ChatbotConfig;
}

export default function PluginPreview({ config }: PluginPreviewProps) {
  const tierConfig = TIER_CONFIGS[config.tier];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Plugin Preview</h2>
      <p className="text-slate-400 mb-8">
        Review your configuration before downloading the WordPress plugin.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Summary */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
            <div className="flex items-center gap-3 mb-4">
              <FileCode className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold text-white">Basic Configuration</h3>
            </div>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-slate-400">Chatbot Name</dt>
                <dd className="font-medium text-white">{config.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Tier</dt>
                <dd className="font-medium text-white">{tierConfig.displayName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">AI Model</dt>
                <dd className="font-medium text-white">
                  {AVAILABLE_MODELS.find(m => m.id === config.model)?.name || config.model}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">API Key</dt>
                <dd className="font-medium text-white">
                  {config.apiKey ? '********' + config.apiKey.slice(-4) : 'Not set'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Limits */}
          <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold text-white">Limits</h3>
            </div>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-slate-400">Message Credits</dt>
                <dd className="font-medium text-white">
                  {config.limits.messageCreditsPerMonth.toLocaleString()}/month
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Storage</dt>
                <dd className="font-medium text-white">
                  {config.limits.storageLimitMB >= 1
                    ? `${config.limits.storageLimitMB} MB`
                    : `${config.limits.storageLimitMB * 1024} KB`}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Training Links</dt>
                <dd className="font-medium text-white">
                  {config.limits.linkTrainingLimit === null
                    ? 'Unlimited'
                    : config.limits.linkTrainingLimit}
                </dd>
              </div>
            </dl>
          </div>

          {/* Features */}
          <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold text-white">Features</h3>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                {config.features.apiAccess ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <X className="w-4 h-4 text-slate-500" />
                )}
                <span className={config.features.apiAccess ? 'text-slate-300' : 'text-slate-500'}>
                  API Access
                </span>
              </li>
              <li className="flex items-center gap-2">
                {config.features.analytics !== 'none' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <X className="w-4 h-4 text-slate-500" />
                )}
                <span className={config.features.analytics !== 'none' ? 'text-slate-300' : 'text-slate-500'}>
                  {config.features.analytics === 'advanced' ? 'Advanced' : config.features.analytics === 'basic' ? 'Basic' : 'No'} Analytics
                </span>
              </li>
              <li className="flex items-center gap-2">
                {config.features.autoRetrain ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <X className="w-4 h-4 text-slate-500" />
                )}
                <span className={config.features.autoRetrain ? 'text-slate-300' : 'text-slate-500'}>
                  Auto Retrain
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Visual Preview */}
        <div className="space-y-6">
          {/* Theme Preview */}
          <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold text-white">Theme Preview</h3>
            </div>
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-slate-600"
                  style={{ backgroundColor: config.theme.primaryColor }}
                />
                <span className="text-sm text-slate-300">Primary</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-slate-600"
                  style={{ backgroundColor: config.theme.secondaryColor }}
                />
                <span className="text-sm text-slate-300">Secondary</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-slate-600"
                  style={{ backgroundColor: config.theme.backgroundColor }}
                />
                <span className="text-sm text-slate-300">Background</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-slate-600"
                  style={{ backgroundColor: config.theme.textColor }}
                />
                <span className="text-sm text-slate-300">Text</span>
              </div>
            </div>
            <p className="text-sm text-slate-400">Mode: {config.theme.mode}</p>
          </div>

          {/* Widget Preview */}
          <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold text-white">Widget Settings</h3>
            </div>
            <dl className="space-y-3">
              <div>
                <dt className="text-slate-400 text-sm">Position</dt>
                <dd className="font-medium text-white capitalize">
                  {config.widget.position.replace('-', ' ')}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400 text-sm">Welcome Message</dt>
                <dd className="font-medium text-white">{config.widget.welcomeMessage}</dd>
              </div>
              <div>
                <dt className="text-slate-400 text-sm">Placeholder</dt>
                <dd className="font-medium text-white">{config.widget.placeholder}</dd>
              </div>
            </dl>
          </div>

          {/* Plugin Info */}
          <div className="bg-orange-500/20 border border-orange-500/50 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-3">What&apos;s Included in the Plugin</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-orange-400" />
                Pre-configured chatbot with your settings
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-orange-400" />
                Knowledge Base management (sitemaps, files, URLs, Q&A)
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-orange-400" />
                WordPress admin dashboard
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-orange-400" />
                Customizable widget appearance
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-orange-400" />
                Media Library integration for icons
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-orange-400" />
                Clean uninstall (removes all data)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
