import { prisma } from '../lib/prisma';

async function migrateExistingData() {
  try {
    console.log('Starting data migration...');

    // Update all existing projects to have sharedWithAll = true
    // Since we just added the column with default true, we just need to ensure sharedWith is set
    const projectsUpdated = await prisma.project.updateMany({
      data: {
        sharedWithAll: true,
        sharedWith: [],
      },
    });
    console.log(`✅ Updated ${projectsUpdated.count} projects with sharedWithAll = true`);

    // Create Todos for existing tasks that have assignees
    const tasksWithAssignees = await prisma.task.findMany({
      where: {
        assignee: {
          not: '',
        },
      },
      select: {
        id: true,
        title: true,
        assignee: true,
        deadline: true,
      },
    });

    let todosCreated = 0;
    for (const task of tasksWithAssignees) {
      // Check if Todo already exists for this task
      const existingTodo = await prisma.todo.findFirst({
        where: { taskId: task.id },
      });

      if (!existingTodo) {
        await prisma.todo.create({
          data: {
            title: task.title,
            completed: false,
            deadline: task.deadline,
            taskId: task.id,
            taskTitle: task.title,
            order: 0,
            mentions: [],
          },
        });
        todosCreated++;
      }
    }
    console.log(`✅ Created ${todosCreated} todos for existing tasks with assignees`);

    console.log('✅ Data migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateExistingData();

