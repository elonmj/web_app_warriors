// Import jest-dom matchers
require('@testing-library/jest-dom');

// Mock TextEncoder/TextDecoder for MSW
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Set up global test environment
beforeAll(() => {
  // Mock Request API
  if (!globalThis.Request) {
    globalThis.Request = class Request {
      constructor(url, options = {}) {
        this.url = url;
        this.method = options.method || 'GET';
        this.headers = new Headers(options.headers);
        this.body = options.body;
      }
    };
  }

  // Mock Headers if not defined
  if (!globalThis.Headers) {
    globalThis.Headers = class Headers {
      constructor(init = {}) {
        this._headers = new Map();
        if (init) {
          Object.entries(init).forEach(([key, value]) => {
            this._headers.set(key.toLowerCase(), value);
          });
        }
      }
      
      append(name, value) {
        this._headers.set(name.toLowerCase(), value);
      }
      
      get(name) {
        return this._headers.get(name.toLowerCase()) || null;
      }
    };
  }

  // Mock Response if not defined
  if (!globalThis.Response) {
    globalThis.Response = class Response {
      constructor(body, init = {}) {
        this._body = body;
        this.status = init.status || 200;
        this.statusText = init.statusText || '';
        this.headers = new Headers(init.headers);
      }
    };
  }

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
});