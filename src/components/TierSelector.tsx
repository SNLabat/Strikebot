'use client';

import { TIER_CONFIGS, TierName, BillingPeriod } from '@/types/chatbot';
import { Check, X } from 'lucide-react';
import { useState } from 'react';

interface TierSelectorProps {
  selectedTier: TierName;
  onTierChange: (tier: TierName) => void;
  billingPeriod: BillingPeriod;
  onBillingPeriodChange: (period: BillingPeriod) => void;
}

export default function TierSelector({
  selectedTier,
  onTierChange,
  billingPeriod,
  onBillingPeriodChange
}: TierSelectorProps) {
  const tiers = Object.values(TIER_CONFIGS);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Select a Plan</h2>
          <p className="text-slate-400">
            Choose a plan to configure the chatbot&apos;s limits and features. These settings will be locked into the WordPress plugin.
          </p>
        </div>

        {/* Billing Period Toggle */}
        <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-1.5">
          <button
            onClick={() => onBillingPeriodChange('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => onBillingPeriodChange('annual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              billingPeriod === 'annual'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Annual
            <span className="ml-1 text-xs text-green-300">(Save up to 17%)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => {
          const price = billingPeriod === 'monthly' ? tier.pricing.monthly : tier.pricing.annualMonthly;
          const savings = tier.pricing.monthly - tier.pricing.annualMonthly;

          return (
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
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
                    ${price}
                  </span>
                  <span className="text-slate-400 text-sm">/month</span>
                </div>
                {billingPeriod === 'annual' && savings > 0 && (
                  <div className="text-xs text-green-400 mt-1">
                    Save ${savings}/month (${tier.pricing.annual}/year)
                  </div>
                )}
                {tier.name === 'enterprise' && (
                  <div className="text-xs text-slate-500 mt-1">Custom pricing available</div>
                )}
              </div>

              <ul className="space-y-2.5 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">
                    {tier.features.messageCreditsPerMonth.toLocaleString()} messages/month
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Website embed</span>
                </li>

                {tier.features.leadCapture && (
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Lead capture</span>
                  </li>
                )}

                {tier.features.emailTranscripts && (
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Email transcripts</span>
                  </li>
                )}

                {tier.features.analytics !== 'none' && (
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300 capitalize">{tier.features.analytics} analytics</span>
                  </li>
                )}

                {tier.features.autoRetrain && (
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Auto-retrain from website</span>
                  </li>
                )}

                {tier.features.autoSyncDataSources && (
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Auto-sync data sources</span>
                  </li>
                )}

                {tier.features.conversationHistoryExport && (
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Conversation exports</span>
                  </li>
                )}

                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300 capitalize">{tier.features.supportLevel.replace('-', ' ')} support</span>
                </li>

                {tier.features.trainingSessions > 0 && (
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">
                      {tier.features.trainingSessions} training session{tier.features.trainingSessions > 1 ? 's' : ''}
                    </span>
                  </li>
                )}

                {tier.features.monthlyStrategyCalls && (
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Monthly strategy calls</span>
                  </li>
                )}

                {tier.features.quarterlyBusinessReviews && (
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Quarterly business reviews</span>
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
