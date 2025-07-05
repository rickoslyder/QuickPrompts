import React, { useState, useEffect, useRef } from 'react';
import PromptList from './components/PromptList';
import PromptForm from './components/PromptForm';
import CategorySuggestions from './components/CategorySuggestions';
import ImportConfirmModal from './components/ImportConfirmModal';
import { getPrompts, savePrompts, getUserSettings, saveUserSettings } from '../utils/storage';
import { Prompt, UserSettings, PromptExportData } from '../utils/storage';
import { getAvailableModels, OpenAIModel } from '../utils/openaiApi';
import { getModelConfig } from '../utils/modelConfig';

enum Tab {
    Prompts = 'prompts',
    Settings = 'settings',
    Categorize = 'categorize'
}

const OptionsPage: React.FC = () => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [userSettings, setUserSettings] = useState<UserSettings>({ openAIApiKey: '', selectedModelId: null, debugModeEnabled: false });
    const [activeTab, setActiveTab] = useState<Tab>(Tab.Prompts);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

    const [availableModels, setAvailableModels] = useState<OpenAIModel[]>([]);
    const [modelsLoading, setModelsLoading] = useState<boolean>(false);
    const [modelsError, setModelsError] = useState<string | null>(null);

    // State for import confirmation modal
    const [showImportModal, setShowImportModal] = useState<boolean>(false);
    const [importedPromptsData, setImportedPromptsData] = useState<Prompt[] | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setModelsLoading(true);
                setModelsError(null);
                const loadedPrompts = await getPrompts();
                const loadedSettings = await getUserSettings();
                setPrompts(loadedPrompts);
                setUserSettings(loadedSettings);

                if (loadedSettings.openAIApiKey) {
                    const modelsResult = await getAvailableModels(loadedSettings.openAIApiKey);
                    if (modelsResult.success && modelsResult.models) {
                        setAvailableModels(modelsResult.models);
                    } else {
                        console.error("Failed to fetch models:", modelsResult.error);
                        setModelsError(modelsResult.error?.message || "Failed to load models.");
                        setAvailableModels([]);
                    }
                } else {
                    setAvailableModels([]);
                }
            } catch (error) {
                showNotification('error', 'Failed to load data');
                console.error('Failed to load data:', error);
                setModelsError("Failed to load initial settings.");
            } finally {
                setModelsLoading(false);
            }
        };

        loadData();
    }, []);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

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

    const handleEditPrompt = (prompt: Prompt) => {
        setEditingPrompt(prompt);
        setActiveTab(Tab.Prompts);
    };

    const handleSettingsChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = event.target;
        const name = target.name;

        if (target.type === 'checkbox') {
            // Handle checkbox changes
            const checked = (target as HTMLInputElement).checked;
            setUserSettings(prevSettings => ({
                ...prevSettings,
                [name]: checked
            }));
        } else {
            // Handle text input and select changes
            const value = target.value;
            // Special handling for empty select value to store null for model ID
            const finalValue = name === 'selectedModelId' && value === "" ? null : value;

            setUserSettings(prevSettings => ({
                ...prevSettings,
                [name]: finalValue
            }));

            // Handle side effects like fetching models for API key changes
            if (name === 'openAIApiKey') {
                if (value) {
                    fetchModelsOnApiKeyChange(value);
                } else {
                    setAvailableModels([]);
                    setUserSettings(prevSettings => ({
                        ...prevSettings,
                        selectedModelId: null
                    }));
                    setModelsError(null);
                }
            }
        }
    };

    const fetchModelsOnApiKeyChange = async (apiKey: string) => {
        setModelsLoading(true);
        setModelsError(null);
        setAvailableModels([]);
        setUserSettings(prevSettings => ({ ...prevSettings, selectedModelId: null }));

        try {
            const modelsResult = await getAvailableModels(apiKey);
            if (modelsResult.success && modelsResult.models) {
                setAvailableModels(modelsResult.models);
                if (userSettings.selectedModelId && !modelsResult.models.some(m => m.id === userSettings.selectedModelId)) {
                    setUserSettings(prev => ({ ...prev, selectedModelId: null }));
                }
            } else {
                console.error("Failed to fetch models:", modelsResult.error);
                setModelsError(modelsResult.error?.message || "Failed to load models with new key.");
                setUserSettings(prev => ({ ...prev, selectedModelId: null }));
            }
        } catch (error) {
            console.error("Error fetching models:", error);
            setModelsError("Network error fetching models.");
            setUserSettings(prev => ({ ...prev, selectedModelId: null }));
        } finally {
            setModelsLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        if (userSettings.openAIApiKey && availableModels.length === 0 && !modelsLoading && !modelsError) {
            await fetchModelsOnApiKeyChange(userSettings.openAIApiKey);
        }

        try {
            await saveUserSettings(userSettings);
            showNotification('success', 'Settings saved successfully');
        } catch (error) {
            showNotification('error', 'Failed to save settings');
            console.error('Failed to save settings:', error);
        }
    };

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

            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `quickprompts-export-${timestamp}.json`;
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            showNotification('success', 'Prompts exported successfully!');

        } catch (error) {
            console.error("Failed to export prompts:", error);
            showNotification('error', 'Failed to export prompts.');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

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

                if (
                    typeof parsedData !== 'object' ||
                    parsedData === null ||
                    parsedData.version !== 1 ||
                    !Array.isArray(parsedData.prompts) ||
                    !parsedData.exportedAt
                ) {
                    throw new Error("Invalid file structure or version.");
                }

                const importedPrompts = parsedData.prompts as Prompt[];
                const arePromptsValid = importedPrompts.every(p =>
                    p && typeof p.id === 'string' &&
                    typeof p.text === 'string' &&
                    typeof p.name === 'string' &&
                    typeof p.category === 'string' &&
                    typeof p.color === 'string' &&
                    typeof p.icon === 'string'
                );

                if (!arePromptsValid) {
                    throw new Error("Invalid prompt data within the file. Check required fields (id, text, name, category, color, icon).");
                }

                // Don't save yet, show the modal instead
                setImportedPromptsData(importedPrompts);
                setShowImportModal(true);

            } catch (error: any) {
                showNotification('error', `Import failed: ${error.message}`);
                console.error('Import error:', error);
            }
        };

        reader.onerror = () => {
            showNotification('error', 'Failed to read the selected file.');
        };

        reader.readAsText(file);
    };

    // --- Modal Handlers ---
    const handleConfirmReplace = async () => {
        if (!importedPromptsData) return;
        try {
            await savePrompts(importedPromptsData);
            setPrompts(importedPromptsData);
            showNotification('success', `${importedPromptsData.length} prompts imported (Replaced existing).`);
        } catch (error) {
            showNotification('error', 'Failed to replace prompts during import.');
        }
        setShowImportModal(false);
        setImportedPromptsData(null);
    };

    const handleConfirmMerge = async () => {
        if (!importedPromptsData) return;
        try {
            const currentPrompts = await getPrompts(); // Re-fetch current prompts
            const currentIds = new Set(currentPrompts.map(p => p.id));
            const newPrompts = importedPromptsData.filter(p => !currentIds.has(p.id));
            const mergedPrompts = [...currentPrompts, ...newPrompts];
            await savePrompts(mergedPrompts);
            setPrompts(mergedPrompts);
            showNotification('success', `${newPrompts.length} new prompts imported (Merged with existing).`);
        } catch (error) {
            showNotification('error', 'Failed to merge prompts during import.');
        }
        setShowImportModal(false);
        setImportedPromptsData(null);
    };

    // --- New Handler for Replace Selected ---
    const handleConfirmReplaceSelected = async (selectedIds: Set<string>) => {
        if (!importedPromptsData || selectedIds.size === 0) return;
        try {
            const currentPrompts = await getPrompts();
            const selectedImportedPrompts = importedPromptsData.filter(p => selectedIds.has(p.id));

            // Filter out current prompts that have the same ID as the selected imported ones
            const filteredCurrentPrompts = currentPrompts.filter(p => !selectedIds.has(p.id));

            // Combine the filtered current prompts with the selected imported ones
            const finalPrompts = [...filteredCurrentPrompts, ...selectedImportedPrompts];

            await savePrompts(finalPrompts);
            setPrompts(finalPrompts);
            showNotification('success', `${selectedImportedPrompts.length} prompts imported (Replaced matching IDs).`);
        } catch (error) {
            showNotification('error', 'Failed to replace selected prompts during import.');
        }
        setShowImportModal(false);
        setImportedPromptsData(null);
    };

    const handleCancelImport = () => {
        setShowImportModal(false);
        setImportedPromptsData(null);
    };
    // --- End Modal Handlers ---

    return (
        <div className="options-container">
            <div className="header">
                <h1>QuickPrompts Options</h1>
            </div>

            {notification && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

            {/* --- Import Confirmation Modal (Rendered near top for structure) --- */}
            {showImportModal && importedPromptsData && (
                <ImportConfirmModal
                    importedPrompts={importedPromptsData}
                    onConfirmReplace={handleConfirmReplace}
                    onConfirmMerge={handleConfirmMerge}
                    onConfirmReplaceSelected={handleConfirmReplaceSelected}
                    onCancel={handleCancelImport}
                />
            )}
            {/* --- End Import Confirmation Modal --- */}

            <div className="tabs">
                <button
                    className={`tab ${activeTab === Tab.Prompts ? 'active' : ''}`}
                    onClick={() => setActiveTab(Tab.Prompts)}
                >
                    Prompts
                </button>
                <button
                    className={`tab ${activeTab === Tab.Settings ? 'active' : ''}`}
                    onClick={() => setActiveTab(Tab.Settings)}
                >
                    Settings
                </button>
                <button
                    className={`tab ${activeTab === Tab.Categorize ? 'active' : ''}`}
                    onClick={() => setActiveTab(Tab.Categorize)}
                    disabled={prompts.length === 0 || !userSettings.openAIApiKey}
                    title={!userSettings.openAIApiKey ? "API Key required for categorization" : prompts.length === 0 ? "Add prompts to categorize" : ""}
                >
                    Categorize Prompts (AI)
                </button>
            </div>

            <div className="tab-content">
                {activeTab === Tab.Prompts && (
                    <div>
                        <div className="data-management-actions">
                            <button className="button button-secondary" onClick={handleImportClick}>
                                <span className="material-icons">file_upload</span>
                                Import Prompts
                            </button>
                            <button className="button button-secondary" onClick={handleExportPrompts} disabled={prompts.length === 0}>
                                <span className="material-icons">file_download</span>
                                Export Prompts
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                accept=".json"
                            />
                        </div>
                        <hr className="section-divider" />

                        <PromptForm
                            onSave={editingPrompt ? handleUpdatePrompt : handleAddPrompt}
                            onCancel={() => setEditingPrompt(null)}
                            initialPrompt={editingPrompt}
                            existingIds={prompts.map(p => p.id)}
                            apiKey={userSettings.openAIApiKey || null}
                            selectedModelId={userSettings.selectedModelId || null}
                        />
                        <hr className="section-divider" />
                        <h2>Your Prompts</h2>
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
                            <label htmlFor="openAIApiKey">OpenAI API Key:</label>
                            <input
                                type="password"
                                id="openAIApiKey"
                                name="openAIApiKey"
                                value={userSettings.openAIApiKey || ''}
                                onChange={handleSettingsChange}
                                placeholder="Enter your OpenAI API key"
                            />
                            <p className="description">
                                Your API key is stored locally and used for features like AI categorization and enhancement.
                                Get your key from{' '}
                                <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer">
                                    OpenAI API Keys page
                                </a>.
                            </p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="selectedModelId">AI Model for Enhancement:</label>
                            <select
                                id="selectedModelId"
                                name="selectedModelId"
                                value={userSettings.selectedModelId ?? ''}
                                onChange={handleSettingsChange}
                                disabled={!userSettings.openAIApiKey || modelsLoading || availableModels.length === 0}
                            >
                                <option value="" disabled={!userSettings.openAIApiKey || modelsLoading}>
                                    {userSettings.openAIApiKey ? (modelsLoading ? 'Loading models...' : (modelsError ? 'Error loading models' : (availableModels.length === 0 ? 'No compatible models found' : 'Select a model...'))) : 'Enter API Key to load models'}
                                </option>
                                {availableModels.map((model) => {
                                    const config = getModelConfig(model.id);
                                    const categoryLabel = config.category === 'reasoning' ? ' [Reasoning]' : config.category === 'chat' ? ' [Chat]' : '';
                                    return (
                                        <option key={model.id} value={model.id} title={config.description || ''}>
                                            {config.displayName}{categoryLabel} ({config.parameters.maxTokensLimit || 'N/A'} max tokens)
                                        </option>
                                    );
                                })}
                            </select>
                            {modelsError && <p className="error-message">Error: {modelsError}</p>}
                            {!modelsError && !modelsLoading && userSettings.openAIApiKey && availableModels.length > 0 && (
                                <>
                                    <p className="description">
                                        Select the model to use for AI features. [Chat] models support all features. [Reasoning] models (o1 series) have advanced capabilities but don't support JSON mode for categorization.
                                    </p>
                                    {userSettings.selectedModelId && getModelConfig(userSettings.selectedModelId).description && (
                                        <p className="description" style={{ fontStyle: 'italic', fontSize: '0.9em' }}>
                                            {getModelConfig(userSettings.selectedModelId).description}
                                        </p>
                                    )}
                                </>
                            )}
                            {!userSettings.openAIApiKey && (
                                <p className="description">
                                    Please enter your OpenAI API key above to load available models.
                                </p>
                            )}
                        </div>

                        <div className="form-group form-group-checkbox">
                            <label htmlFor="debugModeEnabled">Enable Debug Mode:</label>
                            <input
                                type="checkbox"
                                id="debugModeEnabled"
                                name="debugModeEnabled"
                                checked={userSettings.debugModeEnabled || false}
                                onChange={handleSettingsChange}
                            />
                            <small>Show detailed logs in the browser console for troubleshooting.</small>
                        </div>

                        {/* --- Show Icons Toggle --- */}
                        <div className="form-group form-group-checkbox">
                            <label htmlFor="showPromptIcons">Show Icons on Buttons:</label>
                            <input
                                type="checkbox"
                                id="showPromptIcons"
                                name="showPromptIcons"
                                checked={userSettings.showPromptIcons ?? true} // Default to true if undefined
                                onChange={handleSettingsChange}
                            />
                            <small>Display the selected icon next to the prompt name on injected buttons.</small>
                        </div>
                        {/* --- End Show Icons Toggle --- */}

                        <button
                            onClick={handleSaveSettings}
                            className="button button-primary"
                            disabled={modelsLoading}
                        >
                            Save Settings
                        </button>

                        <hr className="section-divider" />
                    </div>
                )}

                {activeTab === Tab.Categorize && (
                    <div>
                        <h2>Categorize Prompts (AI)</h2>
                        <p>Automatically suggest categories for your uncategorized prompts using AI.</p>
                        <CategorySuggestions
                            apiKey={userSettings.openAIApiKey || ''}
                            selectedModelId={userSettings.selectedModelId}
                            prompts={prompts}
                            onApply={handleApplyCategorySuggestions}
                            onCancel={() => setActiveTab(Tab.Prompts)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default OptionsPage; 