import ScrollBar from './scrollBar/ScrollBar'
import CreateTextarea from './textarea/CreateTextarea'
import Record from './record/Record'
import { BG_COLOR_TITLE, BORDER_COLOR } from './tableConst'
import { initTableData, setTableData, getLeftRowLastCell } from './utils/handleTableData'
import { setDomCss, setCanvasCss } from './utils'
import { removeBodyRows, removeRows } from './utils/removeRows'
import { removeBodyCols, removeCols } from './utils/removeCols'
import { addEvent, removeEvent } from './event/eventBind'
import EventCore from './event/EventCore'
import { keyMap, globalEventsMap } from './event/GlobalEvent'
import BodyHotKey from './keyboard/BodyHotKey'
import { closeAllLeft } from './utils/closeAllLeft'
import Keyboard from './keyboard/Keyboard'
import GlobalEvent from './event/GlobalEvent'

import {
	initLeftInfo,
	initLeftData,
	initOpenLeftData,
	initLeftNewRowSpan,
	updateLeftDataYWithIndex,
	getLeftHeight,
	findCellChildIsShowRows,
} from './utils/handleLeftData'

import {
	initHeaderData,
	getLastHeaderCells,
	initOpenHeaderData,
	assembleNewData,
	insertDataToHeader,
	initHeaderColSpan,
	setNewXYAndIndex,
} from './utils/handleHeaderData'

import {
	addAttr,
	getScrollSize,
	getPixelRatio,
	setRowHeight,
	findPre
} from './utils/common'


import {
	createDom,
	createCanvas,
	calcXyRelativeTable,
} from './utils'

import {
	resetTextareaPosi,
	inCell,
	selectionArea,
} from './tableUtils'

/**
 * @desc 创建外层容器
 * @param {*} ele 
 * @param {*} pa 
 */
function createContainer(ele, pa) {

	addAttr(pa, 'container', createDom('div', 'customTableContainer', 'cutom-table-container', {
		width: `${pa.width}px`,
		height: `${pa.height}px`,
	}))
	addAttr(pa, 'leftAndRightBox', createDom('div', 'leftAndRightBox', 'left-and-right-box', {
		// width: `${pa.width}px`,
		// height: `${pa.leftHeight}px`,
		position: 'ralative',
		zIndex: 3,
	}))
	if (!ele) return
	pa.container.appendChild(pa.leftAndRightBox)
	ele.appendChild(pa.container)
}

/**
 * @desc 创建滚动条
 * @param {*} pa 
 * @param {*} verticalScrollCb 
 * @param {*} horizontalScrollCb 
 */
function createScrollBar(pa, verticalScrollCb, horizontalScrollCb) {
	addAttr(pa, 'scrollBar', new ScrollBar({
		ele: pa.container,
		direction: ['vertical', 'horizontal'], //, 'horizontal'
		vertical: {
			ele: pa.container,
			containerPx: pa.tableBodyHeight,
			contentPx: pa.tableHeight,
			width: 14,
			height: pa.height,
			style: {
				top: `${pa.headerHeight}px`,
			}
		},
		horizontal: {
			containerPx: pa.rightSurplusWidth,
			contentPx: pa.tableWidth,
			height: 14,
			style: {
				left: `${pa.leftWidth}px`,
				// bottom: '-17px'
			}
		},
		eventBindEle: pa.leftAndRightBox,
		verticalScrollCb: verticalScrollCb,
		horizontalScrollCb: horizontalScrollCb
	}))
}

/**
 * @desc 创建左侧canvas
 * @param {*} pa 
 */
function createLeftCanvas(pa) {
	pa.leftBox = createDom('div', 'leftBox', 'left-box', {
		width: `${pa.leftWidth}px`,
		height: `${pa.tableBodyHeight}px`,
		top: `${pa.headerHeight}px`,
		zIndex: 2,
		// overflow: 'hidden',
		background: '#fff',
	})
	pa.leftCanvas = createCanvas({
		width: pa.leftWidth,
		// height: pa.leftHeight,
		height: `${pa.tableBodyHeight}`,
	})

	pa.leftBox.appendChild(pa.leftCanvas)
	pa.leftAndRightBox.appendChild(pa.leftBox)
	pa.leftContext = pa.leftCanvas.getContext('2d')
	pa.leftBoxRect = pa.leftBox.getBoundingClientRect()
}

