'use client';

import { AVAILABLE_ADDONS, AddOn } from '@/types/chatbot';
import { Check, Plus } from 'lucide-react';

interface AddOnsSelectorProps {
  selectedAddOns: AddOn[];
  onAddOnsChange: (addOns: AddOn[]) => void;
}

export default function AddOnsSelector({ selectedAddOns, onAddOnsChange }: AddOnsSelectorProps) {
  const isAddOnSelected = (addOnId: string) => {
    return selectedAddOns.some((addOn) => addOn.id === addOnId);
  };

  const toggleAddOn = (addOn: AddOn) => {
    if (isAddOnSelected(addOn.id)) {
      onAddOnsChange(selectedAddOns.filter((a) => a.id !== addOn.id));
    } else {
      onAddOnsChange([...selectedAddOns, addOn]);
    }
  };

  const totalAddOnCost = selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Add-Ons</h2>
      <p className="text-slate-400 mb-6">
        Enhance your plan with optional add-ons. Add-ons are billed monthly.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {AVAILABLE_ADDONS.map((addOn) => {
          const isSelected = isAddOnSelected(addOn.id);

          return (
            <div
              key={addOn.id}
              onClick={() => toggleAddOn(addOn)}
              className={`relative cursor-pointer rounded-lg border-2 p-5 transition-all ${
                isSelected
                  ? 'border-orange-500 bg-gradient-to-br from-orange-500/10 to-orange-600/10 shadow-md'
                  : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">{addOn.name}</h3>
                    {isSelected && (
                      <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{addOn.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
                      ${addOn.price}
                    </span>
                    <span className="text-slate-400 text-sm">/month</span>
                  </div>
                </div>

                <div
                  className={`flex-shrink-0 w-6 h-6 rounded border-2 transition-all flex items-center justify-center ${
                    isSelected
                      ? 'border-orange-500 bg-orange-500'
                      : 'border-slate-500 hover:border-slate-400'
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedAddOns.length > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Selected Add-Ons Total</div>
              <div className="text-sm text-slate-400">
                {selectedAddOns.length} add-on{selectedAddOns.length > 1 ? 's' : ''} selected
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
                +${totalAddOnCost}
              </div>
              <div className="text-xs text-slate-400">per month</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
