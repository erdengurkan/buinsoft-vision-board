import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const createStatusSchema = z.object({
    name: z.string().min(1),
    color: z.string(),
    type: z.enum(['project', 'task']),
    order: z.number().optional(),
    projectId: z.string().optional(),  // NEW: Optional projectId for project-specific statuses
});

const updateStatusSchema = z.object({
    name: z.string().min(1).optional(),
    color: z.string().optional(),
    order: z.number().optional(),
});

// Helper function to ensure default workflow statuses exist
async function ensureDefaultWorkflowStatuses() {
    // Default Workflow Statuses for Tasks
    const defaultTaskStatuses = [
        { name: 'Todo', color: 'bg-gray-500', type: 'task', order: 0 },
        { name: 'In Progress', color: 'bg-yellow-500', type: 'task', order: 1 },
        { name: 'Done', color: 'bg-green-500', type: 'task', order: 2 },
    ];

    // Default Workflow Statuses for Projects
    const defaultProjectStatuses = [
        { name: 'Pending', color: 'bg-red-500', type: 'project', order: 0 },
        { name: 'In Progress', color: 'bg-orange-500', type: 'project', order: 1 },
        { name: 'Done', color: 'bg-green-500', type: 'project', order: 2 },
    ];

    // Check and create GLOBAL task statuses (projectId: null)
    for (const status of defaultTaskStatuses) {
        const existing = await prisma.workflowStatus.findFirst({
            where: {
                name: status.name,
                type: status.type,
                projectId: null,  // GLOBAL statuses
            },
        });

        if (!existing) {
            await prisma.workflowStatus.create({
                data: {
                    ...status,
                    projectId: null,  // Explicitly set to null for global
                },
            });
        }
    }

    // Check and create GLOBAL project statuses (projectId: null)
    for (const status of defaultProjectStatuses) {
        const existing = await prisma.workflowStatus.findFirst({
            where: {
                name: status.name,
                type: status.type,
                projectId: null,  // GLOBAL statuses
            },
        });

        if (!existing) {
            await prisma.workflowStatus.create({
                data: {
                    ...status,
                    projectId: null,  // Explicitly set to null for global
                },
            });
        }
    }
}

export const getWorkflow = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.query;

        // FIRST: Ensure default GLOBAL statuses exist
        await ensureDefaultWorkflowStatuses();

        // Filter statuses by projectId if provided, otherwise return ONLY global statuses (projectId: null)
        const whereClause = projectId && typeof projectId === 'string'
            ? { projectId: projectId }
            : { projectId: null };

        const [statuses, labels] = await Promise.all([
            prisma.workflowStatus.findMany({
                where: whereClause,
                orderBy: { order: 'asc' }
            }),
            prisma.workflowLabel.findMany(),
        ]);

        res.json({ statuses, labels });
    } catch (error) {
        console.error('Error fetching workflow:', error);
        res.status(500).json({ error: 'Failed to fetch workflow data' });
    }
};

export const createStatus = async (req: Request, res: Response) => {
    try {
        const data = createStatusSchema.parse(req.body);

        // If order not provided, add to end (within the same project if projectId specified)
        if (data.order === undefined) {
            const whereClause: any = { type: data.type };
            if (data.projectId) {
                whereClause.projectId = data.projectId;
            }

            const maxOrder = await prisma.workflowStatus.findFirst({
                where: whereClause,
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
                projectId: data.projectId || null,  // Set projectId or null
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
        const whereClause: any = { status: status.name };
        if (status.projectId) {
            whereClause.projectId = status.projectId;
        }

        const tasksWithStatus = await prisma.task.findFirst({
            where: whereClause,
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
