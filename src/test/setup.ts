import '@testing-library/jest-dom/vitest'

// jsdom lacks these; cmdk and MapLibre-adjacent code touch them.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver
Element.prototype.scrollIntoView ??= () => {}

// jsdom has no matchMedia; pretend to be a desktop-width, light-mode browser.
window.matchMedia ??= ((query: string) => ({
  matches: query.includes('min-width'),
  media: query,
  onchange: null,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia
