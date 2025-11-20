import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { handleError } from '../lib/errors';
import { sseManager } from '../lib/sse';
import { z } from 'zod';

const createCommentSchema = z.object({
  projectId: z.string(),
  taskId: z.string().optional(),
  text: z.string().min(1),
  user: z.string(),
});

export const createComment = async (req: Request, res: Response) => {
  try {
    const data = createCommentSchema.parse(req.body);

    const comment = await prisma.comment.create({
      data: {
        projectId: data.projectId,
        taskId: data.taskId,
        text: data.text,
        user: data.user,
      },
    });

    // Broadcast update to all connected clients
    sseManager.broadcastProjectUpdate(data.projectId);

    res.status(201).json(comment);
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    await prisma.comment.delete({
      where: { id },
    });

    // Broadcast update to all connected clients
    sseManager.broadcastProjectUpdate(comment.projectId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    handleError(error, res);
  }
};

export const getProjectComments = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const comments = await prisma.comment.findMany({
      where: { projectId },
      orderBy: { timestamp: 'desc' },
    });

    res.json(comments);
  } catch (error) {
    handleError(error, res);
  }
};

export const getTaskComments = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.query;

    if (!taskId || typeof taskId !== 'string') {
      return res.status(400).json({ error: 'taskId is required' });
    }

    const comments = await prisma.comment.findMany({
      where: { taskId },
      orderBy: { timestamp: 'desc' },
    });

    res.json(comments);
  } catch (error) {
    handleError(error, res);
  }
};

