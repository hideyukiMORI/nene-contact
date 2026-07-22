import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// A default empty tag vocabulary so any component that reads /admin/tags (the inbox, the
// submission detail) renders cleanly without every test having to stub it. Tests that exercise
// tags override this with their own `server.use(...)`.
export const server = setupServer(http.get('*/admin/tags', () => HttpResponse.json({ items: [] })));
