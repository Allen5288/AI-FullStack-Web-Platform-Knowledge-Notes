function kidsWithCandies(candies: number[], extraCandies: number): boolean[] {
    let max: number = Math.max(...candies);
    return candies.map((value: number, index: number): boolean => (value + extraCandies) >= max);
};