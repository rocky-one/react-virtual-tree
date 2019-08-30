import {
    isIntraArea,
    getSelectedLeftCell,
    getSelectedHeaderCell,
    getDragHeaderCell,
    getDragLeftCell,
    getDragLeftColCell,
    findRowIndex,
    findColIndex,
    setDomCss,
} from '../utils'

import {
    openTr
} from '../utils/handleLeftData'

import {
    openHeaderTr,
    getCellBeforeColSpanSum,
} from '../utils/handleHeaderData'

import {
    setTableData
} from '../utils/handleTableData'

import {
    resetTextareaPosi,
    getFirstCellByArea,
    updatedToolTip,
    hideToolTip,
    updateTableBoxRect,
    selectionArea,
    inCell,
    clearAutoScroll,
    getCellByMouseOver,
    resetBoundSign,
} from '../tableUtils'

import {
    setAreaByLeftCell,
    setAreaByHeaderCell,
    setAreaAll,
} from '../utils/setArea'

import {
    getColSum,
    isSelectMultipleCell,
    strip,
    setRowHeight
} from '../utils/common'

import {
    headerDragLine,
    createHeaderDragLine,
    updateDragLinePosition,
    leftDragLine,
    createLeftDragLine,
    createLeftDragColLine,
    updateLeftDragLinePosition,
    updateLeftDragColLinePosition
} from '../utils/headerDrag'


class EventCore {
    constructor(params) {
        this.tableIns = params.tableIns
    }

    leftHeaderClick = (e) => {
        const pa = this.tableIns._pa
        pa.area = setAreaAll(pa.tableData)
        this.tableIns.setSelectedCell(getFirstCellByArea(pa.area, pa.tableData))
        pa.handleLeftHeaderClick && pa.handleLeftHeaderClick()
        this.tableIns.repaintRight()
        // initKey(pa.key, globalEventsMap)
    }
    leftClick = (e) => {
        const x = e.offsetX,
            y = e.offsetY,
            pa = this.tableIns._pa,
            leftCell = (pa.tableHeight >= y && y > 0) ? getSelectedLeftCell(pa.leftData, pa.scrollTop, x, y) : null
        // 在左侧cell区域内
        if (leftCell) {
            // initKey(pa.key, globalEventsMap)
            // 是展开图标区域
            if (pa.arrowCanClick && isIntraArea(leftCell.cell.arrowXy, e.offsetX, e.offsetY)) {

                this.tableIns.setSelectedCell(null)
                // 计算数据
                pa.leftData = openTr(leftCell.cell, pa.leftData, pa.leftAllData)
                // 可优化 根据rowIndex 只计算新加入行的列 ..
                pa.tableData = setTableData(pa.leftData, pa.headerData, pa.tableAllData)
                setRowHeight(pa, pa.leftAllData, pa.leftData, pa.tableData)
                // 更新高
                this.tableIns._updateHeight()
                // 更新滚动条
                this.tableIns._updateScrollTopNode()
                // 绘制
                this.tableIns.repaintLeft()
                this.tableIns.repaintRight()

                // 外部回调
                pa.handleLeftOpen && pa.handleLeftOpen(leftCell.cell)
                // 输入框
                resetTextareaPosi(pa)

                // 选中行
            } else {
                pa.clickHeaderCell = null
                pa.clickLeftCell = leftCell.cell
                pa.area = setAreaByLeftCell(leftCell.cell, getColSum(pa.tableData) - 1)
                this.tableIns.setSelectedCell(getFirstCellByArea(pa.area, pa.tableData))
                this.tableIns.repaintRight()
                pa.handleLeftTdClick && pa.handleLeftTdClick(leftCell.cell)
            }
        }
    }

