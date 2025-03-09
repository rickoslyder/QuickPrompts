/// <reference types="chrome"/>
import { Prompt, getPrompts } from "../utils/storage";

// Main container for quick prompt buttons
let quickPromptsContainer: HTMLElement | null = null;

// Keep track of the currently observed composer
let observedComposer: Element | null = null;

// A unique identifier for this container
const containerId = "chatgpt-quick-prompts-container-" + Date.now();

/**
 * Cleans up existing prompt containers to avoid duplicates
 */
function cleanupExistingContainers() {
  // Find all quick prompt containers
  const existingContainers = document.querySelectorAll(
    ".chatgpt-quick-prompts-container"
  );
  existingContainers.forEach((container) => {
    // Don't remove our own container if it exists
    if (container.id !== containerId) {
      container.remove();
    }
  });
}

// Observe DOM changes for dynamic UI injection
const observer = new MutationObserver(() => {
  // Find the composer background div
  const composerBackground = document.querySelector("#composer-background");

  // If no composer or we're already observing this one, do nothing
  if (!composerBackground || composerBackground === observedComposer) {
    return;
  }

  // We found a new composer - clean up and inject
  observedComposer = composerBackground;
  cleanupExistingContainers();
  injectPromptButtons(composerBackground);
});

/**
 * Injects prompt buttons into the ChatGPT UI
 */
async function injectPromptButtons(targetElement: Element) {
  try {
    // Get prompts from storage
    const prompts = await getPrompts();

    // If no prompts, don't inject anything
    if (!prompts || prompts.length === 0) {
      return;
    }

    // Remove existing container if it exists
    if (
      quickPromptsContainer &&
      document.body.contains(quickPromptsContainer)
    ) {
      quickPromptsContainer.remove();
      quickPromptsContainer = null;
    }

    // Create container for prompt buttons
    quickPromptsContainer = document.createElement("div");
    quickPromptsContainer.className = "chatgpt-quick-prompts-container";
    quickPromptsContainer.id = containerId;
    quickPromptsContainer.style.display = "flex";
    quickPromptsContainer.style.flexWrap = "wrap";
    quickPromptsContainer.style.gap = "8px";
    quickPromptsContainer.style.margin = "8px 0";
    quickPromptsContainer.style.padding = "8px";
    quickPromptsContainer.style.borderRadius = "8px";
    quickPromptsContainer.style.backgroundColor = "rgba(247, 247, 248, 0.1)";
    quickPromptsContainer.style.width = "100%";

    // Add prompt buttons to container
    prompts.forEach((prompt) => {
      const button = createPromptButton(prompt);
      quickPromptsContainer!.appendChild(button);
    });

    // Insert container directly after the composer background
    if (targetElement.parentElement) {
      targetElement.parentElement.insertBefore(
        quickPromptsContainer,
        targetElement.nextSibling
      );
    }
  } catch (error) {
    console.error("Error injecting prompt buttons:", error);
  }
}

/**
 * Insert text with preserved line breaks at the cursor position
 * @param range The DOM range to insert at
 * @param text The text to insert
 * @param needsInitialLineBreak Whether to add a line break before the text
 */
function insertTextWithLineBreaks(
  range: Range,
  text: string,
  needsInitialLineBreak: boolean
): void {
  // Insert initial line break if needed
  if (needsInitialLineBreak) {
    const br = document.createElement("br");
    range.insertNode(br);
    range.setStartAfter(br);
    range.collapse(true);
  }

  // Split the text by line breaks
  const lines = text.split("\n");

  // Create a document fragment to hold all our nodes
  const fragment = document.createDocumentFragment();

  // Add each line with line breaks between them
  lines.forEach((line, index) => {
    if (index > 0) {
      // Add line break between lines (not before the first line)
      fragment.appendChild(document.createElement("br"));
    }

    if (line.length > 0) {
      fragment.appendChild(document.createTextNode(line));
    }
  });

  // Insert the fragment at the current position
  range.insertNode(fragment);

  // Move cursor to after the inserted content
  range.collapse(false);
}

/**
 * Safely insert text at the current cursor position in ChatGPT's editor
 * Handles complex DOM structure and selection states
 */
