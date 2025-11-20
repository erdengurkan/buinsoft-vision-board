import { Router, Request, Response } from 'express';
import { sseManager } from '../lib/sse';

const router = Router();

// SSE endpoint for real-time updates
router.get('/events', (req: Request, res: Response) => {
    const projectId = req.query.projectId as string | undefined;

    // Add client to SSE manager
    // Connection stays open until client disconnects
    sseManager.addClient(res, projectId);

    // Note: We don't send a response here - the connection stays open
    // The sseManager handles sending events to this client
});

export default router;
