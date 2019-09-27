/**
 * @desc  广度
 * @param {*} tree 
 * @param {*} cb 
 */
export function bfTree(tree = [], cb) {
    let queue = []
    for (let i = 0; i < tree.length; i++) {
        if (!tree[i].hasOwnProperty('level')) tree[i].level = 0
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

/**
 * 深度
 * @param {*} tree 
 * @param {*} cb 
 */
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
                    queue.splice(index + j, 0, childrenList[j])
                }
            }
        }
    }
    return nodeList
}

/**
 * 获取父项选中状态 如果当前子节点全部选中则父项选中
 * @param {*} childData 
 */
export const getParentCheckStatus = (childData = []) => {
    let status = 0
    let sum = 0
    for (let i = 0; i < childData.length; i++) {
        if (childData[i].checked === 1) {
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

/**
 * 移除可视数据节点
 * @param {*} item 
 * @param {*} viewData 
 */
export const removeViewDataNode = (item, viewData = []) => {
    if (item) {
        const index = viewData.findIndex(n => n.id === item.id)
        const delData = viewData.splice(index, 1)
        // 删除间接子集节点
        for (let i = index; i < viewData.length; i++) {
            if (viewData[i].level <= delData[0].level) {
                break
            }
            viewData.splice(i, 1)
            i--
        }
    }
    return viewData
}

/**
 * 移除映射数据节点
 * @param {*} item 
 * @param {*} mapData 
 */
export const removeMapDataNode = (item, mapData = {}) => {
    if (item) {
        let data
        if (!item.parentId) {
            data = mapData['0']['root']
        } else {
            data = mapData[item.level][item.parentId]
        }
        const index = data.findIndex(n => n.id === item.id)
        const delNode = data.splice(index, 1)
        if (item.parentId) {
            const itemParent = getItemParentInMapData(item, mapData)
            const child = itemParent.children || []
            const pindex = child.findIndex(n => n.id === item.id)
            child.splice(pindex, 1)
        }

        // 如果当前节点有子节点 需要删除映射数据
        if (delNode[0].children && delNode[0].children.length) {
            bfTree(delNode, (item) => {
                if (item.children && item.children.length)
                    mapData[item.level + 1][item.id] = null
            })
        }
        // 如果当前data.length===0 需要设置父项hasLeaf
        if (delNode && delNode[0].parentId && data.length === 0) {
            const level = delNode[0].level - 1
            let pData
            if (level === 0) {
                pData = mapData['0']
            } else {
                pData = mapData[level]
            }
            const keys = pData ? Object.keys(pData) : []
            breakSign:
            for (let i = 0; i < keys.length; i++) {
                const data = pData[keys[i]]
                for (let j = 0; j < data.length; j++) {
                    if (delNode[0].parentId === data[j].id) {
                        data[j].hasLeaf = false
                        data[j].children = null
                        break breakSign
                    }
                }
            }
        }
    }
    return mapData
}

/**
 * 删除后设置新的勾选状态
 * @param {*} delItem 
 * @param {*} mapData 
 */
export const setCheckStatusByDel = (delItem, mapData) => {
    let curItem = delItem
    let level = curItem.level
    for (let i = level; i >= 0; i--) {
        if (!curItem.parentId) break
        const data = mapData[i][curItem.parentId]
        let sum = 0
        for (let h = 0; h < data.length; h++) {
            if (data[h].checked === 1) {
                sum++
            }
        }
        // 找当前节点的父节点 改变选中状态
        let parentItem
        if (i > 0) {
            const keys = Object.keys(mapData[i - 1])
            breakSign:
            for (let h = 0; h < keys.length; h++) {
                const pData = mapData[i - 1][keys[h]]
                for (let j = 0; j < pData.length; j++) {
                    if (pData[j].id === curItem.parentId) {
                        parentItem = pData[j]
                        curItem = parentItem
                        break breakSign
                    }
                }
            }
        }
        if (parentItem) {
            if (sum === 0) {
                parentItem.checked = 0
            } else if (sum === data.length) {
                parentItem.checked = 1
            } else {
                parentItem.checked = 2
            }
        }

    }
}

export const getItemParentInMapData = (item, mapData) => {
    let parentData = {}
    let parentLevel = Number(item.level) - 1
    let parent = null
    if (parentLevel > -1) {
        parentData = mapData[parentLevel]
        let dataKeys = Object.keys(parentData)
        breakSign:
        for (let i = 0; i < dataKeys.length; i++) {
            const d = parentData[dataKeys[i]] || []
            for (let j = 0; j < d.length; j++) {
                if (d[j].id === item.parentId) {
                    parent = d[j]
                    break breakSign
                }
            }
        }
    }
    return parent
}

export const getItemPath = (item, mapData) => {
    let path = [item.id]
    function loop(item, mapData) {
        const parent = getItemParentInMapData(item, mapData)
        path.push(parent.id)
        if (parent.parentId) {
            loop(parent, mapData)
        }
    }
    loop(item, mapData)

    return path
}

export const createRootItem = () => {
    return {
        level: -1,
        id: null,
    }
}