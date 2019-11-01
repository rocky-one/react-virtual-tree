import {
	getSelectedTableCells,
	findRowIndex,
	findColIndex,
} from './utils'
import {
	getPointStartRowIndex,
	getPointEndColIndex,
	getPointStartColIndex,
	getPointEndRowIndex,
} from './utils/point'
// 更新textarea位置
export function resetTextareaPosi(pa = {}, init, blur = false) {
	const cell = pa.formType === '1' && pa.fakeValue ? pa.clickLeftCell : pa.selectedCell
	let info = {}
	if (!cell || init || !cell.updated || cell.cellReadOnly) {
		info = {
			width: 0,
			height: 0,
			left: 0,
			top: 0,
			scrollLeft: 0,
			scrollTop: 0
		}
	} else {
		info = {
			width: cell.width,
			height: cell.height,
			left: cell.dynaCell ? -pa.leftWidth : cell.x,
			top: cell.y,
			scrollLeft: pa.scrollLeft,
			scrollTop: pa.scrollTop
		}
	}
	pa.textareaInstance.resetPosition(info)
	!blur && pa.textareaInstance.focus()
	pa.showTextarea = info.width != 0
}

// 根据选择区域 获取到第一个cell
export function getFirstCellByArea(area, tableData) {
	if (!area) return null
	return tableData[area.startRowIndex].cells[area.startColIndex]
}

// 更新toolTip位置
export function updatedToolTip(pa, html, style) {
	// const render = pa.toolTipRender(cell)
	// if(!render) return
	pa.toolTip.innerHTML = html
	pa.toolTip.style.left = `${style.left + 20}px`
	pa.toolTip.style.top = `${style.top - 20}px`
	pa.toolTip.style.display = 'block'
}


// 隐藏toolTip
export function hideToolTip(pa) {
	pa.toolTip.innerHTML = null
	pa.toolTip.style.left = 0
	pa.toolTip.style.top = 0
	pa.toolTip.style.display = 'none'
}


// 是否在cell区域内
export function inCell(area) {
	if (!area) return false
	let values = Object.values(area)
	for (let i = 0; i < values.length; i++) {
		if (values[i] < 0) {
			return false
		}
	}
	return true
}

export function updateTableBoxRect(pa) {
	pa.tableBoxRect = pa.tableBox.getBoundingClientRect()
}

/**
 * @desc 选择区域 开始结束坐标
 * @param {Number} x 坐标
 */
export function selectionArea(pa, x, y) {
	let area = null
	if (pa.methodQueue.length === 0) {
		pa.methodQueue.push(1)
		// pa.moveX = x
		// pa.moveY = y
		//const inTableXy = pa.calcXyRelativeTable(x, y, pa.scrollLeft, pa.scrollTop)

		area = getSelectedTableCells(
			pa.tableData,
			pa.downX,
			pa.downY,
			x,
			y,
			// inTableXy.x,
			// inTableXy.y,
			pa.mouseDownScrollLeft,
			pa.mouseDownScrollTop,
			pa.scrollLeft,
			pa.scrollTop,
			() => {
				pa.methodQueue.pop()
			})

	} else {
		return pa.area
	}
	return area
}


/**
 * @desc 清除自动滚动
 * @param {*} pa 
 */
export function clearAutoScroll(pa) {
	if (!pa.timer) return
	clearTimeout(pa.timer)
	// pa.autoScrollStart = false
	pa.timer = null
}

// 鼠标滑过 获取当前cell
export function getCellByMouseOver(pa, x, y, tableData) {
	//const inTableXy = pa.calcXyRelativeTable(x, y, pa.scrollLeft, pa.scrollTop)
	const startRowIndex = findRowIndex(tableData, y)
	const startColIndex = findColIndex(tableData, x)
	if (startRowIndex < 0 || startColIndex < 0) return false
	return tableData[startRowIndex].cells[startColIndex]
}

// 重置超出边界标记
export function resetBoundSign(pa) {
	pa.exceedBound = false
	pa.topBottomBound = null
	pa.leftRightBound = null
}

/**
 * @desc 自动滚动时计算新的area
 */
