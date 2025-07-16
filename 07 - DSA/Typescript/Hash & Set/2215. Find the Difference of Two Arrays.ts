function findDifference(nums1: number[], nums2: number[]): number[][] {
    // Creating two Sets for both Array of numbers.
    const [ansSet1, ansSet2] = [new Set(nums1), new Set(nums2)];
    
    return [
        // Filtering the first Set by occurences in the second Set via delete
        // we get a filtered Set for the second answer-item.
        [...ansSet1].filter(n => !ansSet2.delete(n)), 
        // this will remove the elements from ansSet2 that are in ansSet1
        // ! for ansSet2 is used to keep the elements that are not in ansSet1
        [...ansSet2]
    ];
};

// if nums1 and nums2 are non-unique for themselves, we can use a Map to count the occurences
function findDifferenceWithMap(nums1: number[], nums2: number[]): number[][] {
    const [ansMap1, ansMap2] = [new Map<number, number>(), new Map<number, number>()];
    
    // Counting occurences for nums1
    for (const n of nums1) {
        ansMap1.set(n, (ansMap1.get(n) || 0) + 1);
    }
    
    // Counting occurences for nums2
    for (const n of nums2) {
        ansMap2.set(n, (ansMap2.get(n) || 0) + 1);
    }
    
    return [
        // Filtering the first Map by occurences in the second Map via delete
        // we get a filtered Map for the second answer-item.
        [...ansMap1.keys()].filter(n => !ansMap2.delete(n)),
        [...ansMap2.keys()]
    ];
}