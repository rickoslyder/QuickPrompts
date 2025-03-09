/// <reference types="chrome"/>

export interface Prompt {
  id: string;
  name: string;
  text: string;
  category: string;
  color: string;
  icon: string;
}

export interface UserSettings {
  openAIApiKey?: string;
}

export interface StorageData {
  prompts: Prompt[];
  userSettings: UserSettings;
}

// Default data to initialize storage
const defaultData: StorageData = {
  prompts: [],
  userSettings: {
    openAIApiKey: "",
  },
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
  try {
    const data = await getStorageData();
    data.userSettings = settings;
    await setStorageData(data);
  } catch (error) {
    console.error("Error saving user settings:", error);
    throw new Error(`Failed to save user settings: ${error}`);
  }
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
  try {
    const data = await getStorageData();
    return data.userSettings || { openAIApiKey: "" };
  } catch (error) {
    console.error("Error getting user settings:", error);
    return { openAIApiKey: "" };
  }
};
