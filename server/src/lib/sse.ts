import { Response } from 'express';

interface SSEClient {
  id: string;
  response: Response;
  projectId?: string;
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
    
    const client: SSEClient = {
      id: clientId,
      response: res,
      projectId,
    };

    this.clients.set(clientId, client);
    console.log(`✅ SSE Client connected: ${clientId}, Project: ${projectId || 'all'}, Total clients: ${this.clients.size}`);

    // Send initial connection message
    this.sendToClient(clientId, { type: 'connected', clientId, projectId });

    // Handle client disconnect
    res.on('close', () => {
      this.clients.delete(clientId);
      console.log(`❌ SSE Client disconnected: ${clientId}, Remaining clients: ${this.clients.size}`);
    });

    return clientId;
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  sendToClient(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      client.response.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error(`Error sending SSE to client ${clientId}:`, error);
      this.clients.delete(clientId);
    }
  }

  broadcast(data: any, projectId?: string): void {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    
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

      try {
        client.response.write(message);
      } catch (error) {
        console.error(`Error broadcasting to client ${clientId}:`, error);
        this.clients.delete(clientId);
      }
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

