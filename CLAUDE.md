# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules You Should Always Follow
1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the [todo.md](http://todo.md/) file with a summary of the changes you made and any other relevant information.

## Project Overview

QuickPrompts is a productivity tool available in two versions:
1. **Chrome Extension** (Manifest V3) for browser-based AI platforms
2. **Desktop App** (Electron) for system-wide prompt access

Both versions allow users to quickly inject predefined prompt templates into AI chat interfaces and maintain full data compatibility through shared JSON export/import format.

## Development Commands

### Chrome Extension
```bash
# Install dependencies
npm install

# Production build (creates dist/ folder for Chrome extension loading)
npm run build

# Development with auto-rebuild
npm run watch
# or
npm run dev

# Code quality
npm run lint

# Testing (framework configured, no tests currently)
npm run test
```

#### Extension Installation
1. Run `npm run build`
2. Load unpacked extension from `dist/` folder in Chrome
3. Supports hot reload during development with `npm run watch`

### Desktop App
```bash
# Navigate to desktop app directory
cd quickprompts-desktop

# Install dependencies
npm install

# Build the desktop app
npm run build

# Start the desktop app
npm start

# Development with auto-rebuild
npm run dev

# Package for distribution
npm run package
```

#### Desktop App Features
- **System-wide keyboard shortcuts** (Cmd+Shift+P / Ctrl+Shift+P)
- **Global prompt insertion** via clipboard to any application
- **System tray integration** for quick access
- **Full Chrome extension compatibility** - same JSON export/import format
- **Cross-platform support** (Windows, macOS, Linux)

## Architecture

### Chrome Extension Components
- **Content Script** (`src/content-scripts/contentScript.ts`) - Injected into AI platforms, handles DOM manipulation and button injection
- **Background Script** (`src/background/background.ts`) - Service worker for extension lifecycle
- **Options Page** (`src/options/`) - React-based UI for prompt management with AI enhancement features

### Desktop App Components
- **Main Process** (`quickprompts-desktop/src/main/main.ts`) - Electron main process with system integration
- **Renderer Process** (`quickprompts-desktop/src/renderer/`) - React-based UI (reused from Chrome extension)
- **Shared Utilities** (`quickprompts-desktop/src/shared/`) - Common types, storage, and API integrations

### Technology Stack
- **TypeScript** with React 18 for UI components
- **Webpack 5** build system with source maps
- **Chrome Extension APIs** (storage, runtime, action) for browser version
- **Electron APIs** (globalShortcut, Tray, ipcMain) for desktop version
- **OpenAI API integration** for AI categorization and prompt enhancement

### Key Data Structures
```typescript
interface Prompt {
  id: string;
  name: string;
  text: string;
  category: string;
  color: string;
  icon: string; // Supports both emoji and Material Design icon names
}

interface UserSettings {
  openAIApiKey?: string;
  selectedModelId?: string;
  debugModeEnabled?: boolean;
  showPromptIcons?: boolean;
  // Desktop-specific settings
  globalShortcut?: string;
  launchOnStartup?: boolean;
  minimizeToTray?: boolean;
}

interface PromptExportData {
  version: 1;
  exportedAt: string;
  prompts: Prompt[];
}
```

## Platform Support

### Chrome Extension - Browser Platforms
The extension detects and adapts to these AI platforms with site-specific DOM selectors:
- ChatGPT (chat.openai.com, chatgpt.com)
- Claude (claude.ai) - uses ProseMirror editor with special paragraph handling
- Gemini (gemini.google.com) - uses Quill editor
- Grok (grok.com, x.com/i/grok) - standard text areas
- Microsoft Copilot, Perplexity AI, DeepSeek, T3 Chat, Mistral AI, Google AI Studio

### Desktop App - System-wide Support
The desktop app works with any application that accepts text input:
- **Desktop AI apps**: ChatGPT Desktop, Claude Desktop
- **CLI tools**: Claude Code, terminal applications
- **Text editors**: VS Code, Sublime Text, Notepad++
- **Web browsers**: Any text field in any website
- **Office applications**: Word, Google Docs, Notion

## Text Insertion Strategy

### Chrome Extension
The content script handles different input types:
- **Standard text areas** - direct value manipulation
- **ContentEditable divs** - DOM manipulation with cursor preservation
- **Quill editors** - API-based text insertion
- **ProseMirror editors** - Special paragraph node handling for Claude

### Desktop App
Uses clipboard-based insertion for universal compatibility:
- Copies prompt text to system clipboard
- User pastes with Cmd+V / Ctrl+V into any application
- Works with any text field regardless of implementation

## Storage Architecture

### Chrome Extension
- **Chrome Storage Local** - Primary storage (larger capacity)
- **Automatic migration** from sync to local storage
- **Graceful fallbacks** on storage failures
- **Real-time sync** between options page and content scripts

### Desktop App
- **Local JSON file** - `~/.quickprompts/data.json`
- **Cross-platform paths** - Windows, macOS, Linux support
- **Atomic file operations** - Prevents data corruption
- **Automatic directory creation** - Sets up storage location on first run

## Build System

Webpack configuration with:
- **Multiple entry points**: contentScript, background, options
- **TypeScript compilation** with ts-loader
- **CSS processing** with style-loader and css-loader
- **Static asset copying** for manifest and icons
- **Source maps** for development debugging

## AI Integration Features

### OpenAI API Integration
**Chrome Extension**: `src/utils/openaiApi.ts`  
**Desktop App**: `quickprompts-desktop/src/shared/openaiApi.ts`

- **Dynamic model fetching** - Automatically loads available models from OpenAI API
- Category suggestion generation
- Prompt enhancement with conversation history
- Comprehensive error handling and retry mechanisms

### AI-Powered Features
- **Categorization**: Automatic prompt categorization using OpenAI
- **Enhancement**: Prompt refinement with feedback loops
- **Model Selection**: Dynamic model list loaded from OpenAI API
- **Icon Conversion**: Material Design icon names automatically converted to emojis

## Development Notes

### Chrome Extension Implementation
- **MutationObserver** monitors DOM changes for dynamic injection
- **Site-specific selectors** adapt to each platform's unique structure
- **Smart positioning** places buttons contextually within interfaces
- **Event handling** prevents form submission and preserves cursor position

### Desktop App Implementation
- **Global shortcuts** using Electron's globalShortcut API
- **System tray integration** with context menu and notifications
- **IPC communication** between main and renderer processes
- **Cross-platform file paths** using Node.js path and os modules

### Shared React Components
**Reused between Chrome extension and desktop app:**
- `PromptForm` - Handles creation/editing with AI enhancement
- `PromptList` - Displays and manages prompt collections with icon conversion
- `Settings` - Manages user preferences and API configuration
- `CategorySuggestions` - AI-powered categorization interface
- `ImportConfirmModal` - Sophisticated import workflow with preview

### Error Handling
- Graceful fallbacks for storage operations
- User-friendly error notifications in UI
- Console logging with debug mode toggle
- API error handling with retry mechanisms

### Data Compatibility
- **100% interoperable** JSON export/import format
- **Icon conversion** - Material Design names ↔ emojis
- **Settings migration** - Handles both Chrome and desktop settings
- **Version compatibility** - Backward compatible data format

## Testing Strategy

Jest framework is configured but no tests are currently implemented. Test structure should follow:

### Chrome Extension Tests
- Unit tests for utility functions (`src/utils/`)
- Component tests for React components (`src/options/components/`)
- Integration tests for Chrome extension APIs

### Desktop App Tests  
- Unit tests for shared utilities (`quickprompts-desktop/src/shared/`)
- Component tests for React components (reused from extension)
- Integration tests for Electron APIs and IPC
- End-to-end tests for global shortcuts and system integration

## Code Quality Standards

- **TypeScript** throughout for type safety
- **Interface definitions** for all data structures
- **ESLint** configuration for code consistency
- **Modular architecture** with clear separation of concerns
- **No sensitive data** in manifest or committed code
- **Shared code** between Chrome extension and desktop app
- **Cross-platform compatibility** for desktop features