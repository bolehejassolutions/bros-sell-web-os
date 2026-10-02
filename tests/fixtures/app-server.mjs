// Programmatic dev server avoids CLI child-process startup in restricted workspaces.
import next from 'next';
import http from 'node:http';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54329';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'local-fixture-publishable-key';
const app = next({ dev: process.env.BROS_FIXTURE_PRODUCTION !== '1', hostname: '127.0.0.1', port: 3007 });
app.prepare().then(() => http.createServer(app.getRequestHandler()).listen(3007, '127.0.0.1', () => console.log('Fixture app ready: http://127.0.0.1:3007'))).catch(error => { console.error(error); process.exitCode=1; });
