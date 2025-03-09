/// <reference types="chrome"/>
import { initializeStorage } from "../utils/storage";

// Initialize storage with default values when extension is installed
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    console.log("ChatGPT Quick Prompts extension installed");
    await initializeStorage();
  }
});

// Open options page when extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