function createLeftHeaderCanvas(pa) {
	pa.leftHeaderBox = createDom('div', 'leftHeaderBox', 'left-header-box', {
		width: `${pa.leftWidth}px`,
		height: `${pa.headerHeight}px`,
		background: BG_COLOR_TITLE,
		borderBottom: `1px solid ${BORDER_COLOR}`,
		borderRight: `1px solid ${BORDER_COLOR}`
	})
	pa.container.appendChild(pa.leftHeaderBox)
}

function createRightHeaderCanvas(pa) {
	pa.rightHeaderBox = createDom('div', 'rightHeaderBox', 'right-header-box', {
		width: `${pa.rightSurplusWidth}px`,
		height: `${pa.headerHeight}px`,
		left: `${pa.leftWidth}px`,
		zIndex: 1,
		// overflow: 'hidden',
	})
	pa.rightHeaderCont = createDom('div', 'rightHeaderCont', 'right-header-cont', {
		width: `${pa.rightSurplusWidth}px`,
		height: `${pa.headerHeight}px`,
		position: 'absolute',
		left: 0,
		top: 0,
	})
	pa.rightHeaderCanvas = createCanvas({
		width: pa.rightSurplusWidth,
		height: pa.headerHeight,
	})
	pa.rightHeaderCont.appendChild(pa.rightHeaderCanvas)
	pa.rightHeaderBox.appendChild(pa.rightHeaderCont)
	pa.container.appendChild(pa.rightHeaderBox)
	pa.rightHeaderContext = pa.rightHeaderCanvas.getContext('2d')
	pa.rightHeaderBoxRect = pa.rightHeaderBox.getBoundingClientRect()
}

function createTableCanvas(pa) {
	pa.tableBox = createDom('div', 'tableBox', 'table-box', {
		position: 'absolute',
		width: `${pa.width - pa.leftWidth}px`,
		height: `${pa.tableBodyHeight}px`,
		left: `${pa.leftWidth}px`,
		top: `${pa.headerHeight}px`,
		zIndex: 1,
	})
	pa.tableCanvas = createCanvas({
		width: pa.rightSurplusWidth,
		height: `${pa.tableBodyHeight}`,
	})
	pa.tableBox.appendChild(pa.tableCanvas)
	pa.leftAndRightBox.appendChild(pa.tableBox)
	pa.tableContext = pa.tableCanvas.getContext('2d')
}

// 根据选择区域 获取所有的cell的索引
function getSelectedRegion(area, tableData) {
	if (!area) return []
	const startRowIndex = area.startRowIndex
	const endRowIndex = area.endRowIndex
	const startColIndex = area.startColIndex
	const endColIndex = area.endColIndex
	const rowColIndex = []
	if (startRowIndex >= 0) {
		for (let i = startRowIndex; i <= endRowIndex; i++) {
			for (let j = startColIndex; j <= endColIndex; j++) {
				const cell = tableData[i].cells[j]
				rowColIndex.push({
					...cell,
					rowIndex: cell.newRowIndex,
					columnIndex: cell.newColIndex
				})
			}
		}
	}
	return rowColIndex
}

// const setChild = (list, child) => {
//     for(let k in list) {
//         if (list[k].id === child.parentId) {
//             if (!list[k].children){
//                 list[k].children = [child]
//             } else {
//                 if (!list[k].children.some(v => v.id === child.id)){
//                     list[k].children.push(child)
//                 }
//             }
//             return list
//         } else {
//             if (list[k].children) {
//                 return setChild(list[k].children, child)
//             }
//         }
//     }
// }

const setDimMems = (dims, index, cells, data) => {
	const pushDim = (cell, d, i) => {
		const dimId = Object.keys(cell.dimsInfoMap)[0]
		const c = {
			name: cell.value,
			id: cell.id,
			parentId: cell.parentId || dimId
		}
		if (d[i]) {
			if (!d[i].children.some(v => v.id === c.id)) { // if (!d[i].some(v => v.id === c.id) && !setChild(d[i], c)) {
				d[i].children.push(c)
			}
		} else {
			// 第一次要把维度加进去
			d[i] = {
				id: dimId,
				children: [c]
			}
		}
	}
	pushDim(cells, dims, index)
	findPre(cells, data, (preCell) => {
		if (preCell) {
			index++
			pushDim(preCell, dims, index)
		}
	})
}


// 获取选择区域的维度成员
function getSelectedRegionDimMems(area, leftData, headerData, leftAllDara, headerAllData) {
	if (!area) return []
	const { startRowIndex, endRowIndex, startColIndex, endColIndex } = area;
	const rowDims = [], colDims = [];
	for (let i = startRowIndex; i <= endRowIndex; i++) {
		let index = 0
		const leftRowLastCell = getLeftRowLastCell(leftData, i)
		setDimMems(rowDims, index, leftRowLastCell, leftAllDara)
	}
	const lastHeaderCells = getLastHeaderCells(headerData)
	for (let i = startColIndex; i <= endColIndex; i++) {
		let index = 0
		setDimMems(colDims, index, lastHeaderCells[i], headerAllData)
	}
	return {
		rowDims,
		colDims
	}
}

// 更新 scrollTop
function updateScrollTop(pa, scrollTop = 0) {
	pa.scrollTop = scrollTop
}
// 更新 scrollLeft
function updateScrollLeft(pa, scrollLeft = 0) {
	pa.scrollLeft = scrollLeft
}
// 创建textareaInstance
function createTextareas(pa, blurCb) {
	addAttr(pa, 'textareaInstance', new CreateTextarea({
		container: pa.tableBox,
		blurCb: blurCb,
		key: pa.key,
	}))
}

// 创建toolTip 放到单独类中维护?
function createToolTip(pa) {
	pa.toolTip = createDom('div', null, null, {
		position: 'absolute',
		maxWidth: `500px`,
		minWidth: '100px',
		minHeight: '20px',
		background: 'rgba(0,0,0,0.6)',
		left: 0,
		top: 0,
		zIndex: 9999,
		display: 'none',
		color: '#fff',
	})
	document.body.appendChild(pa.toolTip)
}

// 根据滚动条更新高
function updateHeightByScorll(pa, height) {
	pa.tableHeight = (height || pa.tableHeight)
}
// 根据滚动条更新宽
function updateWidthByScroll(pa, width) {
	pa.tableWidth = (width || pa.tableWidth)
}

function initKey(key, globalEventsMap) {
	Keyboard.init({
		callback: {
			ctrl: globalEventsMap[key].ctrl,
			ctrlC: globalEventsMap[key].ctrlC,
			ctrlV: globalEventsMap[key].ctrlV,
			tab: globalEventsMap[key].tab,
			enter: globalEventsMap[key].enter,
			upArrow: globalEventsMap[key].upArrow,
			downArrow: globalEventsMap[key].downArrow,
			leftArrow: globalEventsMap[key].leftArrow,
			rightArrow: globalEventsMap[key].rightArrow,
			exceptHotkeyRun: globalEventsMap[key].exceptHotkeyRun
		},
		key
	})
}

class Base {
	constructor(option) {
		// privateAttr 存放私有属性
		this._pa = {
			font: 14,
			ele: option.ele,
			arrowCanClick: true,
			showExpandArrow: option.hasOwnProperty('showExpandArrow') ? option.showExpandArrow : true,
			fakeValue: option.fakeValue || false, // 切换模式
			miniWidth: option.miniWidth || false,
			colOpen: option.colOpen,
			rowOpen: option.rowOpen,
			key: Date.now().toString(36), //生成一个唯一标记 用于键盘事件响应判断 或者其他操作
		}
		this.initWidthHeight(option.width, option.height)
		this.initData({
			leftData: option.leftData,
			headerData: option.headerData,
			tableData: option.tableData,
		})
		this.initSizeAttr(option)
		this.initFnAttr(option)
		this.init(option)

		this.eventCore = new EventCore({
			tableIns: this,
		})
		this.eventBindInit()

		this._pa.ratio = getPixelRatio(this._pa.leftContext)
		// GlobalEvent.setTable(this)
	}
	setColOpenStatus(open = false) {
		this._pa.colOpen = open
	}
	setRowOpenStatus(open = false) {
		this._pa.rowOpen = open
	}
	setArrowClickStatus(status = true) {
		this._pa.arrowCanClick = status
	}
	setExpandArrowStatus(status = false) {
		this._pa.showExpandArrow = status
	}
	initWidthHeight(width, height) {
		this._pa.width = width
		this._pa.height = height
	}
	initData(data) {
		const pa = this._pa
		const leftData = data.leftData || pa.leftData || []
		const headerData = data.headerData || pa.headerData || []
		const tableData = data.tableData || pa.tableData || []
		const leftInfoObj = initLeftInfo(leftData, pa.miniWidth)
		const leftDataObj = (pa.rowOpen && !pa.showExpandArrow)
			? initOpenLeftData(leftData, leftInfoObj.leftInfoMap)
			: initLeftData(leftData, leftInfoObj.leftInfoMap, pa.rowOpen)
		const headerDataObj = (pa.colOpen && !pa.showExpandArrow)
			? initOpenHeaderData(headerData)
			: initHeaderData(headerData, pa.colOpen)
		const tableDataObj = initTableData(
			tableData,
			leftDataObj.leftAllData,
			leftDataObj.leftData,
			headerDataObj.headerAllData,
			headerDataObj.headerData)
		addAttr(pa, leftInfoObj, leftDataObj, headerDataObj, tableDataObj)
		// 不是定义模式 才自动计算高度
		if (pa.showExpandArrow) {
			setRowHeight(pa, pa.leftAllData, pa.leftAllData, pa.tableAllData)
			setRowHeight(pa, pa.leftAllData, pa.leftData, pa.tableData)
		}
	}
	initSizeAttr(option = {}) {
		const pa = this._pa
		addAttr(pa, 'width', option.width || pa.width)
		addAttr(pa, 'height', option.height || pa.height)
		addAttr(pa, 'tableWidth', pa.headerWidth) // 内容宽
		addAttr(pa, 'tableHeight', pa.leftHeight) // 内容高
		addAttr(pa, 'vScrollSize', getScrollSize(pa.tableHeight, pa.height - pa.headerHeight))
		addAttr(pa, 'hScrollSize', getScrollSize(pa.headerWidth, pa.width - pa.leftWidth))
		addAttr(pa, 'rightSurplusWidth', pa.width - pa.leftWidth - pa.vScrollSize - 2) // 右侧盒子宽
		addAttr(pa, 'tableBodyHeight', pa.height - pa.headerHeight - pa.hScrollSize - 2) // 盒子高
		addAttr(pa, 'scrollLeft', 0)
		addAttr(pa, 'scrollTop', 0)
		addAttr(pa, 'mouseDownScrollLeft', 0)
		addAttr(pa, 'mouseDownScrollTop', 0)
		addAttr(pa, 'methodQueue', []) // 用于优化大量计算时,上一次计算还未结束,下一次计算又开始的情况
		addAttr(pa, 'methodQueue2', [])
		addAttr(pa, 'clickLeftCell', null)
		addAttr(pa, 'clickHeaderCell', null)
		addAttr(pa, 'headerDistance', 0)
	}
	initFnAttr(option) {
		const pa = this._pa
		addAttr(pa, 'contextmenu', option.contextmenu)
		addAttr(pa, 'handleDoubleClick', option.handleDoubleClick)
		addAttr(pa, 'responseHotkey', option.responseHotkey)
		addAttr(pa, 'verticalScrollCb', option.verticalScrollCb)
		addAttr(pa, 'horizontalScrollCb', option.horizontalScrollCb)
		addAttr(pa, 'handleMouseMove', option.handleMouseMove)
		addAttr(pa, 'toolTipRender', option.toolTipRender)
		addAttr(pa, 'format', option.format)
		addAttr(pa, 'preArea', '')
		addAttr(pa, 'blurCb', option.blurCb)
		addAttr(pa, 'handleRightTdMouseUp', option.handleRightTdMouseUp)
		addAttr(pa, 'handleHeaderThClick', option.handleHeaderThClick)
		addAttr(pa, 'handleLeftTdClick', option.handleLeftTdClick)
		addAttr(pa, 'handleLeftHeaderClick', option.handleLeftHeaderClick)
		addAttr(pa, 'handleClickDropDown', option.handleClickDropDown)
		addAttr(pa, 'paintTableCellRender', option.paintTableCellRender)
		addAttr(pa, 'paintLeftCellCb', option.paintLeftCellCb)
		addAttr(pa, 'paintHeaderCellCb', option.paintHeaderCellCb)
		addAttr(pa, 'paintTableCellCb', option.paintTableCellCb)
		addAttr(pa, 'leftToolTipRender', option.leftToolTipRender)
		addAttr(pa, 'headerToolTipRender', option.headerToolTipRender)
		addAttr(pa, 'responseBodyMouseDown', option.responseBodyMouseDown)
		addAttr(pa, 'setValueBefore', option.setValueBefore)
		addAttr(pa, 'setValueAfter', option.setValueAfter)
		addAttr(pa, 'keyboardEvent', option.keyboardEvent)
		addAttr(pa, 'handleMouseDown', option.handleMouseDown)
		addAttr(pa, 'responseBodyClick', option.responseBodyClick)
		addAttr(pa, 'hotKey', option.hotKey)

	}
	init(option) {
		const pa = this._pa
		createContainer(option.ele, pa)
		createScrollBar(pa, this._verticalScrollCb, this._horizontalScrollCb)
		createLeftCanvas(pa)
		createLeftHeaderCanvas(pa)
		createRightHeaderCanvas(pa)
		createTableCanvas(pa)
		createTextareas(pa, this._blurCb)
		createToolTip(pa)
		pa.calcXyRelativeTable = calcXyRelativeTable(this._pa.leftBoxRect.right, this._pa.rightHeaderBoxRect.bottom)
		pa.record = new Record({})
	}
	resize(option) {
		const pa = this._pa
		if (option.width) {
			addAttr(pa, 'width', option.width)
			addAttr(pa, 'height', option.height)
		}
		addAttr(pa, 'vScrollSize', getScrollSize(pa.tableHeight, pa.height - pa.headerHeight))
		addAttr(pa, 'hScrollSize', getScrollSize(pa.headerWidth, pa.width - pa.leftWidth))
		addAttr(pa, 'rightSurplusWidth', pa.width - pa.leftWidth - pa.vScrollSize - 2)
		addAttr(pa, 'tableBodyHeight', pa.height - pa.headerHeight - pa.hScrollSize - 2)

		setDomCss(pa.container, {
			width: `${pa.width}px`,
			height: `${pa.height}px`,
		})
		setDomCss(pa.leftBox, {
			width: `${pa.leftWidth}px`,
			height: `${pa.tableBodyHeight}px`,
			top: `${pa.headerHeight}px`,
		})
		setCanvasCss(pa.leftCanvas, {
			width: pa.leftWidth,
			height: `${pa.tableBodyHeight}`,
		})
		setDomCss(pa.leftHeaderBox, {
			width: `${pa.leftWidth - 1}px`,
			height: `${pa.headerHeight - 1}px`,
		})
		setDomCss(pa.rightHeaderBox, {
			width: `${pa.rightSurplusWidth}px`,
			height: `${pa.headerHeight}px`,
			left: `${pa.leftWidth}px`,
		})

		setDomCss(pa.rightHeaderCont, {
			width: `${pa.rightSurplusWidth}px`,
			height: `${pa.headerHeight}px`,
		})
		setCanvasCss(pa.rightHeaderCanvas, {
			width: pa.rightSurplusWidth,
			height: pa.headerHeight,
		})
		setDomCss(pa.tableBox, {
			width: `${pa.width - pa.leftWidth}px`,
			height: `${pa.tableBodyHeight}px`,
			left: `${pa.leftWidth}px`,
			top: `${pa.headerHeight}px`,
		})
		setCanvasCss(pa.tableCanvas, {
			width: pa.rightSurplusWidth,
			height: `${pa.tableBodyHeight}`,
		})

		this._updateScrollLeftNode()
		this._updateScrollTopNode()
		this.repaint()
	}
	setSelectedCell = (cell) => {
		const pa = this._pa
		pa.selectedCell = cell
		keyMap.key = pa.key
		cell && pa.textareaInstance.setValue(cell.value)
	}
	eventList = () => {
		this.leftCanvasHeader = [
			{
				event: 'click',
				fn: this.enhanceEventFn(this.eventCore.leftHeaderClick)
			},
		]
		this.leftCanvasEvents = [
			{
				event: 'click',
				fn: this.enhanceEventFn(this.eventCore.leftClick)
			},
			{
				event: 'mousedown',
				fn: this.enhanceEventFn(this.eventCore.leftMousedown)
			},
			{
				event: 'mousemove',
				fn: this.enhanceEventFn(this.eventCore.leftMouseMove)
			},
			{
				event: 'mouseleave',
				fn: this.enhanceEventFn(this.eventCore.leftMouseleave)
			}
		]
		this.headerCanvasEvents = [
			{
				event: 'click',
				fn: this.enhanceEventFn(this.eventCore.headerClick)
			},
			{
				event: 'mousedown',
				fn: this.enhanceEventFn(this.eventCore.headerMousedown)
			},
			{
				event: 'mousemove',
				fn: this.enhanceEventFn(this.eventCore.headerMousemove)
			},
			{
				event: 'mouseleave',
				fn: this.enhanceEventFn(this.eventCore.headerMouseleave)
			},
		]
		this.bodyCanvasEvents = [
			{
				event: 'click',
				fn: this.enhanceEventFn(this.eventCore.bodyClick)
			},
			{
				event: 'mousedown',
				fn: this.enhanceEventFn(this.eventCore.bodyMousedown)
			},
			{
				event: 'mousemove',
				fn: this.enhanceEventFn(this.eventCore.bodyMusemove)
			},
			{
				event: 'mouseup',
				fn: this.enhanceEventFn(this.eventCore.bodyMouseup)
			},
			{
				event: 'mouseleave',
				fn: this.enhanceEventFn(this.eventCore.bodyMouseleave)
			},
		]

		// this.documentEvents = [
		// 	{
		// 		event: 'mousemove',
		// 		fn: this.eventCore.documentBodyMousemove
		// 	},
		// 	{
		// 		event: 'mouseup',
		// 		fn: this.eventCore.documentBodyMouseup
		// 	},
		// ]
	}
	// 事件触发前执行
	beforeTheEvent = () => {
		GlobalEvent.setTable(this)
		initKey(this._pa.key, globalEventsMap)
	}
	enhanceEventFn = (fn) => {
		return (event) => {
			this.beforeTheEvent()
			return fn(event)
		}
	}
	// enhanceFn = (fn) => {
	// 	return (event) => {
	// 		this.beforeTheEvent()
	// 		return fn(event)
	// 	}
	// }
	// 事件绑定 
	eventBindInit = () => {
		const pa = this._pa
		this.eventList()

		this.leftCanvasHeader.forEach(eventItem => {
			addEvent(pa.leftHeaderBox, eventItem.event, eventItem.fn)
		})

		this.leftCanvasEvents.forEach(eventItem => {
			addEvent(pa.leftCanvas, eventItem.event, eventItem.fn)
		})

		this.headerCanvasEvents.forEach(eventItem => {
			addEvent(pa.rightHeaderCanvas, eventItem.event, eventItem.fn)
		})

		this.bodyCanvasEvents.forEach(eventItem => {
			addEvent(pa.tableCanvas, eventItem.event, eventItem.fn)
		})

		// this.documentEvents.forEach(eventItem => {
		// 	addEvent(document.body, eventItem.event, eventItem.fn))
		// })

		// 屏蔽右键菜单
		pa.tableCanvas.oncontextmenu = function (ev) {
			return false;
		}

		// 处理键盘事件
		const handleHotKey = new BodyHotKey({ tableIns: this, hotKey: pa.hotKey })
		globalEventsMap[pa.key] = handleHotKey

	}
	eventUnBind = () => {
		const pa = this._pa
		this.leftCanvasHeader.forEach(eventItem => {
			removeEvent(pa.leftHeaderBox, eventItem.event, eventItem.fn)
		})

		this.leftCanvasEvents.forEach(eventItem => {
			removeEvent(pa.leftCanvas, eventItem.event, eventItem.fn)
		})

		this.headerCanvasEvents.forEach(eventItem => {
			removeEvent(pa.rightHeaderCanvas, eventItem.event, eventItem.fn)
		})

		this.bodyCanvasEvents.forEach(eventItem => {
			removeEvent(pa.tableCanvas, eventItem.event, eventItem.fn)
		})

		// this.documentEvents.forEach(eventItem => {
		// 	removeEvent(document.body, eventItem.event, eventItem.fn))
		// })
	}
	// 垂直滚动条 滚动 回调
	_verticalScrollCb = (scrollTop) => {
		const pa = this._pa
		pa.scrollTop = scrollTop
		this.repaintLeft()
		this.repaintRight()
		resetTextareaPosi(pa, true)
		pa.verticalScrollCb && pa.verticalScrollCb(pa.scrollTop)
	}
	// 横向滚动条 滚动 回调
	_horizontalScrollCb = (scrollLeft) => {
		const pa = this._pa
		pa.scrollLeft = scrollLeft
		this.repaintRight()
		this.repaintHeader()
		resetTextareaPosi(pa, true)
		pa.horizontalScrollCb && pa.horizontalScrollCb(pa.scrollLeft)
	}

