FROM python:3.14-slim

# Criação de um usuário sem privilégios (Security Hardening)
RUN addgroup --system appgroup && adduser --system --group appuser

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Troca o ownership para o usuário criado
RUN chown -R appuser:appgroup /app

# Roda com o usuário appuser, não como root
USER appuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
