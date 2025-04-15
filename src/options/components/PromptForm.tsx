import React, { useState, useEffect, useCallback } from 'react';
import { Prompt } from '../../utils/storage';
// Import enhancer API function and types
import { enhancePrompt, EnhancementHistoryItem } from '../../utils/openaiApi';

// Available icons for prompts
const availableIcons = [
    'text_snippet', 'psychology', 'lightbulb', 'code', 'terminal',
    'format_quote', 'smart_toy', 'chat', 'question_answer', 'format_list_bulleted',
    'list_alt', 'help', 'school', 'science', 'engineering',
    'build', 'handyman', 'design_services', 'public', 'language'
];

// Default colors for prompts
const defaultColors = [
    '#10a37f', // ChatGPT green
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#6366f1', // Indigo
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#4b5563'  // Gray
];

interface PromptFormProps {
    onSave: (prompt: Prompt) => void; // Renamed from onSubmit for clarity
    initialPrompt: Prompt | null;
    onCancel: () => void;
    existingIds: string[]; // Add existing IDs for unique generation
    // Add props for enhancer
    apiKey: string | null;
    selectedModelId: string | null;
}

const PromptForm: React.FC<PromptFormProps> = ({
    onSave,
    initialPrompt,
    onCancel,
    existingIds,
    apiKey,
    selectedModelId
}) => {
    const [name, setName] = useState('');
    const [text, setText] = useState('');
    const [category, setCategory] = useState('');
    const [color, setColor] = useState(defaultColors[0]);
    const [icon, setIcon] = useState(availableIcons[0]);
    const [showIconPicker, setShowIconPicker] = useState(false);

    // --- Enhancer State ---
    const [enhancerPreview, setEnhancerPreview] = useState<string | null>(null);
    const [enhancerFeedback, setEnhancerFeedback] = useState('');
    const [enhancerHistory, setEnhancerHistory] = useState<EnhancementHistoryItem[]>([]);
    const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
    const [enhancerError, setEnhancerError] = useState<string | null>(null);
    // --- End Enhancer State ---

    const resetEnhancerState = useCallback(() => {
        setEnhancerPreview(null);
        setEnhancerFeedback('');
        setEnhancerHistory([]);
        setIsEnhancing(false);
        setEnhancerError(null);
    }, []);

    // Reset form and enhancer state when initialPrompt changes
    useEffect(() => {
        if (initialPrompt) {
            setName(initialPrompt.name || '');
            setText(initialPrompt.text);
            setCategory(initialPrompt.category);
            setColor(initialPrompt.color);
            setIcon(initialPrompt.icon);
            resetEnhancerState(); // Reset enhancer when editing
        } else {
            // Reset form fields for adding new prompt
            setName('');
            setText('');
            setCategory('');
            setColor(defaultColors[0]);
            setIcon(availableIcons[0]);
            resetEnhancerState(); // Ensure clean state for new prompt
        }
    }, [initialPrompt, resetEnhancerState]);

    // --- Enhancer Handlers ---
    const handleEnhance = async () => {
        if (!apiKey || !selectedModelId) {
            setEnhancerError('API Key and Model must be configured in Settings to use enhancer.');
            return;
        }
        if (!text.trim()) {
            setEnhancerError('Please enter some initial prompt text to enhance.');
            return;
        }

        setIsEnhancing(true);
        setEnhancerError(null);
        setEnhancerPreview(null); // Clear previous preview

        try {
            const result = await enhancePrompt(apiKey, selectedModelId, text, []); // Start with empty history
            if (result.success && result.enhancedPrompt) {
                setEnhancerPreview(result.enhancedPrompt);
                setEnhancerHistory(result.history || []);
            } else {
                setEnhancerError(result.error?.message || 'Failed to enhance prompt.');
            }
        } catch (error) {
            console.error("Enhancement error:", error);
            setEnhancerError(error instanceof Error ? error.message : 'Unknown error during enhancement.');
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleRegenerate = async () => {
        if (!apiKey || !selectedModelId || !enhancerPreview) {
            setEnhancerError('Cannot regenerate without API Key, Model, and an initial suggestion.');
            return;
        }

        setIsEnhancing(true);
        setEnhancerError(null);

        try {
            // Pass current history and feedback
            const result = await enhancePrompt(apiKey, selectedModelId, text, enhancerHistory, enhancerFeedback);
            if (result.success && result.enhancedPrompt) {
                setEnhancerPreview(result.enhancedPrompt);
                setEnhancerHistory(result.history || []);
                setEnhancerFeedback(''); // Clear feedback after using it
            } else {
                setEnhancerError(result.error?.message || 'Failed to regenerate enhancement.');
            }
        } catch (error) {
            console.error("Regeneration error:", error);
            setEnhancerError(error instanceof Error ? error.message : 'Unknown error during regeneration.');
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleAcceptSuggestion = () => {
        if (enhancerPreview) {
            setText(enhancerPreview); // Update main text area
            resetEnhancerState(); // Clear enhancer section
        }
    };

    const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEnhancerFeedback(e.target.value);
    };
    // --- End Enhancer Handlers ---

    // Generate a unique ID
    const generateUniqueId = () => {
        let newId = Date.now().toString();
        while (existingIds.includes(newId)) {
            // Simple increment might collide, add random suffix
            newId = `${Date.now().toString()}-${Math.random().toString(36).substring(2, 7)}`;
        }
        return newId;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!text.trim()) {
            // Basic validation
            alert('Prompt text cannot be empty');
            return;
        }

        // If name is not provided, use the first few words of the text
        const promptName = name.trim() || text.trim().split(' ').slice(0, 5).join(' ') + (text.trim().split(' ').length > 5 ? '...' : '');

        const promptData: Prompt = {
            id: initialPrompt ? initialPrompt.id : generateUniqueId(), // Use generator for new prompts
            name: promptName,
            text: text.trim(),
            category: category.trim(),
            color,
            icon
        };

        onSave(promptData); // Use onSave prop

        // Reset form only if adding a new prompt
        if (!initialPrompt) {
            setName('');
            setText('');
            setCategory(''); // Reset category too
            setColor(defaultColors[0]);
            setIcon(availableIcons[0]);
            resetEnhancerState(); // Clear enhancer state on successful save
        }
        // No reset needed for updates, as the user might want to keep editing
    };

    const canEnhance = apiKey && selectedModelId;

    return (
        <div className="prompt-form">
            <h2>{initialPrompt ? 'Edit Prompt' : 'Add New Prompt'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="promptName">Prompt Name</label>
                    <input
                        type="text"
                        id="promptName"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Brief name (optional, generated if blank)"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="promptText">Prompt Text</label>
                    <textarea
                        id="promptText"
                        className="form-control"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter the prompt you want to save..."
                        rows={initialPrompt ? 4 : 6} // More rows when adding potentially
                        required
                    />
                </div>

                {/* --- AI Enhancer Section (Only show when adding new prompt) --- */}
                {!initialPrompt && (
                    <div className="enhancer-section">
                        <hr />
                        <h4>AI Prompt Enhancer</h4>
                        <button
                            type="button"
                            className="button button-secondary"
                            onClick={handleEnhance}
                            disabled={!canEnhance || isEnhancing || !text.trim()}
                            title={!canEnhance ? "Requires OpenAI API Key and Model selection in Settings" : (!text.trim() ? "Enter prompt text to enhance" : "Enhance prompt with AI")}
                        >
                            {isEnhancing && !enhancerPreview ? 'Enhancing...' : 'Enhance with AI'}
                        </button>

                        {enhancerError && (
                            <p className="error-message" style={{ marginTop: '10px' }}>{enhancerError}</p>
                        )}

                        {isEnhancing && (
                            <p style={{ marginTop: '10px' }}><i>Processing enhancement request...</i></p>
                        )}

                        {enhancerPreview && !isEnhancing && (
                            <div className="enhancer-preview" style={{ marginTop: '15px', border: '1px solid #ccc', padding: '10px', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                                <h5>Suggested Enhancement:</h5>
                                <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{enhancerPreview}</pre>
                                <button
                                    type="button"
                                    className="button button-primary button-small"
                                    onClick={handleAcceptSuggestion}
                                    style={{ marginRight: '10px' }}
                                >
                                    Accept Suggestion
                                </button>
                                <hr style={{ margin: '15px 0' }} />
                                <div className="form-group">
                                    <label htmlFor="enhancerFeedback">Feedback (optional):</label>
                                    <textarea
                                        id="enhancerFeedback"
                                        className="form-control"
                                        rows={2}
                                        placeholder="Provide feedback for regeneration (e.g., 'Make it more formal', 'Focus on the output format')"
                                        value={enhancerFeedback}
                                        onChange={handleFeedbackChange}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="button button-secondary button-small"
                                    onClick={handleRegenerate}
                                    disabled={isEnhancing}
                                >
                                    {isEnhancing ? 'Regenerating...' : 'Regenerate with Feedback'}
                                </button>
                            </div>
                        )}
                        <hr />
                    </div>
                )}
                {/* --- End AI Enhancer Section --- */}

                {/* Category field on its own line */}
                <div className="form-group">
                    <label htmlFor="promptCategory">Category</label>
                    <input
                        type="text"
                        id="promptCategory"
                        className="form-control"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="E.g., Coding, Writing (optional)"
                    />
                </div>

                {/* Row for Icon and Color pickers */}
                <div className="form-row">
                    {/* Icon Picker Button */}
                    <div className="form-group" style={{ width: 'auto' }}>
                        <label>Icon</label>
                        <button
                            type="button"
                            className="form-control icon-picker-button"
                            onClick={() => setShowIconPicker(!showIconPicker)}
                            title="Select Icon"
                        >
                            <span className="material-icons">{icon || 'apps'}</span>
                        </button>
                        {showIconPicker && (
                            <div className="icon-picker-popover">
                                {availableIcons.map((i) => (
                                    <div
                                        key={i}
                                        className={`icon-option ${i === icon ? 'selected' : ''}`}
                                        onClick={() => { setIcon(i); setShowIconPicker(false); }}
                                        title={i}
                                    >
                                        <span className="material-icons">{i}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Color Input - Take remaining space */}
                    <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="promptColor">Color</label>
                        <div className="color-picker-wrapper">
                            <input
                                type="color"
                                id="promptColor"
                                className="color-input-native"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                title="Choose custom color"
                            />
                            {/* Swatches */}
                            {defaultColors.map((c) => (
                                <div
                                    key={c}
                                    className={`color-swatch ${color === c ? 'selected' : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                    title={c}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="button button-primary">
                        {initialPrompt ? 'Update Prompt' : 'Add Prompt'}
                    </button>
                    {/* Only render Cancel button when editing */}
                    {initialPrompt && (
                        <button
                            type="button"
                            className="button button-secondary"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default PromptForm; 