	mouseMovePaintTable = (offsetX, offsetY) => {
		if (this._pa.exceedBound) return
		const area = selectionArea(this._pa, offsetX, offsetY)
		if (!inCell(area)) return
		this._pa.area = area
		if (JSON.stringify(area) != this._pa.preArea) {
			this._pa.preArea = JSON.stringify(area)
		} else {
			return
		}
		this.repaintRight()
	}
	_updateHeight = () => {
		updateHeightByScorll(this._pa, getLeftHeight(this._pa.leftData))
	}
	_updateWidth = () => {
		const pa = this._pa
		const lastCells = getLastHeaderCells(this._pa.headerData)
		const width = lastCells.reduce((pre, cur) => {
			return pre + cur.width
		}, 0)

		updateWidthByScroll(pa, width)
	}
	getTextareaText = (target) => {
		let v = target.innerText;
		if (v.split('-->')[1]) {
			v = v.split('-->')[1]
		}
		v = v.replace(/(^\n*)|(\n*$)/g, '')
		return v
	}
	_blurCb = (target) => {
		const pa = this._pa;
		if (pa.blurCb) {
			if (!pa.blurCb(pa.selectedCell)) return
		}
		if (!pa.blurCb) {
			return
		}
		if (target.innerText != pa.selectedCell.value) {
			pa.showTextarea && this.setValue(this.getTextareaText(target), pa.selectedCell.newRowIndex, pa.selectedCell.newColIndex)
		}
		resetTextareaPosi(pa, true, true)
		pa.shouldClearTextareaValue = false
	}
	// 更新横向滚动条 
	_updateScrollLeftNode() {
		const pa = this._pa
		return pa.scrollBar.updateScrollLeftByNodeSize({
			horizontal: {
				contentPx: pa.tableWidth,
				containerPx: pa.rightSurplusWidth,
				style: {
					left: `${pa.leftWidth}px`,
				}
			},
			cb: (scrollLeft) => updateScrollLeft(pa, scrollLeft)
		})
	}

