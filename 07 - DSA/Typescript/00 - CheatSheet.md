# 1. Array / String/ Object

## 1.1 Array Creation

1. Create array with default value

```javascript


let prefixXOR = new Array(arr.length + 1).fill(0);

const dp = Array.from({ length: row }, () => Array(col).fill(0));

let hashArray = Array.from({length: totalNum}, () => ({row: 0, col: 0}));

let forWardCnt = new Array(n).fill(null).map(() => [0, 0]);

// length's array with set
let rows = Array.from({ length: 9 }, () => new Set());

let uniqueArr = Array.from(new Set(inputArr))

const emptyArray = []; // 推荐方式
const lengthArray = new Array(5); // [empty × 5]

// 使用 fill() 方法
const filledArray = new Array(5).fill(0); // [0, 0, 0, 0, 0]
// 使用 Array.from()
const fromArray = Array.from({ length: 5 }, () => 0); // [0, 0, 0, 0, 0]
// 使用展开语法 + 索引
const indexedArray = [...Array(5)].map((_, i) => i); // [0, 1, 2, 3, 4]

const empty2DArray = Array.from({ length: 3 }, () => []); // [ [], [], [] ]
const fixed2DArray = Array.from({ length: 3 }, () => new Array(3).fill(0));

// 创建一个二维数组，每个子数组是一个 Set
const set2DArray = Array.from({ length: 3 }, () => new Set());

```

2. String to Array

```js
let str = "12345";

let arr = str.split("").map(Number);  // Split the string and convert each character to a number
let arr = Array.from(str).map(Number);  // Convert string to array of numbers

console.log(arr);  // Output: [1, 2, 3, 4, 5]
```

3. Using ArrayFrom

```js
Array.from(
    { length: diceNumber },
    () => Math.floor(Math.random() * 6) + 1,
);
// construct from the length and every value with proper calculate
```

## 1.2 Array Operation

### 0. Basic Operation

```js
Object Person = {name: "allen", age: 11};
let arr = ["apple", "banana", "cherry", Person];

arr.push("orange");
arr.pop();
arr.unshift("orange");
arr.shift();
```

### 1. Cut/change arr(slice splice)

Get previous index arr to a new

- Slice(Array and string)

```javascript
/**
 * Slice: can be array or string, original not change
 */
array.slice(startIndex, endIndex)
string.slice(startIndex, endIndex)

// slice
const arr = [1, 2, 3, 4, 5];
const arr2 = arr.slice(0, 3);
console.log(arr2); // [1, 2, 3]

// slice with 1 argument
const arr3 = arr.slice(2);
console.log(arr3); // [3, 4, 5]

// slice with negative index
const arr4 = arr.slice(-3);
console.log(arr4); // [3, 4, 5]

// slice with negative index and 1 argument
const arr5 = arr.slice(-3, -1);
console.log(arr5); // [3, 4]

let str = "Hello, world!";
let slicedStr = str.slice(7, 12);  // Extract substring from index 7 to 11
console.log(slicedStr);  // Output: "world"

```

- splice

```javascript
/**
 * splice: removing or replacing existing elements and/or adding new elements in place.
 */
array.splice(startIndex, deleteCount, item1, item2, ..., itemN)

// Remove:
// splice
const arr6 = [1, 2, 3, 4, 5];
const arr7 = arr6.splice(0, 3);
console.log(arr6); // [4, 5]
console.log(arr7); // [1, 2, 3]
// splice with 1 argument
const arr8 = [1,2,3,4,5];
const arr9 = arr8.splice(2);
console.log(arr8); // [1, 2]
console.log(arr9); // [3, 4, 5]
// splice with negative index
const arr10 = [1, 2, 3, 4, 5];
const arr11 = arr10.splice(-3);
console.log(arr10); // [1, 2]
console.log(arr11); // [3, 4, 5]
// splice with negative index and 1 argument
const arr12 = [1, 2, 3, 4, 5];
const arr13 = arr12.splice(-3, 1);
console.log(arr12); // [1, 2, 4, 5]
console.log(arr13); // [3]

// Add
let arr = [10, 20, 30];
arr.splice(1, 0, 15, 17);  // Start at index 1, remove 0 elements, add 15 and 17
console.log(arr);  // Output: [10, 15, 17, 20, 30]

// Replace
let arr = [10, 20, 30];
arr.splice(1, 1, 25, 27);  // Start at index 1, remove 1 element, add 25 and 27
console.log(arr);  // Output: [10, 25, 27, 30]
```

