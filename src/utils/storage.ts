/// <reference types="chrome"/>

export interface Prompt {
  id: string;
  name: string;
  text: string;
  category: string;
  color: string;
  icon: string;
}

export interface PromptExportData {
  version: 1; // Schema version number
  exportedAt: string; // ISO 8601 timestamp string (e.g., new Date().toISOString())
  prompts: Prompt[]; // The array of prompt objects
}

export interface UserSettings {
  openAIApiKey?: string | null;
  selectedModelId?: string | null;
  debugModeEnabled?: boolean;
  showPromptIcons?: boolean;
}

export interface StorageData {
  prompts: Prompt[];
  userSettings: UserSettings;
}

// Default settings - ensure the new flag has a default (e.g., true)
const defaultUserSettings: UserSettings = {
  openAIApiKey: null,
  selectedModelId: null,
  debugModeEnabled: false,
  showPromptIcons: true, // <-- Default to true
};

// Default data to initialize storage
const defaultData: StorageData = {
  prompts: [],
  userSettings: defaultUserSettings,
};

/**
 * Initialize storage with default data if it doesn't exist
 */
export const initializeStorage = async (): Promise<void> => {
  try {
    const data = await getStorageData();
    if (!data.prompts || !data.userSettings) {
      await setStorageData(defaultData);
    }
  } catch (error) {
    console.error("Failed to initialize storage:", error);
    await setStorageData(defaultData);
  }
};

/**
 * Get data from Chrome storage.local, not using sync due to size limitations
 */
export const getStorageData = async (): Promise<StorageData> => {
  try {
    // Use local storage by default for larger data capacity
    const result = await chrome.storage.local.get(["prompts", "userSettings"]);
    if (result.prompts && result.userSettings) {
      return result as StorageData;
    }
  } catch (error) {
    console.error("Error reading from local storage:", error);
  }

  // Fallback to sync storage for backward compatibility
  try {
    const result = await chrome.storage.sync.get(["prompts", "userSettings"]);
    if (result.prompts && result.userSettings) {
      console.log(
        "Retrieved data from sync storage, will move to local storage for better capacity"
      );
      // Move data from sync to local for future use
      await chrome.storage.local.set(result);
      return result as StorageData;
    }
  } catch (error) {
    console.error("Error reading from sync storage:", error);
  }

  return defaultData;
};

/**
 * Save data to Chrome storage.local for larger capacity
 */
export const setStorageData = async (data: StorageData): Promise<void> => {
  try {
    await chrome.storage.local.set(data);
  } catch (error) {
    if (chrome.runtime.lastError) {
      console.error("Chrome storage error:", chrome.runtime.lastError);
    }
    console.error("Error writing to local storage:", error);
    throw new Error(`Failed to save data: ${error}`);
  }
};

/**
 * Save prompts to storage
 */
export const savePrompts = async (prompts: Prompt[]): Promise<void> => {
  try {
    const data = await getStorageData();
    data.prompts = prompts;
    await setStorageData(data);
  } catch (error) {
    console.error("Error saving prompts:", error);
    throw new Error(`Failed to save prompts: ${error}`);
  }
};

/**
 * Save user settings to storage
 */
export const saveUserSettings = async (
  settings: UserSettings
): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ userSettings: settings }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving user settings:", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Get prompts from storage
 */
export const getPrompts = async (): Promise<Prompt[]> => {
  try {
    const data = await getStorageData();
    return data.prompts || [];
  } catch (error) {
    console.error("Error getting prompts:", error);
    return [];
  }
};

/**
 * Get user settings from storage
 */
export const getUserSettings = async (): Promise<UserSettings> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["userSettings"], (result) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error getting user settings from local storage:",
          chrome.runtime.lastError
        );
        // Resolve with defaults if there's an error reading
        resolve({ ...defaultUserSettings });
        return;
      }

      // Merge loaded settings with defaults to ensure all keys exist
      // This ensures that if new settings are added, the object is still complete
      const loadedSettings = {
        ...defaultUserSettings,
        ...(result.userSettings || {}),
      };
      resolve(loadedSettings);
    });
  });
};
