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

function searchBST(root: TreeNode | null, val: number): TreeNode | null {
    let q = [root];
    while(q.length > 0) {
        let node = q.shift();
        if(node.val === val) return node;
        if(node.left) q.push(node.left);
        if(node.right) q.push(node.right);
    }
    return null;
};