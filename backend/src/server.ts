import { app } from './app.js';
import { env } from './config/env.js';

const port = env.port;

const server = app.listen(port, () => {
  console.log(`StyleMatch API listening at http://localhost:${port}`);
});

server.requestTimeout = 65_000;
server.headersTimeout = 70_000;
