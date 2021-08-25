import { logger } from "./logger.js";
import { Machine } from "./machine.js";
import { Queue } from "./queue.js";
import replicas from "../replicas.json";

async function bootstrap() {
  logger.info("Hub Initialize...");

  const machine = new Machine();

  await machine.cluster(
    replicas.map((replica) => {
      return {
        ...replica,
        sqsName: replica.sqs.name,
        sqsHost: new Queue({
          secretAccessKey: replica.sqs.secretAccessKey,
          accessKeyId: replica.sqs.accessKeyId,
        }),
      };
    })
  );

  await machine.monitor();
}

bootstrap().catch(logger.err);
