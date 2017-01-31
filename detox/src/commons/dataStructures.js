class Queue {

  constructor() {
    this.elements = [];
  }

  enqueue(element) {
    this.elements.push(element);
  }

  dequeue() {
    return this.elements.shift();
  }

  peek() {
    return this.elements[0];
  }

  length() {
    return this.elements.length;
  }

  isEmpty() {
    return this.elements.length === 0;
  }
};

module.exports = {
  Queue
};
