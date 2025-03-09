import React, { useState } from 'react';
import { Prompt } from '../../utils/storage';
import { getCategorySuggestions, CategoryResult } from '../../utils/openaiApi';

interface CategorySuggestionsProps {
    prompts: Prompt[];
    apiKey: string;
    onApply: (prompts: Prompt[]) => void;
    onCancel: () => void;
}

interface PromptWithSuggestion extends Prompt {
    suggestedCategory?: string;
    useCategory: boolean;
}

const CategorySuggestions: React.FC<CategorySuggestionsProps> = ({ prompts, apiKey, onApply, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [promptsWithSuggestions, setPromptsWithSuggestions] = useState<PromptWithSuggestion[]>([]);
    const [isFetched, setIsFetched] = useState(false);

    const handleFetchCategories = async () => {
        if (!apiKey) {
            setError('Please enter an OpenAI API key in the Settings tab first.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result: CategoryResult = await getCategorySuggestions(apiKey, prompts);

            if (!result.success || !result.suggestions) {
                setError(result.error?.message || 'Failed to categorize prompts');
                setLoading(false);
                return;
            }

            // Map the suggestions to the prompts
            const updatedPrompts: PromptWithSuggestion[] = prompts.map(prompt => {
                const suggestion = result.suggestions?.find(s => s.promptId === prompt.id);
                return {
                    ...prompt,
                    suggestedCategory: suggestion?.category || '',
                    useCategory: suggestion?.category ? true : false
                };
            });

            setPromptsWithSuggestions(updatedPrompts);
            setIsFetched(true);
        } catch (err) {
            setError('An unexpected error occurred while fetching categories.');
            console.error('Error fetching categories:', err);
        }

        setLoading(false);
    };

    const handleToggleUseCategory = (id: string) => {
        setPromptsWithSuggestions(prev =>
            prev.map(p =>
                p.id === id ? { ...p, useCategory: !p.useCategory } : p
            )
        );
    };

    const handleApplyCategories = () => {
        // Only update prompts that have suggestedCategory and useCategory is true
        const updatedPrompts = prompts.map(prompt => {
            const promptWithSuggestion = promptsWithSuggestions.find(p => p.id === prompt.id);

            if (promptWithSuggestion?.useCategory && promptWithSuggestion.suggestedCategory) {
                return {
                    ...prompt,
                    category: promptWithSuggestion.suggestedCategory
                };
            }

            return prompt;
        });

        onApply(updatedPrompts);
    };

    return (
        <div>
            <h2>AI Categorization</h2>

            {!isFetched && (
                <div>
                    <p>
                        This feature uses the OpenAI API to suggest categories for your prompts.
                        You'll need an API key from OpenAI to use this feature.
                    </p>

                    {error && (
                        <div className="notification notification-error">
                            {error}
                        </div>
                    )}

                    <button
                        className="btn btn-primary"
                        onClick={handleFetchCategories}
                        disabled={loading || !apiKey}
                    >
                        {loading ? 'Fetching Categories...' : 'Fetch Category Suggestions'}
                    </button>

                    <button
                        className="btn btn-secondary"
                        onClick={onCancel}
                        style={{ marginLeft: '10px' }}
                    >
                        Cancel
                    </button>
                </div>
            )}

            {isFetched && (
                <div>
                    <p>Below are the suggested categories for your prompts. Select which ones to apply:</p>

                    <div className="prompt-list">
                        {promptsWithSuggestions.map(prompt => (
                            <div key={prompt.id} className="prompt-item">
                                <div className="prompt-text">
                                    {prompt.text.length > 50
                                        ? `${prompt.text.substring(0, 50)}...`
                                        : prompt.text
                                    }
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
                                    <div>
                                        <span>Current: </span>
                                        <span className="prompt-category">{prompt.category || 'None'}</span>
                                    </div>

                                    <div style={{ margin: '0 10px' }}>→</div>

                                    <div>
                                        <span>Suggested: </span>
                                        <span className="prompt-category">{prompt.suggestedCategory || 'None'}</span>
                                    </div>

                                    <div style={{ marginLeft: '10px' }}>
                                        <label className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={prompt.useCategory}
                                                onChange={() => handleToggleUseCategory(prompt.id)}
                                                disabled={!prompt.suggestedCategory}
                                                style={{ marginRight: '5px' }}
                                            />
                                            Apply
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleApplyCategories}
                        >
                            Apply Selected Categories
                        </button>

                        <button
                            className="btn btn-secondary"
                            onClick={onCancel}
                            style={{ marginLeft: '10px' }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategorySuggestions; 