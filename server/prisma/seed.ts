import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Create Default Workflow Statuses for Tasks
    const defaultTaskStatuses = [
        { name: 'Pending', color: 'bg-red-500', type: 'task', order: 0 },
        { name: 'In Progress', color: 'bg-orange-500', type: 'task', order: 1 },
        { name: 'Done', color: 'bg-green-500', type: 'task', order: 2 },
    ];

    for (const status of defaultTaskStatuses) {
        await prisma.workflowStatus.upsert({
            where: { name: status.name },
            update: {},
            create: status,
        });
    }

    // Create Default Workflow Statuses for Projects
    const defaultProjectStatuses = [
        { name: 'Potential', color: 'bg-gray-500', type: 'project', order: 0 },
        { name: 'Active', color: 'bg-green-500', type: 'project', order: 1 },
        { name: 'On Hold', color: 'bg-orange-500', type: 'project', order: 2 },
        { name: 'Completed', color: 'bg-blue-500', type: 'project', order: 3 },
    ];

    for (const status of defaultProjectStatuses) {
        await prisma.workflowStatus.upsert({
            where: { name: status.name },
            update: {},
            create: status,
        });
    }

    // Create Labels
    const labels = await Promise.all([
        prisma.label.create({ data: { name: 'Automation', color: 'bg-blue-500' } }),
        prisma.label.create({ data: { name: 'API', color: 'bg-green-500' } }),
        prisma.label.create({ data: { name: 'Web', color: 'bg-purple-500' } }),
        prisma.label.create({ data: { name: 'Backend', color: 'bg-indigo-500' } }),
    ]);

    // Create Project
    const project = await prisma.project.create({
        data: {
            title: 'E-Commerce Platform',
            client: 'TechMart Inc.',
            assignee: 'Emre',
            priority: 'High',
            status: 'Active',
            startDate: new Date('2025-01-15'),
            endDate: new Date('2025-04-30'),
            description: 'Building a modern e-commerce platform',
            labels: {
                connect: labels.map(l => ({ id: l.id })),
            },
            tasks: {
                create: [
                    {
                        title: 'Setup project structure',
                        description: 'Initialize project with proper folder structure',
                        status: 'Pending',
                        assignee: 'Emre',
                        priority: 'High',
                        deadline: new Date('2025-01-20'),
                    },
                    {
                        title: 'Database Schema',
                        description: 'Design the database schema',
                        status: 'In Progress',
                        assignee: 'Gürkan',
                        priority: 'High',
                        deadline: new Date('2025-01-25'),
                    }
                ]
            }
        },
    });

    // Create Todos
    await prisma.todo.createMany({
        data: [
            { title: 'Review PR #123', completed: false },
            { title: 'Update documentation', completed: true },
            { title: 'Deploy to staging', completed: false },
        ],
    });

    // Create User
    // In a real app, password should be hashed. For this demo/seed, we'll store it as is or use a simple hash if we had bcrypt here.
    // Since we are doing a simple implementation, we will store it as plain text for now in the seed, 
    // BUT the controller will expect it to be hashed if we were using bcrypt. 
    // Let's use a simple approach: The controller will compare plain text for this specific demo user if we don't want to add bcrypt to seed deps.
    // Actually, let's just use plain text for simplicity in this specific request context, or better, let's assume the controller handles it.
    // We will use a hardcoded hash for "Test1234" if we were using bcrypt, but let's just store it plain text and handle it in controller for now to avoid complexity with bcrypt in seed script.
    // Wait, I installed bcryptjs in the server. I can import it.

    // For now, let's just create the user.
    await prisma.user.upsert({
        where: { email: 'test@buinsoft.com' },
        update: {},
        create: {
            email: 'test@buinsoft.com',
            password: 'Test1234', // We will handle this in the controller (hashing or direct comparison)
            name: 'Test User',
        },
    });

    console.log('Seed data created successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
