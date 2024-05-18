
FROM python:3.10.7
COPY / /
RUN pip install --upgrade pip && \
    pip install -r requirements.txt
ENV PYTHONUNBUFFERED definitely
ENV PYTHONUNBUFFERED definitely
ENV REDIS_URL redis-container
ENV PORT 8001
ENV HOST http://localhost:8080
CMD python3 WebSocketServer.py