	// 更新纵向滚动条
	_updateScrollTopNode() {
		const pa = this._pa
		return pa.scrollBar.updateScrollTopByNodeSize({
			vertical: {
				contentPx: pa.tableHeight,
				containerPx: pa.tableBodyHeight
			},
			cb: (scrollTop) => updateScrollTop(pa, scrollTop)
		})
	}
	getSelectedCell = () => {
		return this._pa.selectedCell
	}
	// 获取点击左侧点击的单元格
	// getSelectedRowMapLeftCell = () => {
	// 	return this.clickLeftCell
	// }
	// 获取点击表头点击的单元格
	// getSelectedColMapHeaderCell = () => {
	// 	return this.clickHeaderCell
	// }
	// 获取当前点击的表头或者左侧的单元格
	getClickTitleCell = () => {
		return this._pa.clickLeftCell || this._pa.clickHeaderCell
	}
	getSelectedRegion = () => {
		return getSelectedRegion(this._pa.area, this._pa.tableData)
	}
	getSelectedRegionDimMems = () => {
		return getSelectedRegionDimMems(
			this._pa.area,
			this._pa.leftData,
			this._pa.headerData,
			this._pa.leftAllData,
			this._pa.headerAllData
		)
	}
	getEditCells = () => {
		if (!this._pa) return []
		return this._pa.record.getEditedData()
	}
	clearEditCells = () => {
		this._pa.record.cleanAll()
	}
	getTabelAllData = () => {
		return this._pa.tableAllData
	}
	getTabelData = () => {
		return this._pa.tableData
	}
	getLeftAllData = () => {
		return this._pa.leftAllData
	}
	getLeftData = () => {
		return this._pa.leftData
	}
	getHeaderAllData = () => {
		return this._pa.headerAllData
	}
	getHeaderData = () => {
		return this._pa.headerData
	}
	getBoxInfo = () => ({
		leftWidth: this._pa.leftWidth,
		tableBodyHeight: this._pa.tableBodyHeight,
		headerHeight: this._pa.headerHeight,
		tableWidth: this._pa.tableWidth,
	})
	getScrollInfo = () => ({
		scrollLeft: this._pa.scrollLeft,
		scrollTop: this._pa.scrollTop
	})
	getEditStatus = () =>{
		return this._pa.showTextarea
	}
	// 设置伪造value状态 是否伪造value
	setFakeValue = (status = false) => {
		this._pa.fakeValue = status
	}
	// 设置单元格属性
	setBodyCellAttr = (row, col, attr = {}) => {
		const pa = this._pa;
		const cell = pa.tableData[row].cells[col]
		Object.keys(attr).forEach(k => {
			cell[k] = attr[k]
		})
		return cell
	}
	removeRows = (rows = [], cb) => {
		const pa = this._pa
		if (!pa.leftAllData || pa.leftAllData.length === 0) return
		if (!pa.tableAllData || pa.tableAllData.length === 0) return
		const obj = removeRows(rows, pa.leftAllData, pa.leftInfoMap, true)
		if (!obj) return
		pa.area = null
		pa.zeroRow = true
		let newLeftData = findCellChildIsShowRows({
			rowIndex: -1,
			columnIndex: 0,
			indentCount: -1,
		}, obj.leftData)
		newLeftData = initLeftNewRowSpan(newLeftData, obj.leftAllData)
		const updateObj = updateLeftDataYWithIndex(newLeftData)
		pa.leftData = updateObj.leftData
		pa.leftAllData = [...obj.leftAllData]
		pa.leftHeight = getLeftHeight(pa.leftData)
		pa.tableHeight = pa.leftHeight
		const delTableData = {}
		pa.tableAllData = removeBodyRows(rows, pa.tableAllData, true, (delCells) => {
			if (delCells.length > 0) {
				delTableData[delCells[0].oldRowIndex] = delCells
			}
		})
		cb && cb(delTableData)
		pa.tableData = setTableData(pa.leftData, pa.headerData, pa.tableAllData)
		this.repaintLeft()
		this.repaintRight()
		this._updateScrollTopNode()
	}
	removeCols = (cols = [], cb) => {
		const pa = this._pa
		if (!pa.headerAllData || pa.headerAllData.length === 0) return
		if (!pa.tableAllData || pa.tableAllData.length === 0) return
		const obj = removeCols(cols, pa.headerAllData)
		if (!obj) return
		pa.area = null
		pa.zeroCol = true
		const headerData = []
		const headerAllData = []
		obj.headerData.forEach(row => {
			const {
				cells,
				...other
			} = row
			headerData.push({
				...other,
				cells: [...cells]
			})
			headerAllData.push({
				...other,
				cells: [...cells]
			})
		})
		const delData = {} //保存移除的数据
		if (obj.headerData.length > 0) {
			// 集成要展开的数据
			let newData = assembleNewData({
				newRowIndex: 0,
				columnIndex: -1,
				newColIndex: -1,
				indentCount: -1,
				open: true,
			}, headerData, true);
			// 插入数据
			newData = insertDataToHeader(newData, [], 0);
			// 重新计算colSpan
			newData = initHeaderColSpan(newData, headerAllData, setNewXYAndIndex);
			pa.headerData = newData //headerData 
			pa.tableData = setTableData(pa.leftData, pa.headerData, removeBodyCols(cols, pa.tableAllData, (delCell) => {
				if (!delData[delCell.oldRowIndex]) {
					delData[delCell.oldRowIndex] = []
				}
				delData[delCell.oldRowIndex].push(delCell)
			}))
		} else {
			pa.headerData = []
			pa.tableData = []
		}
		pa.headerAllData = headerAllData
		cb && cb(delData)
		// pa.tableWidth = obj.width
		this._updateWidth()
		this.repaintHeader()
		this.repaintRight()
		this._updateScrollLeftNode()
	}
	rowCloseAll = () => {
		this._pa.leftData = closeAllLeft(this._pa.leftAllData)
	}
	destroy = () => {
		this.eventUnBind()
		// this.keyboardIns.destroy()
		this._pa.textareaInstance.destroy()
		this._pa.scrollBar.destroy()
		if (this._pa.ele && this._pa.container) {
			this._pa.ele.removeChild(this._pa.container)
		}
		if (this._pa.toolTip) {
			document.body.removeChild(this._pa.toolTip)
		}
		this._pa = null
		GlobalEvent.destroy()
	}
}

export default Base