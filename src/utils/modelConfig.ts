export interface ModelConfig {
  id: string;
  displayName: string;
  category: 'reasoning' | 'chat' | 'completion' | 'other';
  capabilities: {
    enhancement: boolean;
    categorization: boolean;
    jsonMode: boolean;
  };
  parameters: {
    useMaxCompletionTokens: boolean; // true for o1 models
    maxTokensLimit?: number;
    defaultMaxTokens?: number;
    supportsTemperature?: boolean; // false for reasoning models
    temperature?: number; // fixed temperature value if not configurable
  };
  deprecated?: boolean;
  description?: string;
}

// Model configurations based on OpenAI's documentation
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // O1 Series - Reasoning models
  'o1-preview': {
    id: 'o1-preview',
    displayName: 'O1 Preview',
    category: 'reasoning',
    capabilities: {
      enhancement: true,
      categorization: true,
      jsonMode: false, // O1 models don't support response_format
    },
    parameters: {
      useMaxCompletionTokens: true,
      maxTokensLimit: 32768,
      defaultMaxTokens: 4096,
      supportsTemperature: false,
      temperature: 1,
    },
    description: 'Advanced reasoning model for complex tasks',
  },
  'o1-mini': {
    id: 'o1-mini',
    displayName: 'O1 Mini',
    category: 'reasoning',
    capabilities: {
      enhancement: true,
      categorization: true,
      jsonMode: false,
    },
    parameters: {
      useMaxCompletionTokens: true,
      maxTokensLimit: 65536,
      defaultMaxTokens: 4096,
      supportsTemperature: false,
      temperature: 1,
    },
    description: 'Smaller, faster reasoning model',
  },
  
  // O3 Series - Advanced reasoning models
  'o3': {
    id: 'o3',
    displayName: 'O3',
    category: 'reasoning',
    capabilities: {
      enhancement: true,
      categorization: true,
      jsonMode: false,
    },
    parameters: {
      useMaxCompletionTokens: true,
      maxTokensLimit: 100000,
      defaultMaxTokens: 4096,
      supportsTemperature: false,
      temperature: 1,
    },
    description: 'Advanced reasoning model with enhanced capabilities',
  },
  'o3-mini': {
    id: 'o3-mini',
    displayName: 'O3 Mini',
    category: 'reasoning',
    capabilities: {
      enhancement: true,
      categorization: true,
      jsonMode: false,
    },
    parameters: {
      useMaxCompletionTokens: true,
      maxTokensLimit: 65536,
      defaultMaxTokens: 4096,
      supportsTemperature: false,
      temperature: 1,
    },
    description: 'Smaller O3 model for faster inference',
  },
  
  // O4 Series - Latest reasoning models with multimodal support
  'o4-mini': {
    id: 'o4-mini',
    displayName: 'O4 Mini',
    category: 'reasoning',
    capabilities: {
      enhancement: true,
      categorization: true,
      jsonMode: false,
    },
    parameters: {
      useMaxCompletionTokens: true,
      maxTokensLimit: 65536,
      defaultMaxTokens: 4096,
      supportsTemperature: false,
      temperature: 1,
    },
    description: 'Fast, cost-efficient reasoning model with multimodal support',
  },
  
  // GPT-4o Series
  'gpt-4o': {
    id: 'gpt-4o',
    displayName: 'GPT-4o',
    category: 'chat',
    capabilities: {
      enhancement: true,
      categorization: true,
      jsonMode: true,
    },
    parameters: {
      useMaxCompletionTokens: false,
      maxTokensLimit: 4096,
      defaultMaxTokens: 1000,
      supportsTemperature: true,
    },
    description: 'Latest GPT-4 optimized model',
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    category: 'chat',
    capabilities: {
      enhancement: true,
      categorization: true,
      jsonMode: true,
    },
    parameters: {
      useMaxCompletionTokens: false,
      maxTokensLimit: 16384,
      defaultMaxTokens: 1000,
      supportsTemperature: true,
    },
    description: 'Small, affordable GPT-4o model',
  },
  
  // GPT-4 Series
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    displayName: 'GPT-4 Turbo',
    category: 'chat',
    capabilities: {
      enhancement: true,
      categorization: true,
      jsonMode: true,
    },
    parameters: {
      useMaxCompletionTokens: false,
      maxTokensLimit: 4096,
      defaultMaxTokens: 1000,
      supportsTemperature: true,
    },
    description: 'GPT-4 Turbo with vision capabilities',
  },
  'gpt-4': {
    id: 'gpt-4',
    displayName: 'GPT-4',
    category: 'chat',
    capabilities: {
      enhancement: true,
      categorization: true,
      jsonMode: true,
    },
    parameters: {
      useMaxCompletionTokens: false,
      maxTokensLimit: 8192,
      defaultMaxTokens: 1000,
      supportsTemperature: true,
    },
    description: 'Original GPT-4 model',
  },
  
  // GPT-3.5 Series
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5 Turbo',
    category: 'chat',
    capabilities: {
      enhancement: true,
      categorization: true,
      jsonMode: true,
    },
    parameters: {
      useMaxCompletionTokens: false,
      maxTokensLimit: 4096,
      defaultMaxTokens: 1000,
      supportsTemperature: true,
    },
    description: 'Fast, affordable model for simpler tasks',
  },
};

