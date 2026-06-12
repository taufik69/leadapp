import { Response } from "express";

const clients = new Set<Response>();

export const addSseClient = (res: Response): void => {
  clients.add(res);
  console.log(`[SSE] Client connected — total: ${clients.size}`);
};

export const removeSseClient = (res: Response): void => {
  clients.delete(res);
  console.log(`[SSE] Client disconnected — total: ${clients.size}`);
};

export const broadcastSseEvent = (data: unknown): void => {
  if (clients.size === 0) {
    console.log("[SSE] No connected clients — skipping broadcast");
    return;
  }

  const payload = `data: ${JSON.stringify(data)}\n\n`;
  const stale: Response[] = [];

  for (const client of clients) {
    try {
      client.write(payload);
    } catch {
      // Client is disconnected — mark for removal
      stale.push(client);
    }
  }

  for (const s of stale) {
    clients.delete(s);
    console.log(`[SSE] Removed stale client — total: ${clients.size}`);
  }

  console.log(`[SSE] Broadcast sent to ${clients.size} client(s)`);
};

/** Send a heartbeat comment to all clients to keep connections alive. */
export const sendHeartbeat = (): void => {
  const stale: Response[] = [];
  for (const client of clients) {
    try {
      client.write(": heartbeat\n\n");
    } catch {
      stale.push(client);
    }
  }
  for (const s of stale) clients.delete(s);
};
