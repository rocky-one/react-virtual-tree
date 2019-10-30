import { findCellChild, recursionPre,setOpenDataIndexAndXY } from './handleLeftData'

function findFirstColData(leftAllData) {
    const showFirstColData = []
    const cell = {
        rowIndex: -1,
        columnIndex: 0,
        indentCount: -1,
    }
    findCellChild(cell, leftAllData, (i, j, c) => {
        if (c.indentCount === 0 && c.columnIndex === 0) {
            showFirstColData.push(c)
        }
    })
    return showFirstColData
}

export function findCellChildIsShowRows(leftAllData, cb) {
    
    const cellChild = findFirstColData(leftAllData)
    const lastColIsShow = []
    for (let i = 0; i < cellChild.length; i++) {
        const n = cellChild[i].nextCell
        if (n) {
            for (let j = 0; j < n.length; j++) {
                const nc = n[j]
                const cells = leftAllData[nc.rowIndex].cells
                const c = cells.find(item => item.columnIndex === nc.columnIndex)
                if (c.indentCount === 0) {
                    c.nextCell ? cellChild.push(c) : lastColIsShow.push(c)
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

export const closeAllLeft = (leftAllData = []) => {
    for (let i = 0; i < leftAllData.length; i++) {
        // if (leftAllData[i].open) {
        //     leftAllData[i].open = false
        // }
        // if (leftAllData[i].show) {
        //     leftAllData[i].show = false
        // }
        const cells = leftAllData[i].cells
        for (let j = 0; j < cells.length; j++) {
            if (cells[j].open) {
                cells[j].open = false
            }
            // if (cells[j].show) {
            //     cells[j].show = false
            // }
            if (j != cells.length - 1) {
                cells[j].newRowSpan = null
                cells[j].height = null
            }
        }
    }
    let newData = findCellChildIsShowRows(leftAllData, (c) => {
        recursionPre(c, 'preCell', leftAllData, (pCell) => {
            if(!pCell.newRowSpan){
                pCell.newRowSpan = 1
            }else{
                pCell.newRowSpan += 1
            }
            if(!pCell.height){
                pCell.height = c.height
            }else{
                pCell.height += c.height
            }

        })
    })
    newData = setOpenDataIndexAndXY({
        y: 0,
        height: 0,
        newRowIndex: 0,
        rowSpan: 0,
    }, newData)
    return newData
}