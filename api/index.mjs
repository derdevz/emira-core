import { createRuntimeConfig } from '../backend/src/config.mjs';
import { handleRoute } from '../backend/src/routes.mjs';

export default async function handler(request, response) {
  try {
    await handleRoute(request, response, createRuntimeConfig());
  } catch (error) {
    response.writeHead(500, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    });
    response.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown backend error',
      }),
    );
  }
}
