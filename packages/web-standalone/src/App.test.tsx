import { test, expect } from 'vitest';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

test('app renders without crashing', () => {
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);

  expect(() => {
    createRoot(root).render(createElement(App));
  }).not.toThrow();

  document.body.removeChild(root);
});
