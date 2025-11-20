import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sseManager } from '../lib/sse';

const prisma = new PrismaClient();

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
        const todo = await prisma.todo.create({
            data: {
                ...req.body,
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
        const todo = await prisma.todo.update({
            where: { id },
            data: req.body,
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
