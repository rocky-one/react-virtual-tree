import {
    ROW_WIDTH,
    ROW_HEIGHT,
    LEFT_ROW_WIDTH,
    SCROLL_SIZE
} from '../tableConst'
import { openLeftByLevel } from './openAndCloseLeft'

// 根据第一行设置对应列的 坐标，宽度映射
export const initLeftInfo = (leftData, miniWidth = false) => {
    let leftInfo = [],
        leftWidth = 0,
        row = leftData.length > 0 ? leftData[0] : false,
        leftInfoMap = {}

    if (row) {
        const cells = row.cells
        cells.forEach(c => {
            const width = c.width || (miniWidth ? ROW_WIDTH : LEFT_ROW_WIDTH)
            leftWidth += width
            leftInfo.push({
                width: width
            })
        })

        leftInfo.forEach((item, i) => {
            !leftInfoMap[i] && (leftInfoMap[i] = {})
            leftInfoMap[i].width = item.width
            if (i > 0) {
                leftInfoMap[i].x = leftInfo[i - 1].width + (leftInfoMap[i - 1].x || 0)
            } else {
                leftInfoMap[i].x = 0
            }
        })
    }
    return {
        leftInfo,
        leftWidth,
        leftInfoMap,
    }
}

// 初始化数据
export const initLeftData = (data = [], leftInfoMap, openLevel = 0) => {
    let leftAllData = [],
        leftData = [],
        hiddenRowsMap = {}, // 存放要隐藏的行
        open = openLevel === Infinity,
        preEndIndex = -1,
        showDataMap = {},
        zeroClearing = {},
        leftHeight = 0

    if(data.length === 0){
        return {
            leftData,
            leftHeight: 0,
            leftAllData,
            showDataMap,
        }
    }

    // 更新坐标
    const colMap = {}
    const firstCells = data[0].cells || []
    firstCells.forEach((item, i) => {
        colMap[i] = 0
    })

    function setIndex(i,cells) {
        for (let j = 0; j < cells.length; j++) {
            const cell = cells[j]
            cell.newRowIndex = i
            cell.newColIndex = j
            cell.y = colMap[cell.columnIndex]
            colMap[cell.columnIndex] += cell.height
            if (j === cells.length - 1) {
                leftHeight += cell.height
            }
        }
    }


    for (let i = 0, len = data.length; i < len; i++) {
        let row = data[i],
            newCells = [],
            curCells = row.cells || [],
            lens = curCells.length

        for (let j = 0; j < lens; j++) {
            const cell = Object.assign({}, curCells[j])
            cell.oldRowIndex = cell.rowIndex
            cell.oldHeight = (cell.height || ROW_HEIGHT) * cell.rowSpan
            cell.width = leftInfoMap[cell.columnIndex].width
            cell.x = leftInfoMap[cell.columnIndex].x
            cell.cid = `${i}${j}`
            if (cell.childCount > 0) {
                cell.open = open
            }
            if (open) {
                cell.newRowSpan = cell.rowSpan
                cell.height = (cell.height || ROW_HEIGHT) * cell.rowSpan
            }
            // 设置对应关系
            initLinkMapping(i, j, cell, data)
            // 计算子节点 开始和结束的索引 用来控制显示隐藏的行数 preEndIndex
            if (cell.childCount > 0 && cell.columnIndex === 0 && preEndIndex < i) {
                let startIndex = cell.rowIndex + cell.rowSpan
                breakSign:
                for (let s = startIndex; s < data.length; s++) {
                    const cs = data[s].cells
                    if (cs[0].columnIndex === 0 && cs[0].indentCount <= cell.indentCount) {
                        preEndIndex = cs[0].rowIndex - 1
                        break breakSign
                    } else {
                        hiddenRowsMap[s] = true
                    }
                }
            }
            newCells.push(cell)
        }

        const last = newCells[newCells.length - 1];
        !open && (last.height = last.height || ROW_HEIGHT)
        last.height = last.height || lastCell.oldHeight
        last.newRowSpan = 1
        // 设置newRowSpan
        if (!open && last.preCell) {
            recursionPre(last, 'preCell', leftAllData, (pCell) => {
                if (pCell) {
                    // 归零处理 避免重复设置
                    if (!zeroClearing[`${pCell.rowIndex}${pCell.columnIndex}`]) {
                        zeroClearing[`${pCell.rowIndex}${pCell.columnIndex}`] = true
                        pCell.newRowSpan = 0
                        pCell.height = 0
                    }
                    pCell.newRowSpan += last.newColSpan
                    pCell.height += last.height
                }
            })
        }

        const newRow = {
            cells: newCells,
        }
        if (open) {
            leftData.push(newRow)
            setIndex(leftData.length-1,newRow.cells)
            showDataMap[last['oldRowIndex']] = true;
        } else if (!open && !hiddenRowsMap[i]) {
            if (newRow.cells.length > 0 && !newRow.cells[0].parentId) {
                leftData.push(newRow)
                setIndex(leftData.length-1,newRow.cells)
                showDataMap[last['oldRowIndex']] = true;
            }
        }
        leftAllData.push(newRow)
    }
    if (openLevel != Infinity && openLevel > 0) {
        let newData = openLeftByLevel(leftAllData, openLevel)
        return {
            leftData: newData,
            leftHeight: getLeftHeight(leftData),
            leftAllData,
            showDataMap,
        }
    }
    return {
        leftData,
        leftHeight,
        leftAllData,
        showDataMap,
    }
}

