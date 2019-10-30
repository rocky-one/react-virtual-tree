// export const rowWidth = 130
// export const rowHeight = 30
import {
    ROW_WIDTH,
    ROW_HEIGHT,
} from './tableConst'

export const compose = (...arg) => {
    const args = [...arg]
    return (...r) => {
        let res = [...r]
        for (let i = 0, len = args.length; i < len; i++) {
            if (typeof arg[i] === 'function') {
                const curRes = arg[i](...res)
                if (curRes === 'break') {
                    return res
                }
            }
        }
        return res
    }
}
/**
 * @desc 创建dom节点
 * @param {*} tag 
 * @param {*} id 
 * @param {*} className 
 * @param {*} styles 
 */
export const createDom = (tag, id, className, styles = {}, attr = {}) => {
    let dom = document.createElement(tag)
    id && (dom.id = id)
    className && (dom.className = className)
    setDomCss(dom, styles)
    setDomAttr(dom, attr)
    return dom
}

export const setDomCss = (dom, style) => {
    Object.keys(style).forEach(k => {
        dom.style[k] = style[k]
    })
}

export const setCanvasCss = (dom, style) => {
    Object.keys(style).forEach(k => {
        dom[k] = style[k]
    })
}

export const setDomAttr = (dom, attr) => {
    Object.keys(attr).forEach(k => {
        dom.setAttribute(k, attr[k])
    })
}

export const createCanvas = (styles) => {
    let canvas = document.createElement('canvas')
    Object.keys(styles).forEach(k => {
        canvas[k] = styles[k]
    })
    return canvas
}


export const getLastHeaderCells = (headerData = []) => {
    if (headerData.length === 0) return []
    return headerData[headerData.length - 1].cells
}