### 2. Split, a string into an array of substrings

The trim() function in JavaScript is used to remove leading and trailing whitespace from a string. It does not affect spaces between words.

split is used to seperate string by content input in the ();

```js
string.split(separator, limit)

let words = s.trim().split(' ');

let str = "apple,banana,orange,grape";
let fruits = str.split(",", 2);  // Split the string into 2 parts only
console.log(fruits);  // Output: ["apple", "banana"]
```

### 3. Insert Value to index of array

```javascript
arr.splice(index, 0, num);
```

### 4. Array math - startsWith

starsWith

```js
if (words[i].startsWith(searchWord))
words[i].endsWith(searchWord)

[x, y] = [y, x];
```

### 5. Find index - indexOf

```js
index = nums.indexOf(m)
```

### 6. reduce

```js
array.reduce((accumulator, currentValue, currentIndex, array) => {
  // return the new accumylate value
}, initialValue);

const sum = numbers.reduce((acc, num) => acc + num, 0);
const max = numbers.reduce((acc, num) => acc > num ? acc : num);
const uniqueNumbers = numbers.reduce((acc, num) => {
  if (!acc.includes(num)) {
    acc.push(num);
  }
  return acc;
}, []);

// convert array to object
const array = ['apple', 'banana', 'cherry'];
const obj = array.reduce((acc, curr, index) => {
  acc[index] = curr;
  return acc;
}, {});
console.log(obj); // 输出: {0: 'apple', 1: 'banana', 2: 'cherry'}

```

### 7. iterate

for ... of to interate array, string, map and set
for ... in to interte object

```js
for (var value of iterable) {
    console.log(value);
}
```

### 8. array remove duplix

```js
const uniqueArr = [...new Set(arr)];
```

### 9. includes and replace

```js
res.includes(part);
res = res.replace(part, "");
```

### 10. map(), filter(), some(), every(), find()

```js
const numbers = [1,2,3,4,5];

// map: Describes the transformation logic and return type (new array)
const newNums = numbers.map((item, index, array) => {
    return item + 5;
});

// filter: Explains the filtering condition and result (new array of matches)
const newNums = numbers.filter((item, index, array) => {
    return item > 5;
});

// some: Highlights the "at least one" semantics and boolean return value
const newNums = numbers.some((item, index, array) => {
    return item > 3;
});

// every: Clarifies the "all elements" check and boolean result
const newNums = numbers.every((item, index, array) => {
    return item > 3;
});

// find: Indicates the "first matching element" behavior and possible return values
const newNums = numbers.find((item, index, array) => {
    return item > 3;
});
```

### 11. concat(), reverse()

```js
nums.concat(nums1, nums2);

nums.reverse();
```

### 12. fill(), flat()

fill()

```js
// The fill() method fills the elements in an array with a static value.
const array1 = [1, 2, 3, 4, 5];
Fill all elements with 0
array1.fill(0);
console.log(array1); // [0, 0, 0, 0, 0]

// Fill from index 1 to 3 with 0
const array2 = [1, 2, 3, 4, 5];
array2.fill(0, 1, 4);
console.log(array2); // [1, 0, 0, 0, 5]
```

flat()

```js
// flat
const arr = [1, 2, [3, 4], 5];
const flatArr = arr.flat();
console.log(flatArr); // [1, 2, 3, 4, 5]

// flat with depth
const arr2 = [1, 2, [3, 4, [5, 6]]];
const flatArr2 = arr2.flat(2);
console.log(flatArr2); // [1, 2, 3, 4, 5, 6]

const arr3 = [1, 2, [3, 4], [5, [6, 7]]];
const flatArr3 = arr3.flat(1);
console.log(flatArr3); // [1, 2, 3, 4, 5, [6, 7]]
```

## 1.3 Sort

```js
events.sort((a, b) => a[0] - b[0] || a[2] - b[2]); // sort by arrival time, then by leaving event

// folder = ["/a/b/d", "/a","/a/b/c"] => ["/a","/a/b/c","/a/b/d"]
folder.sort();

let reOrderedWords = words.sort((a, b) => a.length - b.length);

items.sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
```

## 1.4 string operate

### 0. All functions

