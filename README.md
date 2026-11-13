# MERN-Style Deployment Practice App

A small full-stack task manager for practicing GitHub → EC2 → deployment.

**Stack:** React + Vite frontend, Node.js + Express backend, and a local JSON file for persistent data.

> This is MERN-style, but MongoDB is intentionally replaced with `server/data/tasks.json`. No MongoDB, database server, or external database is required.

## Features
- View, add, complete, and delete tasks
- Express REST API
- JSON-file persistence (data survives server restarts)
- React frontend served by Express after production build
- Health endpoint: `/api/health`

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm run install:all
npm run dev
```

Open the Vite URL shown in the terminal (usually http://localhost:5173).
The API runs on http://localhost:5000.

## Production-style run

```bash
npm run install:all
npm run build
npm start
```

Open http://localhost:5000.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task (`{"title":"Learn EC2"}`) |
| PATCH | `/api/tasks/:id` | Toggle completion |
| DELETE | `/api/tasks/:id` | Delete task |

## Where is the database?

`server/data/tasks.json`

The Express server reads and writes this file. Keep this file when redeploying if you want to preserve task data. On an EC2 instance, the file is stored on that instance's disk. If you delete/recreate the instance or replace the file during deployment, the data can be lost. For real production systems, use a managed database or persistent storage.

## Deployment flow (EC2)

1. Launch an Ubuntu EC2 instance and allow inbound SSH (22) and HTTP (80). For initial testing, you may temporarily allow port 5000.
2. Connect using your downloaded key:
   ```bash
   ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
   ```
3. Install Git and Node.js 20+.
4. Clone your GitHub repository:
   ```bash
   git clone YOUR_GITHUB_REPOSITORY_URL
   cd mern-deployment-practice
   ```
5. Install dependencies and build:
   ```bash
   npm run install:all
   npm run build
   ```
6. Start the app:
   ```bash
   npm start
   ```
7. Visit `http://YOUR_EC2_PUBLIC_IP:5000`.

### Recommended next step: run it with PM2

```bash
sudo npm install -g pm2
pm2 start server/index.js --name mern-practice
pm2 save
pm2 startup
```

Follow the command printed by `pm2 startup`. For a cleaner deployment, put Nginx in front of the app and proxy port 80 to `127.0.0.1:5000`.

## Important deployment note

The JSON file is suitable for learning and a single-instance demo. It is not a replacement for a production database: concurrent writes, backups, scaling across multiple instances, and data durability need extra care.
