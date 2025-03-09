import React, { useState, useEffect } from 'react';
import { Prompt } from '../../utils/storage';

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
    onSubmit: (prompt: Prompt) => void;
    initialPrompt: Prompt | null;
    onCancel: () => void;
}

const PromptForm: React.FC<PromptFormProps> = ({ onSubmit, initialPrompt, onCancel }) => {
    const [name, setName] = useState('');
    const [text, setText] = useState('');
    const [category, setCategory] = useState('');
    const [color, setColor] = useState(defaultColors[0]);
    const [icon, setIcon] = useState(availableIcons[0]);
    const [showIconPicker, setShowIconPicker] = useState(false);

    // Reset form when initialPrompt changes
    useEffect(() => {
        if (initialPrompt) {
            setName(initialPrompt.name || '');
            setText(initialPrompt.text);
            setCategory(initialPrompt.category);
            setColor(initialPrompt.color);
            setIcon(initialPrompt.icon);
        } else {
            setName('');
            setText('');
            setCategory('');
            setColor(defaultColors[0]);
            setIcon(availableIcons[0]);
        }
    }, [initialPrompt]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!text.trim()) {
            alert('Prompt text cannot be empty');
            return;
        }

        // If name is not provided, use the first few words of the text
        const promptName = name.trim() || text.trim().split(' ').slice(0, 3).join(' ') + '...';

        const promptData: Prompt = {
            id: initialPrompt ? initialPrompt.id : Date.now().toString(),
            name: promptName,
            text: text.trim(),
            category: category.trim(),
            color,
            icon
        };

        onSubmit(promptData);

        if (!initialPrompt) {
            setName('');
            setText('');
        }
    };

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
                        placeholder="Enter a name for your prompt (optional)"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="promptText">Prompt Text</label>
                    <textarea
                        id="promptText"
                        className="form-control"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter your prompt text here..."
                        rows={4}
                        required
                    />
                </div>

                <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="promptCategory">Category (optional)</label>
                        <input
                            type="text"
                            id="promptCategory"
                            className="form-control"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="E.g., Coding, Writing, etc."
                        />
                    </div>

                    <div className="form-group" style={{ width: '120px' }}>
                        <label htmlFor="promptColor">Color</label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input
                                type="color"
                                id="promptColor"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                style={{ width: '40px', height: '40px', padding: 0, cursor: 'pointer' }}
                            />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {defaultColors.map((c) => (
                                    <div
                                        key={c}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            backgroundColor: c,
                                            cursor: 'pointer',
                                            border: color === c ? '2px solid #000' : '1px solid #ddd',
                                            borderRadius: '2px'
                                        }}
                                        onClick={() => setColor(c)}
                                        title={c}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="promptIcon">Icon</label>
                    <div
                        className="form-control"
                        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => setShowIconPicker(!showIconPicker)}
                    >
                        <span className="material-icons" style={{ marginRight: '8px' }}>{icon}</span>
                        {icon}
                    </div>

                    {showIconPicker && (
                        <div className="icon-picker">
                            {availableIcons.map((i) => (
                                <div
                                    key={i}
                                    className={`icon-option ${i === icon ? 'selected' : ''}`}
                                    onClick={() => {
                                        setIcon(i);
                                        setShowIconPicker(false);
                                    }}
                                    title={i}
                                >
                                    <span className="material-icons">{i}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button type="submit" className="btn btn-primary">
                        {initialPrompt ? 'Update Prompt' : 'Add Prompt'}
                    </button>

                    {initialPrompt && (
                        <button
                            type="button"
                            className="btn btn-secondary"
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