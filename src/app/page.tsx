'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TIER_CONFIGS, AVAILABLE_MODELS, ChatbotConfig, TierName, BillingPeriod, AddOn } from '@/types/chatbot';
import TierSelector from '@/components/TierSelector';
import AddOnsSelector from '@/components/AddOnsSelector';
import ChatbotSettings from '@/components/ChatbotSettings';
import ThemeCustomizer from '@/components/ThemeCustomizer';
import WidgetSettings from '@/components/WidgetSettings';
import PluginPreview from '@/components/PluginPreview';
import { Download, Bot, Settings, Palette, MessageSquare, Eye, PlusCircle } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'tier' | 'addons' | 'settings' | 'theme' | 'widget' | 'preview'>('tier');
  const [isGenerating, setIsGenerating] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [config, setConfig] = useState<ChatbotConfig>({
    id: uuidv4(),
    name: 'My Chatbot',
    tier: 'starter',
    billingPeriod: 'monthly',
    addOns: [],
    model: 'gpt-4o-mini',
    apiKey: '',
    apiEndpoint: 'https://api.openai.com/v1',
    theme: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      mode: 'light',
    },
    widget: {
      position: 'bottom-right',
      welcomeMessage: 'Hello! How can I help you today?',
      placeholder: 'Type your message...',
      iconUrl: '',
    },
    limits: {
      messageCreditsPerMonth: TIER_CONFIGS.starter.features.messageCreditsPerMonth,
      storageLimitMB: TIER_CONFIGS.starter.features.storageLimitMB,
      linkTrainingLimit: TIER_CONFIGS.starter.features.linkTrainingLimit === 'unlimited'
        ? null
        : TIER_CONFIGS.starter.features.linkTrainingLimit,
    },
    features: {
      apiAccess: TIER_CONFIGS.starter.features.apiAccess,
      analytics: TIER_CONFIGS.starter.features.analytics,
      autoRetrain: TIER_CONFIGS.starter.features.autoRetrain,
      modelAccess: TIER_CONFIGS.starter.features.modelAccess,
    },
    createdAt: new Date().toISOString(),
  });

  const handleTierChange = (tier: TierName) => {
    const tierConfig = TIER_CONFIGS[tier];

    // Reset model if current model is not available for the new tier
    const availableModels = AVAILABLE_MODELS.filter(
      m => m.tier === tier || m.tier === 'starter'
    );
    const currentModelAvailable = availableModels.some(m => m.id === config.model);

    setConfig({
      ...config,
      tier,
      model: currentModelAvailable ? config.model : availableModels[0].id,
      limits: {
        messageCreditsPerMonth: tierConfig.features.messageCreditsPerMonth,
        storageLimitMB: tierConfig.features.storageLimitMB,
        linkTrainingLimit: tierConfig.features.linkTrainingLimit === 'unlimited'
          ? null
          : tierConfig.features.linkTrainingLimit,
      },
      features: {
        apiAccess: tierConfig.features.apiAccess,
        analytics: tierConfig.features.analytics,
        autoRetrain: tierConfig.features.autoRetrain,
        modelAccess: tierConfig.features.modelAccess,
      },
    });
  };

  const handleBillingPeriodChange = (period: BillingPeriod) => {
    setBillingPeriod(period);
    setConfig({
      ...config,
      billingPeriod: period,
    });
  };

  const handleAddOnsChange = (addOns: AddOn[]) => {
    setConfig({
      ...config,
      addOns,
    });
  };

  const handleGeneratePlugin = async () => {
    if (!config.apiKey) {
      alert('Please enter an API key before generating the plugin.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-plugin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate plugin');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `strikebot-${config.name.toLowerCase().replace(/\s+/g, '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating plugin:', error);
      alert('Failed to generate plugin. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const tabs = [
    { id: 'tier', label: 'Plan', icon: Bot },
    { id: 'addons', label: 'Add-Ons', icon: PlusCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'widget', label: 'Widget', icon: MessageSquare },
    { id: 'preview', label: 'Preview', icon: Eye },
  ] as const;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600" />
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600">Strikebot Builder</h1>
            </div>
            <button
              onClick={handleGeneratePlugin}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/50"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Download Plugin'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <nav className="flex space-x-1 bg-slate-800/50 backdrop-blur-lg p-1 rounded-lg mb-8 border border-slate-700/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 justify-center ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-orange-500/20 via-orange-600/20 to-orange-700/20 text-white shadow-lg border border-orange-500/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Tab Content */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl shadow-lg border border-slate-700/50 p-6">
          {activeTab === 'tier' && (
            <TierSelector
              selectedTier={config.tier}
              onTierChange={handleTierChange}
              billingPeriod={billingPeriod}
              onBillingPeriodChange={handleBillingPeriodChange}
            />
          )}
          {activeTab === 'addons' && (
            <AddOnsSelector
              selectedAddOns={config.addOns}
              onAddOnsChange={handleAddOnsChange}
            />
          )}
          {activeTab === 'settings' && (
            <ChatbotSettings
              config={config}
              onConfigChange={setConfig}
            />
          )}
          {activeTab === 'theme' && (
            <ThemeCustomizer
              config={config}
              onConfigChange={setConfig}
            />
          )}
          {activeTab === 'widget' && (
            <WidgetSettings
              config={config}
              onConfigChange={setConfig}
            />
          )}
          {activeTab === 'preview' && (
            <PluginPreview config={config} />
          )}
        </div>

        {/* Current Configuration Summary */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Configuration Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-400">Plan</p>
              <p className="font-medium text-white">
                {TIER_CONFIGS[config.tier].displayName} ({config.billingPeriod})
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Monthly Price</p>
              <p className="font-medium text-white">
                ${config.billingPeriod === 'monthly'
                  ? TIER_CONFIGS[config.tier].pricing.monthly
                  : TIER_CONFIGS[config.tier].pricing.annualMonthly}
                {config.addOns.length > 0 && (
                  <span className="text-green-400">
                    {' '}+ ${config.addOns.reduce((sum, a) => sum + a.price, 0)}
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Model</p>
              <p className="font-medium text-white">
                {AVAILABLE_MODELS.find(m => m.id === config.model)?.name || config.model}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Message Credits</p>
              <p className="font-medium text-white">
                {config.limits.messageCreditsPerMonth.toLocaleString()}
                {config.addOns.some(a => a.type === 'extra_messages') && (
                  <span className="text-green-400">
                    {' '}+ {config.addOns.filter(a => a.type === 'extra_messages').reduce((sum, a) => sum + (a.value || 0), 0).toLocaleString()}
                  </span>
                )}
                /month
              </p>
            </div>
          </div>
          {config.addOns.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Active Add-Ons:</p>
              <div className="flex flex-wrap gap-2">
                {config.addOns.map(addOn => (
                  <span key={addOn.id} className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">
                    {addOn.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
