<specification_planning>

**Analysis of Requirements and Proposed Approach**

1. **Core System Architecture and Key Workflows**  
   - Because we’re building a Chrome extension, we’ll organize our code around the standard Chrome extension architecture:
     - A **content script** that injects/controls the UI elements in the ChatGPT page.
     - An **options page** for prompt management and extension configuration (including storing the user’s OpenAI API key for categorization).
     - A **background script** (optional, but typically used if we need event-based actions or messaging between components).
   - **Key workflows**:
     1. User visits `chat.openai.com`.
     2. The content script detects the ChatGPT input field and appends quick prompt buttons.
     3. Clicking a button injects the corresponding text into the input.
     4. Extension Options page:
        - Manage prompts (add/edit/remove, reorder, set category).
        - Manage user’s OpenAI API key and possibly invoke auto-categorization.

2. **Project Structure and Organization**  
   - We will separate concerns by having a dedicated folder for each major part of the extension:
     - `/src/content-scripts` for scripts that run on ChatGPT pages (inject the UI, handle button clicks, etc.).
     - `/src/options` for the React or plain HTML/JS options page (managing the prompts, categorization, color pickers, etc.).
     - `/src/background` for the extension’s background logic (if needed for message passing or advanced features).
     - A shared `/src/utils` folder for common logic (storage, error handling, API calls).

3. **Detailed Feature Specifications**  
   - We’ll define the flow for each user-facing feature:
     - **Prompt Injection**: capturing click events in the content script, injecting the predefined prompt text into the ChatGPT text area.
     - **Prompt Management**: reading/writing data from Chrome storage (sync if available, fallback to local). 
     - **Categorization**: using an external request with the user’s OpenAI API key. Handling error states and usage limits.

4. **Database Schema Design**  
   - Since this is a Chrome extension storing data in Chrome Storage (local + sync), we don’t have a traditional database. We’ll define a JSON structure:
     ```json
     {
       "prompts": [
         {
           "id": "uniquePromptId",
           "text": "Hello, ChatGPT!",
           "category": "Greeting",
           "color": "#FF0000",
           "icon": "star"
         }
       ],
       "userSettings": {
         "apiKey": "sk-XXXX",
         ...
       }
     }
     ```
   - This schema will be saved to Chrome storage, with minimal overhead. 

5. **Server Actions and Integrations**  
   - We do not have a dedicated server. The primary external API is the **OpenAI API** for categorization. The content script or options page will:
     1. Read the user’s OpenAI API key from storage.
     2. Send prompts in JSON format to the OpenAI endpoint.
     3. Receive a suggested category mapping. 
   - This requires error handling (401 unauthorized, 429 rate limit, etc.).

6. **Design System and Component Architecture**  
   - We’ll keep the design minimal, but consistent with ChatGPT’s styling. For the options page:
     - Possibly use a lightweight UI framework or just plain HTML/CSS/JS/React.
     - The color picker can be a simple HTML color input or a small component from a UI library.
     - Icon selection can be done via a dropdown or an icon gallery with Material Icons.

7. **Authentication and Authorization Implementation**  
   - **Skipped** – not applicable in the traditional sense since the extension is not managing user accounts beyond storing an OpenAI API key. We just need to ensure data is stored securely in Chrome Sync and that the key isn’t exposed inadvertently.

8. **Data Flow and State Management**  
   - **Content Script** obtains prompts from Chrome storage => Renders quick prompt buttons => Injects text into ChatGPT. 
   - **Options Page** updates data in Chrome storage => Possibly triggers categorization calls to the OpenAI API => Persists new or updated data.

9. **Payment Implementation**  
   - **Skipped** – not applicable. There is no payment flow in this extension.

10. **Analytics Implementation**  
    - **Skipped** – not specified. If needed, a minimal approach might be tracking usage stats in local storage or with an optional analytics service. Currently, out of scope.

11. **Testing Strategy**  
    - **Unit Tests**: We can test helper functions (e.g., data transformations, categorization request handling) with Jest.
    - **E2E Tests**: Potentially use a test framework like Playwright or Puppeteer to open `chat.openai.com` (in a controlled environment), confirm that the extension loads, and verify that clicking quick prompt buttons injects text.
    - We may also test the Options page logic in an isolated environment.

**Potential Challenges & Edge Cases**  
- **DOM changes**: If ChatGPT changes the structure of the input field, the content script might break. We’ll need robust selectors or fallback logic.  
- **Network issues** for categorization: If the user’s network fails or the API returns an error, we should fallback to manual categorization.  
- **API usage limits**: If a user runs out of tokens or usage credits, show an inline error (with an option to add a new key).  
- **Permissions**: Must carefully request only what is needed (activeTab or host permissions for ChatGPT domains, storage, etc.).

</specification_planning>

