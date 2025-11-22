import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

// Removed ensureDefaultWorkflowStatuses - now creating per-project statuses

export const getProjects = async (req: Request, res: Response) => {
    try {
        const userName = req.query.userName as string | undefined;
        
        // Get all projects first
        const allProjects = await prisma.project.findMany({
            include: {
                tasks: {
                    include: {
                        worklogs: true,
                    },
                },
                labels: true,
            },
        });

        // Filter projects based on sharing settings
        let filteredProjects = allProjects;
        
        if (userName) {
            filteredProjects = allProjects.filter((project) => {
                // If sharedWithAll is true, everyone can see it
                if (project.sharedWithAll === true) {
                    return true;
                }
                
                // If sharedWithAll is false and sharedWith is empty, everyone can see it (default)
                if (project.sharedWithAll === false && (!project.sharedWith || project.sharedWith.length === 0)) {
                    return true;
                }
                
                // If sharedWithAll is false and sharedWith has users, only those users can see it
                if (project.sharedWithAll === false && project.sharedWith && project.sharedWith.length > 0) {
                    return project.sharedWith.includes(userName);
                }
                
                // Default: show if sharedWithAll is true or sharedWith is empty
                return true;
            });
        }
        
        res.json(filteredProjects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
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
                hardness: projectData.hardness ?? null,
                benefit: projectData.benefit ?? null,
                sharedWithAll: projectData.sharedWithAll !== undefined ? projectData.sharedWithAll : true,
                sharedWith: projectData.sharedWith || [],
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
        
        // Handle hardness and benefit (allow null values)
        if ('hardness' in updates) updateData.hardness = updates.hardness ?? null;
        if ('benefit' in updates) updateData.benefit = updates.benefit ?? null;
        
        // Handle sharing fields
        if ('sharedWithAll' in updates) updateData.sharedWithAll = updates.sharedWithAll;
        if ('sharedWith' in updates) updateData.sharedWith = updates.sharedWith || [];

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