    leftMousedown = (e) => {
        const pa = this.tableIns._pa
        let x = e.offsetX,
            y = e.offsetY
        // 鼠标位于拖拽区域
        if (pa.leftDragLineShow) {
            let dragCell = getDragLeftCell(pa.leftData, pa.scrollTop, x, y)
            if (dragCell.cell) {
                pa.leftToolTipRender && hideToolTip(pa)
                pa.leftDragLineDown = true
                pa.leftDragCell = dragCell.cell
                pa.leftDownPageY = e.pageY
            }
        } else if (pa.leftDragColLineShow) {
            let dragCell = getDragLeftColCell(pa.leftData, pa.scrollTop, x, y)
            if (dragCell.cell) {
                pa.leftToolTipRender && hideToolTip(pa)
                pa.leftDragColLineDown = true
                pa.leftDragCell = dragCell.cell
                pa.leftDownPageX = e.pageX
            }
        } else {
            pa.leftDragLineShow = null
            pa.leftDragColLineShow = null
            pa.leftDragLineDown = null
            pa.leftDragColLineDown = null
        }
    }

    leftMouseMove = (e) => {
        const {
            pageX,
            pageY,
        } = e
        const pa = this.tableIns._pa
        let x = e.offsetX,
            y = e.offsetY,
            leftCell = (pa.tableHeight >= y && y > 0) ? getSelectedLeftCell(pa.leftData, pa.scrollTop, x, y) : null,
            leftDragCell = (pa.tableHeight >= y && y > 0) ? getDragLeftCell(pa.leftData, pa.scrollTop, x, y) : null

        if (leftCell && pa.leftToolTipRender) {
            const html = pa.leftToolTipRender(leftCell.cell)
            if (!html) return
            updatedToolTip(pa, html, {
                left: pageX,
                top: pageY,
            })
        } else {
            hideToolTip(pa)
        }
        if (leftDragCell) {
            leftDragLine(pa, x, y, leftCell.cell)
        } else {
            setDomCss(pa.leftBox, {
                cursor: 'default',
            })
        }
        if (pa.leftDragLineDown) {
            createLeftDragLine(pa, pa.width)
            updateLeftDragLinePosition(pa.leftDragLine, y)
        }
        if (pa.leftDragColLineDown) {
            createLeftDragColLine(pa, pa.height)
            updateLeftDragColLinePosition(pa.leftDragColLine, x)
        }
    }

    leftMouseleave = (e) => {
        const pa = this.tableIns._pa
        pa.leftToolTipRender && hideToolTip(pa)
    }

    headerClick = (e) => {
        const pa = this.tableIns._pa
        if (pa.headerDragLineDown) return
        let x = e.offsetX,
            y = e.offsetY,
            headerCell = getSelectedHeaderCell(pa.headerData, pa.scrollLeft, x, y)
        // 展开收起
        if (headerCell.cell) {
            const arrowXy = headerCell.cell.arrowXy
            // initKey(pa.key, globalEventsMap)
            if (pa.arrowCanClick && isIntraArea(arrowXy, e.offsetX, e.offsetY)) {
                this.tableIns.setSelectedCell(null)
                pa.headerData = openHeaderTr(headerCell.cell, pa.headerData, pa.headerAllData)
                // 可优化 根据rowIndex 只计算新加入行的列 ..
                pa.tableData = setTableData(pa.leftData, pa.headerData, pa.tableAllData)
                setRowHeight(pa, pa.leftAllData, pa.leftData, pa.tableData)
                // 更新宽度
                this.tableIns._updateWidth()
                this.tableIns._updateHeight()
                // 更新滚动条
                this.tableIns._updateScrollLeftNode()
                this.tableIns._updateScrollTopNode()
                // 重绘
                this.tableIns.repaintLeft()
                this.tableIns.repaintHeader()
                this.tableIns.repaintRight()
                pa.handleHeaderOpen && pa.handleHeaderOpen(headerCell.cell)
                resetTextareaPosi(pa)
            } else {
                const c = headerCell.cell
                const cells = pa.headerData[c.newRowIndex].cells
                pa.clickLeftCell = null
                pa.clickHeaderCell = c
                const sum = getCellBeforeColSpanSum(cells, c.newColIndex) - (c.newColSpan || c.colSpan)
                pa.area = setAreaByHeaderCell(c, pa.tableData.length - 1, sum)
                this.tableIns.setSelectedCell(getFirstCellByArea(pa.area, pa.tableData))
                this.tableIns.repaintRight()
                pa.handleHeaderThClick && pa.handleHeaderThClick(c)
            }
        }
    }

