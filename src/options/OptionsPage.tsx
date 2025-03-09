import React, { useState, useEffect } from 'react';
import PromptList from './components/PromptList';
import PromptForm from './components/PromptForm';
import CategorySuggestions from './components/CategorySuggestions';
import { getPrompts, savePrompts, getUserSettings, saveUserSettings } from '../utils/storage';
import { Prompt, UserSettings } from '../utils/storage';

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