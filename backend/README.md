setting up the environment:

1: open a terminal
2: navigate to the backend directory
3: python -m venv venv
4: venv\Scripts\activate
5: pip install -r requirements.txt

# MC hacks 2026
project for this hackathon

## Prerequisites
- Python 3.12 or 3.13 is required
- Node.js

## Installing dependencies
Python: 
```
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```
Node.js:
```
cd frontend
npm i -D daisyui@latest
npm install tailwindcss@latest @tailwindcss/vite@latest daisyui@latest
```


## Running the application
Open a cmd

Backend:
```
cd backend
start_server.cmd
```
If start_server.cmd does not work run ./start_server.cmd instead.

start_server builds the frontend and starts the server. If your frontend is already built (npm run build), just use
```
fastapi dev server.py
```
When server is live, go to http://127.0.0.1:8000.

## running frontend for development:
```
cd frontend
npm run dev
```


