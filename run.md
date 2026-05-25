cd backend 
python -m uvicorn backend.app.main:app --port 8000 --reload &

cd frontend 
npm run dev
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload