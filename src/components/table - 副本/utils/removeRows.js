import { findPre } from './common'

function findRowParent(cell, rowIndex, leftData, cb) {
    const newRowIndex = rowIndex//cell.newRowIndex
    let reallyParentId = cell.reallyParentId
    if (reallyParentId) {
        outerFor:
        for (let i = newRowIndex; i >= 0; i--) {
            const cells = leftData[i].cells
            for (let j = 0; j < cells.length; j++) {
                if (reallyParentId && reallyParentId == cells[j].id) {
                    cb && cb(cells[j])
                    if (cells[j].reallyParentId) {
                        reallyParentId = cells[j].reallyParentId
                    } else {
                        break outerFor
                    }
                }
            }
        }
    }
}


function removeRowHasDelete(data = []) {
    for (let i = data.length - 1; i >= 0; i--) {
        const cells = data[i].cells
        for (let j = 0; j < cells.length; j++) {
            cells[j].nextCell = null

            if (cells[j].delete) {
                if (cells[j].childCount > 0) {
                    let breakSign = 0
                    for (let h = i + 1; h < data.length; h++) {
                        if (breakSign >= cells[j].childCount) break
                        const cs = data[h].cells
                        for (let t = 0; t < cs.length; t++) {
                            if (cells[j].columnIndex === cs[t].columnIndex) {
                                cs[t].indentCount -= 1
                                if (cs[t].indentCount === cells[j].indentCount) {
                                    cs[t].parentId = cells[j].parentId
                                }
                                breakSign++
                            }
                        }
                    }
                }
                findRowParent(cells[j], i, data, (parentCell) => {
                    parentCell.childCount -= 1
                })

                cells.splice(j, 1)
                j--
            }
        }
        if (cells.length === 0) {
            data.splice(i, 1)
        }
    }

    return data
}
// 更新坐标 索引
function updateIndex(leftData = [], leftInfoMap) {
    const colMap = {}
    const firstCells = leftData[0].cells || []
    let leftHeight = 0
    firstCells.forEach((item, i) => {
        colMap[i] = 0
    })
    for (let i = 0; i < leftData.length; i++) {
        const cells = leftData[i].cells
        leftData[i].parentId = cells[0].parentId || null

        for (let h = 0; h < cells.length; h++) {
            const cell = cells[h]
            // 更新坐标
            //cell.x = leftInfoMap[cell.columnIndex].x
            //cell.y = colMap[cell.columnIndex]
            colMap[cell.columnIndex] += cell.height
            if (h === cells.length - 1) {
                leftHeight += cell.height
            }

            // 计算子节点 开始和结束的索引
            // if (cell.childCount > 0) {
            //     cell.open = true
            //     leftData[i].open = true

            //     cell.startIndex = cell.rowIndex + cell.rowSpan
            //     let end = cell.startIndex
            //     setIndexBreak:
            //     for (let t = cell.startIndex; t < leftData.length; t++) {
            //         const cells2 = leftData[t].cells
            //         for (let q = 0; q < cells2.length; q++) {
            //             if (cells2[q].columnIndex === cell.columnIndex) {
            //                 if (cells2[q].indentCount > cell.indentCount) {
            //                     end += cells2[q].rowSpan
            //                 } else {
            //                     break setIndexBreak
            //                 }
            //             }
            //         }
            //     }
            //     cell.endIndex = end
            // }
        }
    }
    return {
        leftData,
        leftHeight
    }
}

// 更新位置，对应关系
function moveToCells(leftData = [], leftInfoMap, updateAll) {
    let allLen = leftData.length
    for (let i = 0; i < allLen; i++) {
        const cells = leftData[i].cells
        if (updateAll) {
            leftData[i].rowIndex = i
        }
        // 移动到正确的位置
        const firstCell = cells[0]
        if (firstCell.preCell) {
            for (let j = 0; j < leftData.length; j++) {
                let cells2 = leftData[j].cells
                // 只做 最后一个判断
                const last = cells2[cells2.length - 1]
                if (firstCell.preCell.preCid === last.cid) {
                    cells2.push(...cells)
                    leftData.splice(i, 1)
                    i--
                    allLen--
                    break
                }
            }
        }


        for (let h = 0; h < cells.length; h++) {
            const cell = cells[h]
            cell.newRowSpan = null// cell.rowSpan
            // 更新索引 1更新当前可视数据索引newRowIndex，2更新全部索引 rowIndex
            cell.newRowIndex = i
            if (updateAll) {
                cell.rowIndex = i
            }
            // 更新宽高
            cell.width = leftInfoMap[cell.columnIndex].width
        }
    }

    return {
        leftData,
    }
}

