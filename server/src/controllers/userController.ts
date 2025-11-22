import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { handleError } from '../lib/errors';
import * as bcrypt from 'bcryptjs';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        userRole: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    res.json(users);
  } catch (error) {
    handleError(error, res);
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, name, password, role, userRole, avatar } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || null,
        userRole: userRole || 'User',
        avatar: avatar || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        userRole: true,
        avatar: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    handleError(error, res);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, name, password, role, userRole, avatar } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If email is being updated, check if new email already exists
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (password !== undefined) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (role !== undefined) updateData.role = role || null;
    if (userRole !== undefined) updateData.userRole = userRole || null;
    if (avatar !== undefined) updateData.avatar = avatar || null;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        userRole: true,
        avatar: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
};

