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
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Plugin Preview</h2>
      <p className="text-gray-600 mb-8">
        Review your configuration before downloading the WordPress plugin.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Summary */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileCode className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Basic Configuration</h3>
            </div>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">Chatbot Name</dt>
                <dd className="font-medium text-gray-900">{config.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Tier</dt>
                <dd className="font-medium text-gray-900">{tierConfig.displayName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">AI Model</dt>
                <dd className="font-medium text-gray-900">
                  {AVAILABLE_MODELS.find(m => m.id === config.model)?.name || config.model}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">API Key</dt>
                <dd className="font-medium text-gray-900">
                  {config.apiKey ? '********' + config.apiKey.slice(-4) : 'Not set'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Limits */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Limits</h3>
            </div>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">Message Credits</dt>
                <dd className="font-medium text-gray-900">
                  {config.limits.messageCreditsPerMonth.toLocaleString()}/month
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Storage</dt>
                <dd className="font-medium text-gray-900">
                  {config.limits.storageLimitMB >= 1
                    ? `${config.limits.storageLimitMB} MB`
                    : `${config.limits.storageLimitMB * 1024} KB`}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">AI Actions</dt>
                <dd className="font-medium text-gray-900">
                  {config.limits.aiActionsPerAgent > 0
                    ? `${config.limits.aiActionsPerAgent} per agent`
                    : 'Not available'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Training Links</dt>
                <dd className="font-medium text-gray-900">
                  {config.limits.linkTrainingLimit === null
                    ? 'Unlimited'
                    : config.limits.linkTrainingLimit}
                </dd>
              </div>
            </dl>
          </div>

          {/* Features */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Features</h3>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                {config.features.integrations ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className={config.features.integrations ? '' : 'text-gray-400'}>
                  Integrations (Zendesk, WhatsApp, etc.)
                </span>
              </li>
              <li className="flex items-center gap-2">
                {config.features.apiAccess ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className={config.features.apiAccess ? '' : 'text-gray-400'}>
                  API Access
                </span>
              </li>
              <li className="flex items-center gap-2">
                {config.features.analytics !== 'none' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className={config.features.analytics !== 'none' ? '' : 'text-gray-400'}>
                  {config.features.analytics === 'advanced' ? 'Advanced' : config.features.analytics === 'basic' ? 'Basic' : 'No'} Analytics
                </span>
              </li>
              <li className="flex items-center gap-2">
                {config.features.autoRetrain ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className={config.features.autoRetrain ? '' : 'text-gray-400'}>
                  Auto Retrain
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Visual Preview */}
        <div className="space-y-6">
          {/* Theme Preview */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Theme Preview</h3>
            </div>
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{ backgroundColor: config.theme.primaryColor }}
                />
                <span className="text-sm">Primary</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{ backgroundColor: config.theme.secondaryColor }}
                />
                <span className="text-sm">Secondary</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{ backgroundColor: config.theme.backgroundColor }}
                />
                <span className="text-sm">Background</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{ backgroundColor: config.theme.textColor }}
                />
                <span className="text-sm">Text</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">Mode: {config.theme.mode}</p>
          </div>

          {/* Widget Preview */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Widget Settings</h3>
            </div>
            <dl className="space-y-3">
              <div>
                <dt className="text-gray-500 text-sm">Position</dt>
                <dd className="font-medium text-gray-900 capitalize">
                  {config.widget.position.replace('-', ' ')}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 text-sm">Welcome Message</dt>
                <dd className="font-medium text-gray-900">{config.widget.welcomeMessage}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-sm">Placeholder</dt>
                <dd className="font-medium text-gray-900">{config.widget.placeholder}</dd>
              </div>
            </dl>
          </div>

          {/* Plugin Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3">What&apos;s Included in the Plugin</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-blue-600" />
                Pre-configured chatbot with your settings
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-blue-600" />
                Knowledge Base management (sitemaps, files, URLs, Q&A)
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-blue-600" />
                WordPress admin dashboard
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-blue-600" />
                Customizable widget appearance
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-blue-600" />
                Media Library integration for icons
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-blue-600" />
                Clean uninstall (removes all data)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
