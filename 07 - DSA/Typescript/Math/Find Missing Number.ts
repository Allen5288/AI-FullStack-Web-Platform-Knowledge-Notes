function findMissingNumber(nums: number[]): number {
  const n = nums.length + 1;
  const expectedSum = (n * (n + 1)) / 2;
  const actualSum = nums.reduce((acc, val) => acc + val, 0);
  return expectedSum - actualSum;
}
// time complexity: O(n)
// space complexity: O(1)

// check the next != previous + 1
function findMissingNumber2(nums: number[]): number {
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] !== nums[i - 1] + 1) {
      return nums[i - 1] + 1;
    }
  }
  return -1; // If no missing number is found
}
// time complexity: O(n)
// space complexity: O(1)

// Example:
console.log(findMissingNumber([1, 2, 4, 5, 6])); // 3
