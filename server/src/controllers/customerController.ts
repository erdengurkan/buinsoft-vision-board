import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { handleError } from '../lib/errors';

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    
    res.json(customers);
  } catch (error) {
    handleError(error, res);
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    handleError(error, res);
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { name, company, email, phone } = req.body;

    const customer = await prisma.customer.create({
      data: {
        name,
        company: company || null,
        email: email || null,
        phone: phone || null,
      },
    });

    res.status(201).json(customer);
  } catch (error) {
    handleError(error, res);
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, company, email, phone } = req.body;

    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (company !== undefined) updateData.company = company || null;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    res.json(customer);
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await prisma.customer.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
};

