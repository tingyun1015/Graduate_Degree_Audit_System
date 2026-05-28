FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .

EXPOSE 5173

# For dev environment
CMD ["npm", "run", "dev", "--", "--host"]
