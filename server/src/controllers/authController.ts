import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // In a real app, we would compare hashed passwords here using bcrypt
        // const isValid = await bcrypt.compare(password, user.password);
        // For this demo/seed user, we are doing a direct comparison as requested for simplicity
        // or assuming the seed data is plain text.

        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Return user info (excluding password)
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
