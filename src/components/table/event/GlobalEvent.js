import {
    addEvent,
    removeEvent,
} from './eventBind'
import {
    hideToolTip,
    autoScroll,
} from '../tableUtils'
import {
    setDomCss,
    setCanvasCss,
} from '../utils'

import {
    getLastHeaderCells,
} from '../utils/handleHeaderData'

import {
    headerDragLine,
    headerDragMove,
    getDistance,
    createHeaderDragLine,
    updateDragLinePosition,
    removeHeaderDragLine,
    leftDragLine,
    leftDragMove,
    leftDragColMove,
    getLeftDistance,
    getLeftColDistance,
    createLeftDragLine,
    createLeftDragColLine,
    removeLeftDragLine,
    removeLeftDragColLine,
    updateLeftDragLinePosition,
    updateLeftDragColLinePosition
} from '../utils/headerDrag'

import {
    findPre,
    setRowHeight
} from '../utils/common'

// 全局事件 
// 多个table实例时对于全局事件只绑定一次
// 根据当前table焦点来决定全局事件要响应那个table

class GlobalEvent {
    constructor() {
        this.documentEvents = [{
            event: 'mousemove',
            fn: this.documentBodyMousemove
        }, {
            event: 'mouseup',
            fn: this.documentBodyMouseup
        },
            // {
            //     event: 'copy',
            //     fn: this.documentCopy
            // },{
            //     event: 'paste',
            //     fn: this.documentPaste
            // }
        ]
        this.documentEvents.forEach(eventItem => {
            addEvent(document.body, eventItem.event, eventItem.fn)
        })
    }
    setTable = (tableIns) => {
        //if (!this.tableIns || this.tableIns._pa.key != tableIns._pa.key) {
        this.tableIns = tableIns
        //}
    }
    documentCopy = (e) => {
        if (!this.tableIns || this.tableIns._pa.showTextarea) return
        this.tableIns.copyTextToClipboard()
    }
    documentPaste = (e) => {
        if (!this.tableIns || this.tableIns._pa.showTextarea) return
        this.tableIns.handlePaste(e)
    }
    documentBodyMousemove = (e) => {
        const {
            pageX,
            pageY
        } = e

        if (!this.tableIns) return
        // e.preventDefault()
        const pa = this.tableIns._pa
        if (!pa) return
        // 框选区域
        if (pa.mousedown) {
            if (pa.exceedBound) {
                
                // 计算滚动条中心点坐标, 只计算一次--
                if (!pa.exceedPageX && pa.leftRightBound) {
                    pa.exceedPageX = pa.scrollBar.startAutoScrollH().pageX
                }
                if (!pa.exceedPageY && pa.topBottomBound) {
                    pa.exceedPageY = pa.scrollBar.startAutoScrollV().pageY
                }
                
                // 超出一个方向的边界时, 另一个边界继续做选中区域
                if (!pa.autoScrollStart) {
                    autoScroll(pa)
                }
                return
            }
        }
        // 头部拖拽
        headerDragMove(pa, pageX, () => {
            setDomCss(pa.rightHeaderBox, {
                cursor: 'col-resize',
            })
            hideToolTip(pa)
        })

        // 左侧拖拽
        leftDragMove(pa, pageY, () => {
            setDomCss(pa.leftBox, {
                cursor: 'row-resize',
                zIndex: 4
            })
            hideToolTip(pa)
        })

        // 左侧列拖拽
        leftDragColMove(pa, pageX, () => {
            setDomCss(pa.leftBox, {
                cursor: 'col-resize',
            })
            hideToolTip(pa)
        })
    }

    documentBodyMouseup = (e) => {
        if (!this.tableIns) return
        const pa = this.tableIns._pa
        if (!pa) return
        pa.mousedown = false
        pa.exceedBound = false
        pa.autoScrollStart = false
        pa.exceedPageX = null
        pa.exceedPageY = null
        pa.upX = e.pageX
        pa.upY = e.pageY
        this._headerDragEnd()
        this._leftDragEnd()
    }

