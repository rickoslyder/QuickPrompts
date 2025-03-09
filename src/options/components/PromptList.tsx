import React from 'react';
import { Prompt } from '../../utils/storage';

interface PromptListProps {
    prompts: Prompt[];
    onEdit: (prompt: Prompt) => void;
    onDelete: (id: string) => void;
    onReorder: (id: string, direction: 'up' | 'down') => void;
}

const PromptList: React.FC<PromptListProps> = ({ prompts, onEdit, onDelete, onReorder }) => {
    if (prompts.length === 0) {
        return (
            <div className="prompt-list">
                <p>No prompts added yet. Use the form above to add your first prompt.</p>
            </div>
        );
    }

    return (
        <div className="prompt-list">
            <h2>Your Prompts</h2>
            {prompts.map((prompt, index) => (
                <div key={prompt.id} className="prompt-item">
                    <div
                        className="prompt-color"
                        style={{ backgroundColor: prompt.color || '#444654' }}
                    />

                    <div className="prompt-icon">
                        <span className="material-icons">{prompt.icon || 'text_snippet'}</span>
                    </div>

                    <div className="prompt-name" style={{ fontWeight: 'bold', marginRight: '10px' }}>
                        {prompt.name || 'Unnamed Prompt'}
                    </div>

                    <div className="prompt-text" style={{ color: '#666', flexGrow: 1 }}>
                        {prompt.text.length > 50
                            ? `${prompt.text.substring(0, 50)}...`
                            : prompt.text
                        }
                    </div>

                    {prompt.category && (
                        <div className="prompt-category">{prompt.category}</div>
                    )}

                    <div className="prompt-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => onReorder(prompt.id, 'up')}
                            disabled={index === 0}
                            title="Move up"
                        >
                            <span className="material-icons">arrow_upward</span>
                        </button>

                        <button
                            className="btn btn-secondary"
                            onClick={() => onReorder(prompt.id, 'down')}
                            disabled={index === prompts.length - 1}
                            title="Move down"
                        >
                            <span className="material-icons">arrow_downward</span>
                        </button>

                        <button
                            className="btn btn-secondary"
                            onClick={() => onEdit(prompt)}
                            title="Edit prompt"
                        >
                            <span className="material-icons">edit</span>
                        </button>

                        <button
                            className="btn btn-danger"
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete this prompt?')) {
                                    onDelete(prompt.id);
                                }
                            }}
                            title="Delete prompt"
                        >
                            <span className="material-icons">delete</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PromptList;