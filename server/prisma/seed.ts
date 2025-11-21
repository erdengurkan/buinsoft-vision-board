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
    const labelsData = [
        { name: 'Automation', color: 'bg-blue-500' },
        { name: 'API', color: 'bg-green-500' },
        { name: 'Web', color: 'bg-purple-500' },
        { name: 'Backend', color: 'bg-indigo-500' },
    ];

    const labels = [];
    for (const l of labelsData) {
        const label = await prisma.label.create({
            data: l,
        });
        labels.push(label);
    }

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

    // Create More Demo Projects
    const projectsData = [
        { title: 'CRM Integration', client: 'SalesForce', status: 'Pending', priority: 'High', color: 'bg-blue-500' },
        { title: 'Website Redesign', client: 'Creative Agency', status: 'In Progress', priority: 'Medium', color: 'bg-purple-500' },
        { title: 'Mobile App V2', client: 'TechCorp', status: 'In Progress', priority: 'Critical', color: 'bg-green-500' },
        { title: 'Data Migration', client: 'BigData Co', status: 'Done', priority: 'High', color: 'bg-orange-500' },
        { title: 'Security Audit', client: 'SecureNet', status: 'Pending', priority: 'Critical', color: 'bg-red-500' },
        { title: 'Cloud Infrastructure', client: 'CloudSystems', status: 'In Progress', priority: 'High', color: 'bg-indigo-500' },
        { title: 'AI Chatbot', client: 'FutureTech', status: 'Pending', priority: 'Medium', color: 'bg-pink-500' },
        { title: 'Payment Gateway', client: 'FinTech Ltd', status: 'Done', priority: 'High', color: 'bg-yellow-500' },
        { title: 'User Dashboard', client: 'SaaS Inc', status: 'In Progress', priority: 'Medium', color: 'bg-teal-500' },
        { title: 'API Documentation', client: 'DevTools', status: 'Pending', priority: 'Low', color: 'bg-gray-500' },
    ];

    for (const p of projectsData) {
        const project = await prisma.project.create({
            data: {
                title: p.title,
                client: p.client,
                assignee: 'Emre, Gurkan',
                startDate: new Date(),
                endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                deadline: new Date(new Date().setDate(new Date().getDate() + 15)),
                priority: p.priority,
                status: p.status,
                description: `Description for ${p.title}`,
                labels: {
                    connect: [{ id: labels[Math.floor(Math.random() * labels.length)].id }],
                },
            },
        });

        // Add random tasks
        await prisma.task.create({
            data: {
                title: `Initial Setup for ${p.title}`,
                description: 'Setup repository and basic structure',
                status: 'Done',
                priority: 'High',
                projectId: project.id,
                assignee: 'Emre',
                order: 0,
            },
        });

        await prisma.task.create({
            data: {
                title: `Development Phase 1`,
                description: 'Core features implementation',
                status: 'In Progress',
                priority: 'High',
                projectId: project.id,
                assignee: 'Gurkan',
                order: 1,
            },
        });

        await prisma.task.create({
            data: {
                title: `Testing & QA`,
                description: 'Unit tests and integration testing',
                status: 'Pending',
                priority: 'Medium',
                projectId: project.id,
                assignee: 'Emre',
                order: 2,
            },
        });
    }

    console.log('✅ Additional projects and tasks created');

    // Create some activity logs
    await prisma.activityLog.create({
        data: {
            actionType: 'project_created',
            user: 'Admin',
            description: 'Project created',
            projectId: project1.id,
            metadata: {
                entityType: 'project',
                entityId: project1.id,
            }
        },
    });

    await prisma.activityLog.create({
        data: {
            actionType: 'task_status_changed',
            user: 'Emre',
            description: 'Task status changed to In Progress',
            projectId: project1.id,
            metadata: {
                entityType: 'task',
                entityId: tasks1[2].id,
                newStatus: 'In Progress'
            }
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
