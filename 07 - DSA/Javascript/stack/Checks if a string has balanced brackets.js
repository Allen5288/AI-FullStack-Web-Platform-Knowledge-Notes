/**
 * Checks if a string has balanced brackets.
 * It ignores any characters that are not brackets.
 *
 * @param {string} str The input string to check.
 * @returns {boolean} True if the brackets are balanced, false otherwise.
 */
function hasBalancedBrackets(str) {
  // Handle invalid or edge case inputs first.
  if (typeof str !== "string") {
    // Or throw an error, depending on desired behavior for invalid types.
    return false;
  }

  const stack = [];
  const bracketMap = {
    ")": "(",
    "]": "[",
    "}": "{",
  };

  // For quick lookup of opening brackets.
  const openingBrackets = new Set(["(", "[", "{"]);

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (openingBrackets.has(char)) {
      // If it's an opening bracket, push it onto the stack.
      stack.push(char);
    } else if (bracketMap[char]) {
      // If it's a closing bracket...
      // Check if the stack is empty or if the top of the stack
      // does not match the corresponding opening bracket.
      if (stack.length === 0 || stack.pop() !== bracketMap[char]) {
        return false; // Mismatched or no opening bracket.
      }
    }
    // Any other character is ignored, as per the requirements.
  }

  // If the stack is empty, all brackets were matched.
  // If not, there are unclosed opening brackets.
  return stack.length === 0;
}
