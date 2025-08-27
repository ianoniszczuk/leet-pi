FROM python:3.10-slim

# Instalar GCC (para compilar C)
RUN apt-get update && apt-get install -y gcc build-essential

# Crear carpeta de trabajo
WORKDIR /app

# Copiar requirements e instalar dependencias
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copiar todo tu código
COPY . .

# Abrir puerto 8000
EXPOSE 8000

# Comando para iniciar la API
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]