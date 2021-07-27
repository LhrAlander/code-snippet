function heapSort () {
  const arr = [57, 40, 38, 11, 13, 34, 48, 75, 6, 19, 9, 7]
  let arrLen = arr.length

  function swapValue(idx1, idx2) {
    const temp = arr[idx1];
    arr[idx1] = arr[idx2];
    arr[idx2] = temp;
  }

  function makeMaxHeap () {
    let parentIdx = Math.floor(arrLen / 2) - 1
    for (; parentIdx >= 0; parentIdx--) {
      const leftChildIdx = parentIdx * 2 + 1
      let rightChildIdx = parentIdx * 2 + 2
      const leftValue = arr[leftChildIdx]
      const parentValue = arr[parentIdx]

      if (rightChildIdx >= arrLen) {
        rightChildIdx = undefined;
      }
      const rightValue = arr[rightChildIdx]

      if (
        leftValue > parentValue
        && (rightValue === undefined || leftValue > rightValue)
      ) {
        swapValue(parentIdx, leftChildIdx);
        continue;
      }

      if (rightValue === undefined) {
        continue;
      }

      if (rightValue > parentValue && rightValue > leftValue) {
        swapValue(rightChildIdx, parentIdx);
      }

    }
  }

  for (let i = 0; i < arr.length; i++) {
    makeMaxHeap();
    swapValue(0, arrLen - 1);
    arrLen -= 1;
  }

  return arr;
}


console.log(heapSort());