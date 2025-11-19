import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import * as todoController from '../controllers/todoController';
import * as workflowController from '../controllers/workflowController';

const router = Router();

// Projects
router.get('/projects', projectController.getProjects);
router.post('/projects', projectController.createProject);
router.patch('/projects/:id', projectController.updateProject);
router.delete('/projects/:id', projectController.deleteProject);

// Todos
router.get('/todos', todoController.getTodos);
router.post('/todos', todoController.createTodo);
router.patch('/todos/:id', todoController.updateTodo);
router.delete('/todos/:id', todoController.deleteTodo);

// Workflow
router.get('/workflow', workflowController.getWorkflow);

export default router;
