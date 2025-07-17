/**
 * Definition for a binary tree node.
 * class TreeNode {
 *     val: number
 *     left: TreeNode | null
 *     right: TreeNode | null
 *     constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
 *         this.val = (val===undefined ? 0 : val)
 *         this.left = (left===undefined ? null : left)
 *         this.right = (right===undefined ? null : right)
 *     }
 * }
 */

function rightSideView(root: TreeNode | null): number[] {
    const ret:number[] = [];
    const queue:TreeNode[] = [];
    
    if(root === null) return ret; // collect empty
    
    queue.push(root);
    
    while(queue.length !== 0) {
        let counts = queue.length;
        
        const last = queue[queue.length - 1];
        ret.push(last.val); // collect last node value of this level
        while(counts--!==0) {
            const first = queue.shift();
            first.left!==null && queue.push(first.left);
            first.right!==null && queue.push(first.right);
        }
    }
    
    return ret;    
};