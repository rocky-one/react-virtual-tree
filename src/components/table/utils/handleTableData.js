import {
    ROW_WIDTH,
    ROW_HEIGHT,
} from '../tableConst'
import {
    getLastHeaderCells
} from './handleHeaderData'
import { defer } from './common';

export const initTableData = (
    tableAllData = [],
    leftAllData,
    leftData,
    headerAllData,
    headerData,
    tableBodyHeight,
    showDataMap) => {
    const headerLastCells = getLastHeaderCells(headerAllData)
    const newTableAllData = []
    let tableData = []
    let i = 0, length = tableAllData.length

    const headerColIndex = getHeaderDataIndex(headerData, 'oldColumnIndex')
    function setTableDatas(index, tableData, leftData, colKey) {
        let i = index
        for (; i < tableData.length; i++) {
            const cells = tableData[i].cells;
            const cs = [];
            let leftCell = leftData[i].cells[leftData[i].cells.length - 1]
            let preCell = false;
            let newColIndex = 0
            tableData[i].rowIndex = i
            for (let j = 0; j < cells.length; j++) {
                let cell = cells[j];
                if (!cell) break
                if (headerColIndex[cell[colKey]]) {
                    cell.x = preCell ? preCell.x + preCell.width : 0
                    cell.y = leftCell.y
                    cell.newColIndex = newColIndex++;
                    cell.newRowIndex = i;
                    cell.height = tableData[i].height
                    cell.width = headerLastCells[cell.newColIndex].width || ROW_WIDTH
                    cs.push(cell);
                    preCell = cell;
                }
            }
            tableData[i].cells = cs;
        }
        return tableData
    }

    function init(len) {
        let tableIndex = i
        for (; i < len; i++) {
            const row = tableAllData[i]
            let newRow = {}
            let cells = row.cells
            const leftLastCell = getLeftRowLastCell(leftAllData, i)
            newRow.x = leftLastCell.x
            newRow.y = leftLastCell.y
            newRow.height = leftLastCell.height
            newRow.rowIndex = i
            let newCells = []
            cells.forEach((cell, j) => {
                let newCell =  Object.assign({}, cell) //{ ...cell }
                // originalRowIndex排序
                if (!newCell.hasOwnProperty('originalRowIndex')) {
                    newCell.originalRowIndex = cell.rowIndex
                    newCell.originalColumnIndex = cell.columnIndex
                }
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

            if (showDataMap[cells[0].rowIndex]) {
                tableData.push({...newRow})
            }
        }
        tableData = setTableDatas(tableIndex, tableData, leftData, 'oldColumnIndex') 
    }
    let len = Math.ceil(tableBodyHeight / ROW_HEIGHT) + 1

    let num = 500
    let fragment = Math.ceil(length / num)
    function loop() {
        if (fragment > 0) {
            defer(() => {
                fragment--
                len += num
                if (len > length) len = length
                init(len)
                loop()
            })
        }
    }
    // init(length)

    if (len < length) {
        init(len)
        // 延迟计算
        loop()
    } else {
        init(length)
    }

    return {
        tableAllData: newTableAllData,
        tableData
        // tableData: setTableData(leftData, headerData, newTableAllData)
        //tableData: zero ? newTableAllData : setTableData(leftData, headerData, newTableAllData)
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

export const setTableDataByExpandRow = (changeData, tableData, tableAllData, info, open) => {
    if (open) {
        const newTableData = []
        for (let i = 0; i < changeData.length; i++) {
            const row = tableAllData[changeData[i]]
            // const cells = row.cells
            // for (let j = 0; j < cells.length; j++) {

            // }
            // tableData[info.startIndex++].push(row)
            newTableData.push(row)
        }
        tableData.splice(info.startIndex, 0, ...newTableData)
    } else {
        tableData.splice(info.startIndex, changeData.length)
    }
    let index = info.startIndex
    function updateXY(len) {
        for (; index < len; index++) {
            console.log(index)
        }
    }
    updateXY()

    function loop() {

    }

}

/**
 * 根据表头和左侧表的数据 设置表格区域的数据
 * @param {array} leftData 
 * @param {array} headerData 
 * @param {array} tableData  
 * rowKey = 'oldRowIndex',
    colKey = 'oldColumnIndex'
 */
export const setTableData = (
    leftData = [],
    headerData = [],
    tableAllData = [],
) => {
    let newTableData = setTableRows({
        leftData, tableAllData,
        rowKey: 'oldRowIndex'
    })
    newTableData = setTableCols({
        leftData,
        headerData,
        newTableData,
        colKey: 'oldColumnIndex'
    })

    return newTableData
}

export const getViewTableData = (obj) => {
    let {
        leftData = [],
        headerData = [],
        tableAllData = [],
        rowViewEndIndex
    } = obj

    let newTableData = setTableRows({
        leftData, tableAllData,
        rowKey: 'oldRowIndex'
    })
    newTableData = setTableCols({
        leftData,
        headerData,
        newTableData,
        colKey: 'oldColumnIndex',
        rowViewEndIndex
    })

    return newTableData
}

export const setTableRows = (obj) => {
    let { leftData = [], tableAllData = [], rowKey } = obj
    const rowIndexObj = getLeftDataIndex(leftData, rowKey);
    let newTableData = [];
    for (let i = 0, len = tableAllData.length; i < len; i++) {
        let newRow = {
            ...tableAllData[i]
        };
        if (newRow.cells.length > 0 && rowIndexObj[newRow.cells[0][rowKey]]) {
            newTableData.push(newRow);
        }
    }

    return newTableData
}

export const setTableCols = (obj) => {
    let { leftData = [], headerData = [], newTableData = [], colKey, viewEndRowIndex } = obj
    const headerLastCells = getLastHeaderCells(headerData)
    const headerColIndex = getHeaderDataIndex(headerData, colKey)
    let i = 0
    function updateTable(len) {
        for (; i < len; i++) {
            const cells = newTableData[i].cells;
            const cs = [];
            let leftCell = leftData[i].cells[leftData[i].cells.length - 1]
            let preCell = false;
            let newColIndex = 0
            newTableData[i].rowIndex = i
            for (let j = 0; j < cells.length; j++) {
                let cell = cells[j];
                if (!cell) break
                if (headerColIndex[cell[colKey]]) {
                    cell.x = preCell ? preCell.x + preCell.width : 0
                    cell.y = leftCell.y
                    cell.newColIndex = newColIndex++;
                    cell.newRowIndex = i;
                    cell.height = newTableData[i].height
                    cell.width = headerLastCells[cell.newColIndex].width || ROW_WIDTH
                    cs.push(cell);
                    preCell = cell;
                }
            }
            newTableData[i].cells = cs;
        }
    }
    updateTable(newTableData.length)

    // let l = newTableData.length
    // if (viewEndRowIndex && viewEndRowIndex<l-1) {
    //     updateTable(viewEndRowIndex + 1)
    //     defer(() => updateTable(l))
    // } else {
    //     updateTable(l)
    // }

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
export const getHeaderDataIndex = (headerData = [], key) => {
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

export const tableAllDataAddRow = (tableAllData, index, addRows) => {
    const list = tableAllData
    const newTableCell = {
        x: 0,
        y: tableAllData[index - 1 < 0 ? 0 : index - 1].y + 24,
        rowIndex: tableAllData[index].rowIndex,
        height: 24,
        cells: []
    }
    newTableCell.cells = tableAllData[index].cells.map(v => {
        return {
            ...v,
            cellReadOnly: false,
            color: '',
            backgroundColor: '',
            updated: true,
            value: '',
            height: 24
        }
    })
    addRows ? list.splice(index, 0, ...JSON.parse(JSON.stringify(addRows))) : list.splice(index, 0, newTableCell)
    for (let i = index; i < list.length; i++) {
        list[i].y = list[i - 1].y + list[i - 1].height
        list[i].rowIndex = i
        list[i].cells.forEach(v => {
            v.y = list[i].y
            v.rowIndex = list[i].rowIndex
            // v.oldRowIndex = list[i].rowIndex
        })
    }
    return list
}