import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import * as todoController from '../controllers/todoController';
import * as workflowController from '../controllers/workflowController';
import * as authController from '../controllers/authController';
import * as timerController from '../controllers/timerController';
import * as taskController from '../controllers/taskController';
import * as commentController from '../controllers/commentController';
import * as activityLogController from '../controllers/activityLogController';
import * as worklogController from '../controllers/worklogController';
import { validate } from '../middleware/validation';
import { createTaskSchema, updateTaskSchema, reorderTasksSchema } from '../lib/validation';

const router = Router();

// Auth
router.post('/login', authController.login);

// Projects
router.get('/projects', projectController.getProjects);
router.get('/projects/:id', projectController.getProjectById);
router.post('/projects', projectController.createProject);
router.patch('/projects/:id', projectController.updateProject);
router.delete('/projects/:id', projectController.deleteProject);

// Tasks
router.get('/tasks', taskController.getTasks);
router.get('/tasks/:id', taskController.getTaskById);
router.post('/tasks', validate(createTaskSchema), taskController.createTask);
router.patch('/tasks/:id', validate(updateTaskSchema), taskController.updateTask);
router.delete('/tasks/:id', taskController.deleteTask);
router.post('/tasks/reorder', validate(reorderTasksSchema), taskController.reorderTasks);

// Todos
router.get('/todos', todoController.getTodos);
router.post('/todos', todoController.createTodo);
router.patch('/todos/:id', todoController.updateTodo);
router.delete('/todos/:id', todoController.deleteTodo);

// Workflow
router.get('/workflow', workflowController.getWorkflow);
router.post('/workflow/status', workflowController.createStatus);
router.patch('/workflow/status/:id', workflowController.updateStatus);
router.delete('/workflow/status/:id', workflowController.deleteStatus);

// Debug: Test workflow status endpoint
router.get('/workflow/test', (req: any, res: any) => {
  res.json({ message: 'Workflow routes are loaded', timestamp: new Date().toISOString() });
});

// Timers
router.post('/timers/start', timerController.startTimer);
router.post('/timers/stop', timerController.stopTimer);
router.get('/timers/active', timerController.getActiveTimers);

// Comments
router.get('/comments', commentController.getProjectComments);
router.get('/comments/task', commentController.getTaskComments);
router.post('/comments', commentController.createComment);
router.delete('/comments/:id', commentController.deleteComment);

// Activity Logs
router.get('/activity-logs', activityLogController.getProjectActivityLogs);
router.post('/activity-logs', activityLogController.createActivityLog);

// Worklogs
router.post('/worklogs', worklogController.createWorklog);
router.delete('/worklogs/:id', worklogController.deleteWorklog);

export default router;