```js
let str3 = "Hello World and Hello Universe";
// 1. charAt() - Returns the character at a specified index in a string.
console.log(str3.charAt(0)); // H
// 2. charCodeAt() - Returns the Unicode of the character at a specified index in a string.
console.log(str3.charCodeAt(0)); // 72
// 3. concat() - Combines two or more strings and returns a new string.
console.log(str3.concat("!", " How are you?")); // Hello World and Hello Universe! How are you?
// 4. includes() - Checks if a string contains a specified substring.
console.log(str3.includes("Hello")); // true
// 5. indexOf() - Returns the index of the first occurrence of a specified substring.
console.log(str3.indexOf("Hello")); // 0
// 6. lastIndexOf() - Returns the index of the last occurrence of a specified substring.
console.log(str3.lastIndexOf("Hello")); // 13
// 7. localeCompare() - Compares two strings in the current locale.
console.log(str3.localeCompare("Hello World")); // -1 (less than)
console.log(str3.localeCompare("Hello World and Hello Universe")); // 0 (equal)
console.log(str3.localeCompare("Hello World and Hello Universe!")); // 1 (greater than)
// 8. match() - Searches a string for a match against a regular expression.
console.log(str3.match(/Hello/g)); // [ 'Hello', 'Hello' ]
// 9. replace() - Replaces a specified substring with another substring.
console.log(str3.replace(/Hello/g, "Hi")); // Hi World and Hi Universe
// 10. slice() - Extracts a section of a string and returns it as a new string.
console.log(str3.slice(0, 5)); // Hello
// 11. split() - Splits a string into an array of substrings.
console.log(str3.split(" ")); // [ 'Hello', 'World', 'and', 'Hello', 'Universe' ]
// 12. toLowerCase() - Converts a string to lowercase.
console.log(str3.toLowerCase()); // hello world and hello universe
// 13. toUpperCase() - Converts a string to uppercase.
console.log(str3.toUpperCase()); // HELLO WORLD AND HELLO UNIVERSE
// 14. trim() - Removes whitespace from both ends of a string.
console.log(str3.trim()); // Hello World and Hello Universe
// 15. valueOf() - Returns the primitive value of a string object.
console.log(str3.valueOf()); // Hello World and Hello Universe
// 16. startsWith() - Checks if a string starts with a specified substring.
console.log(str3.startsWith("Hello")); // true
// 17. endsWith() - Checks if a string ends with a specified substring.
console.log(str3.endsWith("Universe")); // true
// 18. repeat() - Returns a new string with a specified number of copies of the original string.
console.log(str3.repeat(2)); // Hello World and Hello UniverseHello World and Hello Universe
// 19. substring() - Extracts characters from a string between two specified indices.
console.log(str3.substring(0, 5)); // Hello
// 20. substr() - Extracts a substring from a string, starting at a specified index and extending for a specified number of characters.
console.log(str3.substr(0, 5)); // Hello
// 21. search() - Searches a string for a match against a regular expression and returns the index of the match.
console.log(str3.search(/Hello/)); // 0
// 22. fromCharCode() - Converts Unicode values to characters.
console.log(String.fromCharCode(72)); // H
```

### 1. Convert array string, number array, number string

```javascript
// convert between string and number
const str = "123";
const num = Number(str);
console.log(num); // 123
// convert between number and string
const num2 = 123;
const str2 = String(num2);
console.log(str2); // "123"

// convert between string and boolean
const str3 = "true";
const bool = Boolean(str3);
console.log(bool); // true
// convert between boolean and string
const bool2 = true;
const str4 = String(bool2);
console.log(str4); // "true"

// convert between string and array
const str5 = "1,2,3,4,5";
const arr = str5.split(",");
console.log(arr); // ["1", "2", "3", "4", "5"]
// convert between array and string
const arr2 = [1, 2, 3, 4, 5];
const str6 = arr2.join(",");
console.log(str6); // "1,2,3,4,5"

// convert between string and object
const str7 = '{"name":"John","age":30}';
const obj = JSON.parse(str7);
console.log(obj); // { name: 'John', age: 30 }
// convert between object and string
const obj2 = { name: "John", age: 30 };
const str8 = JSON.stringify(obj2);
console.log(str8); // '{"name":"John","age":30}'
```

- Convert number to an array of number:
- Conver array of digits to a number