// 初始化就是展开状态 且无法折叠 只计算一次 所以这里单独写一个方法只处理这种简单展示的情况
export const initOpenLeftData = (data = []) => {
    let leftAllData = [],
        leftHeight = 0,
        preRowLastCell = null

    for (let i = 0, len = data.length; i < len; i++) {
        let row = data[i],
            newCells = [],
            curCells = row.cells || [],
            lens = curCells.length

        for (let j = 0; j < lens; j++) {
            const cell = Object.assign({}, curCells[j])
            if (!cell.rowSpan) cell.rowSpan = 1
            cell.oldRowIndex = cell.rowIndex
            cell.height = ROW_HEIGHT * cell.rowSpan
            cell.width = ROW_WIDTH
            cell.x = cell.columnIndex * ROW_WIDTH
            cell.newRowIndex = i
            cell.newColIndex = cell.columnIndex
            cell.newRowSpan = cell.rowSpan
            cell.reallyParentId = cell.reallyParentId
            cell.cid = `${i}${j}`
            if (preRowLastCell) {
                cell.y = preRowLastCell.y + preRowLastCell.height
            } else {
                cell.y = 0
            }
            if (j === lens - 1) {
                leftHeight += cell.height
                preRowLastCell = cell
            }
            // 设置对应关系
            initLinkMapping(i, j, cell, data)

            newCells.push(cell)
        }
        leftAllData.push({
            cells: newCells,
        })
    }

    return {
        leftData: leftAllData,
        leftAllData,
        leftHeight,
    }
}

