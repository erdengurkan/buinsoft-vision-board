import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import path from 'path';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

import routes from './routes';
import sseRoutes from './routes/sseRoutes';

// SSE routes (must be before static files)
app.use('/api', sseRoutes);

// API routes
app.use('/api', routes);

// Serve static files from the public directory (frontend build)
app.use(express.static(path.join(__dirname, '../public')));

// Handle React routing, return all requests to React app
app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
