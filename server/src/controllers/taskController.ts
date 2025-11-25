import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { handleError, AppError } from '../lib/errors';
import { createTaskSchema, updateTaskSchema, reorderTasksSchema } from '../lib/validation';
import { sseManager } from '../lib/sse';

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    
    if (!projectId || typeof projectId !== 'string') {
      throw new AppError(400, 'projectId query parameter is required');
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        worklogs: true,
        linkedProject: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });
    
    res.json(tasks);
  } catch (error) {
    handleError(error, res);
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        worklogs: true,
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        linkedProject: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!task) {
      throw new AppError(404, 'Task not found');
    }

    res.json(task);
  } catch (error) {
    handleError(error, res);
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    // Validation is handled by middleware, but we can double-check
    const validatedData = createTaskSchema.parse(req.body);
    const { projectId, ...taskData } = validatedData;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    // Get max order for this project's tasks
    const maxOrderTask = await prisma.task.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
    });

    // Handle date conversion
    const deadlineDate = taskData.deadline 
      ? (taskData.deadline instanceof Date ? taskData.deadline : new Date(taskData.deadline))
      : null;

    const task = await prisma.task.create({
      data: {
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status || 'Todo',
        assignee: taskData.assignee || '',
        priority: taskData.priority || 'Medium',
        projectId,
        order: maxOrderTask ? maxOrderTask.order + 1 : 0,
        deadline: deadlineDate,
        followUp: taskData.followUp || false,
        hardness: taskData.hardness ?? null,
        benefit: taskData.benefit ?? null,
      },
      include: {
        worklogs: true,
        linkedProject: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // If task has an assignee, create a Todo automatically
    if (task.assignee && task.assignee.trim() !== '') {
      try {
        // Check if Todo already exists for this task
        const existingTodo = await prisma.todo.findFirst({
          where: { taskId: task.id },
        });

        if (!existingTodo) {
          await prisma.todo.create({
            data: {
              title: task.title,
              completed: false,
              deadline: deadlineDate,
              taskId: task.id,
              taskTitle: task.title,
              order: 0,
              mentions: [],
            },
          });
          console.log(`✅ Created Todo for task ${task.id} with assignee ${task.assignee}`);
        }
      } catch (error) {
        console.error(`❌ Error creating Todo for task ${task.id}:`, error);
      }
    } else {
      console.log(`⚠️ Task ${task.id} has no assignee, skipping Todo creation`);
    }

    // Broadcast update to all connected clients
    sseManager.broadcastProjectUpdate(projectId);

    res.status(201).json(task);
  } catch (error) {
    handleError(error, res);
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Validation is handled by middleware
    const updates = updateTaskSchema.parse(req.body);

    // Build update data object - only include fields that are actually provided
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.assignee !== undefined) updateData.assignee = updates.assignee;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.order !== undefined) updateData.order = updates.order;
    if (updates.followUp !== undefined) updateData.followUp = updates.followUp;
    if (updates.flowDiagram !== undefined) updateData.flowDiagram = updates.flowDiagram;
    if (updates.hardness !== undefined) updateData.hardness = updates.hardness ?? null;
    if (updates.benefit !== undefined) updateData.benefit = updates.benefit ?? null;
    if (updates.linkedProjectId !== undefined) {
      if (updates.linkedProjectId) {
        const linkedProject = await prisma.project.findUnique({
          where: { id: updates.linkedProjectId },
        });
        if (!linkedProject) {
          throw new AppError(404, 'Linked project not found');
        }
        updateData.linkedProjectId = updates.linkedProjectId;
      } else {
        updateData.linkedProjectId = null;
      }
    }
    
    // Handle date conversions
    if (updates.deadline !== undefined) {
      updateData.deadline = updates.deadline 
        ? (updates.deadline instanceof Date ? updates.deadline : new Date(updates.deadline))
        : null;
    }

    // Get task before update to check assignee changes
    const oldTask = await prisma.task.findUnique({
      where: { id },
      select: { assignee: true, title: true },
    });

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        worklogs: true,
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        linkedProject: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Handle Todo creation/update when assignee is set or changed
    if (task.assignee && task.assignee.trim() !== '') {
      // Check if Todo already exists for this task
      const existingTodo = await prisma.todo.findFirst({
        where: { taskId: task.id },
      });

      const deadlineDate = task.deadline 
        ? (task.deadline instanceof Date ? task.deadline : new Date(task.deadline))
        : null;

      if (existingTodo) {
        // Update existing Todo
        await prisma.todo.update({
          where: { id: existingTodo.id },
          data: {
            title: task.title,
            deadline: deadlineDate,
            taskTitle: task.title,
          },
        });
      } else {
        // Create new Todo
        await prisma.todo.create({
          data: {
            title: task.title,
            completed: false,
            deadline: deadlineDate,
            taskId: task.id,
            taskTitle: task.title,
            order: 0,
            mentions: [],
          },
        });
      }
    } else if (oldTask?.assignee && (!task.assignee || task.assignee.trim() === '')) {
      // If assignee was removed, delete the associated Todo
      const todoToDelete = await prisma.todo.findFirst({
        where: { taskId: task.id },
      });
      if (todoToDelete) {
        await prisma.todo.delete({
          where: { id: todoToDelete.id },
        });
      }
    }

    // Broadcast update to all connected clients
    if (task.project?.id) {
      sseManager.broadcastProjectUpdate(task.project.id);
    }

    res.json(task);
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get task first to get projectId for broadcast
    const task = await prisma.task.findUnique({
      where: { id },
      select: { projectId: true },
    });

    await prisma.task.delete({
      where: { id },
    });

    // Broadcast update to all connected clients
    if (task?.projectId) {
      sseManager.broadcastProjectUpdate(task.projectId);
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    handleError(error, res);
  }
};

export const reorderTasks = async (req: Request, res: Response) => {
  try {
    // Validation is handled by middleware
    const { projectId, taskOrders } = reorderTasksSchema.parse(req.body);

    // Update all tasks in a transaction
    // CRITICAL: Only update order field, preserve all other fields (especially status)
    await prisma.$transaction(
      taskOrders.map(({ id, order }: { id: string; order: number }) =>
        prisma.task.update({
          where: { id },
          data: { order }, // Only update order, status and other fields are preserved automatically
        })
      )
    );

    // Broadcast update to all connected clients
    sseManager.broadcastProjectUpdate(projectId);

    res.json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    handleError(error, res);
  }
};

