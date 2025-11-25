import { Response } from 'express';

const HEARTBEAT_INTERVAL = 25_000; // 25s keeps Safari/Chrome connections alive

interface SSEClient {
  id: string;
  response: Response;
  projectId?: string;
  heartbeat?: NodeJS.Timeout;
}

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();
  private clientIdCounter = 0;

  addClient(res: Response, projectId?: string): string {
    const clientId = `client-${++this.clientIdCounter}-${Date.now()}`;
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    
    const heartbeat = setInterval(() => {
      this.writeHeartbeat(clientId);
    }, HEARTBEAT_INTERVAL);

    const client: SSEClient = {
      id: clientId,
      response: res,
      projectId,
      heartbeat,
    };

    this.clients.set(clientId, client);
    console.log(`✅ SSE Client connected: ${clientId}, Project: ${projectId || 'all'}, Total clients: ${this.clients.size}`);

    // Send initial connection message
    this.sendToClient(clientId, { type: 'connected', clientId, projectId });

    // Handle client disconnect
    res.on('close', () => {
      if (client.heartbeat) {
        clearInterval(client.heartbeat);
      }
      this.clients.delete(clientId);
      console.log(`❌ SSE Client disconnected: ${clientId}, Remaining clients: ${this.clients.size}`);
    });

    return clientId;
  }

  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client?.heartbeat) {
      clearInterval(client.heartbeat);
    }
    this.clients.delete(clientId);
  }

  sendToClient(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.safeWrite(clientId, `data: ${JSON.stringify(data)}\n\n`);
  }

  private writeHeartbeat(clientId: string): void {
    this.safeWrite(clientId, `:heartbeat ${Date.now()}\n\n`);
  }

  private safeWrite(clientId: string, message: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      client.response.write(message);
    } catch (error) {
      console.error(`Error writing SSE to client ${clientId}:`, error);
      if (client.heartbeat) {
        clearInterval(client.heartbeat);
      }
      this.clients.delete(clientId);
    }
  }

  broadcast(data: any, projectId?: string): void {
    this.clients.forEach((client, clientId) => {
      // If projectId is specified:
      // - Send to clients watching that specific project
      // - Send to global clients (no projectId filter)
      if (projectId) {
        if (client.projectId && client.projectId !== projectId) {
          return; // Skip clients watching a different project
        }
        // Allow: clients watching this project OR global clients (no projectId)
      }

      this.safeWrite(clientId, `data: ${JSON.stringify(data)}\n\n`);
    });
    
    console.log(`📢 Broadcasting ${data.type || 'message'} for projectId: ${projectId || 'all'}, Total clients: ${this.clients.size}`);
  }

  broadcastProjectUpdate(projectId: string): void {
    const message = {
      type: 'project_updated',
      projectId,
      timestamp: new Date().toISOString(),
    };
    console.log(`📢 Broadcasting project update for projectId: ${projectId}, Total clients: ${this.clients.size}`);
    this.broadcast(message, projectId);
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const sseManager = new SSEManager();

