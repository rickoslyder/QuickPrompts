/// <reference types="chrome"/>
import { Prompt, getPrompts } from "../utils/storage";

// Main container for quick prompt buttons
let quickPromptsContainer: HTMLElement | null = null;

// Keep track of the currently observed composer
let observedComposer: Element | null = null;

// A unique identifier for this container
const containerId = "chatgpt-quick-prompts-container-" + Date.now();

// Determine which site we're on
const currentSite = (() => {
  const url = window.location.href;
  console.log("[Quick Prompts Debug] Current URL:", url);
  if (url.includes("chat.openai.com") || url.includes("chatgpt.com")) {
    return "chatgpt";
  } else if (url.includes("grok.com")) {
    return "grok";
  } else if (url.includes("x.com/i/grok")) {
    return "x-grok";
  } else if (url.includes("gemini.google.com")) {
    console.log("[Quick Prompts Debug] Detected Gemini");
    return "gemini";
  } else if (url.includes("chat.deepseek.com")) {
    console.log("[Quick Prompts Debug] Detected DeepSeek");
    return "deepseek";
  } else if (url.includes("t3.chat")) {
    console.log("[Quick Prompts Debug] Detected T3 Chat");
    return "t3chat";
  } else if (url.includes("claude.ai")) {
    console.log("[Quick Prompts Debug] Detected Claude");
    return "claude";
  } else if (url.includes("mistral.ai")) {
    console.log("[Quick Prompts Debug] Detected Mistral");
    return "mistral";
  }
  return "unknown";
})();

console.log("[Quick Prompts Debug] Detected site:", currentSite);

// Check if we're on Grok homepage (not in a conversation)
const isGrokHomepage = () => {
  return currentSite === "grok" && !window.location.pathname.includes("/c/");
};

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

// Get the appropriate target element for Grok based on the current page
function getGrokTargetElement(): Element | null {
  // First try conversation page input
  let targetElement = document.querySelector(
    "div.relative.z-40.flex.flex-col.items-center.w-full > div.relative.w-full"
  );

  // If not found, try the homepage input
  if (!targetElement) {
    targetElement = document.querySelector(
      "div.flex.flex-col.items-center.w-full.gap-1 > div.flex.flex-col-reverse.items-center.justify-between.flex-1.w-full > form"
    );
  }

  // If still not found, try the original selector as a fallback
  if (!targetElement) {
    targetElement = document.querySelector(
      "body > div > div > main > div.relative.flex.flex-col.items-center.h-full.\\@container\\/main > div.absolute.bottom-0.mx-auto.inset-x-0.max-w-\\[50rem\\].z-50"
    );
  }

  return targetElement;
}

