# ChatMe
Real-time chat app with Node.js + Docker + Kubernetes + full CI/CD

## Architecture

This project consists of:
- **Auth Service**: Handles user registration, login, and JWT authentication
- **Chat Service**: Real-time chat using Socket.io with Redis pub/sub for horizontal scaling
- **Frontend**: React application for user interface
- **MongoDB**: Database for users and messages
- **Redis**: Message broker for pub/sub between chat service instances

## Features

- User registration and authentication with JWT
- Real-time chat with multiple rooms
- Horizontal scaling support via Redis pub/sub
- Docker containerization
- Kubernetes deployment with HPA
- CI/CD pipeline with GitHub Actions

## Quick Start

### Using Docker Compose

1. Clone the repository
2. Build and run all services:
   ```bash
   docker-compose up --build
   ```
3. Access the application at http://localhost:3000

### Using Kubernetes

1. Update the DockerHub username in `k8s/*.yaml` files
2. Apply all manifests:
   ```bash
   kubectl apply -f k8s/
   ```
3. Access via ingress (configure host in `k8s/ingress.yaml`)

## Environment Variables

### Auth Service
- `PORT`: Server port (default: 5000)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `CORS_ORIGIN`: Allowed CORS origin

### Chat Service
- `PORT`: Server port (default: 5001)
- `MONGO_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection URL
- `JWT_SECRET`: Secret key for JWT verification
- `CORS_ORIGIN`: Allowed CORS origin
- `INSTANCE_ID`: Unique instance identifier (auto-generated if not set)

### Frontend
- `REACT_APP_AUTH_API_URL`: Auth service API URL
- `REACT_APP_CHAT_API_URL`: Chat service WebSocket URL

## CI/CD

The project includes a GitHub Actions workflow that:
1. Builds Docker images for all services
2. Pushes images to DockerHub
3. Deploys to Kubernetes (on main/master branch)

Required GitHub Secrets:
- `DOCKERHUB_USERNAME`: Your DockerHub username
- `DOCKERHUB_TOKEN`: Your DockerHub access token
- `KUBECONFIG`: Your Kubernetes config file content

## Development

### Backend Services
```bash
cd backend/auth
npm install
npm start

cd backend/chat
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## API Endpoints

### Auth Service
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/profile` - Get user profile (requires JWT)
- `GET /health` - Health check

### Chat Service
- WebSocket connection for real-time chat
- `GET /health` - Health check

## License

MIT