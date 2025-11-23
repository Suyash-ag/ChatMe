# Quick Start Guide - ChatMe

## 🚀 Fastest Way to Run

### 1. Start Everything
```bash
cd ChatMe
docker-compose up --build
```

### 2. Open Browser
Navigate to: **http://localhost:3000**

### 3. Test Flow
1. **Register** → Create account (username: `testuser`, password: `test123`)
2. **Login** → Use your credentials
3. **Chat** → Send messages in the `general` room
4. **Switch Rooms** → Change room name to test different chat rooms

## 📋 Quick Commands

```bash
# Start services
docker-compose up --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Reset everything (clears database)
docker-compose down -v
```

## ✅ What to Expect

- **Frontend:** http://localhost:3000 (Login page)
- **Auth API:** http://localhost:5000
- **Chat API:** http://localhost:5001

## 🐛 Quick Troubleshooting

**Services not starting?**
```bash
docker-compose ps  # Check if containers are running
docker-compose logs  # See what's wrong
```

**Port already in use?**
- Stop other services using ports 3000, 5000, 5001
- Or modify ports in `docker-compose.yml`

**Can't connect?**
- Wait 30-60 seconds for all services to start
- Check Docker Desktop is running
- Check browser console (F12) for errors

## 📖 Full Testing Guide

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed step-by-step instructions.