// Observe DOM changes for dynamic UI injection
const observer = new MutationObserver(() => {
  console.log("[Quick Prompts Debug] DOM mutation observed");

  // Find the target element based on current site
  let targetElement: Element | null = null;

  if (currentSite === "chatgpt") {
    targetElement = document.querySelector("#composer-background");
  } else if (currentSite === "grok") {
    targetElement = getGrokTargetElement();
  } else if (currentSite === "x-grok") {
    targetElement = document.querySelector(
      "#react-root > div > div > div.css-175oi2r.r-1f2l425.r-13qz1uu.r-417010.r-18u37iz > main > div > div > div > div > div > div.r-6koalj.r-eqz5dr.r-1pi2tsx.r-13qz1uu > div > div > div.css-175oi2r.r-1p0dtai.r-gtdqiz.r-13qz1uu"
    );
  } else if (currentSite === "gemini") {
    console.log(
      "[Quick Prompts Debug] Searching for Gemini elements in mutation"
    );
    const inputArea = document.querySelector(".input-area-container");
    console.log(
      "[Quick Prompts Debug] Found input area in mutation:",
      inputArea
    );
    if (inputArea) {
      targetElement = inputArea;
      console.log(
        "[Quick Prompts Debug] Found container in mutation:",
        targetElement
      );
    }
  } else if (currentSite === "deepseek") {
    console.log(
      "[Quick Prompts Debug] Searching for DeepSeek elements in mutation"
    );
    const chatInput = document.querySelector("#chat-input");
    console.log(
      "[Quick Prompts Debug] Found chat input in mutation:",
      chatInput
    );
    if (chatInput) {
      targetElement = chatInput.closest("div[class*='dd442025']");
      console.log(
        "[Quick Prompts Debug] Found container in mutation:",
        targetElement
      );
    }
  } else if (currentSite === "t3chat") {
    console.log(
      "[Quick Prompts Debug] Searching for T3 Chat elements in mutation"
    );
    const formElement = document.querySelector(
      "form.relative.flex.w-full.flex-col.items-stretch.gap-2"
    );
    console.log("[Quick Prompts Debug] Found form element:", formElement);
    if (formElement) {
      targetElement = formElement;
      console.log(
        "[Quick Prompts Debug] Found container in mutation:",
        targetElement
      );
    }
  } else if (currentSite === "claude") {
    console.log(
      "[Quick Prompts Debug] Searching for Claude elements in mutation"
    );
    // Target the parent of the button row - escape dots in class names
    targetElement = document.querySelector(
      "div.flex.flex-col.gap-3\\.5.m-3\\.5"
    );
    if (targetElement) {
      console.log(
        "[Quick Prompts Debug] Found Claude container in mutation:",
        targetElement
      );
    } else {
      console.log(
        "[Quick Prompts Debug] Claude container not found in mutation"
      );
    }
  } else if (currentSite === "mistral") {
    console.log(
      "[Quick Prompts Debug] Searching for Mistral elements in mutation"
    );
    // Target the main form container using escaped selector
    targetElement = document.querySelector("form.\\@container");
    if (targetElement) {
      console.log(
        "[Quick Prompts Debug] Found Mistral container in mutation:",
        targetElement
      );
    } else {
      console.log(
        "[Quick Prompts Debug] Mistral container not found in mutation"
      );
    }
  }

  // If no target or we're already observing this one, do nothing
  if (!targetElement || targetElement === observedComposer) {
    console.log(
      "[Quick Prompts Debug] No new target element found or already observing"
    );
    return;
  }

  console.log("[Quick Prompts Debug] Found new target element:", targetElement);
  // We found a new target - clean up and inject
  observedComposer = targetElement;
  cleanupExistingContainers();
  injectPromptButtons(targetElement);
});

/**
 * Injects prompt buttons into the UI
 */
