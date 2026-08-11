import "@testing-library/jest-dom/vitest";

/**
 * jsdom has no layout engine, so Recharts' ResponsiveContainer measures its
 * parent as 0×0 and renders nothing — every chart assertion would fail on an
 * empty SVG regardless of the code under test. Stubbing the observer with a
 * fixed size lets charts render at a deterministic size in tests.
 */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as never);