    headerMousedown = (e) => {
        const pa = this.tableIns._pa
        let x = e.offsetX,
            y = e.offsetY
        // 鼠标位于拖拽区域
        if (pa.headerDrageLineShow) {
            let dragCell = getDragHeaderCell(pa.headerData, pa.scrollLeft, x, y)
            if (dragCell.cell) {
                pa.headerToolTipRender && hideToolTip(pa)
                pa.headerDragLineDown = true
                pa.DragColIndex = dragCell.colIndex
                pa.DragRowIndex = dragCell.rowIndex
                pa.headerDownPageX = e.pageX
            }
        } else {
            pa.headerDrageLineShow = null
            pa.headerDragLineDown = null
        }
    }

    headerMousemove = (e) => {
        const {
            pageX,
            pageY,
        } = e
        const pa = this.tableIns._pa
        let x = e.offsetX,
            y = e.offsetY,
            headerCell = getSelectedHeaderCell(pa.headerData, pa.scrollLeft, x, y)
        if (headerCell.cell && pa.headerToolTipRender) {
            const html = pa.headerToolTipRender(headerCell.cell)
            if (!html) return
            updatedToolTip(pa, html, {
                left: pageX,
                top: pageY,
            })
        } else {
            hideToolTip(pa)
        }

        headerDragLine(pa, x, y, headerCell.cell)
        if (pa.headerDragLineDown) {
            createHeaderDragLine(pa, pa.height)
            updateDragLinePosition(pa.headerDragLine, x)
        }
    }

    headerMouseleave = (e) => {
        const pa = this.tableIns._pa
        pa.headerToolTipRender && hideToolTip(pa)
    }

    bodyClick = (e) => {
        const pa = this.tableIns._pa
        if (!pa.selectedCell) return
        if (pa.responseBodyClick && !pa.responseBodyClick(pa.selectedCell)) return
        if (!inCell(pa.area)) return
        // 是下拉箭头区域
        const dropDownXy = pa.selectedCell.dropDownXy
        if (dropDownXy) {
            if (isIntraArea(dropDownXy, e.offsetX, e.offsetY)) {
                pa.handleClickDropDown && pa.handleClickDropDown(pa.selectedCell)
            }
        }
    }

    bodyMousedown = (e) => {
        const pa = this.tableIns._pa
        if (e.button === 1 && pa.handleMouseDown && !pa.handleMouseDown()) return
        // initKey(pa.key, globalEventsMap)
        // 定时器防止 mousedown 事件先于失去焦点事件触发
        setTimeout(() => {
            if (e.button === 2) {
                if (isSelectMultipleCell(pa.area)) {
                    pa.contextmenu && pa.contextmenu(null, e.pageX, e.pageY);
                    return
                }
            }
            pa.clickHeaderCell = null
            pa.clickLeftCell = null
            pa.toolTipRender && hideToolTip(pa)
            pa.timer = new Date()
            pa.doubleClick = false

            if (pa.preTimer && pa.timer - pa.preTimer < 240) { // 双击
                pa.doubleClick = true
            }

            pa.preTimer = pa.timer
            pa.mousedown = true
            pa.downX = e.offsetX
            pa.downY = e.offsetY
            pa.mouseDownScrollLeft = pa.scrollLeft
            pa.mouseDownScrollTop = pa.scrollTop
            updateTableBoxRect(pa)
            const area = selectionArea(pa, e.offsetX, e.offsetY)
            if (!inCell(area)) {
                return
            }
            pa.area = area
            // resetTextareaPosi(pa, !pa.doubleClick)
            // 重绘右侧 待优化(只重绘某个cell)
            this.tableIns.repaintRight()
            this.tableIns.preSelectedId = this.tableIns.selectedCell ? this.tableIns.selectedCell.id : null
            const cell = getFirstCellByArea(area, pa.tableData)

            // 此类判断应该放到表格外部 解除耦合...
            let rextAreaInit = false
            if (cell.datatype === '5' || cell.datatype === '4') {
                rextAreaInit = true
            }

            // 响应双击
            let runDefaultDouble = true
            if (pa.doubleClick && pa.handleDoubleClick) {
                runDefaultDouble = pa.handleDoubleClick(cell)
            }
            if (!runDefaultDouble) return

            resetTextareaPosi(pa, !pa.doubleClick || rextAreaInit)

            this.tableIns.setSelectedCell(cell)
            // 响应单击
            let runDefaultClick = true
            if (pa.handleClick) {
                runDefaultClick = pa.handleClick(cell)
            }

            // 右键
            if (e.button === 2) {
                pa.contextmenu && pa.contextmenu(cell, e.pageX, e.pageY);
            }

            if (!pa.doubleClick && !runDefaultClick) return

            if (pa.responseBodyMouseDown && !pa.responseBodyMouseDown(cell)) return

            // pa.textareaInstance.focus()
            let v = cell.value
            if (cell.datatype === '2') {
                if (v && !isNaN(v)) {
                    v = strip(v * 100)
                }
            }
            pa.textareaInstance.setValue(v)

        }, 0)
        return false
    }

