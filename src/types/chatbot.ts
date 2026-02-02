export type TierName = 'starter' | 'professional' | 'business' | 'enterprise';
export type BillingPeriod = 'monthly' | 'annual';

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number; // monthly price
  type: 'extra_messages' | 'remove_branding' | 'fullscreen_help_page';
  value?: number; // e.g., 2500 for extra messages
}

export interface TierConfig {
  name: TierName;
  displayName: string;
  pricing: {
    monthly: number;
    annual: number; // total annual price
    annualMonthly: number; // monthly price when billed annually
  };
  features: {
    messageCreditsPerMonth: number;
    storageLimitMB: number;
    unlimitedWebsites: boolean;
    linkTrainingLimit: number | 'unlimited';
    apiAccess: boolean;
    analytics: 'none' | 'basic' | 'advanced';
    autoRetrain: boolean;
    inactivityDeletionDays: number | null;
    modelAccess: 'limited' | 'advanced';
    // New features
    websiteEmbed: boolean;
    leadCapture: boolean;
    emailTranscripts: boolean;
    conversationHistoryExport: boolean;
    autoSyncDataSources: boolean;
    supportLevel: 'none' | 'email' | 'priority-email' | 'dedicated';
    trainingSessions: number;
    monthlyStrategyCalls: boolean;
    quarterlyBusinessReviews: boolean;
    customDataRetention: boolean;
  };
}

export interface ChatbotConfig {
  id: string;
  name: string;
  tier: TierName;
  billingPeriod: BillingPeriod;
  addOns: AddOn[];
  model: string;
  apiKey: string;
  apiEndpoint: string;

  // Appearance
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    mode: 'light' | 'dark';
  };

  // Widget settings
  widget: {
    position: 'bottom-right' | 'bottom-left';
    welcomeMessage: string;
    placeholder: string;
    iconUrl: string;
    suggestedQuestions?: string[];
    showSuggestedQuestions?: boolean;
    triggerDelay?: number;
    triggerScroll?: number;
    businessHours?: {
      enabled: boolean;
      timezone: string;
      schedule: {
        [key: string]: { start: string; end: string; enabled: boolean };
      };
    };
  };

  // Limits from tier
  limits: {
    messageCreditsPerMonth: number;
    storageLimitMB: number;
    linkTrainingLimit: number | null;
  };

  // Feature flags from tier
  features: {
    apiAccess: boolean;
    analytics: 'none' | 'basic' | 'advanced';
    autoRetrain: boolean;
    modelAccess: 'limited' | 'advanced';
  };

  createdAt: string;
}

export interface KnowledgeBaseItem {
  id: string;
  type: 'sitemap' | 'file' | 'text' | 'url' | 'qa';
  name: string;
  content: string;
  metadata?: {
    fileType?: string;
    fileSize?: number;
    question?: string;
    answer?: string;
    urls?: string[];
  };
  createdAt: string;
}

export interface PluginGeneratorRequest {
  config: ChatbotConfig;
}

