#!/bin/bash

# Update system
echo "Updating system..."
sudo dnf update -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo systemctl start docker
    sudo systemctl enable docker
fi

# Create .env file if not exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat <<EOT >> .env
POSTGRES_USER=admin
POSTGRES_PASSWORD=$(openssl rand -base64 12)
POSTGRES_DB=visionboard
EOT
    echo "Created .env with random password."
fi

# Build and start containers
echo "Starting application..."
docker compose up -d --build

echo "Deployment complete! Application should be running on port 80."
