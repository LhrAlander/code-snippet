function TaskQueue() {
  this.maxLength = 2;
  this.runningTasks = [];
  this.pendingTasks = [];
  this.cb = val => console.log(val);
}

TaskQueue.prototype.addTasks = function(_tasks) {
  const tasks = Array.isArray(_tasks) ? _tasks.slice(0) : [_tasks];
  tasks.forEach(task => this.pendingTasks.push(task));
  return this;
}

TaskQueue.prototype.setMaxLength = function(length) {
  const num = Number(length);
  if (isNaN(num)) {
    return this;
  }

  this.maxLength = num;
  return this;
}
TaskQueue.prototype.setHandleCb = function (cb) {
  this.cb = cb;
}

TaskQueue.prototype.run = function() {
  if (this.runningTasks.length >= this.maxLength || this.pendingTasks.length < 1) {
    return this;
  }
  for (let i = this.runningTasks.length; i < this.maxLength; i++) {
    const task = this.pendingTasks.shift();
    task().then((val) => {
      this.cb(val);
      this.runningTasks = this.runningTasks.filter(item => item !== task);
      this.run();
    });
    this.runningTasks.push(task);
  }
}

function generateTask(value, time) {
  return new Promise(resolve => {
    setTimeout(() => resolve(value), time);
  })
}

const tasks = [
  () => generateTask(1, 1000),
  () => generateTask(2, 300),
  () => generateTask(3, 400),
  () => generateTask(4, 1500)
]

const queue = new TaskQueue();
queue
  .setMaxLength(2)
  .addTasks(tasks)
  .run();