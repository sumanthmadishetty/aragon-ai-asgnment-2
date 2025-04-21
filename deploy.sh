#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment process...${NC}"

# Build both applications
echo -e "${GREEN}Building server...${NC}"
cd server
npm ci
npm run build:prod
echo -e "${GREEN}Server build completed.${NC}"

echo -e "${GREEN}Building client...${NC}"
cd ../client
npm ci
npm run build
echo -e "${GREEN}Client build completed.${NC}"

# Build docker images
cd ..
echo -e "${GREEN}Building Docker containers...${NC}"
docker-compose build

# Push to registry if needed
# Uncomment the below lines and modify as needed
# echo -e "${GREEN}Pushing to Docker registry...${NC}"
# docker push yourorg/server:latest
# docker push yourorg/client:latest

echo -e "${GREEN}Deployment preparation completed successfully!${NC}"
echo -e "${GREEN}Run 'docker-compose up -d' to start the application.${NC}"