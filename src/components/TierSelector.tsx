'use client';

import { TIER_CONFIGS, TierName } from '@/types/chatbot';
import { Check, X } from 'lucide-react';

interface TierSelectorProps {
  selectedTier: TierName;
  onTierChange: (tier: TierName) => void;
}

export default function TierSelector({ selectedTier, onTierChange }: TierSelectorProps) {
  const tiers = Object.values(TIER_CONFIGS);

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Select a Tier</h2>
      <p className="text-slate-400 mb-8">
        Choose a tier to configure the chatbot&apos;s limits and features. These settings will be locked into the WordPress plugin.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            onClick={() => onTierChange(tier.name)}
            className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all ${
              selectedTier === tier.name
                ? 'border-orange-500 bg-gradient-to-br from-orange-500/20 to-orange-600/20 shadow-lg shadow-orange-500/50'
                : 'border-slate-600 bg-slate-700/30 hover:border-slate-500 hover:shadow-md'
            }`}
          >
            {selectedTier === tier.name && (
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            <h3 className="text-lg font-semibold text-white mb-1">{tier.displayName}</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">${tier.price}</span>
              <span className="text-slate-400">/month</span>
            </div>

            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">{tier.features.messageCreditsPerMonth.toLocaleString()} message credits/month</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">
                  {tier.features.storageLimitMB >= 1
                    ? `${tier.features.storageLimitMB} MB per AI agent`
                    : `${tier.features.storageLimitMB * 1024} KB per AI agent`}
                </span>
              </li>
              <li className="flex items-start gap-2">
                {tier.features.aiActionsPerAgent > 0 ? (
                  <>
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">{tier.features.aiActionsPerAgent} AI Actions per agent</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-500">No AI Actions</span>
                  </>
                )}
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">
                  {tier.features.linkTrainingLimit === 'unlimited'
                    ? 'Unlimited training links'
                    : `${tier.features.linkTrainingLimit} training links`}
                </span>
              </li>
              <li className="flex items-start gap-2">
                {tier.features.integrations ? (
                  <>
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Integrations available</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-500">No integrations</span>
                  </>
                )}
              </li>
              <li className="flex items-start gap-2">
                {tier.features.apiAccess ? (
                  <>
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">API access</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-500">No API access</span>
                  </>
                )}
              </li>
              <li className="flex items-start gap-2">
                {tier.features.analytics !== 'none' ? (
                  <>
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300 capitalize">{tier.features.analytics} analytics</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-500">No analytics</span>
                  </>
                )}
              </li>
              <li className="flex items-start gap-2">
                {tier.features.autoRetrain ? (
                  <>
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Auto retrain agents</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-500">Manual retraining only</span>
                  </>
                )}
              </li>
              <li className="flex items-start gap-2">
                {tier.features.modelAccess === 'advanced' ? (
                  <>
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Access to advanced models</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-500">Limited model access</span>
                  </>
                )}
              </li>
              {tier.features.inactivityDeletionDays && (
                <li className="flex items-start gap-2 text-amber-400">
                  <span className="text-xs">
                    Agent deleted after {tier.features.inactivityDeletionDays} days of inactivity
                  </span>
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
