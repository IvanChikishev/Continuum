import docker from "dockerode";
import { logger } from "./logger.js";
import bluebird from "bluebird";
import { Utils } from "./utils.js";

export class Machine {
  /**
   * @type {docker}
   */
  docker = null;
  once = false;

  machineReplicaList = {};

  constructor(settings) {
    this.docker = new docker({
      socketPath: "/var/run/docker.sock",
      Promise: bluebird,
    });

    logger.info("Docker Successful Initialize");
  }

  async cluster(replicas) {
    logger.info("Creates replicas processing..");

    for (const replica of replicas) {
      const {
        image: Image,
        accessId,
        cpuUsageLimit,
        memoryUsageLimit,
        sqsHost,
        sqsName,
      } = replica;

      if (this.machineReplicaList[accessId]) {
        throw new Error("You are trying to create a duplicate cluster");
      }

      const serviceOptions = {
        Name: accessId,
        TaskTemplate: {
          ContainerSpec: {
            Image,
          },
          Resources: {
            Limits: {
              NanoCPUs: 51924994219.0,
            },
          },
        },
        Mode: {
          Replicated: {
            Replicas: 0,
          },
        },
      };

      const service = await this.docker
        .createService(null, serviceOptions)
        .catch(async (err) => {
          logger.error("An error occurred while creating the service");

          if (err.statusCode === 409) {
            logger.warn(
              "It is determined that a service with this accessId is already set"
            );

            const service = this.docker.getService(accessId);
            await service.remove();

            return this.docker.createService(null, serviceOptions);
          }

          throw new Error(err);
        })
        .then(async (service) => {
          logger.info("The service has been successfully overwritten");
          return service;
        });

      service.localSettings = replica;

      this.machineReplicaList[accessId] = service;
      logger.info("The service is ready to work");
    }
  }

  async monitor() {
    while (!this.once) {
      for (const service of Object.values(this.machineReplicaList)) {
        const {
          Version,
          Spec: {
            Name,
            Mode: {
              Replicated: { Replicas },
            },
          },
        } = await service.inspect();

        if (service?.previousReplicas !== Replicas) {
          logger.info(`Service ${Name} / Replicas assigned ${Replicas}`);

          service.previousReplicas = Replicas;
        }

        const messageInQueue =
          await service.localSettings.sqsHost.getMessageInQueue(
            service.localSettings.sqsName
          );

        const calculateReplicas = Math.min(
          Math.ceil(messageInQueue / 10),
          service.localSettings.limitOfReplicas
        );

        if (
          calculateReplicas !== Replicas &&
          service.localSettings.limitOfReplicas >
            Math.min(calculateReplicas, Replicas)
        ) {
          console.log(
            `Resource optimization option found [${Replicas} -> ${calculateReplicas}]`
          );

          await service.update({
            Name: service.localSettings.accessId,
            version: Version.Index,
            TaskTemplate: {
              ContainerSpec: {
                Image: service.localSettings.image,
              },
            },
            Mode: {
              Replicated: {
                Replicas: calculateReplicas,
              },
            },
          });
        }
      }

      await Utils.sleep(5000);
    }
  }
}
