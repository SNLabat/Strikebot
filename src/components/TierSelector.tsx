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
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Tier</h2>
      <p className="text-gray-600 mb-8">
        Choose a tier to configure the chatbot&apos;s limits and features. These settings will be locked into the WordPress plugin.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            onClick={() => onTierChange(tier.name)}
            className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all ${
              selectedTier === tier.name
                ? 'border-blue-600 bg-blue-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            {selectedTier === tier.name && (
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            <h3 className="text-lg font-semibold text-gray-900 mb-1">{tier.displayName}</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">${tier.price}</span>
              <span className="text-gray-500">/month</span>
            </div>

            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{tier.features.messageCreditsPerMonth.toLocaleString()} message credits/month</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  {tier.features.storageLimitMB >= 1
                    ? `${tier.features.storageLimitMB} MB per AI agent`
                    : `${tier.features.storageLimitMB * 1024} KB per AI agent`}
                </span>
              </li>
              <li className="flex items-start gap-2">
                {tier.features.aiActionsPerAgent > 0 ? (
                  <>
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{tier.features.aiActionsPerAgent} AI Actions per agent</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-400">No AI Actions</span>
                  </>
                )}
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  {tier.features.linkTrainingLimit === 'unlimited'
                    ? 'Unlimited training links'
                    : `${tier.features.linkTrainingLimit} training links`}
                </span>
              </li>
              <li className="flex items-start gap-2">
                {tier.features.integrations ? (
                  <>
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Integrations available</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-400">No integrations</span>
                  </>
                )}
              </li>
              <li className="flex items-start gap-2">
                {tier.features.apiAccess ? (
                  <>
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>API access</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-400">No API access</span>
                  </>
                )}
              </li>
              <li className="flex items-start gap-2">
                {tier.features.analytics !== 'none' ? (
                  <>
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="capitalize">{tier.features.analytics} analytics</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-400">No analytics</span>
                  </>
                )}
              </li>
              <li className="flex items-start gap-2">
                {tier.features.autoRetrain ? (
                  <>
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Auto retrain agents</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-400">Manual retraining only</span>
                  </>
                )}
              </li>
              <li className="flex items-start gap-2">
                {tier.features.modelAccess === 'advanced' ? (
                  <>
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Access to advanced models</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-400">Limited model access</span>
                  </>
                )}
              </li>
              {tier.features.inactivityDeletionDays && (
                <li className="flex items-start gap-2 text-amber-600">
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
