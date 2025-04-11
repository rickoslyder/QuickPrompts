import React, { useState, useEffect, useRef } from 'react';
import PromptList from './components/PromptList';
import PromptForm from './components/PromptForm';
import CategorySuggestions from './components/CategorySuggestions';
import { getPrompts, savePrompts, getUserSettings, saveUserSettings } from '../utils/storage';
import { Prompt, UserSettings, PromptExportData } from '../utils/storage';

enum Tab {
    Prompts = 'prompts',
    Settings = 'settings',
    Categorize = 'categorize'
}

const OptionsPage: React.FC = () => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [userSettings, setUserSettings] = useState<UserSettings>({ openAIApiKey: '' });
    const [activeTab, setActiveTab] = useState<Tab>(Tab.Prompts);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

    // Ref for the hidden file input element
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load prompts and user settings from storage
    useEffect(() => {
        const loadData = async () => {
            try {
                const loadedPrompts = await getPrompts();
                const loadedSettings = await getUserSettings();
                setPrompts(loadedPrompts);
                setUserSettings(loadedSettings);
            } catch (error) {
                showNotification('error', 'Failed to load data');
                console.error('Failed to load data:', error);
            }
        };

        loadData();
    }, []);

    // Show notification and auto-hide after 3 seconds
    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    // Add a new prompt
    const handleAddPrompt = async (prompt: Prompt) => {
        try {
            const updatedPrompts = [...prompts, prompt];
            await savePrompts(updatedPrompts);
            setPrompts(updatedPrompts);
            showNotification('success', 'Prompt added successfully');
        } catch (error) {
            showNotification('error', 'Failed to add prompt');
            console.error('Failed to add prompt:', error);
        }
    };

    // Update an existing prompt
    const handleUpdatePrompt = async (updatedPrompt: Prompt) => {
        try {
            const updatedPrompts = prompts.map(p =>
                p.id === updatedPrompt.id ? updatedPrompt : p
            );
            await savePrompts(updatedPrompts);
            setPrompts(updatedPrompts);
            setEditingPrompt(null);
            showNotification('success', 'Prompt updated successfully');
        } catch (error) {
            showNotification('error', 'Failed to update prompt');
            console.error('Failed to update prompt:', error);
        }
    };

    // Delete a prompt
    const handleDeletePrompt = async (id: string) => {
        try {
            const updatedPrompts = prompts.filter(p => p.id !== id);
            await savePrompts(updatedPrompts);
            setPrompts(updatedPrompts);
            showNotification('success', 'Prompt deleted successfully');
        } catch (error) {
            showNotification('error', 'Failed to delete prompt');
            console.error('Failed to delete prompt:', error);
        }
    };

    // Edit a prompt (open form with existing data)
    const handleEditPrompt = (prompt: Prompt) => {
        setEditingPrompt(prompt);
        setActiveTab(Tab.Prompts);
    };

    // Update OpenAI API key
    const handleSaveApiKey = async (apiKey: string) => {
        try {
            const updatedSettings = { ...userSettings, openAIApiKey: apiKey };
            await saveUserSettings(updatedSettings);
            setUserSettings(updatedSettings);
            showNotification('success', 'API key saved successfully');
        } catch (error) {
            showNotification('error', 'Failed to save API key');
            console.error('Failed to save API key:', error);
        }
    };

    // Apply suggested categories to prompts
    const handleApplyCategorySuggestions = async (updatedPrompts: Prompt[]) => {
        try {
            await savePrompts(updatedPrompts);
            setPrompts(updatedPrompts);
            showNotification('success', 'Categories applied successfully');
            setActiveTab(Tab.Prompts);
        } catch (error) {
            showNotification('error', 'Failed to apply categories');
            console.error('Failed to apply categories:', error);
        }
    };

    // Reorder prompts (move up/down)
    const handleReorderPrompt = async (id: string, direction: 'up' | 'down') => {
        const index = prompts.findIndex(p => p.id === id);
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === prompts.length - 1)
        ) {
            return;
        }

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        const newPrompts = [...prompts];
        const [removed] = newPrompts.splice(index, 1);
        newPrompts.splice(newIndex, 0, removed);

        try {
            await savePrompts(newPrompts);
            setPrompts(newPrompts);
        } catch (error) {
            showNotification('error', 'Failed to reorder prompts');
            console.error('Failed to reorder prompts:', error);
        }
    };

    // --- NEW HANDLERS ---
    const handleExportPrompts = async () => {
        try {
            const currentPrompts = await getPrompts();
            if (currentPrompts.length === 0) {
                showNotification('error', 'No prompts to export.');
                return;
            }

            const exportData: PromptExportData = {
                version: 1,
                exportedAt: new Date().toISOString(),
                prompts: currentPrompts,
            };

            const jsonString = JSON.stringify(exportData, null, 2); // Pretty print JSON
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Create temporary link element
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `chatgpt-quick-prompts-export-${timestamp}.json`;
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;

            // Append to body, click, remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up the Blob URL
            URL.revokeObjectURL(url);

            showNotification('success', 'Prompts exported successfully!');

        } catch (error) {
            console.error("Failed to export prompts:", error);
            showNotification('error', 'Failed to export prompts.');
        }
    };

    const handleImportClick = () => {
        // Trigger the hidden file input
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        // Reset file input value to allow importing the same file again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        if (!file) {
            return;
        }

        if (file.type !== 'application/json') {
            showNotification('error', 'Invalid file type. Please select a JSON file.');
            return;
        }

        const reader = new FileReader();

        reader.onload = async (e) => {
            const text = e.target?.result;
            if (typeof text !== 'string') {
                showNotification('error', 'Failed to read file content.');
                return;
            }

            try {
                const parsedData = JSON.parse(text);

                // --- Basic Schema Validation ---
                if (
                    typeof parsedData !== 'object' ||
                    parsedData === null ||
                    parsedData.version !== 1 || // Check for specific version
                    !Array.isArray(parsedData.prompts) ||
                    !parsedData.exportedAt
                ) {
                    throw new Error("Invalid file structure or version.");
                }

                // More detailed prompt validation
                const importedPrompts = parsedData.prompts as Prompt[];
                const arePromptsValid = importedPrompts.every(p =>
                    p && typeof p.id === 'string' &&
                    typeof p.text === 'string' &&
                    typeof p.name === 'string' && // Added name check
                    typeof p.category === 'string' && // Added category check
                    typeof p.color === 'string' && // Added color check
                    typeof p.icon === 'string'    // Added icon check
                );

                if (!arePromptsValid) {
                    throw new Error("Invalid prompt data within the file. Check required fields (id, text, name, category, color, icon).");
                }
                // --- End Validation ---

                const currentPrompts = await getPrompts();

                // --- Ask User for Import Strategy ---
                const replace = window.confirm(
                    `Import ${importedPrompts.length} prompts?\\n\\n` +
                    `Press OK to REPLACE your current ${currentPrompts.length} prompts.\\n` +
                    `Press Cancel to MERGE (only adds new prompts).`
                );

                let finalPrompts: Prompt[];
                let notificationMessage: string;

                if (replace) {
                    finalPrompts = importedPrompts;
                    notificationMessage = `Successfully imported and replaced ${finalPrompts.length} prompts.`;
                } else {
                    // Merge Logic: Add only prompts with IDs not already present
                    const currentPromptIds = new Set(currentPrompts.map(p => p.id));
                    const newPromptsToMerge = importedPrompts.filter(p => !currentPromptIds.has(p.id));
                    finalPrompts = [...currentPrompts, ...newPromptsToMerge];
                    notificationMessage = `Successfully merged ${newPromptsToMerge.length} new prompts. Total: ${finalPrompts.length}.`;
                }

                // Save the final list and update UI state
                await savePrompts(finalPrompts);
                setPrompts(finalPrompts); // Update local state to refresh UI
                showNotification('success', notificationMessage);

            } catch (error: any) {
                console.error("Failed to import prompts:", error);
                showNotification('error', `Import failed: ${error.message || 'Invalid JSON format or data.'}`);
            }
        };

        reader.onerror = () => {
            showNotification('error', 'Failed to read the selected file.');
        };

        reader.readAsText(file);
    };
    // --- END NEW HANDLERS ---

    return (
        <div className="options-container">
            {/* Header */}
            <div className="header">
                <h1>ChatGPT Quick Prompts</h1>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

            {/* Tabs */}
            <div className="tabs">
                <div
                    className={`tab ${activeTab === Tab.Prompts ? 'active' : ''}`}
                    onClick={() => setActiveTab(Tab.Prompts)}
                >
                    Prompts
                </div>
                <div
                    className={`tab ${activeTab === Tab.Settings ? 'active' : ''}`}
                    onClick={() => setActiveTab(Tab.Settings)}
                >
                    Settings
                </div>
                <div
                    className={`tab ${activeTab === Tab.Categorize ? 'active' : ''}`}
                    onClick={() => setActiveTab(Tab.Categorize)}
                >
                    AI Categorization
                </div>
            </div>

            {/* Add Import/Export buttons */}
            <div className="data-management-actions" style={{ marginTop: '20px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee', display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={handleImportClick}>
                    <span className="material-icons" style={{ marginRight: '5px' }}>file_upload</span>
                    Import Prompts
                </button>
                <button className="btn btn-secondary" onClick={handleExportPrompts}>
                    <span className="material-icons" style={{ marginRight: '5px' }}>file_download</span>
                    Export Prompts
                </button>
                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept=".json" // Only accept JSON files
                />
            </div>

            {/* Tab Content */}
            {activeTab === Tab.Prompts && (
                <div>
                    <PromptForm
                        onSubmit={editingPrompt ? handleUpdatePrompt : handleAddPrompt}
                        initialPrompt={editingPrompt}
                        onCancel={() => setEditingPrompt(null)}
                    />
                    <PromptList
                        prompts={prompts}
                        onEdit={handleEditPrompt}
                        onDelete={handleDeletePrompt}
                        onReorder={handleReorderPrompt}
                    />
                </div>
            )}

            {activeTab === Tab.Settings && (
                <div>
                    <div className="form-group">
                        <label htmlFor="apiKey">OpenAI API Key (optional, for AI categorization)</label>
                        <input
                            type="password"
                            id="apiKey"
                            className="form-control"
                            value={userSettings.openAIApiKey || ''}
                            onChange={(e) => setUserSettings({ ...userSettings, openAIApiKey: e.target.value })}
                            placeholder="sk-..."
                        />
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => handleSaveApiKey(userSettings.openAIApiKey || '')}
                    >
                        Save API Key
                    </button>
                </div>
            )}

            {activeTab === Tab.Categorize && (
                <CategorySuggestions
                    prompts={prompts}
                    apiKey={userSettings.openAIApiKey || ''}
                    onApply={handleApplyCategorySuggestions}
                    onCancel={() => setActiveTab(Tab.Prompts)}
                />
            )}
        </div>
    );
};

export default OptionsPage; 