```javascript
let digits = String(num).split('').map(Number);

parseInt(digits.join(''));
```

- convert num & string

```js
num.toString(2) // 2 to binary, 10 to related decimal, number system

parseInt(preTimeString) // convert string to number
```

### 2. substring

```js
const substr = s.substring(left, left + index + 1);

let str = "Hello, world!";
let substr = str.substring(7, 12);  // Extract substring from index 7 to 11
console.log(substr);  // Output: "world"
```

## 1.5 Prefix

Prefix can using in one traverse.

if you need to see prefix and lastfix, using leftSum = totalSum - rightSum, like question 2270;

Another type of prefix
Cnt an array which up and down times;  by this way you can get the changes during serveral segement;

```js
// Step 1: Apply the shifts to the difference array
for (let i = 0; i < shifts.length; i++) {
    const [start, end, direction] = shifts[i];
    const shiftAmount = direction === 1 ? 1 : -1;

    // Increment shift at start index
    cntShiftInfo[start] += shiftAmount;

    // Decrement shift at the end + 1 index to stop the effect after the range
    if (end + 1 < sLength) {
        cntShiftInfo[end + 1] -= shiftAmount;
    }
}
```

## 1.6 charCode calculate

- Calculate charCode convert and move

```js
currentShift += cntShiftInfo[i]; // Update the cumulative shift for this position
const newChar = (s[i].charCodeAt(0) - 97 + currentShift) % 26;

// If newChar is negative (i.e., wrapped around), adjust it
const finalChar = newChar < 0 ? 123 + newChar : 97 + newChar;

result += String.fromCharCode(finalChar);
```

- judge is a alphanumeric

```js
function isLetter(char) {
    return /^[A-Za-z]$/.test(char);

    /^[A-Za-z0-9]$/.test(char); // alphanumeric characters
}

s = s.toLowerCase().replace(/[^a-z0-9]/gi,'');
```

- convert string to unicode

```js
let diff = (str2[j].charCodeAt(0) - str1[i].charCodeAt(0) + 26) % 26;

let wordFreq = new Array(26).fill(0);
for (let char of word) {
    wordFreq[char.charCodeAt(0) - 97]++;
}
```

## 1.7 object

Usage of object:

```js
const bracketPairs = {
    '(': ')',
    '{': '}',
    '[': ']'
};

if (Object.values(bracketPairs).includes(char)) 
```

```js
let myObject = { name: "Alice", age: 30, city: "New York" };
let emptyObject = {};

// Access
let personName = myObject.name;   // "Alice" (dot notation)
let personAge = myObject["age"]; // 30 (bracket notation, useful for dynamic keys)

// Modify/Add
myObject.age = 31;                 // { name: "Alice", age: 31, city: "New York" }
myObject["job"] = "Engineer";      // { ..., job: "Engineer" }

// Delete
delete myObject.city; // { name: "Alice", age: 31, job: "Engineer" }

// Check existence
if ("name" in myObject) {
    console.log("Name property exists.");
}
if (myObject.hasOwnProperty("job")) { // Recommended for own properties
    console.log("Job is an own property.");
}

// Iteration (ES6+)
const keys = Object.keys(myObject);      // ["name", "age", "job"]
const values = Object.values(myObject);  // ["Alice", 31, "Engineer"]
const entries = Object.entries(myObject); // [["name", "Alice"], ["age", 31], ["job", "Engineer"]]

keys.forEach(key => console.log(key, myObject[key]));
for (const [key, value] of entries) { // Destructuring in for...of
    console.log(`${key}: ${value}`);
}

// Merging Objects (ES6+)
const obj1 = { a: 1, b: 2 };
const obj2 = { b: 3, c: 4 };
const merged = { ...obj1, ...obj2 }; // { a: 1, b: 3, c: 4 } (later properties overwrite earlier ones)
```

## 1.8 Spread Operation

