import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

interface Handler {
  path: string;
  method?: 'get' | 'post' | 'put' | 'delete' | 'patch';
  status?: number;
  response: any | ((params?: Record<string, string>) => any);
}

// Create MSW server instance
export const server = setupServer()

// Export handlers helper
export function createHandlers(handlers: Handler[]) {
  return handlers.map(({ path, method = 'get', status = 200, response }) => {
    return http[method](path, () => {
      const responseData = typeof response === 'function' ? response() : response
      return HttpResponse.json(responseData, { status })
    })
  })
}

// Setup MSW server
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())