import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import * as bcrypt from 'bcryptjs';
import { generateToken } from '../lib/jwt';

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

        // Compare hashed password with provided password
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const userRole = user.userRole || 'User';
        const organizationId = null; // Phase 1: organizationId is null, will be set in Phase 2
        const token = generateToken(user.id, user.email, userRole, organizationId);

        // Return user info (excluding password) and token
        const { password: _, ...userWithoutPassword } = user;
        res.json({ 
          user: {
            ...userWithoutPassword,
            userRole: userRole,
          },
          token: token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