```js
// Spread Operator in Arrays
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];  // Spread arr1 and add more elements
console.log(arr2);  // [1, 2, 3, 4, 5]

// Spread Operator in Objects
const obj1 = { a: 1, b: 2 };
const obj2 = { ...obj1, c: 3 };  // Spread obj1 and add more properties
console.log(obj2);  // { a: 1, b: 2, c: 3 }

// Spread Operator for Cloning Arrays and Objects
const arr1 = [1, 2, 3];
const arr2 = [...arr1];
const obj1 = { a: 1, b: 2 };
const obj2 = { ...obj1 };

// Combining Arrays or Objects
const arr1 = [1, 2];
const arr2 = [3, 4];
const combinedArr = [...arr1, ...arr2];  // Combine both arrays
const obj1 = { a: 1, b: 2 };
const obj2 = { c: 3, d: 4 };
const combinedObj = { ...obj1, ...obj2 };  // Combine both objects

// Handling Function Arguments
function greet(...names) {
  console.log("Hello " + names.join(", "));
}

const people = ["Alice", "Bob", "Charlie"];
greet(...people);  // Hello Alice, Bob, Charlie
```

# 2. Two Pointers

# 3. Sliding Window

# 4. Matrix

# 5. Hashmap

## 5.1 Using set

```javascript+
let nums = [2, 5, 2, 4];
let set = new Set(nums);
// The Set object will automatically remove any duplicate values from the array. In your example, the array nums contains the following values: 2, 5, 2, and 4. After converting nums to a Set, set will contain only unique values: 2, 5, and 4.
if (elementCount.get(outElement) === 0) {
    elementCount.delete(outElement);
}

const allowedSet = new Set(allowed);

if (!allowedSet.has(char))
allowedSet.add(char)

const totalDistinct = new Set(nums).size;
```

## 5.2 using Map

```js
let occupiedChairs = new Map();
if (occupiedChairs.has(person)) {
    occupiedChairs.delete(person);
}
let chair = (occupiedChairs.get(person) || nextChair++);
occupiedChairs.set(person, chair);
wordMap.set(word, (wordMap.get(word) || 0) + 1);

// CountNum:
const currentCount = map.get(substr) ?? 0;
map.set(substr, newCount);

for (let [key, value] of exampleMap) {
    console.log(`Key: ${key}, Value: ${value}`);
}
```

## 5.3 using {}

```js
let countT = {};
for (let char of t) {
    countT[char] = (countT[char] || 0) + 1;
}
let required = Object.keys(countT).length; // Number of unique characters in T
```

# 6. Intervals

# 7. Stack

Increament stack
Decrement Stack

```js
let top = stack.pop();  // Pop the top of the stack
stack.push(current);  // Push the current index to the stack
```

# 8. Linked List

```js
class Node {
    constructor(value) {
        this.value = value;
        this.next = null; // Points to the next node, null if it's the last
    }
}


```

# 9. Binary Tree

## 9.1 Binary Tree General

## 9.2 Binary Tree BFS

```js
var maxDepth = function(root) {
    if (!root) {
        return 0;
    }

    const queue = [];
    queue.push(root);
    let depth = 0;

    while (queue.length > 0) {
        depth++;

        const levelSize = queue.length;
        for (let i = 0; i < levelSize; i++) {
            const node = queue.shift();
            if (node.left) {
                queue.push(node.left);
            }
            if (node.right) {
                queue.push(node.right);
            }
        }
    }

    return depth;    
};
```

## 9.3 Binary Tree DFS

```js
function binaryTreeMaximumDepth(root) {
    if (!root) return 0;

    return Math.max(binaryTreeMaximumDepth(root.left), binaryTreeMaximumDepth(root.right)) + 1;
}
```

## 9.4 Binary Search Tree

# 10. Graph

## 10.1 General

## 10.2 Graph BFS

# 11. Trie

## 11.1 Trie Prefix Tree

```js
/**
 * @param {string[]} words
 * @return {number[]}
 */
class TrieNode {
    constructor() {
        this.children = {};  // Child nodes for each character
        this.count = 0;      // Count of words that pass through this node
    }
}

var sumPrefixScores = function(words) {
    const root = new TrieNode();  // Root of the Trie
    
    // Helper function to insert a word into the Trie and update prefix counts
    const insert = (word) => {
        let node = root;
        for (let char of word) {
            if (!node.children[char]) {
                node.children[char] = new TrieNode();  // Create new node if it doesn't exist
            }
            node = node.children[char];
            node.count++;  // Increment the count for this prefix
        }
    };

    // Insert all words into the Trie
    for (let word of words) {
        insert(word);
    }

    // Helper function to compute the sum of prefix scores for a given word
    const computeScore = (word) => {
        let node = root;
        let score = 0;
        for (let char of word) {
            node = node.children[char];
            score += node.count;  // Add the count for this prefix
        }
        return score;
    };

    // Compute the prefix scores for each word
    const result = [];
    for (let word of words) {
        result.push(computeScore(word));
    }

    return result;
};
```

