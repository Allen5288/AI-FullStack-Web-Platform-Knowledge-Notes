function removeStars(s: string): string {
    const n = s.length;
    const stack = [];
    
    for (let i = 0; i < n; i++) {
        if (s[i] !== '*') {
            stack.push(s[i]);
        }
        else { stack.pop(); }
    }
    return stack.join('');      
};