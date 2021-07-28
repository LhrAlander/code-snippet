function swap(arr, idx1, idx2) {
  const temp = arr[idx1];
  arr[idx1] = arr[idx2];
  arr[idx2] = temp;
}

function quickSort(arr = []) {
  if (arr.length === 1 || arr.length === 0) {
    return arr;
  }


  let baseIdx = 0;
  let leftIdx = baseIdx + 1;
  let rightIdx = arr.length - 1;
  const baseValue = arr[baseIdx];

  while (leftIdx <= rightIdx) {

   for (; rightIdx >= leftIdx; rightIdx--) {
     if (arr[rightIdx] < baseValue) {
       break;
     }
   }

    if (leftIdx <= rightIdx) {
      swap(arr, baseIdx, rightIdx);
      baseIdx = rightIdx;
    }



    rightIdx--;

    for (; leftIdx <= rightIdx; leftIdx++) {
      if (arr[leftIdx] > baseValue) {
        break;
      }
    }

    if (leftIdx <= rightIdx) {
      swap(arr, baseIdx, leftIdx);
      baseIdx = leftIdx;
    }

    leftIdx++;
  }


  return [
    ...quickSort(arr.slice(0, baseIdx)),
    arr[baseIdx],
    ...quickSort(arr.slice(baseIdx + 1))
  ]

}

console.log(quickSort([5, 3, 7, 1, 8, 2, 9, 4, 7, 2, 6, 6]))