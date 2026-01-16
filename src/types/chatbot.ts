export type TierName = 'free' | 'hobby' | 'standard' | 'pro';

export interface TierConfig {
  name: TierName;
  displayName: string;
  price: number;
  features: {
    messageCreditsPerMonth: number;
    storageLimitMB: number;
    aiActionsPerAgent: number;
    unlimitedWebsites: boolean;
    linkTrainingLimit: number | 'unlimited';
    integrations: boolean;
    apiAccess: boolean;
    analytics: 'none' | 'basic' | 'advanced';
    autoRetrain: boolean;
    inactivityDeletionDays: number | null;
    modelAccess: 'limited' | 'advanced';
  };
}

export interface ChatbotConfig {
  id: string;
  name: string;
  tier: TierName;
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
  };

  // Limits from tier
  limits: {
    messageCreditsPerMonth: number;
    storageLimitMB: number;
    aiActionsPerAgent: number;
    linkTrainingLimit: number | null;
  };

  // Feature flags from tier
  features: {
    integrations: boolean;
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
  { id: 'gpt-5.1', name: 'GPT-5.1', tier: 'advanced' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini', tier: 'advanced' },
  { id: 'gpt-5-nano', name: 'GPT-5 Nano', tier: 'limited' },
  { id: 'gpt-4.1', name: 'GPT-4.1', tier: 'advanced' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', tier: 'limited' },
  { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', tier: 'limited' },
  { id: 'o3', name: 'O3', tier: 'advanced' },
  { id: 'o4-mini', name: 'O4 Mini', tier: 'advanced' },
  { id: 'gpt-4o', name: 'GPT-4o', tier: 'limited' },
  { id: 'gpt-4o-realtime-preview', name: 'GPT-4o Realtime Preview', tier: 'advanced' },
] as const;

export const TIER_CONFIGS: Record<TierName, TierConfig> = {
  free: {
    name: 'free',
    displayName: 'Free Plan',
    price: 0,
    features: {
      messageCreditsPerMonth: 50,
      storageLimitMB: 0.4, // 400 KB
      aiActionsPerAgent: 0,
      unlimitedWebsites: true,
      linkTrainingLimit: 10,
      integrations: false,
      apiAccess: false,
      analytics: 'none',
      autoRetrain: false,
      inactivityDeletionDays: 14,
      modelAccess: 'limited',
    },
  },
  hobby: {
    name: 'hobby',
    displayName: 'Hobby Plan',
    price: 40,
    features: {
      messageCreditsPerMonth: 1500,
      storageLimitMB: 20,
      aiActionsPerAgent: 5,
      unlimitedWebsites: true,
      linkTrainingLimit: 'unlimited',
      integrations: true,
      apiAccess: true,
      analytics: 'basic',
      autoRetrain: false,
      inactivityDeletionDays: null,
      modelAccess: 'advanced',
    },
  },
  standard: {
    name: 'standard',
    displayName: 'Standard Plan',
    price: 150,
    features: {
      messageCreditsPerMonth: 10000,
      storageLimitMB: 40,
      aiActionsPerAgent: 10,
      unlimitedWebsites: true,
      linkTrainingLimit: 'unlimited',
      integrations: true,
      apiAccess: true,
      analytics: 'basic',
      autoRetrain: true,
      inactivityDeletionDays: null,
      modelAccess: 'advanced',
    },
  },
  pro: {
    name: 'pro',
    displayName: 'Pro Plan',
    price: 500,
    features: {
      messageCreditsPerMonth: 40000,
      storageLimitMB: 60,
      aiActionsPerAgent: 15,
      unlimitedWebsites: true,
      linkTrainingLimit: 'unlimited',
      integrations: true,
      apiAccess: true,
      analytics: 'advanced',
      autoRetrain: true,
      inactivityDeletionDays: null,
      modelAccess: 'advanced',
    },
  },
};
