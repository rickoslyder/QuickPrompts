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
