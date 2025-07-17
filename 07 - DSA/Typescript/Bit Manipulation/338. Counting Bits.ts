const countBits = (n: number): number[] => {

    const bitCounts = new Uint8Array(n + 1);

    for (let i = 0; i < n + 1; i++) {
        // What the value should be for the current position
        // can be found by right-shifting by 1 (basically 
        // dividing by half) and then use the bit-wise & operator
        // to account for the last bit (will return 1 if the number is odd, 0 if it's even)
        bitCounts[i] = bitCounts[i >> 1] + (i & 1);
    }

    return [...bitCounts];
};