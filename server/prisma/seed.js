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
                        status: 'Todo',
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

    console.log('Seed data created successfully');
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
