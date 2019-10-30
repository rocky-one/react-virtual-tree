import {
    findCellChildIsShowRows,
    getSpliceStartIndex,
    recursionPre,
} from './handleLeftData'
import {
    getLastHeaderCells
} from './handleHeaderData'
import {
    getHeaderDataIndex
} from './handleTableData'

import { defer } from './common'
/**
 * 
 * @param {*} obj 
 */
export const onExpandRowNew = (obj) => {

    if (obj.cell.open) {
        return colseRow(obj)
    }

    return openRow(obj)
}
const setBodyRows = (tableAllData = [], info) => {
    if (info.open) {
        const newTableData = []
        const keys = Object.keys(info.changeData)
        for (let i = 0; i < keys.length; i++) {
            const row = tableAllData[keys[i]]
            newTableData.push({ ...row })
        }
        info.tableData.splice(info.startIndex, 0, ...newTableData)
    } else {
        info.tableData.splice(info.startIndex, info.delDataLen)
    }
    return info.tableData
}
function recoveryXy(index, len, data, rowViewTotal) {
    let px = rowViewTotal * 30
    for (; index < len; index++) {
        if (index > len) break
        if (data[index]) {
            const cells = data[index].cells
            for (let i = 0; i < cells.length; i++) {
                cells[i].y += px
            }
        }
    }
}
// 更新坐标和索引
let fragment = -1
const updateCellAfterData = (obj) => {
    let {
        cell, leftData, rowViewTotal, tableData, colKey, headerData,
        startIndex, changeDataLen,
    } = obj
    let i = startIndex
    let bodyIndex = startIndex
    let length = leftData.length
    let pre = {
        y: cell.y,
        height: cell.height
    }
    fragment = -1
    function update(len) {
        for (; i < len; i++) {
            if (!leftData[i] || fragment < 0) break
            const cells = leftData[i].cells
            for (let j = 0; j < cells.length; j++) {
                const c = cells[j]
                c.y = pre.y + pre.height
                c.newRowIndex = i
                c.newColIndex = j
                if (j === cells.length - 1) {
                    pre = {
                        y: c.y,
                        height: c.height
                    }
                }
            }
        }
    }
    const headerLastCells = getLastHeaderCells(headerData)
    const headerColIndex = getHeaderDataIndex(headerData, colKey)

    function updateTable(len) {
        for (; bodyIndex < len; bodyIndex++) {
            if (fragment < 0 || !tableData[bodyIndex]) break
            const cells = tableData[bodyIndex].cells;
            const cs = [];
            let leftCell = leftData[bodyIndex].cells[leftData[bodyIndex].cells.length - 1]
            let newColIndex = 0
            let preCell = false
            tableData[bodyIndex].rowIndex = bodyIndex
            //tableData[bodyIndex].y = leftCell.y
            for (let j = 0; j < cells.length; j++) {
                let cell = cells[j];
                if (!cell) break
                if (headerColIndex[cell[colKey]]) {
                    cell.x = preCell ? preCell.x + preCell.width : 0
                    cell.y = leftCell.y
                    cell.newColIndex = newColIndex++;
                    cell.newRowIndex = bodyIndex;
                    cell.height = tableData[bodyIndex].height
                    cell.width = headerLastCells[cell.newColIndex].width || ROW_WIDTH
                    cs.push(cell);
                    preCell = cell;
                }
            }
            tableData[bodyIndex].cells = cs;
        }
    }
    // update(length)
    // updateTable(length)
    // return { leftData, tableData }
    let firstEndIndex = startIndex + rowViewTotal
    // 重叠现象
    if (cell.open && firstEndIndex < length) {
        let index = startIndex + changeDataLen
        let len = index + rowViewTotal
        recoveryXy(index, len, leftData, rowViewTotal)
        recoveryXy(index, len, tableData, rowViewTotal)
    }

    let num = 500
    fragment = Math.ceil(length / num)
    function loop() {
        if (fragment > 0) {
            defer(() => {
                fragment--
                firstEndIndex += num
                if (firstEndIndex > length) firstEndIndex = length
                update(firstEndIndex)
                updateTable(firstEndIndex)
                loop()
            })
        }
    }
    if (firstEndIndex < length) {
        update(firstEndIndex)
        updateTable(firstEndIndex)
        // 延迟计算
        loop()
    } else {
        update(length)
        updateTable(length)
    }

    return { leftData, tableData }
}
// 设置新展开数据的坐标 和 索引
const setOpenDataIndexAndXY = (obj) => {
    const { cell, newData = [], leftData = [], tableData, rowViewTotal, startIndex, headerData, changeDataLen } = obj
    let rowHeightSum = 0
    let changeData = []
    for (let i = 0; i < newData.length; i++) {
        const cells = newData[i].cells
        const lastCell = cells[cells.length - 1]
        const rowIndex = lastCell.rowIndex
        changeData.push(rowIndex)
        rowHeightSum += lastCell.height
        // for (let j = 0; j < cells.length; j++) {
        //     const c = cells[j]
        //     c.y = pre.y + pre.height
        //     c.newRowIndex = i + si
        //     c.newColIndex = j
        //     if (j === cells.length - 1) {
        //         pre = {
        //             y: c.y,
        //             height: c.height
        //         }
        //         rowHeightSum += c.height
        //     }
        // }
    }
    const dataObj = updateCellAfterData({
        cell,
        leftData,
        headerData,
        rowHeightSum: rowHeightSum,
        changeDataLen,
        rowViewTotal,
        tableData,
        colKey: 'oldColumnIndex',
        startIndex
    })

    return {
        leftData: leftData.length === 0 ? newData : dataObj.leftData,
        tableData,
        changeData,
    }
}

