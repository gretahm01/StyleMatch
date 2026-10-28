import { app } from './app.js';
import { env } from './config/env.js';

const port = env.port;

const server = app.listen(port, () => {
  console.log(`StyleMatch API listening at http://localhost:${port}`);
});

server.on('clientError', (error) => {
  console.warn(JSON.stringify({ event: 'http_client_error', name: error.name, code: (error as NodeJS.ErrnoException).code ?? null }));
});

server.requestTimeout = 65_000;
server.headersTimeout = 70_000;