# 12. Backtracking

# 13. Divide & Conquer

# 14. Kadane's Algorithm

# 15. Binary Search

```js
// Binary search to find the largest price <= query
while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (maxBeauty[mid][0] <= query) {
        maxBeautyForQuery = maxBeauty[mid][1];
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}

function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
      return mid; // Target found
    } else if (arr[mid] < target) {
      left = mid + 1; // Search in the right half
    } else {
      right = mid - 1; // Search in the left half
    }
  }

  return -1; // Target not found
}
```

# 16. Heap

## 16.1 MaxPriorityQueue

```javascript
// create a 
const maxKelements = function (nums, k) {
  const pq = new MaxPriorityQueue({ compare: (a, b) => b - a }) // The comparison function ensures that elements with higher values have higher priority
  for (const num of nums) {
    pq.enqueue(num) // Enqueue the number into the priority queue
  }
  let score = 0
  while (k) {
    const ele = pq.dequeue() // Dequeue the highest priority element from the priority queue
    score += ele
    pq.enqueue(Math.ceil(ele / 3))
    k--
  }
  return score
}

// Second create a simple PriorityQueue
const q = new MaxPriorityQueue();
q.enqueue(i);
const val = q.dequeue().element;
while (!q.isEmpty())
```

@@ 16.2 MinPriorityQueue

```js
class NumberContainers {
  constructor() {
    this.nums = {};
    this.numMap = {};
  }

  change(index, number) {
    this.nums[index] = number;

    if (!this.numMap[number]) {
      this.numMap[number] = new MinPriorityQueue();
    }

    this.numMap[number].enqueue(index);
  }

  find(number) {
    while (
      this.numMap[number] &&
      this.numMap[number].size() > 0 &&
      this.nums[this.numMap[number].front().element] !== number
    ) {
      this.numMap[number].dequeue();
    }

    return this.numMap[number] && this.numMap[number].size() > 0
      ? this.numMap[number].front().element
      : -1;
  }
}
```

# 17. Bit Manipulation

1. Prefix Usage

```javascript
for (let i = 0; i < arr.length; i++) {
    prefixXOR[i + 1] = prefixXOR[i] ^ arr[i];
}


# 18. Math

```

# 19. DP

## 19.1 1D DP

## 19.2 Multidimensional DP

# 20. BFS

## 20.1 Basic BFS with tree

```javascript
var kthLargestLevelSum = function(root, k) {
    if (!root) return -1;

    // BFS queue
    let queue = [root];
    let levelSums = [];

    // Perform level-order traversal (BFS)
    while (queue.length > 0) {
        let levelSize = queue.length;
        let levelSum = 0;

        // Process all nodes in the current level
        for (let i = 0; i < levelSize; i++) {
            let node = queue.shift();
            levelSum += node.val;

            // Add the child nodes to the queue
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }

        // Store the sum of the current level
        levelSums.push(levelSum);
    }

    ... // other operations based on the result
};
```

# 21. DFS

## 21.1 DFS Tree

Flip Equivalent Binary Trees

```javascript
var flipEquiv = function(root1, root2) {
    // Base case: both nodes are null, they are flip equivalent
    if (root1 === null && root2 === null) return true;
    
    // If only one of them is null or values don't match, return false
    if (root1 === null || root2 === null || root1.val !== root2.val) return false;

    // Check if without flip, they are flip equivalent
    let noFlip = flipEquiv(root1.left, root2.left) && flipEquiv(root1.right, root2.right);
    
    // Check if with flip, they are flip equivalent
    let withFlip = flipEquiv(root1.left, root2.right) && flipEquiv(root1.right, root2.left);

    // Return true if either the noFlip or withFlip check succeeds
    return noFlip || withFlip;
};
```

## 21.2 DFS graph safe node

```js
var eventualSafeNodes = function(graph) {
    const n = graph.length;
    const result = new Array(n).fill(0);

    const dfs = (node) => {
        if (result[node] !== 0) return result[node] === 2;
        result[node] = 1;
        for (let neighbor of graph[node]) {
            if (result[neighbor] === 1 || !dfs(neighbor)) return false;   
        }
        result[node] = 2;
        return true;
    };
    const safeNodes = [];
    for (let node = 0; node < n; node++) {
        if (dfs(node)) safeNodes.push(node);
    
    }
    return safeNodes;
};
```

