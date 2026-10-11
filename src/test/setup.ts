import "@testing-library/jest-dom/vitest";

// Тести завжди на моках — live-режим fetch не вмикається
(globalThis as unknown as { __GERTS_MOCKS__?: boolean }).__GERTS_MOCKS__ = true;

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
