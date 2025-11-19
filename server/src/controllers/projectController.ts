import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export const createProject = async (req: Request, res: Response) => {
    try {
        const { labels, tasks, ...projectData } = req.body;

        // Handle labels connection/creation logic if needed, for now assuming simple creation
        // This is a simplified version. In a real app, you'd likely connect existing labels.

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
        res.json(project);
    } catch (error) {
        console.error(error);
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

        const project = await prisma.project.update({
            where: { id },
            data: updates,
            include: {
                labels: true,
                tasks: true,
            },
        });
        res.json(project);
    } catch (error) {
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
