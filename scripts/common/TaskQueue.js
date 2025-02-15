/**
 * Manages concurrent task execution with a maximum limit
 */
export class TaskQueue {
  constructor(maxConcurrent = 25) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
  }

  async add(task) {
    if (this.running >= this.maxConcurrent) {
      await new Promise((resolve) => this.queue.push(resolve));
    }

    this.running++;
    try {
      return await task();
    } finally {
      this.running--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next();
      }
    }
  }
}
