export function bfTree(tree = [], cb) {
    let queue = []
    for (let i = 0; i < tree.length; i++) {
        tree[i].level = 0
        queue.push(tree[i])
    }
    while (queue.length != 0) {
        let item = queue.shift()
        cb && cb(item)
        if (item.children) {
            for (let i = 0; i < item.children.length; i++) {
                item.children[i].level = item.level + 1
                queue.push(item.children[i])
            }
        }
    }
}

export function dfsTree(tree = [], cb) {
    let nodeList = []
    if (tree && tree.length > 0) {
        let queue = []
        let index = 0
        for (let i = 0; i < tree.length; i++) {
            if (!tree[i].hasOwnProperty('level')) tree[i].level = 0
            queue.push(tree[i])
        }
        while (queue.length != 0) {
            let item = queue.shift()
            nodeList.push(item)
            let go = true
            if (cb) {
                go = cb(item)
            }
            if (go !== false) {
                let childrenList = item.children || [];
                for (let j = 0; j < childrenList.length; j++) {
                    if (!childrenList[j].hasOwnProperty('level')) childrenList[j].level = item.level + 1
                    queue.splice(index, 0, childrenList[j])
                }
            }
        }
    }
    return nodeList
}


// 获取父项选中状态 如果当前子节点全部选中则父项选中
export const getParentCheckStatus = (childData = []) => {
    let status = 0
    let sum = 0
    for (let i = 0; i < childData.length; i++) {
        if (childData[i].checked) {
            sum++
        }
    }
    if (sum === childData.length) {
        status = 1
    } else if (sum > 0) {
        status = 2
    }
    return status
}