export const AVAILABLE_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tier: 'starter' },
  { id: 'gpt-4o', name: 'GPT-4o', tier: 'starter' },
  { id: 'gpt-5.1', name: 'GPT-5.1', tier: 'professional' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini', tier: 'professional' },
  { id: 'gpt-5-nano', name: 'GPT-5 Nano', tier: 'professional' },
  { id: 'gpt-4.1', name: 'GPT-4.1', tier: 'business' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', tier: 'business' },
  { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', tier: 'business' },
  { id: 'o3', name: 'O3', tier: 'business' },
  { id: 'o4-mini', name: 'O4 Mini', tier: 'business' },
  { id: 'gpt-4o-realtime-preview', name: 'GPT-4o Realtime Preview', tier: 'business' },
] as const;

export const TIER_CONFIGS: Record<TierName, TierConfig> = {
  starter: {
    name: 'starter',
    displayName: 'Starter',
    pricing: {
      monthly: 99,
      annual: 1068,
      annualMonthly: 89,
    },
    features: {
      messageCreditsPerMonth: 10000,
      storageLimitMB: 50,
      unlimitedWebsites: true,
      linkTrainingLimit: 'unlimited',
      apiAccess: false,
      analytics: 'basic',
      autoRetrain: true,
      inactivityDeletionDays: null,
      modelAccess: 'limited',
      websiteEmbed: true,
      leadCapture: true,
      emailTranscripts: true,
      conversationHistoryExport: true,
      autoSyncDataSources: false,
      supportLevel: 'email',
      trainingSessions: 0,
      monthlyStrategyCalls: false,
      quarterlyBusinessReviews: false,
      customDataRetention: false,
    },
  },
  professional: {
    name: 'professional',
    displayName: 'Professional',
    pricing: {
      monthly: 199,
      annual: 2268,
      annualMonthly: 189,
    },
    features: {
      messageCreditsPerMonth: 25000,
      storageLimitMB: 100,
      unlimitedWebsites: true,
      linkTrainingLimit: 'unlimited',
      apiAccess: true,
      analytics: 'advanced',
      autoRetrain: true,
      inactivityDeletionDays: null,
      modelAccess: 'advanced',
      websiteEmbed: true,
      leadCapture: true,
      emailTranscripts: true,
      conversationHistoryExport: true,
      autoSyncDataSources: true,
      supportLevel: 'priority-email',
      trainingSessions: 1,
      monthlyStrategyCalls: false,
      quarterlyBusinessReviews: false,
      customDataRetention: false,
    },
  },
  business: {
    name: 'business',
    displayName: 'Business',
    pricing: {
      monthly: 299,
      annual: 2988,
      annualMonthly: 249,
    },
    features: {
      messageCreditsPerMonth: 50000,
      storageLimitMB: 200,
      unlimitedWebsites: true,
      linkTrainingLimit: 'unlimited',
      apiAccess: true,
      analytics: 'advanced',
      autoRetrain: true,
      inactivityDeletionDays: null,
      modelAccess: 'advanced',
      websiteEmbed: true,
      leadCapture: true,
      emailTranscripts: true,
      conversationHistoryExport: true,
      autoSyncDataSources: true,
      supportLevel: 'dedicated',
      trainingSessions: 2,
      monthlyStrategyCalls: true,
      quarterlyBusinessReviews: false,
      customDataRetention: true,
    },
  },
  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise',
    pricing: {
      monthly: 999,
      annual: 11988,
      annualMonthly: 999, // Custom pricing, using base as placeholder
    },
    features: {
      messageCreditsPerMonth: 100000,
      storageLimitMB: 500,
      unlimitedWebsites: true,
      linkTrainingLimit: 'unlimited',
      apiAccess: true,
      analytics: 'advanced',
      autoRetrain: true,
      inactivityDeletionDays: null,
      modelAccess: 'advanced',
      websiteEmbed: true,
      leadCapture: true,
      emailTranscripts: true,
      conversationHistoryExport: true,
      autoSyncDataSources: true,
      supportLevel: 'dedicated',
      trainingSessions: 3,
      monthlyStrategyCalls: true,
      quarterlyBusinessReviews: true,
      customDataRetention: true,
    },
  },
};

// Available Add-ons
export const AVAILABLE_ADDONS: AddOn[] = [
  {
    id: 'extra-messages',
    name: 'Extra Messages',
    description: '2,500 additional messages per month',
    price: 25,
    type: 'extra_messages',
    value: 2500,
  },
  {
    id: 'remove-branding',
    name: 'Remove Branding',
    description: 'Remove "Powered by Strikebot" branding',
    price: 199,
    type: 'remove_branding',
  },
  {
    id: 'fullscreen-help-page',
    name: 'Fullscreen Help Page',
    description: 'Add a dedicated fullscreen chatbot help page with sidebar and chat history',
    price: 49,
    type: 'fullscreen_help_page',
  },
];
