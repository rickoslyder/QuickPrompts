# Learnings

## TypeScript with Chrome Extension Development

- **Issue**: TypeScript linter errors with chrome API types
- **Solution**: Add `/// <reference types="chrome"/>` to the top of files that use Chrome APIs
- **Note**: Make sure @types/chrome is properly installed in devDependencies

## React Integration

- **Issue**: React component TypeScript errors in a Chrome extension
- **Solution**: Ensure proper tsconfig.json setup with React JSX support
- **Note**: TypeScript errors may persist in the editor but should not affect the build if properly configured

## Chrome Storage

- **Issue**: Need fallback mechanism for Chrome storage
- **Solution**: Implemented a utility that tries sync storage first, falls back to local storage
- **Note**: Always handle errors in storage operations to prevent extension crashes

## OpenAI API Integration

- **Issue**: OpenAI API response sometimes includes markdown code blocks that are hard to parse
- **Solution**: Use `response_format: { "type": "json_object" }` to ensure consistent JSON responses
- **Note**: When using JSON mode, you must include the word "json" somewhere in your system or user message
  
- **Issue**: OpenAI API might return different JSON structures (direct array, or nested under different property names)
- **Solution**: Implement robust parsing that handles multiple possible response formats
- **Note**: Always add error logging to help debug API response issues

## ChatGPT DOM Integration

- **Issue**: ChatGPT's DOM structure changes periodically, breaking content script selectors
- **Solution**: Use more specific selectors like IDs (`#prompt-textarea`) and flexible traversal methods (`closest()`)
- **Note**: ChatGPT uses a contenteditable div instead of a textarea for input, requiring different interaction methods
  
- **Issue**: Injecting text into ChatGPT input requires different approaches based on element type
- **Solution**: For contenteditable divs, use `element.textContent = value` instead of `element.value = value`
- **Note**: Always dispatch the appropriate events (`input` event with `bubbles: true`) to ensure UI updates properly

- **Issue**: Line breaks are not preserved when setting `textContent` on a contenteditable div
- **Solution**: Use `innerText` instead of `textContent` to preserve line breaks and formatting
- **Note**: Remember to cast the element to the correct type (`as HTMLElement`) when using DOM properties like `innerText`

## Chrome Extension Domain Configuration

- **Issue**: Services may use multiple domains for the same product (e.g., chat.openai.com and chatgpt.com)
- **Solution**: Include all relevant domains in manifest.json under both "matches" and "host_permissions"
- **Note**: Regularly check if the service has introduced new domains or changed their URL structure 

### Content Script Instance Management
- **Issue**: Multiple instances of content scripts can inject duplicate UI elements when storage changes
- **Context**: Each Chrome tab has its own instance of content scripts, but all instances receive the same storage change events
- **Solution**: 
  - Use unique IDs for injected elements (e.g., with timestamp: `element-id-${Date.now()}`)
  - Implement cleanup functions to remove stale/duplicate elements before injection
  - Track observed elements to prevent redundant processing
  - Use a more targeted approach to DOM mutations by tracking specific elements of interest 

### Chrome Storage Size Limitations
- **Issue**: Chrome sync storage has a limit of ~100KB total and 8KB per item, causing large prompts to fail silently
- **Context**: By default, the extension was using `chrome.storage.sync` which has severe limitations for large text
- **Solution**:
  - Switch to `chrome.storage.local` as the primary storage mechanism (has a 5MB limit by default)
  - Request the `unlimitedStorage` permission to remove the size limitation for local storage
  - Add proper error handling and check for `chrome.runtime.lastError` when storage operations fail
  - Implement a migration path from sync to local storage for backward compatibility
  - Always wrap storage operations in try/catch blocks with appropriate error logging 

### Button Click Form Submission
- **Issue**: Buttons within a web page context can trigger form submission unexpectedly
- **Context**: In web applications like ChatGPT, button clicks can sometimes trigger the default form submission behavior
- **Solution**:
  - Always set `type="button"` explicitly on button elements to prevent default form submission
  - Use `event.preventDefault()` and `event.stopPropagation()` in click handlers
  - Return `false` from click handlers as an additional safeguard (legacy approach)
  - Be mindful of event bubbling that could trigger parent elements' handlers
  - For critical operations, use a short timeout to ensure the event loop completes before proceeding 

### Cursor Position Text Insertion
- **Issue**: Inserting text in contenteditable elements at the current cursor position is complex
- **Context**: Unlike regular inputs, contenteditable divs require using the Selection and Range APIs
- **Solution**:
  - Use `window.getSelection()` and `selection.getRangeAt(0)` to get cursor position
  - Check if the selection is actually within the target element
  - Split text at cursor position using string manipulation
  - Handle special cases (unfocused elements, end of text, existing line breaks)
  - Restore selection after text insertion using `document.createRange()`
  - Add robust fallbacks for edge cases where selection APIs might fail

### DOM Range API for Text Manipulation
- **Issue**: ChatGPT's editor has a complex DOM structure that simple string manipulation can't handle properly
- **Context**: Using `innerText` with string manipulation loses cursor position and doesn't respect DOM structure
- **Solution**:
  - Work directly with the DOM using Range API instead of string manipulation
  - Use `range.deleteContents()` to remove selected text
  - Create text nodes with `document.createTextNode()` and insert them with `range.insertNode()`
  - Position cursor after insertion with `range.setStartAfter()` and `range.collapse(true)`
  - Handle selection state with `selection.isCollapsed` to detect if text is selected
  - Check text context (like preceding line breaks) by examining `range.startContainer.textContent`
  - Always provide fallbacks for older browsers or edge cases

### Line Break Handling in Contenteditable Elements
- **Issue**: Line breaks get lost when using simple text nodes for insertion in contenteditable elements
- **Context**: When using `document.createTextNode()`, newline characters (\n) don't create visual line breaks in HTML
- **Solution**:
  - Split text by newlines (`text.split('\n')`) and process each line separately
  - Create actual `<br>` elements (`document.createElement('br')`) between lines
  - Use DocumentFragment (`document.createDocumentFragment()`) to batch DOM operations
  - Insert each line as a separate text node with `<br>` elements in between
  - Pay attention to edge cases like empty lines (still need `<br>` elements)
  - Handle initial line breaks based on existing content context
  - Use `range.collapse(false)` to position cursor after the entire inserted fragment 

### Integrating Complex Features Across Components (React)
- **Issue**: Adding a feature like the AI Prompt Enhancer requires state and logic across multiple components (`OptionsPage`, `PromptForm`, `openaiApi`, `storage`).
- **Context**: The enhancer needs API key/model ID from settings (parent), interacts with API utils, manages its own state within the form component, and updates the form's main text state.
- **Solution**:
  - Clearly define props needed by child components (`PromptForm` needs `apiKey`, `selectedModelId`, `existingIds` from `OptionsPage`).
  - Centralize API calls in utility functions (`enhancePrompt` in `openaiApi.ts`).
  - Encapsulate feature-specific state and handlers within the most relevant component (`PromptForm`).
  - Use `useCallback` for helper functions passed down or used in `useEffect` dependencies (`resetEnhancerState`).
  - Be mindful of prop drilling and consider context or state management libraries for more complex scenarios, though prop drilling was sufficient here.
  - Ensure state is reset appropriately when context changes (e.g., switching between adding/editing prompts, submitting the form). 