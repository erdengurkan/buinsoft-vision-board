const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    // Hash password for users
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Create Users
    await prisma.user.upsert({
        where: { email: 'test@buinsoft.com' },
        update: {},
        create: {
            email: 'test@buinsoft.com',
            password: hashedPassword,
            name: 'Test User',
        },
    });

    await prisma.user.upsert({
        where: { email: 'emre.alemdar@buinsoft.com' },
        update: {},
        create: {
            email: 'emre.alemdar@buinsoft.com',
            password: hashedPassword,
            name: 'Emre Alemdar',
        },
    });

    await prisma.user.upsert({
        where: { email: 'gerden@buinsoft.com' },
        update: {},
        create: {
            email: 'gerden@buinsoft.com',
            password: hashedPassword,
            name: 'Gerden',
        },
    });

    // Create Labels
    const labelData = [
        { name: 'Automation', color: 'bg-blue-500' },
        { name: 'API', color: 'bg-green-500' },
        { name: 'Web', color: 'bg-purple-500' },
        { name: 'Backend', color: 'bg-indigo-500' },
    ];

    const labels = [];
    for (const l of labelData) {
        const existing = await prisma.label.findFirst({
            where: { name: l.name },
        });
        if (!existing) {
            const label = await prisma.label.create({ data: l });
            labels.push(label);
        } else {
            labels.push(existing);
        }
    }

    console.log('✅ Labels created');

    // Create Demo Projects with Tasks
    const projectsData = [
        {
            title: 'Buinsoft Vision Board',
            client: 'Buinsoft',
            assignee: 'Test User, Emre, Gerden',
            priority: 'High',
            status: 'In Progress',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            deadline: new Date('2024-06-30'),
            description: 'Modern project management platform with Kanban boards, analytics, and team collaboration features.',
            labelIndices: [0, 1, 2],
            tasks: [
                { title: 'Setup project structure', description: 'Initialize React, TypeScript, and Tailwind CSS', status: 'Done', assignee: 'Test User', priority: 'High', order: 0 },
                { title: 'Implement authentication', description: 'User login and registration with bcrypt', status: 'Done', assignee: 'Emre', priority: 'High', order: 1 },
                { title: 'Design Kanban board', description: 'Drag-and-drop task management interface', status: 'In Progress', assignee: 'Test User', priority: 'High', order: 2 },
                { title: 'Add undo/redo functionality', description: 'Implement Ctrl+Z and Ctrl+Y for all actions', status: 'In Progress', assignee: 'Gerden', priority: 'Medium', order: 3 },
                { title: 'Create analytics dashboard', description: 'Visualize project metrics and time tracking', status: 'Todo', assignee: 'Emre', priority: 'Medium', order: 4 },
            ]
        },
        {
            title: 'Mobile App Development',
            client: 'TechStart Inc.',
            assignee: 'Emre',
            priority: 'High',
            status: 'In Progress',
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-08-31'),
            deadline: new Date('2024-07-15'),
            description: 'Cross-platform mobile application for iOS and Android with real-time features.',
            labelIndices: [0, 3],
            tasks: [
                { title: 'Design UI mockups', description: 'Create high-fidelity designs in Figma', status: 'Done', assignee: 'Emre', priority: 'High', order: 0 },
                { title: 'Setup React Native project', description: 'Initialize Expo with TypeScript', status: 'In Progress', assignee: 'Emre', priority: 'High', order: 1 },
                { title: 'Implement push notifications', description: 'Firebase Cloud Messaging integration', status: 'Todo', assignee: 'Emre', priority: 'Medium', order: 2 },
            ]
        },
        {
            title: 'E-Commerce Platform',
            client: 'ShopMaster',
            assignee: 'Gerden',
            priority: 'Medium',
            status: 'Pending',
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-10-31'),
            deadline: new Date('2024-09-30'),
            description: 'Full-featured e-commerce platform with payment integration and inventory management.',
            labelIndices: [2, 3],
            tasks: [
                { title: 'Setup database schema', description: 'Design PostgreSQL tables for products and orders', status: 'Todo', assignee: 'Gerden', priority: 'High', order: 0 },
                { title: 'Integrate payment gateway', description: 'Add Stripe payment processing', status: 'Todo', assignee: 'Gerden', priority: 'High', order: 1 },
            ]
        },
        {
            title: 'CRM Integration',
            client: 'SalesForce',
            assignee: 'Emre, Test User',
            priority: 'High',
            status: 'Pending',
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 60)),
            deadline: new Date(new Date().setDate(new Date().getDate() + 45)),
            description: 'Integrate customer relationship management system with existing platform.',
            labelIndices: [0, 1],
            tasks: [
                { title: 'API Integration Setup', description: 'Connect to SalesForce API', status: 'Todo', assignee: 'Emre', priority: 'High', order: 0 },
                { title: 'Data Mapping', description: 'Map fields between systems', status: 'Todo', assignee: 'Test User', priority: 'High', order: 1 },
                { title: 'Testing', description: 'End-to-end integration testing', status: 'Todo', assignee: 'Emre', priority: 'Medium', order: 2 },
            ]
        },
        {
            title: 'Website Redesign',
            client: 'Creative Agency',
            assignee: 'Gerden',
            priority: 'Medium',
            status: 'In Progress',
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            deadline: new Date(new Date().setDate(new Date().getDate() + 20)),
            description: 'Complete redesign of company website with modern UI/UX.',
            labelIndices: [2],
            tasks: [
                { title: 'Design Mockups', description: 'Create new design concepts', status: 'Done', assignee: 'Gerden', priority: 'High', order: 0 },
                { title: 'Frontend Development', description: 'Implement new design', status: 'In Progress', assignee: 'Gerden', priority: 'High', order: 1 },
                { title: 'Content Migration', description: 'Move existing content to new structure', status: 'Todo', assignee: 'Gerden', priority: 'Medium', order: 2 },
            ]
        },
    ];

    const createdProjects = [];
    for (const projectData of projectsData) {
        const project = await prisma.project.create({
            data: {
                title: projectData.title,
                client: projectData.client,
                assignee: projectData.assignee,
                priority: projectData.priority,
                status: projectData.status,
                startDate: projectData.startDate,
                endDate: projectData.endDate,
                deadline: projectData.deadline,
                description: projectData.description,
                labels: {
                    connect: projectData.labelIndices.map(i => ({ id: labels[i].id })),
                },
                tasks: {
                    create: projectData.tasks.map(task => ({
                        ...task,
                        deadline: task.deadline || null,
                    })),
                },
            },
        });

        // Create default task statuses for THIS project
        const defaultTaskStatuses = [
            { name: 'Todo', color: 'bg-gray-500', order: 0 },
            { name: 'In Progress', color: 'bg-yellow-500', order: 1 },
            { name: 'Done', color: 'bg-green-500', order: 2 },
        ];

        for (const status of defaultTaskStatuses) {
            await prisma.workflowStatus.create({
                data: {
                    ...status,
                    type: 'task',
                    projectId: project.id,
                },
            });
        }

        createdProjects.push(project);
    }

    console.log(`✅ Created ${createdProjects.length} projects with tasks and task statuses`);

    // Create Todos
    await prisma.todo.createMany({
        data: [
            { title: 'Review PR #123', completed: false, order: 0 },
            { title: 'Update documentation', completed: true, order: 1 },
            { title: 'Deploy to staging', completed: false, order: 2 },
            { title: 'Fix login bug', completed: false, order: 3 },
            { title: 'Add new feature', completed: false, order: 4 },
            { title: 'Code review', completed: true, order: 5 },
        ],
    });

    console.log('✅ Todos created');
    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📧 Login credentials:');
    console.log('   Email: test@buinsoft.com | Password: 123456');
    console.log('   Email: emre.alemdar@buinsoft.com | Password: 123456');
    console.log('   Email: gerden@buinsoft.com | Password: 123456');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
