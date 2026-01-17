cd ../frontend
call npm run build
cd ../backend
fastapi dev server.py