export const initHeaderData = (headerData = []) => {
    let headerWidth = 0,
        headerHeight = 0,
        headerInfo = []

    const lastCells = getLastHeaderCells(headerData)
    lastCells.forEach(item => {
        headerWidth += item.width || ROW_WIDTH,
            headerInfo.push({
                width: ROW_WIDTH
            })
    })

    const len = headerData.length;
    for (let i = len - 1; i >= 0; i--) {
        const cells = headerData[i].cells || []

        let hei = headerData[i].height || ROW_HEIGHT
        headerData[i].height = hei
        headerHeight += hei
        cells.forEach((cell, j) => {
            if (!cell.width) cell.width = ROW_WIDTH
            if (!cell.height) cell.height = hei
            if (j > 0) {
                cell.x = cell.width + cells[j - 1].x
            } else {
                cell.x = 0
            }
            if (i > 0) {
                cell.y = i * hei
            } else {
                cell.y = 0
            }
            if (cell.preCell) {
                const preCell = headerData[cell.preCell.rowIndex].cells[cell.preCell.columnIndex]
                if (!preCell.width) {
                    preCell.width = cell.width
                } else {
                    preCell.width += cell.width
                }
            }
        })
    }

    return {
        headerData,
        headerInfo,
        headerWidth,
        headerHeight
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

export const getLeftFirstRow = (leftData = []) => {
    return leftData.length > 0 ? leftData[0] : false
}

export const initTableData = (tableData = [], leftData, headerData) => {
    return {
        tableData: []
    }
    const headerLastCells = getLastHeaderCells(headerData)
    tableData.forEach((row, i) => {
        const cells = row.cells || []
        const leftLastCell = getLeftRowLastCell(leftData, i)
        row.x = leftLastCell.x
        row.y = leftLastCell.y
        row.height = leftLastCell.height
        cells.forEach((cell, j) => {
            cell.x = headerLastCells[j].x
            cell.y = leftLastCell.y
            cell.width = headerLastCells[j].width
            cell.height = leftLastCell.height
        })
    })
    return {
        tableData,
    }
}

/**
 * @desc 当前鼠标位置是否在某个区域之内
 * @param {*} info 
 * @param {*} x 
 * @param {*} y 
 */
export const isIntraArea = (info, x, y) => {
    if (!info) return false
    if (x > info.x && x < info.x + info.width && y > info.y && y < info.y + info.height) {
        return true
    }
    return false
}

/**
 * @desc 根据坐标获取左侧选中cell
 * @param {*} leftInfo 
 * @param {*} leftData 
 * @param {*} x 
 * @param {*} y 
 */
export const getSelectedLeftCell = (leftData = [], scrollTop = 0, x, y) => {
    if (leftData.length === 0) return false
    let colIndex, rowIndex = -1
    y += scrollTop
    const firstRow = getLeftFirstRow(leftData);
    // 寻找列
    if (firstRow) {
        const cells = firstRow.cells
        for (let i = 0; i < cells.length; i++) {
            let pw = cells[i].x
            let w = cells[i].width
            if (x > pw && x < pw + w) {
                colIndex = i
                break
            }
        }
    }
    // 寻找行
    let ph = 0
    for (let i = 0, len = leftData.length; i < len; i++) {
        let cells = leftData[i].cells
        for (let j = 0, clen = cells.length; j < clen; j++) {
            let columnIndex = cells[j].columnIndex
            if (colIndex === columnIndex) {
                let hei = cells[j].height// * (cells[j].newRowSpan || cells[j].rowSpan)
                if (y > ph && y < ph + hei) {

                    rowIndex = i;
                    j = clen;
                    i = len;
                } else {
                    ph += hei
                }
            }
        }
    }
    if (rowIndex === -1) return false
    const cells = leftData[rowIndex].cells
    let cell = {}
    for (let i = 0; i < cells.length; i++) {
        let c = cells[i]
        if (c.columnIndex === colIndex) {
            cell = c
            break
        }
    }
    return {
        colIndex,
        rowIndex,
        cell
    }
}

export const getDragLeftColCell = (leftData = [], scrollTop = 0, x, y) => {
    if (leftData.length === 0) return false
    let colIndex, rowIndex = -1
    y += scrollTop
    const firstRow = getLeftFirstRow(leftData);
    // 寻找列
    if (firstRow) {
        const cells = firstRow.cells
        for (let i = 0; i < cells.length; i++) {
            let pw = cells[i].x
            let w = cells[i].width
            if (x > pw + 5 && x <= pw + w + 5) {
                colIndex = i
                break
            }
        }
    }
    // 寻找行
    let ph = 0
    for (let i = 0, len = leftData.length; i < len; i++) {
        let cells = leftData[i].cells
        for (let j = 0, clen = cells.length; j < clen; j++) {
            let columnIndex = cells[j].columnIndex
            if (colIndex === columnIndex) {
                let hei = cells[j].height// * (cells[j].newRowSpan || cells[j].rowSpan)
                if (y > ph + 5 && y < ph + hei + 5) {

                    rowIndex = i;
                    j = clen;
                    i = len;
                } else {
                    ph += hei
                }
            }
        }
    }
    if (rowIndex === -1) return false
    const cells = leftData[rowIndex].cells
    let cell = {}
    for (let i = 0; i < cells.length; i++) {
        let c = cells[i]
        if (c.columnIndex === colIndex) {
            cell = c
            break
        }
    }
    return {
        colIndex,
        rowIndex,
        cell
    }
}

export const getDragLeftCell = (leftData = [], scrollTop = 0, x, y) => {
    if (leftData.length === 0) return false
    let colIndex, rowIndex = -1
    y += scrollTop
    const firstRow = getLeftFirstRow(leftData);
    // 寻找列
    if (firstRow) {
        const cells = firstRow.cells
        for (let i = 0; i < cells.length; i++) {
            let pw = cells[i].x
            let w = cells[i].width
            if (x > pw && x <= pw + w) {
                colIndex = i
                break
            }
        }
    }
    // 寻找行
    let ph = 0
    for (let i = 0, len = leftData.length; i < len; i++) {
        let cells = leftData[i].cells
        for (let j = 0, clen = cells.length; j < clen; j++) {
            let columnIndex = cells[j].columnIndex
            if (colIndex === columnIndex) {
                let hei = cells[j].height// * (cells[j].newRowSpan || cells[j].rowSpan)
                if (y > ph + 5 && y < ph + hei + 5) {

                    rowIndex = i;
                    j = clen;
                    i = len;
                } else {
                    ph += hei
                }
            }
        }
    }
    if (rowIndex === -1) return false
    const cells = leftData[rowIndex].cells
    let cell = {}
    for (let i = 0; i < cells.length; i++) {
        let c = cells[i]
        if (c.columnIndex === colIndex) {
            cell = c
            break
        }
    }
    return {
        colIndex,
        rowIndex,
        cell
    }
}

/**
 * @desc 根据坐标获取头部选中的cell
 * @param {*} headerData 
 * @param {*} x 
 * @param {*} y 
 */
export const getSelectedHeaderCell = (headerData = [], scrollLeft = 0, x, y) => {
    if (headerData.length === 0) return {}
    x += scrollLeft
    let colIndex, rowIndex, cell
    // 寻找行
    let heiSum = 0
    for (let i = 0; i < headerData.length; i++) {
        const hei = headerData[i].cells ? headerData[i].cells[0].height : ROW_HEIGHT
        if (y > heiSum && y <= heiSum + hei) {
            rowIndex = i
            break
        }
        heiSum += hei
    }

    const cells = rowIndex >= 0 ? headerData[rowIndex].cells : []
    for (let i = 0; i < cells.length; i++) {
        if (x > cells[i].x && x <= cells[i].x + cells[i].width) {
            colIndex = i
            cell = cells[i]
            break
        }
    }
    return {
        colIndex,
        rowIndex,
        cell,
    }
}

export const getDragHeaderCell = (headerData = [], scrollLeft = 0, x, y) => {
    if (headerData.length === 0) return {}
    x += scrollLeft
    let colIndex, rowIndex, cell
    // 寻找行
    let heiSum = 0
    for (let i = 0; i < headerData.length; i++) {
        const hei = headerData[i].cells ? headerData[i].cells[0].height : ROW_HEIGHT
        if (y > heiSum && y <= heiSum + hei) {
            rowIndex = i
            break
        }
        heiSum += hei
    }

    const cells = rowIndex >= 0 ? headerData[rowIndex].cells : []
    for (let i = 0; i < cells.length; i++) {
        if (x > cells[i].x + 5 && x < cells[i].x + cells[i].width + 5) {
            colIndex = i
            cell = cells[i]
            break
        }
    }
    return {
        colIndex,
        rowIndex,
        cell,
    }
}

/**
 * @desc 根据坐标x或者y,以及元素的宽或者高 计算循环开始的索引
 * @param {*} xOry 
 * @param {*} elePx 
 */
const calcStartIndex = (xOry, elePx) => {
    let index = Math.floor(xOry / elePx) - 1
    return index < 0 ? 0 : index
}
/**
 * @desc 寻找框选区域表格行索引
 * @param {*} tableData 
 * @param {*} y 
 */
export const findRowIndex = (tableData = [], y) => {
    // 寻找开始行
    let rowIndex = -1,
        len = tableData.length
    if(len === 0) return rowIndex
    for (let i =0; i < len; i++) {
        const row = tableData[i]
        const cells = row.cells
        if (!cells || cells.length === 0) return rowIndex
        // if (cells[0].y > y) {
        //     i -= 4
        //     i = i < 0 ? 0 : i
        //     console.log(123)
        //     continue
        // }
        if (cells[0].y <= y) {
            // 确定是在当前行内
            if (cells[0].y + cells[0].height >= y) {
                rowIndex = i
                break
            }
        }
    }

    return rowIndex
}

/**
 * @desc 寻找选中区域列索引
 * @param {*} tableData 
 * @param {*} x 
 */
export const findColIndex = (tableData, x) => {
    let cells = tableData.length > 0 ? tableData[0].cells : [],
        width = cells.length > 0 ? (cells[0].width || ROW_WIDTH) : ROW_WIDTH,
        j = calcStartIndex(x, width),
        len = cells.length,
        colIndex = -1
    for (; j < len; j++) {
        const cell = cells[j]
        if (cell.x > x) {
            j -= 4
            j = j < 0 ? 0 : j
            continue
        }
        if (cell.x <= x) {
            // 确定列
            if (cell.x + cell.width >= x) {
                colIndex = j
                break
            }
        }
    }
    return colIndex
}
/**
 * @desc 根据鼠标拖拽起始坐标计算出这个矩形的左上角和右下角的坐标位置
 */
export const startXyToRectXy = (
    startX = 0,
    startY = 0,
    endX = 0,
    endY = 0,
    mouseDownScrollLeft = 0,
    mouseDownScrollTop = 0,
    scrollLeft = 0,
    scrollTop = 0
) => {
    let leftTop = {}, rightBottom = {}
    startX += mouseDownScrollLeft
    endX = endX + scrollLeft
    startY += mouseDownScrollTop
    endY = endY + scrollTop
    if (startX <= endX) {
        leftTop.x = startX
        rightBottom.x = endX
    } else {
        leftTop.x = endX
        rightBottom.x = startX
    }
    if (startY <= endY) {
        leftTop.y = startY
        rightBottom.y = endY
    } else {
        leftTop.y = endY
        rightBottom.y = startY
    }
    return {
        leftTop,
        rightBottom
    }
}
/**
 * @desc 获取表格选中区域
 * @param {*} tableData 
 * @param {*} startX 
 * @param {*} startY 
 * @param {*} endX 
 * @param {*} endY 
 */
export const getSelectedTableCells = (
    tableData = [],
    startX,
    startY,
    endX,
    endY,
    mouseDownScrollLeft,
    mouseDownScrollTop,
    scrollLeft,
    scrollTop,
    cb) => {
    const {
        leftTop,
        rightBottom
    } = startXyToRectXy(startX, startY, endX, endY, mouseDownScrollLeft, mouseDownScrollTop, scrollLeft, scrollTop)

    const startRowIndex = findRowIndex(tableData, leftTop.y),
        startColIndex = findColIndex(tableData, leftTop.x),
        endRowIndex = findRowIndex(tableData, rightBottom.y),
        endColIndex = findColIndex(tableData, rightBottom.x)

    cb && cb()
    return {
        startRowIndex: startRowIndex || 0,
        startColIndex: startColIndex || 0,
        endRowIndex: endRowIndex || 0,
        endColIndex: endColIndex || 0
    }
}

export const getScrollTop = (ele) => {
    return ele.scrollTop || ele.pageYOffset || 0;
}

export const getScrollLeft = (ele) => {
    return ele.scrollLeft || ele.pageXOffset || 0;
}

export const getScrollBarPx = (elePx, contPx) => {
    // if (contPx < elePx) {
    //     return {
    //         px: 0,
    //         percentage: 0,
    //         surplusPx: 0
    //     }
    // }
    let p = elePx / contPx,
        px = p * elePx
    if (px < 20) {
        px = 20
    }
    return {
        px,
        percentage: p,
        surplusPx: elePx - px
    }
}

/**
 * @desc 根据鼠标当前坐标计算 相对于表格数据区坐标,也就是以表格左上角为原点
 */
export const calcXyRelativeTable = (right, bottom) => {
    return (x, y, scrollLeft, scrollTop) => ({
        x: x - right + scrollLeft,
        y: y - bottom + scrollTop
    })
}

export const calcAreaWhenExceed = (parmas) => {
    const {
        tableData,
        startX,
        startY,
        endX,
        endY,
        mouseDownScrollLeft,
        mouseDownScrollTop,
        scrollLeft,
        scrollTop,
        topBottomBound,
        leftRightBound,
        area,
        cb
    } = parmas
    let newArea = Object.assign({}, area)
    const {
        leftTop,
        rightBottom
    } = startXyToRectXy(startX, startY, endX, endY,
        mouseDownScrollLeft,
        mouseDownScrollTop,
        scrollLeft,
        scrollTop)

    // 上下超出 但是左右未超出的情况
    if (topBottomBound && !leftRightBound) {
        newArea.startColIndex = findColIndex(tableData, leftTop.x)
        newArea.endColIndex = findColIndex(tableData, rightBottom.x)
    }
    // 左右超出 但是上下未超出的情况
    if (leftRightBound && !topBottomBound) {
        newArea.startRowIndex = findRowIndex(tableData, leftTop.y)
        newArea.endRowIndex = findRowIndex(tableData, rightBottom.y)
    }
    cb && cb()
    return newArea
}

export const getCalHeaderCell = (headerData = [], scrollLeft = 0, x, rowIndex) => {
    if (headerData.length === 0) return {}
    x += scrollLeft
    let calCol, calCell
    const cells = rowIndex >= 0 ? headerData[rowIndex].cells : []
    for (let i = 0; i < cells.length; i++) {
        if (x > cells[i].x + 5 && x < cells[i].x + cells[i].width + 5) {
            calCol = i
            calCell = cells[i]
            break
        }
    }
    return {
        calCol,
        calCell
    }
}

export const getCalTableCell = (tableData = [], scrollLeft = 0, x, rowIndex) => {
    if (tableData.length === 0) return {}
    x += scrollLeft
    let calTableCol, calTableCell
    const cells = rowIndex >= 0 ? tableData[rowIndex].cells : []
    for (let i = 0; i < cells.length; i++) {
        if (x > cells[i].x + 5 && x < cells[i].x + cells[i].width + 5) {
            calTableCol = i
            calTableCell = cells[i]
            break
        }
    }
    return {
        calTableCol,
        calTableCell
    }
}
// export function getLeftData(pa) {
//     if (pa.open) return pa.leftAllData || []
//     return pa.leftData || []
// }
// export function getHeaderData(pa) {
//     if (pa.open) return pa.headerAllData || []
//     return pa.headerData || []
// }
// export function getTableData(pa) {
//     if (pa.open) return pa.tableAllData || []
//     return pa.tableData || []
// }

