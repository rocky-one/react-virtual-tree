import {
    getColSum
} from './common'
// 根据左侧点击cell 设置选中行区域
export const setAreaByLeftCell = (cell, endColIndex = 0) => {
    const rowSpan = cell.newRowSpan || cell.rowSpan
    return {
        startRowIndex: cell.newRowIndex,
        startColIndex: 0,
        endRowIndex: rowSpan > 1 ? (cell.newRowIndex + rowSpan - 1) : cell.newRowIndex,
        endColIndex: endColIndex
    }
}

// 根据点击头部cell 设置选中列区域
export const setAreaByHeaderCell = (cell, endRowIndex = 0, leftColSpanSum = 0) => {
    return {
        startRowIndex: 0,
        startColIndex: leftColSpanSum,
        endRowIndex: endRowIndex,
        endColIndex: leftColSpanSum + (cell.newColSpan || cell.colSpan) - 1,
    }
}

// 选中全表
export const setAreaAll = (tableData, area) => {
    if(!tableData || tableData.length===0) return area
    return {
        startRowIndex: 0,
        startColIndex: 0,
        endRowIndex: tableData.length - 1,
        endColIndex: getColSum(tableData) - 1,
    }
}