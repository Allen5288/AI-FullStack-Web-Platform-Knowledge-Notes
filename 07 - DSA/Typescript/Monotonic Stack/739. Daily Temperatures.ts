function dailyTemperatures(temperatures: number[]): number[] {
    const t = temperatures;
    const answer = new Array(t.length).fill(0);
    if (t.length <= 1) return answer;
    for (let i = t.length - 2; i >= 0; i--) {
        let j = i + 1;
        while (j < t.length) {
            if (t[j] > t[i]) {
                answer[i] = j - i;
                break;
            } 
            if (answer[j] === 0) break;
            j = answer[j] + j;
        }
    }
    return answer;
};