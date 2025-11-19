import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
// Additional CRUD operations would go here
