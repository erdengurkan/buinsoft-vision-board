import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

// Removed ensureDefaultWorkflowStatuses - now creating per-project statuses

export const getProjects = async (req: Request, res: Response) => {
    try {
        const projects = await prisma.project.findMany({
            include: {
                tasks: {
                    include: {
                        worklogs: true,
                    },
                },
                labels: true,
            },
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};

export const getProjectById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                tasks: {
                    include: {
                        worklogs: true,
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
                labels: true,
            },
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        console.error('Get project by ID error:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
};

export const createProject = async (req: Request, res: Response) => {
    try {
        const { labels, tasks, ...projectData } = req.body;

        // Create project first
        const project = await prisma.project.create({
            data: {
                ...projectData,
                startDate: new Date(projectData.startDate),
                endDate: new Date(projectData.endDate),
                deadline: projectData.deadline ? new Date(projectData.deadline) : null,
                labels: {
                    create: labels?.map((l: any) => ({
                        name: l.name,
                        color: l.color,
                    })),
                },
            },
            include: {
                labels: true,
                tasks: true,
            },
        });

        // Create default task statuses for THIS specific project
        const defaultTaskStatuses = [
            { name: 'Todo', color: 'bg-gray-500', order: 0 },
            { name: 'In Progress', color: 'bg-yellow-500', order: 1 },
            { name: 'Done', color: 'bg-green-500', order: 2 },
        ];

        for (const status of defaultTaskStatuses) {
            // Check if already exists for this project
            const existing = await prisma.workflowStatus.findFirst({
                where: {
                    name: status.name,
                    type: 'task',
                    projectId: project.id,
                },
            });

            if (!existing) {
                await prisma.workflowStatus.create({
                    data: {
                        ...status,
                        type: 'task',
                        projectId: project.id,  // Link to THIS project
                    },
                });
            }
        }

        console.log(`✅ Created project "${project.title}" with task statuses`);
        res.json(project);
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
};

export const updateProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { tasks, labels, ...updates } = req.body;

        // Handle date conversions
        if (updates.startDate) updates.startDate = new Date(updates.startDate);
        if (updates.endDate) updates.endDate = new Date(updates.endDate);
        if (updates.deadline) updates.deadline = new Date(updates.deadline);

        // Build update data object
        const updateData: any = { ...updates };

        // Handle tasks if provided
        if (tasks && Array.isArray(tasks)) {
            updateData.tasks = {
                deleteMany: {}, // Clear existing tasks
                create: tasks.map((task: any) => ({
                    title: task.title,
                    description: task.description || '',
                    status: task.status || 'Todo',
                    assignee: task.assignee || '',
                    priority: task.priority || 'Medium',
                    deadline: task.deadline ? new Date(task.deadline) : undefined,
                })),
            };
        }

        const project = await prisma.project.update({
            where: { id },
            data: updateData,
            include: {
                labels: true,
                tasks: {
                    include: {
                        worklogs: true,
                    },
                },
            },
        });
        res.json(project);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
};

export const deleteProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.project.delete({
            where: { id },
        });
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
};
