function isPalindrome(str: string): boolean {
  const cleaned = str.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return cleaned === cleaned.split("").reverse().join("");
}
// time complexity: O(n)
// space complexity: O(n)

// Example:
console.log(isPalindrome("A man, a plan, a canal: Panama")); // true
