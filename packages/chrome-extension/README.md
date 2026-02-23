# Chrome Extension Project

This is a Chrome extension project built with Vue 3 + TypeScript + Vite.

## Project Structure

- `manifest.json`: Chrome extension manifest (MV3)
- `vite.config.ts`: Vite configuration for multi-entry build
- `src/background.ts`: Service worker script
- `src/content.ts`: Content script
- `src/popup/`: Popup UI (Vue app)
- `index.html`: Popup entry point

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

## Development

Since this project uses a standard Vite build for multiple entries, HMR for content scripts and background scripts is not supported out of the box.

For popup development:
```bash
npm run dev
```

## Build

To build the extension for production:

```bash
npm run build
```

The output will be in the `dist` directory.

## Load in Chrome

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable "Developer mode" in the top right corner.
3. Click "Load unpacked" and select the `dist` directory in this project.
