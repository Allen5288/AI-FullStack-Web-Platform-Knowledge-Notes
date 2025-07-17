function eraseOverlapIntervals(intervals: number[][]): number {
    let res = 0;
    intervals.sort((x, y)=>x[1] - y[1]);
    let lastEnd = -Infinity;

    for(const interval of intervals){
        const start = interval[0];
        const end = interval[1];

        if(start>=lastEnd){
            lastEnd = end;
        }else{
            res += 1;
        }
    }

    return res;
};