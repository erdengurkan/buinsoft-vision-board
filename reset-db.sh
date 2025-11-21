#!/bin/bash
set -e

echo "🔄 Resetting database..."

# Copy seed file to container
docker cp /root/buinsoft-vision-board/server/prisma/seed.ts buinsoft-vision-board-app-1:/app/prisma/seed.ts

# Reset database and run seed
docker exec buinsoft-vision-board-app-1 sh -c "cd /app && npx prisma migrate reset --force"

echo "✅ Database reset complete!"
echo ""
echo "📧 Login credentials:"
echo "   admin@buinsoft.com - Password: 123456"
echo "   emre.alemdar@buinsoft.com - Password: 123456"
echo "   gerden@buinsoft.com - Password: 123456"

