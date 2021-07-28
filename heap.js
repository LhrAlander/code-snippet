function createHeap () {
  const arr = [5, 3, 7, 1, 8, 2, 9, 4, 7, 2, 6, 6];

  const result = [];

  while(arr.length) {
    const currVal = arr.pop();
    result.push(currVal);
    let parentIdx = Math.floor(result.length / 2) - 1;
    let childIdx = result.length - 1;
    while (parentIdx >= 0) {
      const parentVal = result[parentIdx];
      if (parentVal < currVal) {
        break;
      }
      result[childIdx] = parentVal;
      result[parentIdx] = currVal;
      childIdx = parentIdx;
      parentIdx = Math.floor((childIdx + 1) / 2) - 1;
    }
  }
  return result;
}
