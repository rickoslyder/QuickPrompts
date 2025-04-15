import React, { useState } from 'react';
import { Prompt } from '../../utils/storage'; // Import Prompt type

interface ImportConfirmModalProps {
    // promptCount: number; // No longer needed, can derive from array
    importedPrompts: Prompt[]; // Pass the full array
    onConfirmReplace: () => void;
    onConfirmMerge: () => void;
    onConfirmReplaceSelected: (selectedIds: Set<string>) => void; // New callback
    onCancel: () => void;
}

const ImportConfirmModal: React.FC<ImportConfirmModalProps> = ({
    // promptCount, // Removed
    importedPrompts,
    onConfirmReplace,
    onConfirmMerge,
    onConfirmReplaceSelected, // New callback
    onCancel,
}) => {
    const promptCount = importedPrompts.length;
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set()); // State for expanded items
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set()); // State for selected items

    // Toggle function
    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Toggle selection for a prompt
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleReplaceSelectedClick = () => {
        onConfirmReplaceSelected(selectedIds);
    };

    // --- New: Select All / Select None Toggle ---
    const handleSelectToggleAll = () => {
        if (selectedIds.size === importedPrompts.length) {
            // If all are selected, deselect all
            setSelectedIds(new Set());
        } else {
            // Otherwise, select all
            setSelectedIds(new Set(importedPrompts.map(p => p.id)));
        }
    };
    // --- End New ---

    const isAnySelected = selectedIds.size > 0;
    const areAllSelected = selectedIds.size === importedPrompts.length && importedPrompts.length > 0; // Added check

    return (
        <div className="modal-backdrop">
            <div className="modal" style={{ paddingBottom: '15px' }}>
                <h2>Import {promptCount} Prompts?</h2>
                <p>Select prompts to import and choose an action:</p>

                {/* --- Expandable & Selectable Preview Section --- */}
                <div className="import-preview" style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #ccc', padding: '5px 10px', marginBottom: '15px', background: '#f9f9f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <strong>Incoming Prompts Preview ({promptCount}):</strong>
                        {importedPrompts.length > 0 && ( // Only show if there are prompts
                            <span
                                onClick={handleSelectToggleAll}
                                style={{ cursor: 'pointer', textDecoration: 'underline', color: '#007bff', fontSize: '0.9em' }}
                                role="button" // Added for accessibility
                                tabIndex={0}  // Added for accessibility
                                onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectToggleAll(); }} // Added for accessibility
                            >
                                {areAllSelected ? 'Select None' : 'Select All'}
                            </span>
                        )}
                    </div>
                    <ul style={{ listStyle: 'none', paddingLeft: '0', marginTop: '5px', marginBottom: '5px' }}>
                        {importedPrompts.map((prompt) => {
                            const isExpanded = expandedIds.has(prompt.id);
                            const isSelected = selectedIds.has(prompt.id);
                            return (
                                <li key={prompt.id} style={{ borderBottom: '1px solid #eee', padding: '5px 0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {/* Checkbox for selection */}
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelect(prompt.id)}
                                            style={{ marginRight: '8px', flexShrink: 0 }}
                                            aria-label={`Select prompt: ${prompt.name || 'Unnamed Prompt'}`}
                                        />
                                        {/* Prompt Name (now takes less space) */}
                                        <span title={prompt.name} style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1, marginRight: '10px' }}>
                                            {prompt.name || 'Unnamed Prompt'}
                                        </span>
                                        {/* Expand/Collapse Button */}
                                        <button
                                            onClick={() => toggleExpand(prompt.id)}
                                            className="button button-secondary button-small"
                                            style={{ flexShrink: 0 }}
                                            aria-expanded={isExpanded}
                                        >
                                            {isExpanded ? '[-] Hide' : '[+] Show'}
                                        </button>
                                    </div>
                                    {isExpanded && (
                                        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', marginTop: '5px', padding: '5px', background: '#eee', borderRadius: '3px', fontSize: '0.9em', marginLeft: '25px' /* Indent preview */ }}>
                                            {prompt.text}
                                        </pre>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
                {/* --- End Preview Section --- */}

                {/* Explanation of actions */}
                <div className="import-actions-explanation" style={{ fontSize: '0.9em', marginBottom: '15px', background: '#f0f0f0', padding: '8px', borderRadius: '4px' }}>
                    <p><strong>Replace All:</strong> Deletes all current prompts, then adds all {promptCount} incoming prompts.</p>
                    <p><strong>Merge New:</strong> Keeps all current prompts, then adds only incoming prompts with IDs not already present.</p>
                    <p><strong>Replace Selected:</strong> Keeps current prompts, but removes any current prompts that share an ID with a *selected* incoming prompt, then adds all *selected* incoming prompts.</p>
                </div>

                {/* Buttons */}
                <div className="modal-actions">
                    <button
                        className="button button-primary" // New button for replace selected
                        onClick={handleReplaceSelectedClick}
                        disabled={!isAnySelected}
                        title={!isAnySelected ? "Select prompts from the list above first" : "Replace current prompts with matching IDs with selected ones"}
                    >
                        Replace Selected ({selectedIds.size})
                    </button>
                    <button
                        className="button button-secondary" // Changed from primary to secondary
                        onClick={onConfirmMerge}
                    >
                        Merge New
                    </button>
                    <button
                        className="button button-danger"
                        onClick={onConfirmReplace}
                    >
                        Replace All ({promptCount})
                    </button>
                    <button
                        className="button button-secondary"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportConfirmModal; 