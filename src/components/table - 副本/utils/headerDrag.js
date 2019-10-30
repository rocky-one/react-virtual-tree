import { MIN_WIDTH, MIN_HEIGHT, LEFT_ROW_WIDTH, MAX_LEFT_WIDTH } from '../tableConst'
import { setDomCss, createDom } from '../utils'
import { getLastHeaderCells } from './handleHeaderData'

const findNextLastCell = (cell, headerData) => {
    const rowIndex = cell.newRowIndex
    const colIndex = cell.newColIndex
    const cells = headerData[rowIndex].cells
    let colSpan = -1
    for (let i = colIndex; i >= 0; i--) {
        colSpan += cells[i].newColSpan
    }
    const lastCells = getLastHeaderCells(headerData)
    return lastCells[colSpan]
}


const caclHeaserDragLineArea = (cell, scrollLeft = 0, x, y) => {
    let startX = cell.width + cell.x - scrollLeft
    if ( x >= startX - 5 && x <= startX || ( cell.columnIndex == 0 ? false : x >= cell.x - scrollLeft && x <= cell.x - scrollLeft + 5)) {
        if (y >= cell.y && y <= cell.y + cell.height) {
            return true
        }
    }
    return false
}

export const headerDragLine = (pa, offsetX, offsetY, cell) => {
    if (cell) {
        let inLineArea = caclHeaserDragLineArea(cell, pa.scrollLeft, offsetX, offsetY)
        pa.headerDrageLineShow = inLineArea
        setDomCss(pa.rightHeaderBox, {
            cursor: inLineArea ? 'col-resize' : 'default',
        })
    }else {
        setDomCss(pa.rightHeaderBox, {
            cursor: 'default',
        })
    }
}

export const headerDragMove = (pa, pageX, cb) => {
    if (pa.headerDragLineDown) {
        pa.headerDistance = pageX - pa.headerDownPageX
        cb && cb()
    }
}


export const getDistance = (distance = 0, dragCell, headerData = []) => {
    let newDis = distance

    const lastCell = findNextLastCell(dragCell, headerData)
    if (lastCell.width <= MIN_WIDTH && distance < 0) return {
        distance: 0,
        lastCell
    }
    if (distance < 0 && lastCell.width - Math.abs(distance) <= MIN_WIDTH) {
        newDis = -1 * (lastCell.width - MIN_WIDTH)
    }
    return {
        distance: newDis,
        lastCell
    }
}

export const createHeaderDragLine = (pa, height) => {
    if (pa.headerDragLine) {
        // pa.headerDragLine.style.display='block'
        return
    }
    pa.headerDragLine = createDom('div', null, null, {
        position: 'absolute',
        width: `1px`,
        height: `${height}px`,
        left: 0,
        top: 0,
        zIndex: 9999,
        borderRight: '1px dashed black'
    })
    pa.rightHeaderBox.appendChild(pa.headerDragLine)
}

export const removeHeaderDragLine = (pa) => {
    if (pa.headerDragLine) {
        // pa.headerDragLine.style.display='none'
        pa.rightHeaderBox.removeChild(pa.headerDragLine)
        pa.headerDragLine = null
    }
}

export const updateDragLinePosition = (ele, x) => {
    ele.style.left = `${x}px`
}

/* 左侧box */
const findLeftNextLastCell = (cell, leftData) => {
    const rowIndex = cell.newRowIndex
    const rowSpan = cell.newRowSpan
    const cells = leftData[rowIndex + rowSpan - 1]["cells"]
    return cells[cells.length - 1]
}

const caclLeftDragLineArea = (cell, scrollTop = 0, x, y) => {
    let startY = cell.height + cell.y - scrollTop
    if ( y >= startY - 5 && y <= startY || ( cell.rowIndex == 0 ? false : y >= cell.y - scrollTop && y <= cell.y - scrollTop + 5)) {
        if (x >= cell.x && x <= cell.x + cell.width) {
            return true
        }
    }
    return false
}

