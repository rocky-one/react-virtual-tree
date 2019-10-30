
import {
    resetTextareaPosi,
    ScrollToView
} from '../tableUtils'
import {
    getPointStartRowIndex,
    getPointEndColIndex,
    getPointStartColIndex,
    getPointEndRowIndex,
} from '../utils/point'
import { keyMap } from '../event/GlobalEvent'

export function isTarget(target, paKey) {
    let key = null
    if (target) {
        key = target.getAttribute('data-key')
    }
    if (paKey != keyMap.key || paKey != key) {
        return false
    }

    // if(target===document.body){
    //     return true
    // }
    // if(target && !ele.contains(target)){
    //     return false
    // }
    return true
}

function getActiveArea(tableData, area) {
    let avtiveArea
    if (area.startRowIndex === area.endRowIndex && area.startColIndex === area.endColIndex) {
        avtiveArea = tableData
    } else {
        avtiveArea = JSON.parse(JSON.stringify(tableData)).slice(area.startRowIndex, area.endRowIndex + 1)
        avtiveArea.forEach(v => {
            v.cells = v.cells.slice(area.startColIndex, area.endColIndex + 1)
        })
    }
    return avtiveArea
}


export default class BodyHotKey {
    constructor(option) {
        this.tableIns = option.tableIns
        this.hotKey = option.hotKey || {}
    }
    // ctrl = (event) => {
    //     if(!this.tableIns._pa.showTextarea){
    //         this.tableIns._pa.textareaInstance.blur()
    //     }
    // }
    ctrlC = (event) => {
        if(this.tableIns._pa.showTextarea) return 
        this.hotKey['ctrlC'] && this.hotKey['ctrlC'](event)
    }
    ctrlV = (event) => {
        if(this.tableIns._pa.showTextarea) return 
        this.hotKey['ctrlV'] && this.hotKey['ctrlV'](event)
    }
    tab = (event) => {
        event.preventDefault()
        const pa = this.tableIns._pa
        if (pa.showTextarea) return
        if (event.target == document.body || !isTarget(event.target, pa.key)) return
        const area = pa.area
        let selectedCell = pa.selectedCell
        if (selectedCell) {
            let newRowIndex = pa.selectedCell.newRowIndex
            let newColIndex = pa.selectedCell.newColIndex
            const activeArea = getActiveArea(pa.tableData, area)
            newColIndex++
            const cells = activeArea[0].cells
            if (newColIndex > cells[cells.length - 1].newColIndex) {
                newColIndex = cells[0].newColIndex
                newRowIndex++
                if (newRowIndex > activeArea[activeArea.length - 1].rowIndex) {
                    newRowIndex = activeArea[0].rowIndex
                }
            }
            this.tableIns.setSelectedCell(pa.tableData[newRowIndex].cells[newColIndex])
            if (area.startRowIndex === area.endRowIndex &&
                area.startColIndex === area.endColIndex) {
                pa.area = {
                    startRowIndex: pa.selectedCell.newRowIndex,
                    startColIndex: pa.selectedCell.newColIndex,
                    endRowIndex: pa.selectedCell.newRowIndex,
                    endColIndex: pa.selectedCell.newColIndex
                }
            }
            this.tableIns.repaintRight()
            ScrollToView(pa)
        }
    }
    enter = (event) => {
        const pa = this.tableIns._pa
        const area = pa.area
        if (event.target == document.body || !isTarget(event.target, pa.key)) return
        let selectedCell = pa.selectedCell
        if (selectedCell) {
            let newRowIndex = pa.selectedCell.newRowIndex
            let newColIndex = pa.selectedCell.newColIndex
            // 回车如果是编辑状态 先保存当前value 然后跳到下一个单元格
            if (pa.showTextarea) {
                this.tableIns._blurCb(event.target)
            }
            const activeArea = getActiveArea(pa.tableData, area)
            newRowIndex++
            const cells = activeArea[0].cells
            if (newRowIndex > activeArea[activeArea.length - 1].rowIndex) {
                newRowIndex = activeArea[0].rowIndex
                newColIndex++
                if (newColIndex > cells[cells.length - 1].newColIndex) {
                    newColIndex = cells[0].newColIndex
                }
            }
            this.tableIns.setSelectedCell(pa.tableData[newRowIndex].cells[newColIndex])
            if (area.startRowIndex === area.endRowIndex &&
                area.startColIndex === area.endColIndex) {
                pa.area = {
                    startRowIndex: pa.selectedCell.newRowIndex,
                    startColIndex: pa.selectedCell.newColIndex,
                    endRowIndex: pa.selectedCell.newRowIndex,
                    endColIndex: pa.selectedCell.newColIndex
                }
            }
            this.tableIns.repaintRight()
            ScrollToView(pa)
        }
    }
    upArrow = (event) => {
        const pa = this.tableIns._pa
        // if (pa.showTextarea) return
        if (!isTarget(event.target, pa.key)) return
        let selectedCell = pa.selectedCell
        if (selectedCell) {
            let newRowIndex = pa.selectedCell.newRowIndex
            let newColIndex = pa.selectedCell.newColIndex
            const bodyData = pa.tableData
            // 如果是编辑状态 先保存当前value 然后跳到下一个单元格
            if (pa.showTextarea) {
                this.tableIns._blurCb(event.target)
            }
            // 上
            newRowIndex--
            if (pa.scrollBar.hasVScroll()) {
                if (newRowIndex - 1 < getPointStartRowIndex(bodyData, pa.scrollTop)) { //selectedCell.y - pa.scrollTop < 40
                    let scrollTop = pa.scrollTop
                    scrollTop -= pa.selectedCell.height
                    if (scrollTop < 0) {
                        scrollTop = 0
                    }
                    pa.scrollTop = scrollTop
                }
            }

            if (newRowIndex < 0) {
                pa.scrollTop = pa.scrollBar.maxScrollTop
                newRowIndex = pa.tableData.length - 1
            }
            if (pa.scrollBar.hasVScroll()) {
                pa.scrollBar.vScrollChangeUpdate(pa.scrollTop)
            }
            this.tableIns.setSelectedCell(bodyData[newRowIndex].cells[newColIndex])
            pa.area = {
                startRowIndex: pa.selectedCell.newRowIndex,
                startColIndex: pa.selectedCell.newColIndex,
                endRowIndex: pa.selectedCell.newRowIndex,
                endColIndex: pa.selectedCell.newColIndex
            }
            this.tableIns.repaintRight()
        }
    }
    downArrow = () => {
        const pa = this.tableIns._pa
        //if (pa.showTextarea) return
        if (!isTarget(event.target, pa.key)) return
        let selectedCell = pa.selectedCell
        if (selectedCell) {
            let newRowIndex = pa.selectedCell.newRowIndex
            let newColIndex = pa.selectedCell.newColIndex
            let scrollTop = pa.scrollTop
            const bodyData = pa.tableData
            // 如果是编辑状态 先保存当前value 然后跳到下一个单元格
            if (pa.showTextarea) {
                this.tableIns._blurCb(event.target)
            }
            newRowIndex++
            // 下
            if (pa.scrollBar.hasVScroll()) {
                if (newRowIndex + 1 > getPointEndRowIndex(bodyData, pa.tableBodyHeight, scrollTop)) { //selectedCell.y - pa.scrollTop + 40 > pa.tableBodyHeight
                    scrollTop += pa.selectedCell.height
                    if (scrollTop > pa.scrollBar.maxScrollTop) {
                        pa.scrollTop = pa.scrollBar.maxScrollTop
                    } else {
                        pa.scrollTop = scrollTop
                    }
                }
            }
            if (newRowIndex >= bodyData.length) {
                newRowIndex = 0
                pa.scrollTop = 0
            }
            if (pa.scrollBar.hasVScroll()) {
                pa.scrollBar.vScrollChangeUpdate(pa.scrollTop)
            }
            this.tableIns.setSelectedCell(bodyData[newRowIndex].cells[newColIndex])
            // pa.selectedCell = bodyData[newRowIndex].cells[newColIndex]
            pa.area = {
                startRowIndex: pa.selectedCell.newRowIndex,
                startColIndex: pa.selectedCell.newColIndex,
                endRowIndex: pa.selectedCell.newRowIndex,
                endColIndex: pa.selectedCell.newColIndex
            }
            this.tableIns.repaintRight()
        }
    }
    rightArrow = (event) => {
        const pa = this.tableIns._pa
        if (pa.showTextarea) return
        if (!isTarget(event.target, pa.key)) return
        let selectedCell = pa.selectedCell
        if (selectedCell) {
            let newRowIndex = pa.selectedCell.newRowIndex
            let newColIndex = pa.selectedCell.newColIndex
            let scrollLeft = pa.scrollLeft
            const bodyData = pa.tableData
            newColIndex++
            // 右
            if (pa.scrollBar.hasHScroll()) {
                if (newColIndex + 1 > getPointEndColIndex(bodyData, pa.rightSurplusWidth, scrollLeft)) {
                    scrollLeft += pa.selectedCell.width
                    if (scrollLeft > pa.scrollBar.maxScrollLeft) {
                        pa.scrollLeft = pa.scrollBar.maxScrollLeft
                    } else {
                        pa.scrollLeft = scrollLeft
                    }
                }
            }
            const cells = bodyData[0].cells
            if (newColIndex >= cells.length) {
                newColIndex = 0
                pa.scrollLeft = 0
                // newRowIndex++ 
                // if(newRowIndex>=bodyData.length){
                //     newRowIndex=0
                // }
            }

            if (pa.scrollBar.hasHScroll()) {
                pa.scrollBar.hScrollChangeUpdate(pa.scrollLeft)
            }
            this.tableIns.setSelectedCell(bodyData[newRowIndex].cells[newColIndex])
            // pa.selectedCell = bodyData[newRowIndex].cells[newColIndex]
            pa.area = {
                startRowIndex: pa.selectedCell.newRowIndex,
                startColIndex: pa.selectedCell.newColIndex,
                endRowIndex: pa.selectedCell.newRowIndex,
                endColIndex: pa.selectedCell.newColIndex
            }
            this.tableIns.repaintRight()
        }
    }
    leftArrow = (event) => {
        const pa = this.tableIns._pa
        if (pa.showTextarea) return
        if (!isTarget(event.target, pa.key)) return
        let selectedCell = pa.selectedCell
        if (selectedCell) {
            let newRowIndex = pa.selectedCell.newRowIndex
            let newColIndex = pa.selectedCell.newColIndex
            let scrollLeft = pa.scrollLeft
            const bodyData = pa.tableData
            newColIndex--
            // 左 
            if (pa.scrollBar.hasHScroll()) {
                if (newColIndex - 1 < getPointStartColIndex(bodyData,  scrollLeft)) {
                    scrollLeft -= pa.selectedCell.width
                    if (scrollLeft < 0) {
                        pa.scrollLeft = 0
                    } else {
                        pa.scrollLeft = scrollLeft
                    }
                }
            }
            const cells = bodyData[0].cells
            if (newColIndex < 0) {
                newColIndex = cells.length - 1
                pa.scrollLeft = pa.scrollBar.maxScrollLeft
            }
            if (pa.scrollBar.hasHScroll()) {
                pa.scrollBar.hScrollChangeUpdate(pa.scrollLeft)
            }
            this.tableIns.setSelectedCell(bodyData[newRowIndex].cells[newColIndex])
            // pa.selectedCell = bodyData[newRowIndex].cells[newColIndex]
            pa.area = {
                startRowIndex: pa.selectedCell.newRowIndex,
                startColIndex: pa.selectedCell.newColIndex,
                endRowIndex: pa.selectedCell.newRowIndex,
                endColIndex: pa.selectedCell.newColIndex
            }
            this.tableIns.repaintRight()
        }
    }
    exceptHotkeyRun = (event, isCtrl) => {
        const pa = this.tableIns._pa
        if (pa.keyboardEvent) {
            if (!pa.keyboardEvent(pa.selectedCell, event.keyCode)) return
        }
        if (!isTarget(event.target, pa.key)) return
        if (!pa.selectedCell || isCtrl) return false

        // 只有是输入键时才执行
        if (!pa.shouldClearTextareaValue) {
            !pa.doubleClick && pa.textareaInstance.setValue()
            resetTextareaPosi(pa)
            // 键盘输入时 只在第一次时清空value
            pa.shouldClearTextareaValue = true
        }
    }
}

