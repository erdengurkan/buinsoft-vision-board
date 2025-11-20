import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { handleError } from '../lib/errors';
import { sseManager } from '../lib/sse';
import { z } from 'zod';

const startTimerSchema = z.object({
  taskId: z.string(),
  projectId: z.string(),
  userId: z.string(),
});

const stopTimerSchema = z.object({
  userId: z.string(),
  taskId: z.string().optional(), // Optional: stop specific task timer
});

export const startTimer = async (req: Request, res: Response) => {
  try {
    const data = startTimerSchema.parse(req.body);

    // Delete existing timer for this user if exists
    await prisma.activeTimer.deleteMany({
      where: { userId: data.userId },
    });

    // Create new timer
    const timer = await prisma.activeTimer.create({
      data: {
        taskId: data.taskId,
        projectId: data.projectId,
        userId: data.userId,
        startedAt: new Date(),
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
    });

    // Broadcast timer start to all connected clients
    sseManager.broadcast(
      {
        type: 'timer_started',
        taskId: data.taskId,
        projectId: data.projectId,
        userId: data.userId,
        timestamp: new Date().toISOString(),
      },
      data.projectId
    );

    res.json(timer);
  } catch (error) {
    handleError(error, res);
  }
};

export const stopTimer = async (req: Request, res: Response) => {
  try {
    const data = stopTimerSchema.parse(req.body);

    // Build where clause: stop specific task timer if taskId provided, otherwise stop all for user
    const where: any = { userId: data.userId };
    if (data.taskId) {
      where.taskId = data.taskId;
    }

    const timer = await prisma.activeTimer.findFirst({
      where,
      include: {
        task: {
          select: {
            projectId: true,
          },
        },
      },
    });

    if (!timer) {
      return res.status(404).json({ error: 'No active timer found' });
    }

    // Delete timer(s) matching the where clause
    await prisma.activeTimer.deleteMany({
      where,
    });

    // Broadcast timer stop to all connected clients
    sseManager.broadcast(
      {
        type: 'timer_stopped',
        taskId: timer.taskId,
        projectId: timer.projectId,
        userId: data.userId,
        timestamp: new Date().toISOString(),
      },
      timer.task.projectId
    );

    res.json({ message: 'Timer stopped successfully' });
  } catch (error) {
    handleError(error, res);
  }
};

export const getActiveTimers = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;

    const where: any = {};
    if (projectId && typeof projectId === 'string') {
      where.projectId = projectId;
    }

    const timers = await prisma.activeTimer.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
    });

    res.json(timers);
  } catch (error) {
    handleError(error, res);
  }
};

