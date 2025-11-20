import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { handleError } from '../lib/errors';
import { sseManager } from '../lib/sse';
import { z } from 'zod';

const createActivityLogSchema = z.object({
  projectId: z.string(),
  taskId: z.string().optional(),
  user: z.string(),
  actionType: z.string(),
  description: z.string(),
  metadata: z.any().optional(),
});

export const createActivityLog = async (req: Request, res: Response) => {
  try {
    const data = createActivityLogSchema.parse(req.body);

    const activityLog = await prisma.activityLog.create({
      data: {
        projectId: data.projectId,
        user: data.user,
        actionType: data.actionType,
        description: data.description,
        metadata: data.metadata,
      },
    });

    // Broadcast update to all connected clients
    sseManager.broadcastProjectUpdate(data.projectId);

    res.status(201).json(activityLog);
  } catch (error) {
    handleError(error, res);
  }
};

export const getProjectActivityLogs = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const logs = await prisma.activityLog.findMany({
      where: { projectId },
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit to last 100 logs
    });

    res.json(logs);
  } catch (error) {
    handleError(error, res);
  }
};