```markdown
# ChatGPT Quick Prompts Technical Specification

## 1. System Overview

### Core Purpose and Value Proposition
- **Purpose**: A Chrome extension that quickly injects predefined prompts into ChatGPT’s input field, saving users time on repetitive queries.
- **Value**: Streamlines user workflows by letting them manage, categorize, and style a large library of prompts without manual copy/paste.

### Key Workflows
1. **Prompt Injection**:
   - User clicks on a quick prompt button beneath the ChatGPT input field.
   - Extension injects the predefined prompt text into the input, without auto-submission.
2. **Prompt Management**:
   - Users open the Options page to add/edit/remove prompts.
   - Users can reorder, categorize, and apply styling to each prompt.
3. **Auto-Categorization** (Optional):
   - User saves an OpenAI API key in the Options page.
   - Extension gathers prompt data in JSON format, sends it to the OpenAI API.
   - Displays suggested categories for each prompt; user can accept or reject.

### System Architecture
- **Content Script**:
  - Injects UI elements (quick prompt buttons) into `chat.openai.com`.
  - Reads stored prompts from Chrome Storage.
  - Injects text into the ChatGPT input field when a button is clicked.
- **Options Page**:
  - Allows CRUD operations for prompts.
  - Manages categories (manual & AI-based).
  - Collects and stores the user’s OpenAI API key securely.
- **Background Script (Optional)**:
  - May be used for extension lifecycle events or messaging if needed. This might be minimal if we can handle most logic in content + options.

## 2. Project Structure

A possible file/folder organization:

```
chatgpt-quick-prompts/
├─ src/
│  ├─ content-scripts/
│  │  ├─ contentScript.ts
│  │  └─ injectUI.ts
│  ├─ options/
│  │  ├─ OptionsPage.tsx
│  │  ├─ OptionsPage.css
│  │  └─ components/
│  │      ├─ PromptList.tsx
│  │      ├─ PromptForm.tsx
│  │      └─ CategorySuggestions.tsx
│  ├─ background/
│  │  └─ background.ts
│  ├─ utils/
│  │  ├─ storage.ts
│  │  ├─ openaiApi.ts
│  │  └─ ...
│  ├─ manifest.json
│  └─ ...
├─ package.json
├─ tsconfig.json
└─ README.md
```

- `content-scripts`: Content scripts that modify the ChatGPT interface and handle prompt injection.
- `options`: The React/HTML/JS code for the extension’s Options page.
- `background`: Scripts for any background tasks (e.g., listening for external messages).
- `utils`: Shared code for storage, API calls, error handling, etc.

## 3. Feature Specification

### 3.1 Basic Prompt Injection

**User Story & Requirements**  
- As a user, I can see a row of quick prompt buttons below the ChatGPT input field.
- Clicking a button populates ChatGPT’s input with that prompt text, allowing me to edit or submit it.

**Implementation Steps**  
1. **DOM Injection**: The content script, on page load, appends a container below the ChatGPT input field.
2. **Button Rendering**: For each prompt in storage, render a button with label/icon/color.
3. **Click Handler**: On button click, find ChatGPT’s text area element and set its value to the prompt text.

**Error Handling & Edge Cases**  
- If ChatGPT changes its DOM structure, the content script might fail to locate the input field. Provide fallback or version checks.
- If no prompts exist, the container might remain hidden or display a message like “No quick prompts available.”

### 3.2 Prompt Management

**User Story & Requirements**  
- As a user, I can add, edit, remove, reorder, and search/filter prompts from the Options page.
- All changes automatically sync across my Chrome browsers if enabled.

**Implementation Steps**  
1. **Storage**: Use the `chrome.storage.sync` API for cross-device data. Fallback to `chrome.storage.local` if sync is unavailable.
2. **CRUD UI**: A table or list in the Options page for existing prompts.  
   - **Add**: Click an “Add Prompt” button, fill out text, category, color, icon, etc.
   - **Edit**: Click an edit icon next to each prompt; open a small form or inline editor.
   - **Remove**: A delete icon that removes the prompt from the list.
   - **Reorder**: Drag-and-drop or up/down arrows to reorder prompts.
   - **Search**: A text input field to filter the list based on prompt text or category.
3. **Sync Handling**: On any change, store updated data in `chrome.storage.sync`.

**Error Handling & Edge Cases**  
- If sync is unavailable or fails, fallback to local storage or show a notification.
- Validate user input (e.g., ensure prompt text isn’t empty).

### 3.3 Prompt Categorization

**User Story & Requirements**  
- I can manually create categories.
- I can optionally use AI-based categorization if I have an OpenAI API key.

**Implementation Steps**  
1. **Manual Categorization**: In the prompt form, user chooses or types a category name.
2. **OpenAI API Key Storage**: A field in extension settings where the user enters their key. Stored in Chrome Sync.
3. **Auto-Categorization**:
   1. User triggers an action (e.g., “Auto-categorize prompts” button).
   2. The extension collects all prompt text in JSON.
   3. Calls a function in `openaiApi.ts` to send a categorization request to OpenAI.
   4. Receives a set of category suggestions for each prompt.
   5. Displays them in a dedicated view (e.g., `CategorySuggestions.tsx`). The user can accept/reject.
   6. Updates local store with chosen categories.
4. **Error Handling**:
   - **Usage Limit**: Show an inline notification if the user hits usage limits. Optionally display a modal to ask for a new key.
   - **Network Errors**: Retry or let the user manually categorize.
   - **Invalid Key**: Inline error message prompting user to correct the key.

### 3.4 UI / UX Considerations

**Requirements**  
- Buttons remain minimal, with an icon and short label, matching ChatGPT’s style.
- Users can pick a button color and icon from a limited set in the Options page.

**Implementation Steps**  
- **Style**: Use small, subtle color-coded buttons below ChatGPT’s input.
- **Light & Dark Mode**: Respect ChatGPT’s existing color scheme, or detect page background and match automatically.
- **Hover States**: Show prompt preview or short description on hover if needed.

**Error Handling & Edge Cases**  
- If the user picks an invalid color code, default to a fallback color.

## 4. Database Schema

Since we’re only using Chrome Storage, there’s no traditional SQL or NoSQL DB.  
However, we have a JSON-like structure for storing data:

### 4.1 Data Model
```json
{
  "prompts": [
    {
      "id": "string",
      "text": "string",
      "category": "string",
      "color": "string (hex)",
      "icon": "string (icon name)"
    }
    // ... more prompts
  ],
  "userSettings": {
    "openAIApiKey": "string"
  }
}
```

- **Indexes**: Not applicable. Searching/filtering is done in-memory.
- **Relationships**: Each prompt can have one category. Additional relationships can be added if needed (e.g., sub-categories).

## 5. Server Actions

Since this is a Chrome extension with minimal server involvement, we only detail external API integration:

### 5.1 OpenAI API Integration
- **Endpoint**: `https://api.openai.com/v1/chat/completions` or similar, depending on the chosen model.
- **Request**:
  - Headers: `{ "Authorization": "Bearer <API_KEY>", "Content-Type": "application/json" }`
  - Body: JSON containing the system or user prompt about categorizing the user’s prompts.
