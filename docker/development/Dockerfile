# Using Lightweight docker image for node
FROM node:20-alpine AS base

# Setting Up Working Directory
WORKDIR /lms-backend

# Copying Package Files
COPY package*.json ./

# Installing Dependencies
RUN npm ci

# Copying Files
COPY . .

# Exposing Port
EXPOSE 5000

# Start Application
CMD ["npm", "run", "dev"]