// 展开
const openRow = (obj) => {
    let {
        cell, leftData, leftAllData, rowViewTotal, tableAllData, tableData, headerData,
    } = obj
    let newData = [];
    let changeData = {}
    let changeDataLen = 0
    cell.open = true;
    newData = findCellChildIsShowRows(cell, leftAllData, (c) => {
        changeData[c.rowIndex] = c.rowIndex
        changeDataLen++
        recursionPre(c, 'preCell', leftAllData, (pCell) => {
            if (!pCell.newRowSpan) {
                pCell.newRowSpan = 1
            } else {
                pCell.newRowSpan += 1
            }
            if (!pCell.height) {
                pCell.height = c.height
            } else {
                pCell.height += c.height
            }
        })
    })

    //  插入新的行
    let spliceIndex = getSpliceStartIndex(cell)
    leftData.splice(spliceIndex, 0, ...newData)

    const tableData2 = setBodyRows(tableAllData, {
        changeData,
        tableData,
        open: cell.open,
        startIndex: spliceIndex,
        changeDataLen
    })
    return setOpenDataIndexAndXY({
        cell,
        newData,
        leftData,
        tableData: tableData2,
        headerData,
        changeDataLen: newData.length,
        rowViewTotal,
        startIndex: spliceIndex
    })
}

const colseRow = (obj) => {
    let {
        cell, leftData, leftAllData, rowViewTotal, tableAllData, tableData, headerData,
    } = obj
    let childData = [];
    cell.open = false;
    childData = findCellChildIsShowRows(cell, leftAllData)
    let startIndex = getSpliceStartIndex(cell);
    let delData = leftData.splice(startIndex, childData.length);
    // 计算新的rowSpan数
    let rowSpanSum = 0
    let rowHeightSum = 0
    for (let i = 0; i < childData.length; i++) {
        const cells = childData[i].cells
        const lastCell = cells[cells.length - 1]
        rowSpanSum += (lastCell.newRowSpan || lastCell.rowSpan)
        rowHeightSum += lastCell.height
    }
    recursionPre(cell, 'preCell', leftAllData, (pCell) => {
        if (pCell) {
            pCell.newRowSpan -= rowSpanSum
            pCell.height -= rowHeightSum
        }
    })
    for (let i = 0; i < delData.length; i++) {
        const cells = delData[i].cells
        for (let j = 0; j < cells.length; j++) {
            const c = cells[j]
            if (j != cells.length - 1) {
                c.newRowSpan = null
                c.height = null
            }
        }
    }
    const tableData2 = setBodyRows(tableAllData, {
        delDataLen: delData.length,
        tableData,
        open: cell.open,
        startIndex
    })
    const dataObj = updateCellAfterData({
        cell,
        leftData,
        headerData,
        rowHeightSum: -rowHeightSum,
        changeDataLen: 0,
        rowViewTotal,
        tableData: tableData2,
        colKey: 'oldColumnIndex',
        startIndex
    })

    return {
        leftData: dataObj.leftData,
        tableData: dataObj.tableData,
    }
}