import {
    ROW_WIDTH,
} from '../tableConst'
import {
    getLastHeaderCells
} from './handleHeaderData'

export const initTableData = (tableAllData = [], leftAllData, leftData, headerAllData, headerData, zero = false) => {
    const headerLastCells = getLastHeaderCells(headerAllData)
    const newTableAllData = []
    tableAllData.forEach((row, i) => {
        let newRow = {}
        let cells = row.cells
        const leftLastCell = getLeftRowLastCell(leftAllData, i)
        newRow.x = leftLastCell.x
        newRow.y = leftLastCell.y
        newRow.height = leftLastCell.height
        newRow.rowIndex = i
        let newCells = []
        cells.forEach((cell, j) => {
            let newCell = { ...cell }
            newCell.oldRowIndex = cell.rowIndex
            newCell.oldColumnIndex = cell.columnIndex
            newCell.x = headerLastCells[j].x
            newCell.y = leftLastCell.y
            newCell.width = headerLastCells[j].width
            newCell.height = leftLastCell.height
            newCell.id = newCell.id || `${i}${j}`
            newCells.push(newCell)
        })
        newRow.cells = newCells
        newTableAllData.push(newRow)
    })
    return {
        tableAllData: newTableAllData,
        tableData: zero ? newTableAllData : setTableData(leftData, headerData, newTableAllData)
    }
}

export const getLeftRowLastCell = (leftData = [], row) => {
    let leftDataLen = leftData.length
    if (leftDataLen === 0) return false

    if (row > leftDataLen - 1) {
        let cells = leftData[leftDataLen - 1].cells
        return cells[cells.length - 1]
    }
    let cells = leftData[row].cells
    return cells[cells.length - 1]

}

/**
 * 根据表头和左侧表的数据 设置表格区域的数据
 * @param {array} leftData 
 * @param {array} headerData 
 * @param {array} tableData  
 */
export const setTableData = (leftData = [], headerData = [], tableAllData = [], rowKey = 'oldRowIndex', colKey = 'oldColumnIndex') => {
    let newTableData = setTableRows(leftData, tableAllData, rowKey)
    newTableData = setTableCols(leftData, headerData, newTableData, colKey)
    return newTableData
}

export const setTableRows = (leftData = [], tableAllData = [], rowKey) => {
    const rowIndexObj = getLeftDataIndex(leftData, rowKey);
    let newTableData = [];
    tableAllData.forEach(row => {
        let newRow = {
            ...row
        };
        if (row.cells.length > 0 && rowIndexObj[row.cells[0][rowKey]]) {
            newTableData.push(newRow);
        }
    })
    return newTableData
}

export const setTableCols = (leftData = [], headerData = [], newTableData = [], colKey) => {
    const headerLastCells = getLastHeaderCells(headerData)
    const headerColIndex = getHeaderDataIndex(headerData, colKey);
    newTableData.forEach((row, index) => {
        const cells = row.cells;
        const cs = [];
        let leftCell = leftData[index].cells[leftData[index].cells.length - 1]
        let preCell = false;
        let newColIndex = 0
        // row.height = leftCell.height
        // row.y = leftCell.y //preRow ? preRow.y + preRow.height : 0 
        row.rowIndex = index
        for (let j = 0; j < cells.length; j++) {
            let cell = cells[j];
            //let hasCol = headerColIndex.findIndex(i => i === cell.columnIndex);
            if (headerColIndex[cell[colKey]]) {//hasCol >= 0
                cell.x = preCell ? preCell.x + preCell.width : 0
                cell.y = leftCell.y //leftData[index].cells[]//row.y
                cell.newColIndex = newColIndex++;
                cell.newRowIndex = index;
                cell.height = row.height
                cell.width = headerLastCells[cell.newColIndex].width || ROW_WIDTH
                cs.push(cell);
                preCell = cell;
            }
        }
        row.cells = cs;
    })
    return newTableData
}

/**
 * 根据左侧数据获取 当前数据显示行的索引
 * @param {array} leftData 
 */
const getLeftDataIndex = (leftData = [], key) => {
    let indexObj = {};
    leftData.forEach(row => {
        let cells = row.cells;
        let last = cells[cells.length - 1];
        indexObj[last[key]] = true;
    });

    return indexObj;
}


/**
 * 根据表格头部数据获取当前显示列的数据的索引
 * @param {array} headerData 
 */
const getHeaderDataIndex = (headerData = [], key) => {
    let indexObj = {};
    if (headerData.length > 0) {
        let lastCells = headerData[headerData.length - 1].cells;
        lastCells.forEach(cell => {
            // indexArr.push(cell[key]);
            indexObj[cell[key]] = true;
        });
    }

    return indexObj;
}

export const initTableAllDataOldIndex = (data = []) => {
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].cells.length; j++) {
            data[i].cells[j].oldRowIndex = data[i].cells[j].rowIndex
            data[i].cells[j].oldColumnIndex = data[i].cells[j].columnIndex
        }
    }
    return data
}