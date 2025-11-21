import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Create Users
    const hashedPassword = await bcrypt.hash('123123', 10);

    const user1 = await prisma.user.upsert({
        where: { email: 'gurkan@buinsoft.com' },
        update: {},
        create: {
            email: 'gurkan@buinsoft.com',
            name: 'Gurkan',
            password: hashedPassword,
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'emre@buinsoft.com' },
        update: {},
        create: {
            email: 'emre@buinsoft.com',
            name: 'Emre',
            password: hashedPassword,
        },
    });

    const user3 = await prisma.user.upsert({
        where: { email: 'omer@buinsoft.com' },
        update: {},
        create: {
            email: 'omer@buinsoft.com',
            name: 'Omer',
            password: hashedPassword,
        },
    });

    const user4 = await prisma.user.upsert({
        where: { email: 'dev@buinsoft.com' },
        update: {},
        create: {
            email: 'dev@buinsoft.com',
            name: 'Dev User',
            password: hashedPassword,
        },
    });

    console.log('✅ Users created:', {
        user1: user1.email,
        user2: user2.email,
        user3: user3.email,
        user4: user4.email
    });

    // Create Default Workflow Statuses for Tasks
    const defaultTaskStatuses = [
        { name: 'Todo', color: 'bg-gray-500', type: 'task', order: 0 },
        { name: 'In Progress', color: 'bg-yellow-500', type: 'task', order: 1 },
        { name: 'Done', color: 'bg-green-500', type: 'task', order: 2 },
    ];

    for (const status of defaultTaskStatuses) {
        const existing = await prisma.workflowStatus.findFirst({
            where: {
                name: status.name,
                type: status.type,
            },
        });

        if (!existing) {
            await prisma.workflowStatus.create({
                data: status,
            });
        }
    }

    // Create Default Workflow Statuses for Projects
    const defaultProjectStatuses = [
        { name: 'Pending', color: 'bg-red-500', type: 'project', order: 0 },
        { name: 'In Progress', color: 'bg-orange-500', type: 'project', order: 1 },
        { name: 'Done', color: 'bg-green-500', type: 'project', order: 2 },
    ];

    for (const status of defaultProjectStatuses) {
        const existing = await prisma.workflowStatus.findFirst({
            where: {
                name: status.name,
                type: status.type,
            },
        });

        if (!existing) {
            await prisma.workflowStatus.create({
                data: status,
            });
        }
    }

    console.log('✅ Workflow statuses created');

    // Create Labels
    const labels = await Promise.all([
        prisma.label.upsert({
            where: { name: 'Automation' },
            update: {},
            create: { name: 'Automation', color: 'bg-blue-500' },
        }),
        prisma.label.upsert({
            where: { name: 'API' },
            update: {},
            create: { name: 'API', color: 'bg-green-500' },
        }),
        prisma.label.upsert({
            where: { name: 'Web' },
            update: {},
            create: { name: 'Web', color: 'bg-purple-500' },
        }),
        prisma.label.upsert({
            where: { name: 'Backend' },
            update: {},
            create: { name: 'Backend', color: 'bg-indigo-500' },
        }),
    ]);

    console.log('✅ Labels created');

    // Create Demo Projects
    const project1 = await prisma.project.create({
        data: {
            title: 'Buinsoft Vision Board',
            client: 'Buinsoft',
            assignee: 'Test User, Emre, Gerden',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            deadline: new Date('2024-06-30'),
            priority: 'High',
            status: 'In Progress',
            description: 'Modern project management platform with Kanban boards, analytics, and team collaboration features.',
            labels: {
                connect: labels.slice(0, 3).map(l => ({ id: l.id })),
            },
        },
    });

    const project2 = await prisma.project.create({
        data: {
            title: 'Mobile App Development',
            client: 'TechStart Inc.',
            assignee: 'Emre',
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-08-31'),
            deadline: new Date('2024-07-15'),
            priority: 'High',
            status: 'In Progress',
            description: 'Cross-platform mobile application for iOS and Android with real-time features.',
            labels: {
                connect: [{ id: labels[0].id }, { id: labels[3].id }],
            },
        },
    });

    const project3 = await prisma.project.create({
        data: {
            title: 'E-Commerce Platform',
            client: 'ShopMaster',
            assignee: 'Gerden',
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-10-31'),
            deadline: new Date('2024-09-30'),
            priority: 'Medium',
            status: 'Pending',
            description: 'Full-featured e-commerce platform with payment integration and inventory management.',
            labels: {
                connect: [{ id: labels[2].id }, { id: labels[3].id }],
            },
        },
    });

    console.log('✅ Projects created');

    // Create Tasks for Project 1
    const tasks1 = await Promise.all([
        prisma.task.create({
            data: {
                title: 'Setup project structure',
                description: 'Initialize React, TypeScript, and Tailwind CSS',
                status: 'Done',
                priority: 'High',
                projectId: project1.id,
                assignee: 'Admin',
                order: 0,
            },
        }),
        prisma.task.create({
            data: {
                title: 'Implement authentication',
                description: 'User login and registration with JWT',
                status: 'Done',
                priority: 'High',
                projectId: project1.id,
                assignee: 'Emre',
                order: 1,
            },
        }),
        prisma.task.create({
            data: {
                title: 'Design Kanban board',
                description: 'Drag-and-drop task management interface',
                status: 'In Progress',
                priority: 'High',
                projectId: project1.id,
                assignee: 'Admin',
                order: 2,
            },
        }),
        prisma.task.create({
            data: {
                title: 'Add undo/redo functionality',
                description: 'Implement Ctrl+Z and Ctrl+Y for all actions',
                status: 'In Progress',
                priority: 'Medium',
                projectId: project1.id,
                assignee: 'Gerden',
                order: 3,
            },
        }),
        prisma.task.create({
            data: {
                title: 'Create analytics dashboard',
                description: 'Visualize project metrics and time tracking',
                status: 'Todo',
                priority: 'Medium',
                projectId: project1.id,
                assignee: 'Emre',
                order: 4,
            },
        }),
        prisma.task.create({
            data: {
                title: 'Deploy to production',
                description: 'Setup Docker and deploy to server',
                status: 'Todo',
                priority: 'Low',
                projectId: project1.id,
                assignee: 'Admin',
                order: 5,
            },
        }),
    ]);

    // Create Tasks for Project 2
    const tasks2 = await Promise.all([
        prisma.task.create({
            data: {
                title: 'Design UI mockups',
                description: 'Create high-fidelity designs in Figma',
                status: 'Done',
                priority: 'High',
                projectId: project2.id,
                assignee: 'Emre',
                order: 0,
            },
        }),
        prisma.task.create({
            data: {
                title: 'Setup React Native project',
                description: 'Initialize Expo with TypeScript',
                status: 'In Progress',
                priority: 'High',
                projectId: project2.id,
                assignee: 'Emre',
                order: 1,
            },
        }),
        prisma.task.create({
            data: {
                title: 'Implement push notifications',
                description: 'Firebase Cloud Messaging integration',
                status: 'Todo',
                priority: 'Medium',
                projectId: project2.id,
                assignee: 'Emre',
                order: 2,
            },
        }),
    ]);

    // Create Tasks for Project 3
    const tasks3 = await Promise.all([
        prisma.task.create({
            data: {
                title: 'Setup database schema',
                description: 'Design PostgreSQL tables for products and orders',
                status: 'Todo',
                priority: 'High',
                projectId: project3.id,
                assignee: 'Gerden',
                order: 0,
            },
        }),
        prisma.task.create({
            data: {
                title: 'Integrate payment gateway',
                description: 'Add Stripe payment processing',
                status: 'Todo',
                priority: 'High',
                projectId: project3.id,
                assignee: 'Gerden',
                order: 1,
            },
        }),
    ]);

    console.log('✅ Tasks created');

    // Create some activity logs
    await prisma.activityLog.create({
        data: {
            action: 'created',
            entityType: 'project',
            entityId: project1.id,
            description: 'Project created',
            projectId: project1.id,
        },
    });

    await prisma.activityLog.create({
        data: {
            action: 'updated',
            entityType: 'task',
            entityId: tasks1[2].id,
            description: 'Task status changed to In Progress',
            projectId: project1.id,
        },
    });

    console.log('✅ Activity logs created');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📧 Login credentials:');
    console.log('   Email: test@buinsoft.com | Password: 123456');
    console.log('   Email: emre.alemdar@buinsoft.com | Password: 123456');
    console.log('   Email: gerden@buinsoft.com | Password: 123456');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
