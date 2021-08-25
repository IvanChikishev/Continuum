import aws from "aws-sdk";

export class Queue {
  /**
   * @type {aws.SQS}
   */
  sqs = null;

  constructor({ secretAccessKey, accessKeyId }) {
    this.sqs = new aws.SQS({
      secretAccessKey,
      accessKeyId,
      region: "ru-central1",
      endpoint: "https://message-queue.api.cloud.yandex.net",
    });
  }

  /**
   * @param QueueName {String}
   * @returns {Promise<Number>}
   */
  async getMessageInQueue(QueueName) {
    const { QueueUrl } = await this.sqs
      .getQueueUrl({
        QueueName,
      })
      .promise();

    const {
      Attributes: { ApproximateNumberOfMessages },
    } = await this.sqs
      .getQueueAttributes({
        QueueUrl,
        AttributeNames: ["ApproximateNumberOfMessages"],
      })
      .promise();

    return parseInt(ApproximateNumberOfMessages, 10);
  }
}