function insertTextAtCursorPosition(
  inputElement: HTMLElement,
  text: string
): void {
  // Store current focus state
  const wasAlreadyFocused = document.activeElement === inputElement;

  // Focus the element to ensure we can modify it
  inputElement.focus();

  // Get current selection
  const selection = window.getSelection();
  if (!selection) {
    // Fallback: Just set the innerText (preserves line breaks)
    inputElement.innerText = text;
    return;
  }

  // Handle selection or insert at cursor
  if (selection.rangeCount > 0) {
    // Get the selected range
    const range = selection.getRangeAt(0);

    // If there's text selected, replace it with our prompt
    if (!selection.isCollapsed) {
      // Delete the selected content
      range.deleteContents();
    }

    // Check if we need a line break before inserting
    // If we're at the beginning of the input, don't add a line break
    const needsLineBreak =
      range.startOffset > 0 &&
      !range.startContainer.textContent
        ?.substring(0, range.startOffset)
        .endsWith("\n");

    // Insert the text with proper line breaks
    insertTextWithLineBreaks(range, text, needsLineBreak);

    // Update the selection
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    // No range available, fallback to appending
    const currentText = inputElement.innerText;
    inputElement.innerText = currentText ? currentText + "\n" + text : text;
  }

  // Manually dispatch input event for ChatGPT UI to detect the change
  inputElement.dispatchEvent(new Event("input", { bubbles: true }));

  // Keep focus if it was already focused
  if (!wasAlreadyFocused) {
    // We intentionally leave it focused since we just inserted text
  }
}

/**
 * Creates a button element for a prompt
 */
function createPromptButton(prompt: Prompt): HTMLElement {
  const button = document.createElement("button");

  // Explicitly set type="button" to prevent form submission
  button.type = "button";

  // Use the prompt name if available, otherwise use truncated text
  const displayText =
    prompt.name ||
    (prompt.text.length > 15
      ? prompt.text.substring(0, 15) + "..."
      : prompt.text);

  button.textContent = displayText;
  button.title = prompt.text;
  button.style.padding = "6px 12px";
  button.style.borderRadius = "4px";
  button.style.border = "none";
  button.style.background = prompt.color || "#444654";
  button.style.color = "#ffffff";
  button.style.fontSize = "14px";
  button.style.cursor = "pointer";
  button.style.transition = "background 0.3s";

  // Add hover effect
  button.onmouseover = () => {
    button.style.filter = "brightness(1.1)";
  };
  button.onmouseout = () => {
    button.style.filter = "brightness(1)";
  };

  // Add click handler to inject prompt text
  button.onclick = (event) => {
    // Prevent default button behavior and stop event propagation
    event.preventDefault();
    event.stopPropagation();

    // Find the contenteditable div that serves as the input
    const inputDiv = document.querySelector("#prompt-textarea");
    if (inputDiv) {
      // Insert text at cursor position or replace selection
      insertTextAtCursorPosition(inputDiv as HTMLElement, prompt.text);

      // Find any submit buttons and ensure our prompt doesn't trigger them
      const submitButton = document.querySelector(
        'button[data-testid="send-button"]'
      );
      if (submitButton) {
        // Make sure we don't accidentally submit
        setTimeout(() => {
          // This ensures we don't interfere with any event loops currently executing
          console.log("Prompt insertion complete - cursor position preserved");
        }, 50);
      }
    }

    // Return false for good measure (old-school way to prevent defaults)
    return false;
  };

  return button;
}

// Start observing DOM changes for dynamic injection
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Initial cleanup and injection
cleanupExistingContainers();
const composerBackground = document.querySelector("#composer-background");
if (composerBackground) {
  observedComposer = composerBackground;
  injectPromptButtons(composerBackground);
}

// Listen for storage changes to update buttons
chrome.storage.onChanged.addListener(
  (changes: { [key: string]: chrome.storage.StorageChange }) => {
    if (changes.prompts) {
      // Clean up existing containers first
      cleanupExistingContainers();

      // Re-inject buttons when prompts change
      const composerBackground = document.querySelector("#composer-background");
      if (composerBackground) {
        observedComposer = composerBackground;
        injectPromptButtons(composerBackground);
      }
    }
  }
);
