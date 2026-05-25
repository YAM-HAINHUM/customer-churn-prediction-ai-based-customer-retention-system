FROM python:3.11-slim

WORKDIR /app

# Install system deps for scikit-learn / matplotlib
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Pre-train model if artifacts don't exist
RUN python -c "import os; os.path.exists('ml/artifacts/best_model.pkl') or __import__('subprocess').run(['python', '-m', 'ml.train'])"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