// Default configuration for unknown models
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  id: 'unknown',
  displayName: 'Unknown Model',
  category: 'other',
  capabilities: {
    enhancement: true,
    categorization: true,
    jsonMode: false,
  },
  parameters: {
    useMaxCompletionTokens: false,
    maxTokensLimit: 4096,
    defaultMaxTokens: 1000,
    supportsTemperature: true,
  },
};

/**
 * Check if a model ID represents a reasoning model based on naming pattern
 */
function isReasoningModel(modelId: string): boolean {
  // Check if it matches the OpenAI reasoning model pattern (o1, o3, o4, etc.)
  return /^o\d+(-mini|-preview)?$/i.test(modelId);
}

/**
 * Get configuration for a specific model
 */
export function getModelConfig(modelId: string): ModelConfig {
  // Return known configuration if available
  if (MODEL_CONFIGS[modelId]) {
    return MODEL_CONFIGS[modelId];
  }
  
  // For unknown models, try to infer type
  const isReasoning = isReasoningModel(modelId);
  
  return {
    ...DEFAULT_MODEL_CONFIG,
    id: modelId,
    displayName: modelId,
    category: isReasoning ? 'reasoning' : 'other',
    parameters: {
      ...DEFAULT_MODEL_CONFIG.parameters,
      useMaxCompletionTokens: isReasoning,
      supportsTemperature: !isReasoning,
      temperature: isReasoning ? 1 : undefined,
    },
    description: isReasoning 
      ? 'Unknown reasoning model - using max_completion_tokens parameter' 
      : undefined,
  };
}

/**
 * Check if a model supports a specific capability
 */
export function modelSupportsCapability(
  modelId: string,
  capability: keyof ModelConfig['capabilities']
): boolean {
  const config = getModelConfig(modelId);
  return config.capabilities[capability];
}

/**
 * Get the appropriate token parameter name for a model
 */
export function getTokenParameterName(modelId: string): 'max_tokens' | 'max_completion_tokens' {
  const config = getModelConfig(modelId);
  return config.parameters.useMaxCompletionTokens ? 'max_completion_tokens' : 'max_tokens';
}

/**
 * Build token parameter object for API calls
 */
export function buildTokenParameter(modelId: string, requestedTokens?: number): Record<string, number> {
  const config = getModelConfig(modelId);
  const paramName = getTokenParameterName(modelId);
  const tokenValue = requestedTokens || config.parameters.defaultMaxTokens || 1000;
  
  return {
    [paramName]: Math.min(tokenValue, config.parameters.maxTokensLimit || tokenValue)
  };
}

/**
 * Get recommended models for a specific use case
 */
export function getRecommendedModels(capability: keyof ModelConfig['capabilities']): ModelConfig[] {
  return Object.values(MODEL_CONFIGS)
    .filter(config => config.capabilities[capability] && !config.deprecated)
    .sort((a, b) => {
      // Prefer chat models over reasoning models for most tasks
      if (a.category === 'chat' && b.category !== 'chat') return -1;
      if (b.category === 'chat' && a.category !== 'chat') return 1;
      return 0;
    });
}

/**
 * Get default model for categorization
 */
export function getDefaultCategorizationModel(): string {
  // Try to use gpt-4o-mini first, then fall back to other models
  const preferredModels = ['gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4o'];
  
  for (const modelId of preferredModels) {
    if (MODEL_CONFIGS[modelId] && modelSupportsCapability(modelId, 'categorization')) {
      return modelId;
    }
  }
  
  // Fall back to first available model that supports categorization
  const categorization = getRecommendedModels('categorization');
  return categorization[0]?.id || 'gpt-4o-mini';
}

/**
 * Build completion parameters for OpenAI API calls
 */
export function buildCompletionParams(
  modelId: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens?: number,
  additionalParams?: Record<string, any>
): Record<string, any> {
  const config = getModelConfig(modelId);
  const tokenParams = buildTokenParameter(modelId, maxTokens);
  
  // Build base params
  const params: Record<string, any> = {
    model: modelId,
    messages,
    ...tokenParams,
    ...additionalParams,
  };
  
  // Remove response_format if model doesn't support it
  if (additionalParams?.response_format && !config.capabilities.jsonMode) {
    delete params.response_format;
  }
  
  // Handle temperature restrictions
  if (config.parameters.supportsTemperature === false) {
    // Remove temperature parameter or set to required value
    if (config.parameters.temperature !== undefined) {
      params.temperature = config.parameters.temperature;
    } else {
      delete params.temperature;
    }
  }
  
  return params;
}

/**
 * Get user-friendly error message for model-specific errors
 */
export function getModelErrorMessage(error: any): string {
  const message = error?.message || '';
  
  if (message.includes('max_tokens') && message.includes('max_completion_tokens')) {
    return 'This model requires a different parameter format. Please try a different model or contact support.';
  }
  
  if (message.includes('response_format')) {
    return 'This model does not support JSON response format. The response may not be properly formatted.';
  }
  
  if (message.includes('does not exist') || message.includes('invalid model')) {
    return 'The selected model is not available. Please choose a different model.';
  }
  
  if (message.includes('insufficient_quota') || message.includes('rate_limit')) {
    return 'API quota exceeded or rate limit reached. Please try again later.';
  }
  
  return message || 'An unknown error occurred with the OpenAI API.';
}