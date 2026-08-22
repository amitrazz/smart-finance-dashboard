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

/**
 * jsdom doesn't implement these — any component that previews a downloaded
 * file (e.g. a salary-slip/document iframe preview) via
 * `URL.createObjectURL(blob)` would otherwise throw, which most such
 * components swallow into a "could not load" error state, silently masking
 * the component under test rather than the real behavior.
 */
globalThis.URL.createObjectURL = globalThis.URL.createObjectURL ?? (() => "blob:mock-url");
globalThis.URL.revokeObjectURL = globalThis.URL.revokeObjectURL ?? (() => undefined);
