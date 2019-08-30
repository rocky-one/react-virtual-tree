import { SCROLL_SIZE, ROW_HEIGHT, LINE_HEIGHT } from '../tableConst'
import {
    getLeftRowLastCell
} from './handleTableData'

/**
 * @desc 添加属性到一个对象上
 * @param {Object} -target
 * @param {any}  -string or object
 */
export function addAttr() {
    const [target, ...other] = arguments,
        isString = typeof other[0] === 'string'
    if (isString) {
        const k = other[0],
            v = other[1]
        target[k] = v
    } else {
        Object.assign(target, ...other)
    }
}

// 是否是选中了多个cell 
export function isSelectMultipleCell(area) {
    if (!area) return false
    if (Math.abs(area.startRowIndex - area.endRowIndex) > 0) return true
    if (Math.abs(area.startColIndex - area.endColIndex) > 0) return true
    return false
}

// 获取表格列数
export function getColSum(tableData = []) {
    if (tableData.length === 0) return 0
    const cells = tableData[0].cells || []
    return cells.length
}

// 是否有滚动条
export function getScrollSize(contSize = 0, size = 0) {
    if (contSize > size) {
        return SCROLL_SIZE
    }
    return 0
}

export function getPixelRatio(context) {
    var backingStore = context.backingStorePixelRatio ||
        context.webkitBackingStorePixelRatio ||
        context.mozBackingStorePixelRatio ||
        context.msBackingStorePixelRatio ||
        context.oBackingStorePixelRatio ||
        context.backingStorePixelRatio || 1;
    return (window.devicePixelRatio || 1) / backingStore;
};

export function findPre(cell, data, cb) {
    if (cell.preCell) {
        const preCell = data[cell.preCell.rowIndex].cells[cell.preCell.columnIndex];
        cb && cb(preCell)
        if (preCell && preCell.preCell) {
            findPre(preCell, data, cb)
        }
    }
}

// 解决小数计算时精度问题
export function strip(num, precision = 12) {
    return +parseFloat(num.toPrecision(precision));
}

// 折行格式   处理换行
export function wrapText(pa, text, maxWidth, x, y, height) {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    ctx.font = `${pa.font}px Arial`
    const arrText = text.split('');
    let line = '';
    let res = []
    // let maxLines = Math.floor(height / LINE_HEIGHT)
    for (let n = 0; n < arrText.length; n++) {
        if (arrText[n] === '\n') {
            res.push({ line, x, y })
            line = '';
            y += ROW_HEIGHT;
        } else {
            const testLine = line + arrText[n];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            //高度不够时 不在显示剩余文字 直接跳出
            // if (res.length >= maxLines) break
            if (testWidth > maxWidth && n > 0) {
                res.push({ line, x, y })
                line = arrText[n];
                y += ROW_HEIGHT;
            } else {
                line = testLine;
            }
        }
    }
    res.push({ line, x, y })
    return res
}

// 获取这一行的最高高度
export function getRowHeight(pa, rowList) {
    let rowHeight = 0
    rowList.forEach(cell => {
        const cellHeight = (cell.datatype === '3' || cell.datatype === '4')
            ? wrapText(
                pa,
                cell.value,
                cell.datatype === '4' ? cell.width - 22 : cell.width -  6,
                cell.x + 6,
                cell.y + ROW_HEIGHT - pa.font / 2,
                cell.height).length * ROW_HEIGHT
            : ROW_HEIGHT
        rowHeight = cellHeight > rowHeight ? cellHeight : rowHeight
    })
    return rowHeight < ROW_HEIGHT ? ROW_HEIGHT : rowHeight
}

// 更新行高
export function setRowHeight(pa, leftAllData, leftData, tableData, tableAllData) {
    const addMap = {}
    let leftHeight = 0
    leftData.forEach((row, rowIndex) => {
        const cell = row.cells[row.cells.length - 1]
        if (!cell.hasDrag) {
            cell.height = tableData[rowIndex]
                ? getRowHeight(pa, tableData[rowIndex].cells)
                : (cell.height || ROW_HEIGHT)
        }
        leftHeight += cell.height
        if (rowIndex > 0) {
            const preCells = leftData[rowIndex - 1].cells
            cell.y = preCells[preCells.length - 1].y + preCells[preCells.length - 1].height
        }
        findPre(cell, leftAllData, (preCell) => {
            if (preCell) {
                const key = `${preCell.newRowIndex}${preCell.newColIndex}`
                if (!addMap[key]) {
                    preCell.height = cell.height
                    preCell.y = cell.y
                    addMap[key] = true
                } else {
                    preCell.height += cell.height
                }
            }
        })
    })
    pa.leftHeight = leftHeight

    // 更新表格高度
    for (let i = 0; i < tableData.length; i++) {
        const rows = tableData[i].cells
        const leftRowLastCell = getLeftRowLastCell(leftData, i)
        tableData[i].y = leftRowLastCell.y
        tableData[i].height = leftRowLastCell.height
        rows.forEach(cell => {
            cell.y = leftRowLastCell.y
            cell.height = leftRowLastCell.height
        })
    }
}

export const setCellsOpenStatus = (data = [], status, cb) => {
    for (let i = 0; i < data.length; i++) {
        const cells = data[i].cells
        for (let j = 0; j < cells.length; j++) {
            if (cells[j].childCount > 0) {
                cells[j].open = status
                cb && cb(cells[j])
            }
        }
    }
    return data
}
