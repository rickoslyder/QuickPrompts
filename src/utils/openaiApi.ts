import { Prompt } from "./storage";

interface CategorySuggestion {
  promptId: string;
  category: string;
}

interface OpenAIError {
  message: string;
  type?: string;
  code?: string;
}

export interface CategoryResult {
  success: boolean;
  suggestions?: CategorySuggestion[];
  error?: OpenAIError;
}

// New Interfaces for Model Fetching
export interface OpenAIModel {
  id: string;
  object: string; // e.g., 'model'
  created: number;
  owned_by: string;
  // Add other relevant fields if needed, like 'permission', 'root', 'parent'
}

export interface ModelsResult {
  success: boolean;
  models?: OpenAIModel[];
  error?: OpenAIError;
}

/**
 * Uses OpenAI API to suggest categories for a list of prompts
 */
export const getCategorySuggestions = async (
  apiKey: string,
  prompts: Prompt[]
): Promise<CategoryResult> => {
  if (!apiKey) {
    return {
      success: false,
      error: { message: "No API key provided" },
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that categorizes prompts. 
            Please analyze the provided prompts and suggest a suitable category for each one.
            Return your response as a valid JSON object in the following format:
            {
              "prompts": [
                {
                  "promptId": "id_from_input",
                  "category": "your_suggested_category"
                },
                ...
              ]
            }
            Your response MUST be valid JSON.`,
          },
          {
            role: "user",
            content: JSON.stringify(
              prompts.map((p) => ({ id: p.id, text: p.text }))
            ),
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          message: errorData.error?.message || "Request failed",
          type: errorData.error?.type,
          code: errorData.error?.code,
        },
      };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        error: { message: "No content returned from API" },
      };
    }

    // Try to parse the JSON content
    try {
      const parsedContent = JSON.parse(content);
      // Check if the parsed content has the data we need
      if (Array.isArray(parsedContent.suggestions)) {
        return {
          success: true,
          suggestions: parsedContent.suggestions,
        };
      } else if (Array.isArray(parsedContent.prompts)) {
        // If the API returned a 'prompts' array instead of 'suggestions'
        return {
          success: true,
          suggestions: parsedContent.prompts,
        };
      } else if (Array.isArray(parsedContent)) {
        // If the API returned a direct array instead of the expected object structure
        return {
          success: true,
          suggestions: parsedContent,
        };
      } else {
        // We have JSON but not in the expected format
        console.error("Unexpected JSON structure:", content);
        return {
          success: false,
          error: { message: "API returned unexpected JSON structure" },
        };
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      return {
        success: false,
        error: { message: "Failed to parse API response" },
      };
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
};

/**
 * Fetches available models from the OpenAI API
 */
export const getAvailableModels = async (
  apiKey: string
): Promise<ModelsResult> => {
  if (!apiKey) {
    return {
      success: false,
      error: { message: "No API key provided" },
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      const error = responseData.error as OpenAIError;
      return {
        success: false,
        error: {
          message: error?.message || "Failed to fetch models",
          type: error?.type,
          code: error?.code,
        },
      };
    }

    // Filter out models containing 'vision' in their ID as they might not be suitable for text enhancement
    const filteredModels = (responseData.data as OpenAIModel[]).filter(
      (model) => !model.id.includes("vision")
    );

    // Optionally sort models, e.g., by ID or put preferred models first
    filteredModels.sort((a, b) => a.id.localeCompare(b.id));

    return {
      success: true,
      models: filteredModels,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Unknown network error",
      },
    };
  }
};

// --- Prompt Enhancement Types and Function ---

export interface EnhancementHistoryItem {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface EnhancePromptResult {
  success: boolean;
  enhancedPrompt?: string;
  history?: EnhancementHistoryItem[]; // Return updated history
  error?: OpenAIError;
}

// System prompt for the enhancer
const ENHANCER_SYSTEM_PROMPT = `You are an AI assistant specialized in enhancing user-provided prompts for Large Language Models (LLMs) like ChatGPT.
Your goal is to refine the user's prompt to be clearer, more effective, and more likely to yield the desired output from an LLM.

Guidelines:
1.  **Understand Intent:** Analyze the user's original prompt to grasp their underlying goal.
2.  **Clarity and Specificity:** Improve wording for precision. Remove ambiguity. Add necessary context or constraints if missing.
3.  **Structure:** Organize the prompt logically. Use formatting (like markdown or bullet points) if it improves readability for the LLM.
4.  **Completeness:** Ensure the prompt includes all necessary information for the LLM to perform the task.
5.  **Tone and Persona:** Adjust the tone or suggest a persona for the LLM if relevant to the user's goal (e.g., 'Act as a senior software engineer...').
6.  **Conciseness:** While adding detail is important, avoid unnecessary jargon or verbosity.
7.  **Output Format:** If the user implies a desired output format (e.g., list, JSON, table), make it explicit in the prompt.
8.  **Feedback Integration:** If the user provides feedback on a previous enhancement, incorporate it into the next refinement.

Output ONLY the enhanced prompt text, without any explanations, apologies, or introductory phrases like "Here is the enhanced prompt:". Just provide the raw, improved prompt.`;

/**
 * Enhances a given prompt using the OpenAI API based on history and feedback.
 */
export const enhancePrompt = async (
  apiKey: string,
  modelId: string,
  originalPrompt: string,
  history: EnhancementHistoryItem[],
  feedback?: string // Optional feedback on the last assistant response
): Promise<EnhancePromptResult> => {
  if (!apiKey) {
    return { success: false, error: { message: "API Key not provided" } };
  }
  if (!modelId) {
    return { success: false, error: { message: "Model ID not selected" } };
  }

  const messages: EnhancementHistoryItem[] = [
    { role: "system", content: ENHANCER_SYSTEM_PROMPT },
    // Add existing history
    ...history,
  ];

  // If this is the first enhancement for this prompt, add the original prompt as user input
  if (history.length === 0) {
    messages.push({
      role: "user",
      content: `Enhance this prompt: ${originalPrompt}`,
    });
  } else if (feedback) {
    // If there's feedback, add it as a new user message
    messages.push({ role: "user", content: feedback });
  } else {
    // If no feedback, ask for another refinement (might need adjustment based on desired flow)
    messages.push({
      role: "user",
      content:
        "Regenerate the enhancement, perhaps exploring a different angle.",
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId, // Use the selected model ID
        messages: messages,
        temperature: 0.5, // Slightly creative temperature
        max_tokens: 1000, // Allow for reasonably long prompts
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const error = responseData.error as OpenAIError;
      console.error("OpenAI API Error:", error);
      return {
        success: false,
        error: {
          message: error?.message || "Failed to enhance prompt",
          type: error?.type,
          code: error?.code,
        },
      };
    }

    const enhancedPrompt = responseData.choices[0]?.message?.content?.trim();

    if (!enhancedPrompt) {
      console.error("No content returned from API:", responseData);
      return {
        success: false,
        error: { message: "No enhancement content returned from API" },
      };
    }

    // Update history with the latest user message (original/feedback) and the assistant response
    const updatedHistory: EnhancementHistoryItem[] = [
      ...messages.slice(1), // Exclude system prompt from stored history
      { role: "assistant", content: enhancedPrompt },
    ];

    // Only keep the original prompt message and the latest assistant response + feedback loop
    // This prevents the history from growing indefinitely with regeneration attempts
    const prunedHistory = updatedHistory.slice(-4); // Keep last ~2 turns (user, assistant, user, assistant)

    return {
      success: true,
      enhancedPrompt: enhancedPrompt,
      history: prunedHistory,
    };
  } catch (error) {
    console.error("Error calling enhancePrompt API:", error);
    return {
      success: false,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Unknown network error during enhancement",
      },
    };
  }
};