const cacLeftDragColLine = (cell, x, y, scrollTop) => {
    let startX = cell.width + cell.x
    if ( x >= startX - 5 && x <= startX || ( cell.columnIndex == 0 ? false : x >= cell.x  && x <= cell.x + 5)) {
        if (y + scrollTop >= cell.y && y + scrollTop <= cell.y + cell.height) {
            return true
        }
    }
    return false
}

export const leftDragLine = (pa, offsetX, offsetY, cell) => {
    if (cell) {
        let inRowLineArea = caclLeftDragLineArea(cell, pa.scrollTop, offsetX, offsetY)
        let inColLineArea = cacLeftDragColLine(cell, offsetX, offsetY, pa.scrollTop)
        if(inColLineArea) {
            setDomCss(pa.leftBox, {
                cursor: 'col-resize',
            })
            pa.leftDragLineShow = false
            pa.leftDragColLineShow = true
        }else if(!inColLineArea && inRowLineArea) {
            setDomCss(pa.leftBox, {
                cursor: 'row-resize',
            })
            pa.leftDragLineShow = true
            pa.leftDragColLineShow = false
        }else{
            setDomCss(pa.leftBox, {
                cursor: 'default',
            })
            pa.leftDragLineShow = false
            pa.leftDragColLineShow = false
        }
    }
}

export const leftDragMove = (pa, pageY, cb) => {
    if (pa.leftDragLineDown) {
        pa.leftDistance = pageY - pa.leftDownPageY
        cb && cb()
    }
}

export const leftDragColMove = (pa, pageX, cb) => {
    if (pa.leftDragColLineDown) {
        pa.leftColDistance = pageX - pa.leftDownPageX
        cb && cb()
    }
}

export const getLeftDistance = (distance = 0, dragCell, leftData = []) => {
    let newDis = distance
    const lastCell = findLeftNextLastCell(dragCell, leftData)
    if (lastCell.height <= MIN_HEIGHT && distance < 0) return {
        distance: 0,
        lastCell
    }
    if (distance < 0 && lastCell.height - Math.abs(distance) <= MIN_HEIGHT) {
        newDis = -1 * (lastCell.height - MIN_HEIGHT)
    }
    return {
        distance: newDis,
        lastCell
    }
}

export const getLeftColDistance = ( leftWidth, distance = 0, dragCell) => {
    let newDis = distance
    if (dragCell.width <= LEFT_ROW_WIDTH && distance < 0) return 0;
    if (distance < 0 && dragCell.width - Math.abs(distance) <= LEFT_ROW_WIDTH) {
        newDis = -1 * (dragCell.width - LEFT_ROW_WIDTH)
    }
    if(distance > 0 && leftWidth + distance > MAX_LEFT_WIDTH) {
        newDis = MAX_LEFT_WIDTH - leftWidth
    }
    return newDis
}

export const createLeftDragLine = (pa, width) => {
    if (pa.leftDragLine) {
        return
    }
    pa.leftDragLine = createDom('div', null, null, {
        position: 'absolute',
        width: `${width}px`,
        height: `1px`,
        left: 0,
        top: 0,
        zIndex: 9999,
        borderBottom: '1px dashed black'
    })
    pa.leftBox.appendChild(pa.leftDragLine)
}

export const createLeftDragColLine = (pa, height) => {
    if (pa.leftDragColLine) {
        return
    }
    pa.leftDragColLine = createDom('div', null, null, {
        position: 'absolute',
        width: `1px`,
        height: `${height}px`,
        left: 0,
        top: 0,
        zIndex: 9999,
        borderRight: '1px dashed black'
    })
    pa.leftBox.appendChild(pa.leftDragColLine)
}

export const removeLeftDragLine = (pa) => {
    if (pa.leftDragLine) {
        pa.leftBox.removeChild(pa.leftDragLine)
        pa.leftDragLine = null
    }
}

export const removeLeftDragColLine = (pa) => {
    if (pa.leftDragColLine) {
        pa.leftBox.removeChild(pa.leftDragColLine)
        pa.leftDragColLine = null
    }
}

export const updateLeftDragLinePosition = (ele, y) => {
    ele.style.top = `${y}px`
}

export const updateLeftDragColLinePosition = (ele, x) => {
    ele.style.left = `${x}px`
}