import {
    recursionPre,
    setOpenDataIndexAndXY,
    findCellChildIsShowRows,
} from './handleLeftData'

const handleDataByLevel = (leftAllData) => {
    const leftData = findCellChildIsShowRows({
        rowIndex: -1,
        columnIndex: 0,
        indentCount: -1,
    }, leftAllData, (c) => {
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

    return setOpenDataIndexAndXY({
        newRowIndex: 0,
        columnIndex: 0,
        indentCount: -1,
        height: 0,
        rowSpan: 0,
        y: 0,
    }, leftData, [])
}

/**
 * 
 * @param {*} leftAllData 
 * @param {num | Infinity} level num展开层级数 | Infinity全部展开
 */
export const openLeftByLevel = (leftAllData, level = 0) => {
    for (let i = 0; i < leftAllData.length; i++) {
        const cells = leftAllData[i].cells
        for (let j = 0; j < cells.length; j++) {
            if (j != cells.length - 1) {
                cells[j].newRowSpan = null
                cells[j].height = null
            }
            if (cells[j].childCount > 0) {
                if (cells[j].indentCount < level) {
                    cells[j].open = true
                } else {
                    cells[j].open = false
                }
            }
        }
    }

    return handleDataByLevel(leftAllData)
}

/**
 * 
 * @param {*} leftAllData 
 * @param {num | Infinity} level  0 1 2  
 */
export const closeLeftByLevel = (leftAllData, level = 0) => {
    for (let i = 0; i < leftAllData.length; i++) {
        const cells = leftAllData[i].cells
        for (let j = 0; j < cells.length; j++) {
            if (j != cells.length - 1) {
                cells[j].newRowSpan = null
                cells[j].height = null
            }
            if (cells[j].childCount > 0) {
                if (cells[j].indentCount >= level) {
                    cells[j].open = false
                }
            }
        }
    }

    return handleDataByLevel(leftAllData)
}