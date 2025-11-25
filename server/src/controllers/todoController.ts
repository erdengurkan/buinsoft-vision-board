import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sseManager } from '../lib/sse';

const prisma = new PrismaClient();
const NO_PROJECT_SENTINEL = "__none__";

const fetchProjectMeta = async (projectId?: unknown): Promise<Record<string, unknown>> => {
    if (projectId === undefined) {
        return {};
    }

    if (projectId === null || projectId === '') {
        return { projectId: null, projectTitle: null };
    }

    if (projectId === NO_PROJECT_SENTINEL) {
        return { projectId: null, projectTitle: null };
    }

    if (typeof projectId !== 'string') {
        throw new Error('INVALID_PROJECT');
    }

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { title: true },
    });

    if (!project) {
        throw new Error('PROJECT_NOT_FOUND');
    }

    return { projectId, projectTitle: project.title };
};

const resolveProjectMetaOrRespond = async (
    projectId: unknown,
    res: Response
): Promise<Record<string, unknown> | null> => {
    try {
        return await fetchProjectMeta(projectId);
    } catch (error: any) {
        if (error?.message === 'PROJECT_NOT_FOUND') {
            res.status(400).json({ error: 'Invalid projectId' });
            return null;
        }
        if (error?.message === 'INVALID_PROJECT') {
            res.status(400).json({ error: 'projectId must be a string' });
            return null;
        }
        throw error;
    }
};

export const getTodos = async (req: Request, res: Response) => {
    try {
        const todos = await prisma.todo.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(todos);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch todos' });
    }
};

export const createTodo = async (req: Request, res: Response) => {
    try {
        const { projectId, ...rest } = req.body;
        const projectMeta = await resolveProjectMetaOrRespond(projectId, res);
        if (projectMeta === null) {
            return;
        }

        const todo = await prisma.todo.create({
            data: {
                ...rest,
                ...projectMeta,
                createdAt: new Date(),
            },
        });

        // Broadcast todo creation to all clients
        sseManager.broadcast({
            type: 'todo_created',
            todoId: todo.id,
            timestamp: new Date().toISOString(),
        });

        res.json(todo);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create todo' });
    }
};

export const updateTodo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { projectId, ...rest } = req.body;
        let projectMeta: Record<string, unknown> = {};

        if (Object.prototype.hasOwnProperty.call(req.body, 'projectId')) {
            const resolved = await resolveProjectMetaOrRespond(projectId, res);
            if (resolved === null) {
                return;
            }
            projectMeta = resolved;
        }

        const todo = await prisma.todo.update({
            where: { id },
            data: {
                ...rest,
                ...projectMeta,
            },
        });

        // Broadcast todo update to all clients
        sseManager.broadcast({
            type: 'todo_updated',
            todoId: todo.id,
            timestamp: new Date().toISOString(),
        });

        res.json(todo);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update todo' });
    }
};

export const deleteTodo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.todo.delete({
            where: { id },
        });

        // Broadcast todo deletion to all clients
        sseManager.broadcast({
            type: 'todo_deleted',
            todoId: id,
            timestamp: new Date().toISOString(),
        });

        res.json({ message: 'Todo deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete todo' });
    }
};
