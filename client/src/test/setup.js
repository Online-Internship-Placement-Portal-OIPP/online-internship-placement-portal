import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.clearAllMocks();
});

// Mock window.matchMedia for responsive UI components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.location in JSDOM
delete window.location;
window.location = {
  pathname: '/',
  href: 'http://localhost:5173/',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};

