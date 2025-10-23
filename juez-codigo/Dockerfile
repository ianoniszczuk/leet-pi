FROM python:3.10-slim

# Instalar GCC (para compilar C)
RUN apt-get update && apt-get install -y gcc build-essential

# Crear carpetas necesarias para el juez
RUN mkdir -p /tmp/submissions /tests

# Crear carpeta de trabajo
WORKDIR /app

# Copiar requirements e instalar dependencias
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copiar todo tu código
COPY . .

# Abrir puerto 5000 (según especificaciones)
EXPOSE 5000

# Comando para iniciar la API en puerto 5000
# Para ejecutar con volúmenes:
# docker run -d --name code-judge -p 5000:5000 \
#   -v /host/tests:/tests:ro \
#   -v /host/submissions:/tmp/submissions \
#   --memory=256m --cpus=1 --restart=unless-stopped \
#   code-judge:latest
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]