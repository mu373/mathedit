import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker&inline';

// Use the bundled editor so our patched sanitizer is used at runtime too.
// Inline workers also work in the macOS app's file:// WebView.
self.MonacoEnvironment = { getWorker: () => new EditorWorker() };
loader.config({ monaco });
