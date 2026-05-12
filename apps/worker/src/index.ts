import { Kafka } from 'kafkajs';

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'devops-cluster-kafka-bootstrap.kafka.svc:9092';
const TOPIC = 'access-logs';
const GROUP_ID = 'ts-worker-group';

const kafka = new Kafka({
  clientId: 'ts-worker',
  brokers: [KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: GROUP_ID });

const run = async () => {
  console.log(\`👷 TypeScript Worker started! Connecting to \${KAFKA_BROKER}...\`);
  
  await consumer.connect();
  console.log('✅ Connected to Kafka successfully.');

  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
  console.log(\`🎧 Listening on topic: \${TOPIC}\`);

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value) return;
      console.log(\`🔥 EVENT RECEIVED: topic=\${topic} partition=\${partition} offset=\${message.offset}\`);
      console.log(\`   Payload: \${message.value.toString()}\`);
    },
  });
};

run().catch((error) => {
  console.error('❌ Error in worker:', error);
  process.exit(1);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down consumer...');
  try {
    await consumer.disconnect();
    console.log('Disconnected cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('Error during disconnect', err);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
