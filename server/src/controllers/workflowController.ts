import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const createStatusSchema = z.object({
    name: z.string().min(1),
    color: z.string(),
    type: z.enum(['project', 'task']),
    order: z.number().optional(),
});

const updateStatusSchema = z.object({
    name: z.string().min(1).optional(),
    color: z.string().optional(),
    order: z.number().optional(),
});

export const getWorkflow = async (req: Request, res: Response) => {
    try {
        const [statuses, labels] = await Promise.all([
            prisma.workflowStatus.findMany({ orderBy: { order: 'asc' } }),
            prisma.workflowLabel.findMany(),
        ]);
        res.json({ statuses, labels });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch workflow data' });
    }
};

export const createStatus = async (req: Request, res: Response) => {
    try {
        const data = createStatusSchema.parse(req.body);
        
        // If order not provided, add to end
        if (data.order === undefined) {
            const maxOrder = await prisma.workflowStatus.findFirst({
                where: { type: data.type },
                orderBy: { order: 'desc' },
                select: { order: true },
            });
            data.order = (maxOrder?.order ?? -1) + 1;
        }

        const status = await prisma.workflowStatus.create({
            data: {
                name: data.name,
                color: data.color,
                type: data.type,
                order: data.order,
            },
        });

        res.json(status);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.issues });
        } else {
            res.status(500).json({ error: 'Failed to create status' });
        }
    }
};

export const updateStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = updateStatusSchema.parse(req.body);

        const status = await prisma.workflowStatus.update({
            where: { id },
            data,
        });

        res.json(status);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.issues });
        } else {
            res.status(500).json({ error: 'Failed to update status' });
        }
    }
};

export const deleteStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if status is used by any tasks
        const status = await prisma.workflowStatus.findUnique({
            where: { id },
        });

        if (!status) {
            return res.status(404).json({ error: 'Status not found' });
        }

        // Check if any tasks use this status
        const tasksWithStatus = await prisma.task.findFirst({
            where: { status: status.name },
        });

        if (tasksWithStatus) {
            return res.status(400).json({ error: 'Cannot delete status that is in use by tasks' });
        }

        await prisma.workflowStatus.delete({
            where: { id },
        });

        res.json({ message: 'Status deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete status' });
    }
};
// Additional CRUD operations would go here