    _headerDragEnd() {
        const pa = this.tableIns._pa
        if (pa.headerDragLineDown) {
            setDomCss(pa.rightHeaderBox, {
                cursor: 'default',
            })
            const dragCell = pa.headerData[pa.DragRowIndex].cells[pa.DragColIndex]
            const distanceObj = getDistance(pa.headerDistance, dragCell, pa.headerData)
            const lastCells = getLastHeaderCells(pa.headerData)
            const lastCell = distanceObj.lastCell
            const addMap = {}
            // 更新headerData宽和坐标
            for (let i = lastCell.newColIndex; i < lastCells.length; i++) {
                const cell = lastCells[i]
                if (i === lastCell.newColIndex) {
                    cell.width += distanceObj.distance
                    findPre(cell, pa.headerAllData, (preCell) => {
                        if (preCell) {
                            const key = `${preCell.newRowIndex}${preCell.newColIndex}`
                            if (!addMap[key]) {
                                addMap[key] = true
                            }
                            preCell.width += distanceObj.distance
                        }

                    })
                } else {
                    cell.x += distanceObj.distance
                    findPre(cell, pa.headerAllData, (preCell) => {
                        if (preCell) {
                            const key = `${preCell.newRowIndex}${preCell.newColIndex}`
                            if (!addMap[key]) {
                                addMap[key] = true
                                preCell.x += distanceObj.distance
                            }
                        }

                    })
                }
            }
            // 更新表格宽和坐标
            const tableData = pa.tableData
            for (let j = 0; j < tableData.length; j++) {
                const cells = tableData[j].cells
                for (let i = lastCell.newColIndex; i < cells.length; i++) {
                    const cell = cells[i]
                    if (i === lastCell.newColIndex) {
                        cell.width += distanceObj.distance
                    } else {
                        cell.x += distanceObj.distance
                    }
                }
            }
            //setRowHeight(pa, pa.leftAllData, pa.leftData, pa.tableData)
            // 更新宽高
            this.tableIns._updateHeight()
            // 更新宽度
            this.tableIns._updateWidth()
            // 更新滚动条
            this.tableIns._updateScrollLeftNode()
            this.tableIns.repaintLeft()
            this.tableIns.repaintHeader()
            this.tableIns.repaintRight()
        }
        setTimeout(() => {
            pa.headerDragLineDown = null
            pa.headerDistance = 0
            removeHeaderDragLine(pa)
        }, 0)
    }