- **Response**:
  - A list of suggested categories for each prompt.
  - Potential error codes (401, 429, etc.).

## 6. Design System

### 6.1 Visual Style
- **Minimal**: White or off-white backgrounds, with subtle borders and shadows.
- **Color Palette**: 
  - **Primary**: #007ACC (example)
  - **Gray**: #E5E5E5
  - **Text**: #333333
- **Typography**:
  - **Font**: System font or a common web font like Arial/Helvetica for extension UI.
  - **Sizes**: 14px–16px for body text, 18px for titles.

### 6.2 Core Components

1. **Button** (in content script):
   - Small size, colored background if user-specified, icon + text label.
   - Hover style: slight color shift or underline.
2. **PromptList** (in Options page):
   - Displays an interactive list of prompts, each with an edit/delete button and an indicator for color/icon.
3. **PromptForm** (in Options page):
   - Fields for text, color, icon, category. On submit, saves data to storage.
4. **CategorySuggestions** (in Options page):
   - A panel or dialog that lists prompts with suggested categories from OpenAI, offering accept/reject.

## 7. Component Architecture

### 7.1 Server Components
- **Skipped**. No dedicated server.

### 7.2 Client Components
- **State Management**: 
  - For the options page, we can use React’s built-in hooks (`useState`, `useEffect`) or a lightweight state library if needed. 
  - The content script will store minimal state in local variables, syncing with Chrome storage on load.
- **Event Handlers**: 
  - Button clicks for injecting prompts.
  - Category suggestion acceptance/rejection.
  - CRUD operations in the Options page.
- **Props Interface** (if using TypeScript/React):
   ```ts
   interface Prompt {
     id: string;
     text: string;
     category: string;
     color: string;
     icon: string;
   }

   interface UserSettings {
     openAIApiKey?: string;
   }

   interface OptionsPageProps {
     prompts: Prompt[];
     userSettings: UserSettings;
   }
   ```

## 8. Authentication & Authorization

- **Not Applicable**: No user login beyond storing an optional OpenAI API key. No role-based permissions.

## 9. Data Flow

1. **On Extension Install**:
   - Initialize default storage structure if none exists.
2. **On ChatGPT Page Visit**:
   - Content script loads, reads prompts from storage, and renders buttons.
3. **On Options Page**:
   - UI retrieves existing prompts/settings from storage.
   - User modifies data => updated in storage => changes reflected in content script on next page load or via messaging (optional).

## 10. Stripe Integration

- **Skipped**: No payment functionality is in scope.

## 11. PostHog Analytics

- **Skipped**: No analytics is in scope.

## 12. Testing

### 12.1 Unit Tests (Jest)
- **storage.ts**: test saving, loading, fallback logic.
- **openaiApi.ts**: mock the fetch calls to test success/error handling.
- **Prompt Management**: ensure CRUD operations behave as expected.

### 12.2 e2e Tests (Playwright)
- Install and load the extension in a browser context.
- Navigate to `chat.openai.com`.
- Verify the quick prompt buttons appear.
- Click on a button, confirm text injection in the input field.
- Test the Options page for adding/editing/deleting prompts.
- Test AI-based categorization flow if an API key is provided.

```