async function injectPromptButtons(targetElement: Element) {
  try {
    console.log(
      "[Quick Prompts Debug] Starting injection for site:",
      currentSite
    );

    // Get prompts from storage
    const prompts = await getPrompts();
    console.log("[Quick Prompts Debug] Loaded prompts:", prompts?.length || 0);

    // If no prompts, don't inject anything
    if (!prompts || prompts.length === 0) {
      console.log("[Quick Prompts Debug] No prompts found, skipping injection");
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
    quickPromptsContainer.style.zIndex = "50"; // Ensure it's visible
    quickPromptsContainer.style.position = "relative"; // Fix visibility on conversation page

    // Add DeepSeek-specific styles when on DeepSeek
    if (currentSite === "deepseek") {
      quickPromptsContainer.style.backgroundColor = "rgba(66, 68, 81, 0.3)"; // Match DeepSeek's dark theme
      quickPromptsContainer.style.borderRadius = "12px"; // Match DeepSeek's UI
      quickPromptsContainer.style.padding = "12px"; // More padding to match DeepSeek's spacing
    }

    // Center buttons on Grok homepage
    if (isGrokHomepage()) {
      quickPromptsContainer.style.justifyContent = "center";
    }

    // Add prompt buttons to container
    prompts.forEach((prompt) => {
      const button = createPromptButton(prompt);

      // Add DeepSeek-specific button styles
      if (currentSite === "deepseek") {
        button.className =
          "ds-button ds-button--primary ds-button--filled ds-button--rect ds-button--m";
        button.style.setProperty("--ds-button-color", "transparent");
        button.style.setProperty("--button-text-color", "#F8FAFF");
        button.style.setProperty("--button-border-color", "#626262");
        button.style.setProperty("--ds-button-hover-color", "#424451");
      }

      quickPromptsContainer!.appendChild(button);
    });

    // Insert container based on the current site
    if (currentSite === "chatgpt") {
      // Original ChatGPT insertion - after composer background
      if (targetElement.parentElement) {
        targetElement.parentElement.insertBefore(
          quickPromptsContainer,
          targetElement.nextSibling
        );
      }
    } else if (currentSite === "grok" || currentSite === "x-grok") {
      // For Grok on grok.com and x.com, append as the last child
      targetElement.appendChild(quickPromptsContainer);
    } else if (currentSite === "gemini") {
      console.log("[Quick Prompts Debug] Attempting Gemini injection");
      const disclaimerElement = document.querySelector(
        "hallucination-disclaimer"
      );
      console.log(
        "[Quick Prompts Debug] Found disclaimer element:",
        disclaimerElement
      );
      if (disclaimerElement) {
        // Insert before the disclaimer element itself
        disclaimerElement.parentElement?.insertBefore(
          quickPromptsContainer!,
          disclaimerElement
        );
        console.log("[Quick Prompts Debug] Successfully injected for Gemini");

        // Add Gemini-specific alignment styles
        quickPromptsContainer!.style.margin = "0 auto"; // Center horizontally
        quickPromptsContainer!.style.width = "calc(100% - 32px)"; // Match input width
        quickPromptsContainer!.style.maxWidth = "672px"; // Match Gemini's max width
        quickPromptsContainer!.style.marginBottom = "12px";
      } else {
        // Fallback to inserting after the input area if no disclaimer found
        console.log(
          "[Quick Prompts Debug] Trying fallback injection for Gemini"
        );
        const inputArea = document.querySelector(".input-area-container");
        if (inputArea) {
          inputArea.appendChild(quickPromptsContainer!);
          console.log(
            "[Quick Prompts Debug] Successfully injected using fallback for Gemini"
          );
        } else {
          console.log(
            "[Quick Prompts Debug] Failed to find Gemini injection point"
          );
        }
      }
    } else if (currentSite === "deepseek") {
      console.log("[Quick Prompts Debug] Attempting DeepSeek injection");
      const buttonsContainer = targetElement.querySelector(
        "div[class*='ec4f5d61']"
      );
      console.log(
        "[Quick Prompts Debug] Found buttons container:",
        buttonsContainer
      );
      if (buttonsContainer && buttonsContainer.parentElement) {
        buttonsContainer.parentElement.insertBefore(
          quickPromptsContainer!,
          buttonsContainer.nextSibling
        );
        console.log("[Quick Prompts Debug] Successfully injected for DeepSeek");
      } else {
        console.log(
          "[Quick Prompts Debug] Failed to find DeepSeek injection point"
        );
      }
    } else if (currentSite === "t3chat") {
      console.log("[Quick Prompts Debug] Attempting T3 Chat injection");

      // Add T3 Chat-specific styles
      quickPromptsContainer!.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
      quickPromptsContainer!.style.backdropFilter = "blur(8px)";
      quickPromptsContainer!.style.borderRadius = "16px";
      quickPromptsContainer!.style.border =
        "1px solid rgba(255, 255, 255, 0.7)";
      quickPromptsContainer!.style.marginBottom = "12px";

      // Insert at the beginning of the form
      targetElement.insertBefore(
        quickPromptsContainer!,
        targetElement.firstChild
      );
      console.log("[Quick Prompts Debug] Successfully injected for T3 Chat");
    } else if (currentSite === "claude") {
      console.log("[Quick Prompts Debug] Attempting Claude injection");
      // Find the button row to insert *before* - escape dots in selector
      const buttonRow = targetElement.querySelector(
        "div.flex.gap-2\\.5.w-full.items-center"
      );
      if (buttonRow) {
        console.log(
          "[Quick Prompts Debug] Found Claude button row, inserting container before it."
        );
        targetElement.insertBefore(quickPromptsContainer, buttonRow);
      } else {
        console.log(
          "[Quick Prompts Debug] Claude button row not found, appending to target as fallback."
        );
        // Fallback: Append to the target element if button row isn't found
        targetElement.appendChild(quickPromptsContainer);
      }
    } else if (currentSite === "mistral") {
      console.log(
        "[Quick Prompts Debug] Attempting Mistral injection (bottom)"
      );
      // Find the inner div containing the textarea and button row
      const innerContentDiv = targetElement.querySelector(
        "div.flex.w-full.flex-col.p-4"
      );

      if (innerContentDiv) {
        // Append the button container to the end of this inner div
        innerContentDiv.appendChild(quickPromptsContainer!);
        console.log(
          "[Quick Prompts Debug] Successfully injected for Mistral (bottom)"
        );
      } else {
        console.log(
          "[Quick Prompts Debug] Mistral inner content div not found, appending to form as fallback."
        );
        targetElement.appendChild(quickPromptsContainer!); // Fallback: append to the main form
      }
    }

    console.log(
      "[Quick Prompts Debug] Injection attempt complete for site:",
      currentSite
    );
  } catch (error) {
    console.error(
      "[Quick Prompts Debug] Error injecting prompt buttons:",
      error
    );
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
 * Handles insertion for Claude by creating paragraph elements.
 */
function insertRichTextForClaude(range: Range, text: string): void {
  const lines = text.split("\n");
  const fragment = document.createDocumentFragment();

  lines.forEach((line, index) => {
    const p = document.createElement("p");
    // If the line is empty, ProseMirror often expects a <br> inside the <p>
    if (line.trim() === "") {
      p.appendChild(document.createElement("br"));
    } else {
      p.appendChild(document.createTextNode(line));
    }
    fragment.appendChild(p);
  });

  // Insert the fragment containing <p> elements
  range.insertNode(fragment);

  // Collapse the range to the end
  range.collapse(false);
}

/**
 * Handles insertion into a standard textarea element (like those used by Grok)
 */
function insertTextIntoTextarea(
  textareaElement: HTMLTextAreaElement,
  text: string
): void {
  // Get the cursor position
  const start = textareaElement.selectionStart || 0;
  const end = textareaElement.selectionEnd || 0;

  // Current value
  const currentValue = textareaElement.value;

  // Insert the text at cursor position or replace selected text
  const newValue =
    currentValue.substring(0, start) + text + currentValue.substring(end);

  // Update the textarea value
  textareaElement.value = newValue;

  // Set cursor position after inserted text
  const newCursorPos = start + text.length;
  textareaElement.selectionStart = newCursorPos;
  textareaElement.selectionEnd = newCursorPos;

  // Dispatch input event to trigger UI updates
  textareaElement.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Insert text with preserved line breaks at the cursor position for Quill editor (Gemini)
 */
function insertTextIntoQuillEditor(editor: HTMLElement, text: string): void {
  // Clear any existing content if it's just a blank line
  if (editor.innerHTML === "<p><br></p>") {
    editor.innerHTML = "";
  }

  // Split text into lines and wrap each in <p> tags
  const lines = text.split("\n");
  const formattedText = lines
    .map((line) => `<p>${line || "<br>"}</p>`)
    .join("");

  // Insert at cursor or append
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const fragment = document
      .createRange()
      .createContextualFragment(formattedText);
    range.deleteContents();
    range.insertNode(fragment);
  } else {
    // Append if no cursor position
    editor.innerHTML += formattedText;
  }

  // Dispatch input event to trigger UI updates
  editor.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Safely insert text at the current cursor position
 * Handles complex DOM structure and selection states
 */
async function insertTextAtCursorPosition(
  inputElement: HTMLElement,
  text: string
): Promise<void> {
  // For standard textareas (like Grok uses), use the simpler method
  if (inputElement.tagName.toLowerCase() === "textarea") {
    insertTextIntoTextarea(inputElement as HTMLTextAreaElement, text);
    return;
  }

  // For Gemini's Quill editor
  if (inputElement.classList.contains("ql-editor")) {
    insertTextIntoQuillEditor(inputElement, text);
    return;
  }

  // --- Special handling for Claude (ProseMirror) ---
  if (currentSite === "claude") {
    inputElement.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      console.error(
        "[Quick Prompts Debug] Could not get selection or range for Claude."
      );
      // Basic fallback if selection fails
      inputElement.innerText = text;
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

    const range = selection.getRangeAt(0);

    // --- Create the fragment first ---
    const lines = text.split("\n");
    const fragment = document.createDocumentFragment();
    lines.forEach((line) => {
      const p = document.createElement("p");
      if (line.trim() === "") {
        p.appendChild(document.createElement("br"));
      } else {
        p.appendChild(document.createTextNode(line));
      }
      fragment.appendChild(p);
    });

    // --- Adjust range & insert ---
    const isEditorEffectivelyEmpty =
      inputElement.children.length === 1 &&
      inputElement.firstChild?.nodeName === "P" &&
      (inputElement.firstChild as HTMLElement).classList.contains(
        "is-editor-empty"
      ) &&
      range.startContainer === inputElement.firstChild && // Cursor is in the empty P
      range.startOffset === 0;

    if (isEditorEffectivelyEmpty && inputElement.firstChild) {
      // Remove the placeholder paragraph entirely
      const placeholderP = inputElement.firstChild; // Keep reference
      inputElement.removeChild(placeholderP);
      // Append the fragment directly to the main editor div
      inputElement.appendChild(fragment);
      // Set range to the end of the newly added content
      range.selectNodeContents(inputElement);
      range.collapse(false); // Collapse to the end
    } else {
      // Clear any existing selection if not collapsed
      if (!selection.isCollapsed) {
        range.deleteContents();
      }
      // Insert the structured fragment at the current range
      range.insertNode(fragment);
      range.collapse(false); // Collapse the range to its end point after insertion
    }

    // Update the selection
    selection.removeAllRanges();
    selection.addRange(range);

    // Dispatch input event crucial for ProseMirror to recognize the change
    inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    return; // End Claude-specific logic
  }
  // --- End Claude specific handling ---

  // --- Default contenteditable handling (like ChatGPT) ---
  // Store current focus state
  const wasAlreadyFocused = document.activeElement === inputElement;

  // Focus the element to ensure we can modify it
  inputElement.focus();

  // Get current selection
  const selection = window.getSelection();
  if (!selection) {
    // Fallback: Just set the innerText (preserves line breaks)
    inputElement.innerText = text;
    // Dispatch input event
    inputElement.dispatchEvent(new Event("input", { bubbles: true }));
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
    const needsLineBreak =
      range.startOffset > 0 &&
      !range.startContainer.textContent
        ?.substring(0, range.startOffset)
        .endsWith("\n");

    // Insert the text with proper line breaks using the default method
    insertTextWithLineBreaks(range, text, needsLineBreak);

    // Update the selection
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    // No range available, fallback to appending
    const currentText = inputElement.innerText;
    inputElement.innerText = currentText ? currentText + "\n" + text : text;
  }

  // Manually dispatch input event for the UI to detect the change
  inputElement.dispatchEvent(new Event("input", { bubbles: true }));

  // Keep focus if it was already focused
  if (!wasAlreadyFocused) {
    // We intentionally leave it focused since we just inserted text
  }
  // --- End Default contenteditable handling ---
}

/**
 * Finds the appropriate input area (textarea or contenteditable div)
 */
function findInputElement(): HTMLElement | null {
  switch (currentSite) {
    case "chatgpt":
      return document.getElementById("prompt-textarea") as HTMLTextAreaElement;
    case "grok":
    case "x-grok":
      return document.querySelector(
        "textarea[data-testid='tweetTextarea_0']"
      ) as HTMLTextAreaElement;
    case "gemini":
      // Gemini uses a contenteditable div
      return document.querySelector(".ql-editor.textarea") as HTMLElement;
    case "deepseek":
      return document.querySelector("#chat-input") as HTMLTextAreaElement;
    case "t3chat":
      return document.querySelector(
        "textarea[placeholder='Type a message...']"
      ) as HTMLTextAreaElement;
    case "claude":
      // Claude uses a contenteditable div
      return document.querySelector(
        "div.ProseMirror[contenteditable='true']"
      ) as HTMLElement;
    case "mistral":
      return document.querySelector(
        'textarea[placeholder="Ask le Chat"]'
      ) as HTMLTextAreaElement;
    default:
      return null;
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
  button.onclick = async (event) => {
    // Prevent default button behavior and stop event propagation
    event.preventDefault();
    event.stopPropagation();

    // Find the input element
    const inputElement = findInputElement();

    if (inputElement) {
      console.log("Found input element:", inputElement);

      // Await the insertion function
      await insertTextAtCursorPosition(inputElement, prompt.text);

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
    } else {
      console.error("Could not find input element for text insertion");
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

// Initial injection based on current site
let initialTargetElement: Element | null = null;

console.log(
  "[Quick Prompts Debug] Starting initial element search for site:",
  currentSite
);

if (currentSite === "chatgpt") {
  initialTargetElement = document.querySelector("#composer-background");
} else if (currentSite === "grok") {
  initialTargetElement = getGrokTargetElement();
} else if (currentSite === "x-grok") {
  initialTargetElement = document.querySelector(
    "#react-root > div > div > div.css-175oi2r.r-1f2l425.r-13qz1uu.r-417010.r-18u37iz > main > div > div > div > div > div > div.r-6koalj.r-eqz5dr.r-1pi2tsx.r-13qz1uu > div > div > div.css-175oi2r.r-1p0dtai.r-gtdqiz.r-13qz1uu"
  );
} else if (currentSite === "gemini") {
  initialTargetElement = document.querySelector(".input-area-container");
  console.log(
    "[Quick Prompts Debug] Gemini initial target search result:",
    initialTargetElement
  );
} else if (currentSite === "deepseek") {
  const chatInput = document.querySelector("#chat-input");
  console.log("[Quick Prompts Debug] DeepSeek chat input found:", chatInput);
  if (chatInput) {
    initialTargetElement = chatInput.closest("div[class*='dd442025']");
    console.log(
      "[Quick Prompts Debug] DeepSeek container found:",
      initialTargetElement
    );
  }
} else if (currentSite === "t3chat") {
  const formElement = document.querySelector(
    "form.relative.flex.w-full.flex-col.items-stretch.gap-2"
  );
  console.log("[Quick Prompts Debug] T3 Chat form element found:", formElement);
  if (formElement) {
    initialTargetElement = formElement;
    console.log(
      "[Quick Prompts Debug] T3 Chat container found:",
      initialTargetElement
    );
  }
} else if (currentSite === "claude") {
  // Use the correct selector for the initial target element search
  initialTargetElement = document.querySelector(
    "div.flex.flex-col.gap-3\\.5.m-3\\.5"
  );
  console.log(
    "[Quick Prompts Debug] Claude initial target search result:",
    initialTargetElement
  );
} else if (currentSite === "mistral") {
  // Use escaped selector
  initialTargetElement = document.querySelector("form.\\@container");
  console.log(
    "[Quick Prompts Debug] Mistral initial target search result:",
    initialTargetElement
  );
}

console.log(
  "[Quick Prompts Debug] Initial target element:",
  initialTargetElement
);

if (initialTargetElement) {
  observedComposer = initialTargetElement;
  injectPromptButtons(initialTargetElement);
}

// Listen for storage changes to update buttons
chrome.storage.onChanged.addListener(
  (changes: { [key: string]: chrome.storage.StorageChange }) => {
    if (changes.prompts) {
      // Clean up existing containers first
      cleanupExistingContainers();

      // Re-inject buttons when prompts change based on current site
      let targetElement: Element | null = null;

      if (currentSite === "chatgpt") {
        targetElement = document.querySelector("#composer-background");
      } else if (currentSite === "grok") {
        targetElement = getGrokTargetElement();
      } else if (currentSite === "x-grok") {
        targetElement = document.querySelector(
          "#react-root > div > div > div.css-175oi2r.r-1f2l425.r-13qz1uu.r-417010.r-18u37iz > main > div > div > div > div > div > div.r-6koalj.r-eqz5dr.r-1pi2tsx.r-13qz1uu > div > div > div.css-175oi2r.r-1p0dtai.r-gtdqiz.r-13qz1uu"
        );
      } else if (currentSite === "gemini") {
        targetElement = document.querySelector(".input-area-container");
      } else if (currentSite === "deepseek") {
        const chatInput = document.querySelector("#chat-input");
        if (chatInput) {
          targetElement = chatInput.closest("div[class*='dd442025']");
        }
      } else if (currentSite === "t3chat") {
        targetElement = document.querySelector(
          "form.relative.flex.w-full.flex-col.items-stretch.gap-2"
        );
      } else if (currentSite === "claude") {
        // Use the correct selector in the storage listener as well
        targetElement = document.querySelector(
          "div.flex.flex-col.gap-3\\.5.m-3\\.5"
        );
      } else if (currentSite === "mistral") {
        // Use escaped selector
        targetElement = document.querySelector("form.\\@container");
      }

      if (targetElement) {
        observedComposer = targetElement;
        injectPromptButtons(targetElement);
      }
    }
  }
);