// 初始化对应关系
function initLinkMapping(i, j, cell, data = []) {
    for (let r = i; r < cell.rowSpan + i; r++) {
        const cells = data[r].cells
        const c = cells.find(item => item.columnIndex === cell.columnIndex + 1)
        if (c) {
            c.preCell = {
                rowIndex: i,
                columnIndex: j,
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

    return cell
}

// 更新leftData y, newRowIndex, newColIndex 同时计算高
export const updateLeftDataYWithIndex = (leftData = []) => {
    let leftHeight = 0
    if (leftData.length === 0) {
        return {
            leftData,
            leftHeight
        }
    }
    const colMap = {}
    const firstCells = leftData[0].cells || []
    firstCells.forEach((item, i) => {
        colMap[i] = 0
    })
    for (let i = 0; i < leftData.length; i++) {
        const cells = leftData[i].cells
        for (let j = 0; j < cells.length; j++) {
            const cell = cells[j]
            cell.newRowIndex = i
            cell.newColIndex = j
            cell.y = colMap[cell.columnIndex]
            colMap[cell.columnIndex] += cell.height
            if (j === cells.length - 1) {
                leftHeight += cell.height
            }
        }
    }

    return {
        leftData,
        leftHeight
    }
}

// 初始化当前展示数据的rowSpan
export const initLeftNewRowSpan = (data, leftAllData, cb) => {
    const obj = {}
    for (let i = 0; i < data.length; i++) {
        const lastCell = findLastCell(data[i].cells)
        lastCell.height = lastCell.height || lastCell.oldHeight
        lastCell.newRowSpan = 1
        cb && cb(lastCell)
        if (lastCell.preCell) {
            recursionPre(lastCell, 'preCell', leftAllData, (pCell) => {
                if (pCell) {
                    // 归零处理 避免重复设置
                    if (!obj[`${pCell.rowIndex}${pCell.columnIndex}`]) {
                        obj[`${pCell.rowIndex}${pCell.columnIndex}`] = true
                        pCell.newRowSpan = 0
                        pCell.height = 0
                    }
                    pCell.newRowSpan += lastCell.newColSpan || 1
                    pCell.height += lastCell.height || ROW_HEIGHT
                    cb && cb(pCell)
                }
            })
        }
    }
    return data
}


// 获取一行中的最后一个cell
const findLastCell = (cells = []) => {
    const len = cells.length - 1;
    return len >= 0 ? cells[len] : null
}

export const recursionPre = (cell, filedName, data, cb) => {
    const loop = (cell, filedName, data, cb) => {
        if (cell && cell[filedName]) {
            const pCells = data[cell[filedName].rowIndex].cells;
            const pCell = pCells[cell[filedName].columnIndex];
            pCell && cb(pCell);
            if (pCell && pCell[filedName]) {
                loop(pCell, filedName, data, cb)
            }
        }
    }
    loop(cell, filedName, data, cb)
}

// 更新坐标和索引
const updateCellAfterData = (cell, leftData, rowHeightSum, changeDataLen = 0) => {
    let i = cell.newRowIndex + (cell.newRowSpan || cell.rowSpan) + changeDataLen
    let len = leftData.length

    for (; i < len; i++) {
        if (!leftData[i]) break
        const cells = leftData[i].cells
        for (let j = 0; j < cells.length; j++) {
            // const c = cells[j]
            cells[j].newRowIndex = i
            cells[j].newColIndex = j
            cells[j].y += rowHeightSum
        }
    }
    return leftData
}

// 设置新展开数据的坐标 和 索引
export const setOpenDataIndexAndXY = (cell, newData = [], leftData = []) => {
    let rowHeightSum = 0
    let pre = {
        y: cell.y,
        height: cell.height
    }
    let si = cell.newRowIndex + (cell.newRowSpan || cell.rowSpan)
    for (let i = 0; i < newData.length; i++) {
        const cells = newData[i].cells
        for (let j = 0; j < cells.length; j++) {
            const c = cells[j]
            c.y = pre.y + pre.height
            c.newRowIndex = i + si
            c.newColIndex = j
            if (j === cells.length - 1) {
                pre = {
                    y: c.y,
                    height: c.height
                }
                rowHeightSum += c.height
            }
        }
    }
    leftData = updateCellAfterData(cell, leftData, rowHeightSum, newData.length)
    
    return leftData.length === 0 ? newData : leftData
}


// 查找cell的子集
export function findCellChild(cell, leftAllData, cb) {
    breakSign:
    for (let i = cell.rowIndex + 1; i < leftAllData.length; i++) {
        const cells = leftAllData[i].cells
        for (let j = 0; j < cells.length; j++) {
            if (cell.columnIndex === cells[j].columnIndex) {
                if (cells[j].indentCount > cell.indentCount) {
                    cb(i, j, cells[j])
                } else {
                    break breakSign
                }
            }
        }
    }
}


// 查找当前cell下面要显示的全部子级 且是相同列的数据
function findCellChildIsShow(cell, leftAllData, cb) {
    const showChild = []
    const closeId = {}
    findCellChild(cell, leftAllData, (i, j, c) => {
        // 直接子级
        if (cell.indentCount + 1 === c.indentCount) {
            showChild.push(c)
            if (c.open) {
                closeId[c.id] = c.id
            }
            cb && cb(c)
            // 间接子级
        } else {
            if (c.parentId) {
                // 说明父项是展开状态 那当前项也要显示
                if (closeId[c.parentId]) {
                    showChild.push(c)
                    // 说明父项是关闭状态 当前项不需展示 并且如果当前项也有子级 需要把当前项id放到closeId中
                    // 以便于跳过间接子项是展开的状态
                    if (c.open) {
                        closeId[c.id] = c.id
                    }
                    cb && cb(c)
                }
            }
        }
    })

    return showChild
}

// 查找当前cell下所有要显示的子级行
export function findCellChildIsShowRows(cell, leftAllData, cb) {
    const cellChild = findCellChildIsShow(cell, leftAllData)
    const lastColIsShow = []
    for (let i = 0; i < cellChild.length; i++) {
        const n = cellChild[i].nextCell
        if (n) {
            for (let j = 0; j < n.length; j++) {
                const nc = n[j]
                const cells = leftAllData[nc.rowIndex].cells
                // 找到对应的后一个层级的cell
                const c = cells.find(item => item.columnIndex === nc.columnIndex)
                // nextCell横向 说明是直接项 要展示
                if (c.indentCount === 0) {
                    c.nextCell ? cellChild.push(c) : lastColIsShow.push(c)
                    if (c.childCount > 0 && c.open) {
                        const nextShow = findCellChildIsShow(c, leftAllData)
                        if (nextShow.length > 0) {
                            nextShow[0].nextCell ? cellChild.push(...nextShow) : lastColIsShow.push(...nextShow)
                        }
                    }
                }
            }
        } else {
            lastColIsShow.push(cellChild[i])
        }
    }
    const newRows = []
    lastColIsShow.forEach(item => {
        item.height = item.height || ROW_HEIGHT
        item.newRowSpan = 1
        cb && cb(item)
        newRows.push(leftAllData[item.rowIndex])
    })

    return newRows
}


// 获取展开收起时 应该截取的长度 
export const getSpliceStartIndex = (cell) => {
    return cell.newRowIndex + (cell.newRowSpan || cell.rowSpan)
}

export const getLeftHeight = (leftData = []) => {
    let height = 0
    for (let i = 0; i < leftData.length; i++) {
        const cells = leftData[i].cells
        const last = cells[cells.length - 1]
        height += last.height
    }
    return height + SCROLL_SIZE
}

export const leftDataAddRow = (leftData, index, addCells) => {
    const list = leftData
    list.splice(index, 0, ...JSON.parse(JSON.stringify(addCells)))
    for (let i = index; i < list.length; i++) {
        if (i >= 1) {
            const preCell = list[i - 1].cells[0]
            list[i].rowIndex = i
            list[i].cells[0].newRowIndex = i
            list[i].cells[0].rowIndex = i
            list[i].cells[0].y = preCell.y + preCell.height
        } else {
            list[i].rowIndex = 0
            list[i].cells[0].newRowIndex = 0
            list[i].cells[0].rowIndex = 0
            list[i].cells[0].y = 0
        }
    }
    return list
}