function calcAutoScrollArea(pa) {
	let rowIndex = 0,
		colIndex = 0
	if (pa.topBottomBound === -1) {
		rowIndex = pa.area.startRowIndex - 1
		rowIndex = rowIndex < 0 ? 0 : rowIndex
		pa.area.startRowIndex = rowIndex
	} else if (pa.topBottomBound === 1) {
		rowIndex = pa.area.endRowIndex + 1
		const rowLen = pa.tableData.length || 0
		rowIndex = rowIndex >= rowLen ? rowLen - 1 : rowIndex
		pa.area.endRowIndex = rowIndex
	}
	if (pa.leftRightBound === -1) {
		colIndex = pa.area.startColIndex - 1
		colIndex = colIndex <= 0 ? 0 : colIndex
		pa.area.startColIndex = colIndex
	} else if (pa.leftRightBound === 1) {
		colIndex = pa.area.endColIndex + 1
		const colLen = pa.tableData.length > 0 ? pa.tableData[0].cells.length : 0
		colIndex = colIndex >= colLen ? colLen - 1 : colIndex
		pa.area.endColIndex = colIndex
	}
	return {
		rowIndex,
		colIndex
	}
}

/**
 * @desc 拖拽选中区域超出边界 自动滚动
 */
export function autoScroll(pa) {
	if (!pa.autoScrollStart) {
		pa.autoScrollStart = true
	}
	const indexObj = calcAutoScrollArea(pa)

	// const rowLen = pa.tableData.length || 0
	// const colLen = pa.tableData.length > 0 ? pa.tableData[0].cells.length : 0

	if (pa.leftRightBound) {
		const cell = pa.tableData[indexObj.rowIndex].cells[indexObj.colIndex]
		pa.exceedPageX += cell.width * pa.leftRightBound
		pa.scrollBar.horizontalMove(pa.exceedPageX, true)
		if (pa.leftRightBound === -1) {
			pa.area.endColIndex = pa.selectedCell.newColIndex
		} else {
			pa.area.startColIndex = pa.selectedCell.newColIndex
		}
	}
	if (pa.topBottomBound) {
		const row = pa.tableData[indexObj.rowIndex]
		pa.exceedPageY += row.height * pa.topBottomBound
		pa.scrollBar.verticalMove(pa.exceedPageY, true)
		if (pa.topBottomBound === -1) {
			pa.area.endRowIndex = pa.selectedCell.newRowIndex
		} else {
			pa.area.startRowIndex = pa.selectedCell.newRowIndex
		}
	}
	// 右
	if (pa.scrollBar.hBound === 1 && pa.leftRightBound === 1) {
		clearAutoScroll(pa)
		return
	}
	// 左
	if (pa.scrollBar.hBound === 2 && pa.leftRightBound === -1) {
		clearAutoScroll(pa)
		return
	}

	// 下
	if (pa.scrollBar.vBound === 1 && pa.topBottomBound === 1) {
		clearAutoScroll(pa)
		return
	}

	// 上
	if (pa.scrollBar.vBound === 2 && pa.topBottomBound === -1) {
		clearAutoScroll(pa)
		return
	}
	pa.timer = setTimeout(() => {
		if (pa.exceedBound) {
			autoScroll(pa)
		} else {
			clearAutoScroll(pa)
		}
	}, 100)
}

/**
 * @desc 键盘移动选中项时，自动滚入可视区
 */
export function ScrollToView(pa) {
	let newRowIndex = pa.selectedCell.newRowIndex
	let newColIndex = pa.selectedCell.newColIndex
	let scrollLeft = pa.scrollLeft
	let scrollTop = pa.scrollTop
	if (pa.scrollBar.hasHScroll()) {
		const endColIndex = getPointEndColIndex(pa.tableData, pa.rightSurplusWidth, scrollLeft, 'newColIndex')
		if (newColIndex > endColIndex) {
			scrollLeft = scrollLeft + (newColIndex - endColIndex) * pa.selectedCell.width
			if (scrollLeft > pa.scrollBar.maxScrollLeft) {
				pa.scrollLeft = pa.scrollBar.maxScrollLeft
			} else {
				pa.scrollLeft = scrollLeft
			}
		}
		if (newColIndex < getPointStartColIndex(pa.tableData, scrollLeft, 'newColIndex')) {
			pa.scrollLeft = pa.selectedCell.width * newColIndex
		}
		pa.scrollBar.hScrollChangeUpdate(pa.scrollLeft)
	}
	if (pa.scrollBar.hasVScroll()) {
		const endRowIndex = getPointEndRowIndex(pa.tableData, pa.tableBodyHeight, scrollTop, 'rowIndex')
		if (newRowIndex > endRowIndex) {
			scrollTop = scrollTop + (newRowIndex - endRowIndex) * pa.selectedCell.height
			if (scrollTop > pa.scrollBar.maxScrollTop) {
				pa.scrollTop = pa.scrollBar.maxScrollTop
			} else {
				pa.scrollTop = scrollTop
			}
		}
		if (newRowIndex < getPointStartRowIndex(pa.tableData, scrollTop, 'rowIndex')) {
			pa.scrollTop = pa.selectedCell.height * newRowIndex
		}
		pa.scrollBar.vScrollChangeUpdate(pa.scrollTop)
	}
}