import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { handleError } from '../lib/errors';
import { sseManager } from '../lib/sse';
import { z } from 'zod';

const createWorklogSchema = z.object({
  taskId: z.string(),
  durationMs: z.number().int().positive(),
  startedAt: z.string().datetime(),
  stoppedAt: z.string().datetime(),
  user: z.string(),
  description: z.string().optional(),
});

export const createWorklog = async (req: Request, res: Response) => {
  try {
    const data = createWorklogSchema.parse(req.body);

    // Get task to find projectId
    const task = await prisma.task.findUnique({
      where: { id: data.taskId },
      select: { projectId: true },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const worklog = await prisma.worklogEntry.create({
      data: {
        taskId: data.taskId,
        durationMs: data.durationMs,
        startedAt: new Date(data.startedAt),
        stoppedAt: new Date(data.stoppedAt),
        user: data.user,
        description: data.description,
      },
    });

    // Broadcast update to all connected clients
    sseManager.broadcastProjectUpdate(task.projectId);

    res.status(201).json(worklog);
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteWorklog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get worklog to find projectId
    const worklog = await prisma.worklogEntry.findUnique({
      where: { id },
      include: {
        task: {
          select: { projectId: true },
        },
      },
    });

    if (!worklog) {
      return res.status(404).json({ error: 'Worklog not found' });
    }

    await prisma.worklogEntry.delete({
      where: { id },
    });

    // Broadcast update to all connected clients
    sseManager.broadcastProjectUpdate(worklog.task.projectId);

    res.json({ message: 'Worklog deleted successfully' });
  } catch (error) {
    handleError(error, res);
  }
};

export const getTaskWorklogs = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.query;

    if (!taskId || typeof taskId !== 'string') {
      return res.status(400).json({ error: 'taskId is required' });
    }

    const worklogs = await prisma.worklogEntry.findMany({
      where: { taskId },
      orderBy: { stoppedAt: 'desc' },
    });

    res.json(worklogs);
  } catch (error) {
    handleError(error, res);
  }
};

