from fastapi import FastAPI, HTTPException
import os
import socket
import json
import redis.asyncio as redis
import asyncpg
from aiokafka import AIOKafkaProducer
from contextlib import asynccontextmanager

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
POSTGRES_USER = os.getenv("POSTGRES_USER", "admin")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "supersecretpassword")
POSTGRES_DB = os.getenv("POSTGRES_DB", "appdb")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "devops-cluster-kafka-bootstrap.kafka.svc:9092")

app_state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Conexões DB e Cache
    app_state["redis"] = await redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)
    try:
        app_state["pg_pool"] = await asyncpg.create_pool(
            user=POSTGRES_USER, password=POSTGRES_PASSWORD, database=POSTGRES_DB, host=POSTGRES_HOST
        )
    except Exception:
        app_state["pg_pool"] = None

    # Conexão Kafka
    producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BROKER)
    try:
        await producer.start()
        app_state["kafka_producer"] = producer
    except Exception as e:
        print(f"Erro conectando ao Kafka: {e}")
        app_state["kafka_producer"] = None
    
    yield
    
    # Shutdown
    await app_state["redis"].close()
    if app_state["pg_pool"]:
        await app_state["pg_pool"].close()
    if app_state.get("kafka_producer"):
        await app_state["kafka_producer"].stop()

app = FastAPI(title="Backend Service V3", lifespan=lifespan)

@app.get("/")
async def read_root():
    hostname = socket.gethostname()
    
    # Enviar Evento pro Kafka
    producer = app_state.get("kafka_producer")
    kafka_status = "not connected"
    if producer:
        event = {"event": "page_view", "host": hostname}
        await producer.send_and_wait("access-logs", json.dumps(event).encode('utf-8'))
        kafka_status = "event published"

    r = app_state.get("redis")
    visits = await r.incr("visits_counter") if r else -1

    return {
        "message": "Hello from Python Backend (Fase 3 - Event Driven)!",
        "hostname": hostname,
        "redis_visits": visits,
        "kafka_status": kafka_status,
        "version": "3.0.0 (Event-Driven Edition)"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "layer": "backend"}