## 21.3 DFS Graph with set

```js
var checkIfPrerequisite = function(numCourses, prerequisites, queries) {
    // Build the graph from prerequisites
    const graph = Array.from({ length: numCourses }, () => []);
    for (let [src, dest] of prerequisites) {
        graph[src].push(dest);
    }
    
    // Memoization object to store reachable nodes for each course
    const memo = new Array(numCourses).fill(null);
    
    // Helper function: DFS to find all courses reachable from the current course
    function dfs(course) {
        if (memo[course] !== null) {
            return memo[course]; // Return cached result if already computed
        }
        
        const reachable = new Set();
        // Visit each course that can be reached directly from `course`
        for (let nextCourse of graph[course]) {
            reachable.add(nextCourse);
            // Add all courses reachable from `nextCourse`
            for (let subCourse of dfs(nextCourse)) {
                reachable.add(subCourse);
            }
        }
        
        memo[course] = reachable; // Cache the result
        return reachable;
    }
    
    // Precompute the reachable courses for each course using DFS
    for (let course = 0; course < numCourses; course++) {
        if (memo[course] === null) {
            dfs(course);
        }
    }
    
    // Answer the queries
    const result = [];
    for (let [u, v] of queries) {
        result.push(memo[u].has(v)); // Check if v is reachable from u
    }
    
    return result;
};

```

## 21.4 DFS with string and normally operation

```ts
function canPartition(num:string, target, start) {
    if (target === 0 && start === num.length) return true;
    if (start >= num.length) return false;
    
    let sum = 0;
    for (let i = start; i < num.length; i++) {
        // check every conjunction of nums from 1 to 14 to 145 to 1452 for 1452 for exmaple
        sum = sum * 10 + parseInt(num[i], 10);
        if (sum > target) break;
        if (canPartition(num, target - sum, i + 1)) return true;
    }
    
    return false;
}
```

# 22. Math

## 22.1 Math Operation

`math.ceil` - get up of the result. like: 1.2 => 2;

`Math.floor` - get down, 1.2 => 1

`Math.sqrt` - Square root 9 => 3

`m = Math.min(...nums)`  min from an array of nums

## 22.2 Value Operation

- judge value type:

```js
typeof value === 'boolean' | 'number' | 'string' | 'symbol' | 'undefined' | null // null is a special case since typeof null returns "object"
Array.isArray(value)
typeof value === 'function'
typeof value === 'object'
typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
```

- save decimal places

these methods return string!

```js
positiveProportion.toFixed(6) // scaled to six decimal places
x.toPrecision()
```

- Interger

```js
Number.MAX_SAFE_INTEGER
Number.MIN_SAFE_INTEGER

// float
Number.MAX_VALUE
Number.MIN_VALUE
```

# 23. Regex

Using Search tp find:

```js
const regex = new RegExp(needle);
return haystack.search(regex);
```

# 24 Greedy

# 25 Bit operation

```js
// AND &, OR |, XOR ^, NOT ~， shift << >>,

// Count the number of 1s in num2 using bitwise operations
for (let i = num2; i > 0; i >>= 1) {
    if (i & 1) num2Bit1Length++;
}

// First, set bits in result from num1 while matching the 1-bits count in num2
for (let i = 31; i >= 0; i--) {
    // Check if the i-th bit in num1 is 1
    if ((num1 >> i) & 1) {
        // If there are still 1s left to place, set this bit in result
        if (num2Bit1Length > 0) {
            result |= (1 << i); // Set the i-th bit in result
            num2Bit1Length--;  // Decrease the number of 1s we need to place
        }
    }
}
```

# 30. Public Method

## 30.1 Get Primes

```js
function getPrimes(num) {
    let res = []
    let primes = new Array(num).fill(true)
    primes[0] = primes[1] = false

    for(let i = 2; i <= Math.sqrt(num); ++i) {
        if(primes[i]) {
            for(let j = i * i; j <= num; j+=i) primes[j] = false
        }
    }

    for(let i = 0; i <= num; ++i) if(primes[i]) res.push(i)

    return res
}
```