    _leftDragEnd() {
        const pa = this.tableIns._pa
        if (pa.leftDragLineDown) {
            setDomCss(pa.leftBox, {
                cursor: 'default',
                zIndex: 2
            })
            const dragCell = pa.leftDragCell
            const distanceObj = getLeftDistance(pa.leftDistance, dragCell, pa.leftData)
            const lastCells = pa.leftData
            const lastCell = distanceObj.lastCell
            const addMap = {}
            // 更新leftData高和坐标
            pa.leftHeight += distanceObj.distance
            for (let i = lastCell.newRowIndex; i < lastCells.length; i++) {
                const cells = lastCells[i]["cells"]
                const cell = cells[cells.length - 1]
                cell.hasDrag = true
                if (i === lastCell.newRowIndex) {
                    cell.height += distanceObj.distance
                    findPre(cell, pa.leftAllData, (preCell) => {
                        if (preCell) {
                            const key = `${preCell.newRowIndex}${preCell.newColIndex}`
                            if (!addMap[key]) {
                                addMap[key] = true
                            }
                            preCell.height += distanceObj.distance
                        }
                    })
                } else {
                    cell.y += distanceObj.distance
                    findPre(cell, pa.leftAllData, (preCell) => {
                        if (preCell) {
                            const key = `${preCell.newRowIndex}${preCell.newColIndex}`
                            if (!addMap[key]) {
                                addMap[key] = true
                                preCell.y += distanceObj.distance
                            }
                        }

                    })
                }
            }
            // 更新表格宽和坐标
            const tableData = pa.tableData
            const tableAllData = pa.tableAllData
            for (let i = lastCell.newRowIndex; i < tableData.length; i++) {
                if (i == lastCell.newRowIndex) {
                    tableAllData[i].height += distanceObj.distance
                    tableData[i].height += distanceObj.distance
                }
                const cells = tableData[i].cells
                cells.forEach(cell => {
                    if (i === lastCell.newRowIndex) {
                        cell.height += distanceObj.distance
                    } else {
                        cell.y += distanceObj.distance
                    }
                })
            }
            // 更新宽高
            this.tableIns._updateHeight()
            // 更新宽度
            this.tableIns._updateWidth()
            // 更新滚动条
            this.tableIns._updateScrollTopNode()
            this.tableIns.repaintLeft()
            this.tableIns.repaintRight()
        } else if (pa.leftDragColLineDown) {
            setDomCss(pa.leftBox, {
                cursor: 'default',
            })
            const dragCell = pa.leftDragCell
            const colIndex = dragCell.columnIndex
            const distance = getLeftColDistance(pa.leftWidth, pa.leftColDistance, dragCell)
            let cellsLength = pa.leftAllData[0]["cells"]["length"]
            //更新容器定位
            pa._leftColDistance = distance
            pa.rightSurplusWidth = pa.rightSurplusWidth - pa._leftColDistance
            pa.leftWidth += distance
            pa.leftCanvas.width += distance
            setDomCss(pa.leftHeaderBox, {
                width: `${pa.leftWidth}px`
            })
            setDomCss(pa.leftBox, {
                width: `${pa.leftWidth}px`
            })
            setDomCss(pa.rightHeaderBox, {
                left: `${pa.leftWidth}px`,
                width: `${pa.rightSurplusWidth}px`
            })
            setDomCss(pa.rightHeaderCont, {
                width: `${pa.rightSurplusWidth}px`
            })
            setCanvasCss(pa.rightHeaderCanvas, {
                width: pa.rightSurplusWidth,
                height: pa.headerHeight,
            })
            setDomCss(pa.tableBox, {
                width: `${pa.width - pa.leftWidth}px`,
                left: `${pa.leftWidth}px`,
            })
            setCanvasCss(pa.tableCanvas, {
                width: pa.rightSurplusWidth,
                height: pa.tableBodyHeight
            })
            //更新leftData高和坐标
            pa.leftAllData.forEach(rows => {
                rows.cells.forEach(cell => {
                    if (cell.columnIndex === colIndex) {
                        cell.width += distance
                    } else if (cell.columnIndex > colIndex) {
                        cell.x += distance
                    }
                })
            })
            // 更新高度
            this.tableIns._updateHeight()
            // 更新宽度
            this.tableIns._updateWidth()
            // 更新滚动条
            this.tableIns._updateScrollLeftNode()
            //更新容器定位
            this.tableIns.repaint()
        }
        setTimeout(() => {
            pa.leftDragCell = null
            pa.leftDragLineDown = null
            pa.leftDragColLineDown = null
            pa.leftDistance = 0
            pa.leftColDistance = 0
            pa._leftColDistance = 0
            removeLeftDragLine(pa)
            removeLeftDragColLine(pa)
        }, 0)
    }
    extend = (eventItem, fn) => {
        if (!this.documentEvents.find(n => n === name)) {
            this.documentEvents.push(eventItem)
            addEvent(document.body, eventItem.event, eventItem.fn)
        }
    }
    destroy = () => {
        // this.documentEvents.forEach(eventItem => {
        //     removeEvent(document.body, eventItem.event, eventItem.fn)
        // })
        this.tableIns = null
    }
}

export default new GlobalEvent()

export const keyMap = {}
export const globalEventsMap = {}