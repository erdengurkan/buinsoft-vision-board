import { z } from 'zod';

// Project schemas
export const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  client: z.string().min(1, 'Client is required').max(100),
  assignee: z.string().max(100).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  status: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  deadline: z.string().or(z.date()).nullable().optional(),
  followUp: z.boolean().optional(),
  description: z.string().optional(),
  order: z.number().int().optional(),
  hardness: z.number().int().min(1).max(5).nullable().optional(),
  benefit: z.number().int().min(1).max(5).nullable().optional(),
  labels: z.array(z.object({
    name: z.string(),
    color: z.string(),
  })).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// Task schemas
export const createTaskSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().default(''),
  status: z.string().optional().default('Todo'),
  assignee: z.string().max(100).optional().default(''),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional().default('Medium'),
  deadline: z.union([z.string(), z.date()]).nullable().optional(),
  followUp: z.boolean().optional().default(false),
  order: z.number().int().optional(),
  hardness: z.number().int().min(1).max(5).nullable().optional(),
  benefit: z.number().int().min(1).max(5).nullable().optional(),
});

export const updateTaskSchema = createTaskSchema
  .omit({ projectId: true })
  .partial()
  .extend({
    flowDiagram: z.any().optional(), // Allow flowDiagram JSON object
    // CRITICAL: Remove default values for optional fields to prevent unintended resets
    status: z.string().optional(), // No default - preserve existing status if not provided
    assignee: z.string().max(100).optional(), // No default
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(), // No default
    description: z.string().optional(), // No default
    followUp: z.boolean().optional(), // No default
  });

export const reorderTasksSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  taskOrders: z.array(z.object({
    id: z.string().uuid('Invalid task ID'),
    order: z.number().int(),
  })),
});

// Todo schemas
export const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  completed: z.boolean().optional(),
  deadline: z.string().or(z.date()).nullable().optional(),
  order: z.number().int().optional(),
  mentions: z.array(z.string()).optional(),
});

export const updateTodoSchema = createTodoSchema.partial();

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// User schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.string().max(100).optional().nullable(),
  userRole: z.enum(['Admin', 'User']).default('User'),
  avatar: z.string().url('Invalid avatar URL').optional().nullable().or(z.literal('')),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(1, 'Name is required').max(100).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.string().max(100).optional().nullable(),
  userRole: z.enum(['Admin', 'User']).optional().nullable(),
  avatar: z.string().url('Invalid avatar URL').optional().nullable().or(z.literal('')),
});

// Customer schemas
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  company: z.string().max(100).optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  phone: z.string().max(20).optional().nullable(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  company: z.string().max(100).optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  phone: z.string().max(20).optional().nullable(),
});