    bodyMusemove = (e) => {
        const {
            pageX,
            pageY,
            offsetX,
            offsetY
        } = e
        const pa = this.tableIns._pa
        // 清空超出框选属性
        pa.mouseleave = false
        pa.exceedBound && clearAutoScroll(pa)
        pa.exceedBound = false
        pa.autoScrollStart = false

        if (!pa.mousedown) {
            if (pa.handleMouseMove || pa.toolTip) {
                const startRowIndex = findRowIndex(pa.tableData, offsetY),
                    startColIndex = findColIndex(pa.tableData, offsetX)
                const area = {
                    startRowIndex: startRowIndex,
                    startColIndex: startColIndex,
                    endRowIndex: startRowIndex,
                    endColIndex: startColIndex
                }

                if (inCell(area)) {
                    const cell = getCellByMouseOver(pa, offsetX + pa.scrollLeft, offsetY + pa.scrollTop, pa.tableData)
                    pa.handleMouseMove && pa.handleMouseMove(cell)

                    if (pa.toolTipRender) {
                        const html = pa.toolTipRender(cell)
                        if (!html) {
                            hideToolTip(pa)
                        } else {
                            updatedToolTip(pa, html, {
                                left: pageX,
                                top: pageY,
                            })
                        }
                    }
                } else {
                    pa.toolTipRender && hideToolTip(pa)
                    return
                }
            }
        }

        if (pa.mousedown) {
            // 框选区域
            // if (!inCell(pa.area)) {
            // 	return
            // }
            this.tableIns.mouseMovePaintTable(offsetX, offsetY)
        }

        if (pa.headerDragLineDown) {
            createHeaderDragLine(pa, pa.height)
            updateDragLinePosition(pa.headerDragLine, offsetX)
        }

        if (pa.leftDragLineDown) {
            createLeftDragLine(pa, pa.width)
            updateLeftDragLinePosition(pa.leftDragLine, offsetY)
        }

        if (pa.leftDragColLineDown) {
            updateLeftDragColLinePosition(pa.leftDragColLine, offsetX + pa.leftWidth)
        }
    }

    bodyMouseup = (e) => {
        const pa = this.tableIns._pa
        pa.handleRightTdMouseUp && pa.handleRightTdMouseUp()
    }

    bodyMouseleave = (e) => {
        const pa = this.tableIns._pa
        const offsetX = e.offsetX
        const offsetY = e.offsetY
        pa.toolTipRender && hideToolTip(pa)
        pa.mouseleave = true
        if (pa.mousedown) {
            resetBoundSign(pa)
            const scrollBarWidth = 18
            if (offsetX <= 0) {
                pa.leftRightBound = -1
                pa.exceedBound = true
            }
            if (offsetX >= pa.rightSurplusWidth - scrollBarWidth) {
                pa.leftRightBound = 1
                pa.exceedBound = true
            }
            if (offsetY <= 0) {
                pa.topBottomBound = -1
                pa.exceedBound = true
            }
            if (offsetY >= pa.tableBodyHeight - scrollBarWidth) {
                pa.topBottomBound = 1
                pa.exceedBound = true
            }
        }
    }
}

export default EventCore