// 更新高
function updateHeight(data) {
    for (let i = 0; i < data.length; i++) {
        const cells = data[i].cells
        for (let h = 0; h < cells.length; h++) {
            const cell = cells[h]
            if (h != cells.length - 1) {
                cell.height = null
            }
            // if (h === cells.length - 1) {
            //     recursionPre(cell, 'preCell', data, (pCell) => {
            //         if (pCell) {
            //             if (!pCell.height) {
            //                 pCell.height = cell.height
            //             } else {
            //                 pCell.height += cell.height
            //             }
            //         }
            //     })
            // }
        }
    }
    // for (let i = 0; i < data.length; i++) {
    //     const cells = data[i].cells
    //     const cell = cells[cells.length - 1]
    //     recursionPre(cell, 'preCell', data, (pCell) => {
    //         if (pCell) {
    //             if (!pCell.height) {
    //                 pCell.height = cell.height
    //             } else {
    //                 pCell.height += cell.height
    //             }
    //         }
    //     })
    // }
    return data
}
// 更新关系
function updatePre(data) {
    for (let i = 0; i < data.length; i++) {
        const cells = data[i].cells
        for (let h = 0; h < cells.length; h++) {
            const cell = cells[h]
            for (let r = i; r < cell.rowSpan + i; r++) { //newRowSpan
                const cells = data[r].cells
                const c = cells.find(item => item.columnIndex === cell.columnIndex + 1)
                if (c) {
                    c.preCell = {
                        rowIndex: i,
                        columnIndex: h,
                        preCid: cell.cid
                    }
                    // 下一级对应关系
                    if (!cell.nextCell) {
                        cell.nextCell = []
                    }
                    cell.nextCell.push({
                        rowIndex: r,
                        columnIndex: cell.columnIndex + 1,
                    })
                }
            }
        }
    }
    return data
}

export const removeRows = (rows = [], data, leftInfoMap, updateAll) => {
    if (rows.length === 0) return false
    const rowsMap = {}
    rows.forEach(i => rowsMap[i] = i)
    for (let i = 0; i < data.length; i++) {
        const cells = data[i].cells
        const cell = cells[cells.length - 1]
        if (rowsMap.hasOwnProperty(cell.rowIndex)) {
            cell.delete = true
            findPre(cell, data, (pre) => {
                if (pre.rowSpan && pre.rowSpan > 1) {
                    pre.rowSpan -= 1
                } else if (pre.rowSpan === 1) {
                    pre.delete = true
                }
            })
        }
    }
    data = removeRowHasDelete(data)
    if (data.length === 0) {
        return {
            leftData: [],
            leftAllData: [],
        }
    }
    const moveObj = moveToCells(data, leftInfoMap, updateAll)
    const leftAllData = updatePre(moveObj.leftData)
    // updateHeight(moveObj.leftData)
    // const updateObj = updateIndex(moveObj.leftData, leftInfoMap)
    return {
        leftData: leftAllData,
        leftAllData: leftAllData,
    }
}

export const removeBodyRows = (rows = [], data = [], updateAll, cb) => {
    if (rows.length > 0) {
        rows.forEach(i => {
            data[i].delete = true
        })
        for (let i = 0; i < data.length; i++) {
            if (data[i].delete) {
                const delData = data.splice(i, 1)
                cb && cb(delData[0].cells)
                i--
            }
            if (i < 0) continue
            data[i].rowIndex = i
            const cells = data[i].cells
            cells.forEach(item => {
                if (updateAll) {
                    item.rowIndex = i
                    item.newRowIndex = i
                } else {
                    item.newRowIndex = i
                }

            })
        }
    }
    return data
}

