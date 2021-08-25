export class Utils {
  /**
   * @param milliseconds {Number}
   * @returns {Promise}
   */
  static async sleep(milliseconds) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, milliseconds);
    });
  }
}
