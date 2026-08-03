import "@testing-library/jest-dom";

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

if (typeof window !== "undefined") {
  if (!window.getSelection) {
    (window as any).getSelection = () => ({
      addRange: () => {},
      removeAllRanges: () => {},
      getRangeAt: () => ({
        setEnd: () => {},
        setStart: () => {},
        getBoundingClientRect: () => ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }),
        getClientRects: () => [],
      }),
    });
  }

  if (!document.createRange) {
    (document as any).createRange = () => ({
      setStart: () => {},
      setEnd: () => {},
      commonAncestorContainer: {
        nodeName: "BODY",
        ownerDocument: document,
      },
      getClientRects: () => [],
      getBoundingClientRect: () => ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }),
    });
  }
}
