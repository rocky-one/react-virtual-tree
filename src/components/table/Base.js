import ScrollBar from './scrollBar/ScrollBar'
import CreateTextarea from './textarea/CreateTextarea'
import Record from './record/Record'
import { BG_COLOR_TITLE, BORDER_COLOR, SCROLL_SIZE, ROW_HEIGHT } from './tableConst'
import {
	initTableData,
	setTableData,
	getLeftRowLastCell,
	tableAllDataAddRow
} from './utils/handleTableData'
import { setDomCss, setCanvasCss } from './utils'
import { removeBodyRows, removeRows } from './utils/removeRows'
import { removeBodyCols, removeCols } from './utils/removeCols'
import { execCommandCopy } from './utils/hotKey'
import { addEvent, removeEvent } from './event/eventBind'
import EventCore from './event/EventCore'
import { keyMap, globalEventsMap } from './event/GlobalEvent'
import BodyHotKey from './keyboard/BodyHotKey'
import { openLeftByLevel, closeLeftByLevel } from './utils/openAndCloseLeft'
import { openHeaderByLevel, closeHeaderByLevel } from './utils/openAndCloseHeader'
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
	leftDataAddRow
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
		zIndex: 4,
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
		zIndex: 3,
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
function createTextareas(pa, cbObj) {
	addAttr(pa, 'textareaInstance', new CreateTextarea({
		container: pa.tableBox,
		blurCb: cbObj.blurCb,
		onCopy: cbObj.onCopy,
		onPaste: cbObj.onPaste,
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
		zIndex: 2001,
		display: 'none',
		color: '#fff',
	})
	document.body.appendChild(pa.toolTip)
}

// 根据滚动条更新高
function updateHeightByScorll(pa, height) {
	pa.tableHeight = (height || pa.tableHeight)
	pa.leftHeight = pa.tableHeight
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
			formType: option.formType,
			colOpen: option.colOpen,
			rowOpen: option.rowOpen,
			rowOpenLevel: option.rowOpenLevel || 0,
			colOpenLevel: option.colOpenLevel || 0,
			key: Date.now().toString(36), //生成一个唯一标记 用于键盘事件响应判断 或者其他操作
			validatePickList: option.validatePickList || null, // 下拉验证回调 add by lynn
		}
		this.initWidthHeight(option.width, option.height)
		this.initData({
			leftData: option.leftData,
			headerData: option.headerData,
			tableData: option.tableData,
		})
		this.initFnAttr(option)
		this.init(option)
		this.eventCore = new EventCore({
			tableIns: this,
		})
		this.eventBindInit()

		this._pa.ratio = getPixelRatio(this._pa.leftContext)
		// GlobalEvent.setTable(this)
	}
	setColOpenStatus(level = 0) {
		this._pa.colOpenLevel = level
	}
	setRowOpenStatus(level = 0) {
		this._pa.rowOpenLevel = level
	}
	setArrowClickStatus(status = true) {
		this._pa.arrowCanClick = status
	}
	getArrowStatus() {
		return this._pa.arrowCanClick
	}
	setExpandArrowStatus(status = false) {
		this._pa.showExpandArrow = status
	}
	initWidthHeight(width, height) {
		this._pa.width = width
		this._pa.height = height

	}
	initData(data) {
		let t = new Date()
		const pa = this._pa
		const leftData = data.leftData || pa.leftData || []
		const headerData = data.headerData || pa.headerData || []
		const tableData = data.tableData || pa.tableData || []
		const leftInfoObj = initLeftInfo(leftData, pa.miniWidth)
		const leftDataObj = (pa.rowOpenLevel === Infinity && !pa.showExpandArrow)
			? initOpenLeftData(leftData, leftInfoObj.leftInfoMap)
			: initLeftData(leftData, leftInfoObj.leftInfoMap, pa.rowOpenLevel) //pa.rowOpen
		const headerDataObj = (pa.colOpenLevel === Infinity && !pa.showExpandArrow)
			? initOpenHeaderData(headerData)
			: initHeaderData(headerData, pa.colOpenLevel) //pa.colOpen
		console.log('初始化 左侧数据计算耗时: ', new Date() - t)
		addAttr(pa, leftInfoObj, leftDataObj, headerDataObj)
		this.initSizeAttr()
		const tableDataObj = initTableData(
			tableData,
			leftDataObj.leftAllData,
			leftDataObj.leftData,
			headerDataObj.headerAllData,
			headerDataObj.headerData,
			pa.tableBodyHeight,
			pa.showDataMap)
		addAttr(pa, tableDataObj)
		// 不是定义模式 才自动计算高度
		if (pa.showExpandArrow) {
			// setRowHeight(pa, pa.leftAllData, pa.leftAllData, pa.tableAllData)
			// setRowHeight(pa, pa.leftAllData, pa.leftData, pa.tableData)
		}
		console.log('初始化 所有数据计算耗时: ', new Date() - t)
	}
	initSizeAttr(option = {}) {
		const pa = this._pa
		addAttr(pa, 'width', option.width || pa.width)
		addAttr(pa, 'height', option.height || pa.height)
		addAttr(pa, 'rowViewTotal', Math.ceil(pa.height / ROW_HEIGHT))
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
		addAttr(pa, 'dynaLeftCell', null)
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
		addAttr(pa, 'handleMouseMoveOnLeft', option.handleMouseMoveOnLeft)
		addAttr(pa, 'handleLeftMouseleave', option.handleLeftMouseleave)
		addAttr(pa, 'toolTipRender', option.toolTipRender)
		addAttr(pa, 'format', option.format)
		addAttr(pa, 'preArea', '')
		addAttr(pa, 'blurCb', option.blurCb)
		addAttr(pa, 'blurSetValueCb', option.blurSetValueCb)
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
		addAttr(pa, 'onPaste', option.onPaste)

	}
	init(option) {
		const pa = this._pa
		createContainer(option.ele, pa)
		createScrollBar(pa, this._verticalScrollCb, this._horizontalScrollCb)
		createLeftCanvas(pa)
		createLeftHeaderCanvas(pa)
		createRightHeaderCanvas(pa)
		createTableCanvas(pa)
		createTextareas(pa, {
			blurCb: this._blurCb,
			onCopy: this.onCopy,
			onPaste: this.handlePaste,
		})
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
		// 		fn: this.enhanceEventFn(this.eventCore.bodyMusemove)
		// 	},
		// 	{
		// 		event: 'mouseup',
		// 		fn: this.enhanceEventFn(this.eventCore.bodyMouseup)
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
		// 	addEvent(document.body, eventItem.event, eventItem.fn)
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
		if (this.paintEnd) return
		if (!this.paintEnd) this.paintEnd = true
		const pa = this._pa
		pa.scrollTop = scrollTop
		this.repaintLeft()
		this.repaintRight()
		resetTextareaPosi(pa, true)
		pa.verticalScrollCb && pa.verticalScrollCb(pa.scrollTop)
		this.paintEnd = null
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
		updateWidthByScroll(pa, width + SCROLL_SIZE)
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
		if (!pa.blurCb) return
		if (pa.formType === '1' && pa.fakeValue) {
			if (pa.clickLeftCell && pa.showTextarea) {
				this.getTextareaText(target) && pa.blurCb(pa.clickLeftCell, this.getTextareaText(target))
				resetTextareaPosi(pa, true, true)
				pa.shouldClearTextareaValue = false
				pa.dynaLeftCell = null
				pa.clickLeftCell = null
			}
		} else {
			if (!pa.blurCb(pa.selectedCell, this.getTextareaText(target))) return

			if (pa.blurSetValueCb && pa.blurSetValueCb(pa.selectedCell, this.getTextareaText(target))) {
				pa.showTextarea && this.setValue(this.getTextareaText(target), pa.selectedCell.newRowIndex, pa.selectedCell.newColIndex)
			} else if (target.innerText != pa.selectedCell.value) {
				pa.showTextarea && this.setValue(this.getTextareaText(target), pa.selectedCell.newRowIndex, pa.selectedCell.newColIndex)
			}
			resetTextareaPosi(pa, true, true)
			pa.shouldClearTextareaValue = false
		}
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
	getEditStatus = () => {
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
	// 设置单元格属性（sheetTable 用）
	setCellsAttr = (fullpathArr, attr = {}) => {
		const pa = this._pa;
		pa.tableAllData.forEach(row => {
			row.cells.forEach(cell => {
				if (fullpathArr.includes(cell.fullpath)) {
					Object.keys(attr).forEach(k => {
						cell[k] = attr[k]
					})
				}
			})
		})
		pa.tableData = setTableData(pa.leftData, pa.headerData, pa.tableAllData)
		this.repaintRight()
	}

	textareaInitFocus = () => {
		const pa = this._pa
		if (!pa.doubleClick && !pa.showTextarea && this.getSelectedCell()) {
			pa.textareaInstance.focus(true)
		}
	}
	onCopy = (e) => {
		if (!this._pa.showTextarea) {
			e.preventDefault()
			this.copyTextToClipboard()
		}
	}
	// 复制到剪切板
	copyTextToClipboard = (text) => {
		// if (this.copySum === 1) {
		// 	this.copySum = 0
		// 	return
		// }
		// this.copySum = 1

		if (!text) {
			const data = this.getSelectedRegion();
			let copyArray = data.map(item => (item.value))
			let rowIndexs = data.map(item => item.newRowIndex)
			let columnIndexs = data.map(item => item.newColIndex)
			rowIndexs = Array.from(new Set(rowIndexs))
			columnIndexs = Array.from(new Set(columnIndexs))
			const areaLen = Math.max(...rowIndexs) - Math.min(...rowIndexs) + 1
			const areaWidth = Math.max(...columnIndexs) - Math.min(...columnIndexs) + 1
			let str = '';
			for (let i = 0; i < areaLen; i++) {
				for (let j = 0; j < areaWidth; j++) {
					if (j + 1 === areaWidth) {
						str = str + copyArray[i * areaWidth + j]
					} else {
						str = str + copyArray[i * areaWidth + j] + '\t'
					}
				}
				if (i + 1 === areaLen) {
					str = str
				} else {
					str = str + '\n'
				}
			}
			// add by lynn  在str被写入剪切板后丢失'\r\n'
			execCommandCopy(str)
		} else {
			execCommandCopy(text)
		}
	}
	// 处理剪切板数据 \n 换行   \t 下一个单元格   \r\n 换行
	getClipboardData = (clipboardData) => {
		if (clipboardData) {
			let txt = clipboardData.getData('text');
			let copyData = new Array();
			if (!txt) {
				return false;
			}
			while (txt.length > 0) {
				let c = txt.charAt(txt.length - 1);
				if (c == '\n' || c == '\r' || c == '\t') {
					txt = txt.substring(0, txt.length - 1);
				} else {
					break;
				}
			}
			let prows = txt.split("\r\n");
			// add by lynn 还是用一个hack来解决web端和Excel端读取剪切板数据的差异性
			for (let i = 0; i < prows.length; i++) {
				copyData[i] = prows[i].split('\t').map(v => {
					return v.replace(/^\"|\"$/g, '')
				});
			}
			let height = copyData.length || 0,
				width = copyData[0].length || 0;
			return {
				copyData,
				height,
				width
			}
		}
	}
	// 粘贴
	handlePaste = async (e, data) => {
		if (this._pa.showTextarea) return
		let clipboardData, copyData, height, width;
		let selectedData = this.getSelectedRegion();
		if (e) {
			e.stopImmediatePropagation();
			clipboardData = window.clipboardData || e.clipboardData; // IE || chrome
			const clipObj = this.getClipboardData(clipboardData);
			copyData = clipObj.copyData
			width = clipObj.width
			height = clipObj.height
		} else {
			let rowIndexs = data.map(item => item.newRowIndex);
			let columnIndexs = data.map(item => item.newColIndex);
			copyData = [];
			rowIndexs = Array.from(new Set(rowIndexs));
			columnIndexs = Array.from(new Set(columnIndexs));
			height = Math.max(...rowIndexs) - Math.min(...rowIndexs) + 1;
			width = Math.max(...columnIndexs) - Math.min(...columnIndexs) + 1;
			for (let j = 0; j < height; j++) {
				let tempCol = [];
				for (let i = 0; i < width; i++) {
					tempCol.push(data[width * j + i].value);
				}
				copyData.push(tempCol);
			}
		}
		let tableData = this.getTabelData();
		if (copyData === undefined || selectedData.length === 0) {
			console.log('no data copy');
			return
		}
		let singleSelectData = selectedData[0];
		const { newRowIndex, newColIndex } = singleSelectData;
		let tableWidth = tableData[0].cells.length || 0;
		let tableHeight = tableData.length || 0;
		let realWidth = (tableWidth - newColIndex) < width ? (tableWidth - newColIndex) : width;
		let realHeight = (tableHeight - newRowIndex) < height ? (tableHeight - newRowIndex) : height;
		let pickListCells = []; // 下拉列表
		// 如果复制了单个单元格 全部填充所有单元格
		if (copyData.length === 1 && copyData[0].length === 1) {
			for (let i = 0; i < selectedData.length; i++) {
				let copyItemValue = copyData[0].toString();
				let origItem = selectedData[i];
				if (origItem.datatype != '7' && origItem.updated != false) {
					if (origItem.datatype == '3') {
						this.setValue(copyItemValue, origItem.newRowIndex, origItem.newColIndex)
					} else if (origItem.datatype == '5') {
						this.setValue(copyItemValue, origItem.newRowIndex, origItem.newColIndex)
						let reg = new RegExp(/^\d{4}(-|\/|年)\d{1,2}(-|\/|月)\d{1,2}(日)$/);
						if (reg.test(copyItemValue)) {
							// 日期处理
							let ds = copyItemValue.replace(/(年|月)+/g, '-').replace(/(日)+/g, '')
							this.setValue(dateToValue(START_DATE, moment(ds)), origItem.newRowIndex, origItem.newColIndex)
						}
					} else if (origItem.datatype == '4') {
						pickListCells.push({ ...origItem, newCopyValue: copyItemValue })
					} else {
						// 千分位处理
						copyItemValue = copyItemValue.split(',').join('');
						// 百分比处理
						if (origItem.datatype === '2') {
							let value = copyItemValue
							if (copyItemValue.indexOf('%') > -1) {
								value = copyItemValue.replace(/%+/g, '');
							} else {
								value = copyItemValue * 100;
							}
							this.setValue(value, origItem.newRowIndex, origItem.newColIndex)
						} else {
							let num = 0;
							if (origItem.datatype === '1') {
								if (copyItemValue.indexOf("\n") > 0) {
									num = Number(copyItemValue.replace(/\n/g, ''))
									this.setValue(num, origItem.newRowIndex, origItem.newColIndex)
								} else {
									if (Number(copyItemValue)) {
										this.setValue(Number(copyItemValue).toFixed(2), origItem.newRowIndex, origItem.newColIndex)
									}
								}
							} else {
								if (Number(copyItemValue)) {
									this.setValue(Number(copyItemValue), origItem.newRowIndex, origItem.newColIndex)
								}
							}
						}
					}
				}
			}
		} else {
			for (let i = 0; i < realHeight; i++) {
				let copyRow = copyData[i];
				let origRow = tableData[i + newRowIndex].cells;
				for (let j = 0; j < realWidth; j++) {
					let copyItemValue = copyRow[j].toString();
					let origItem = origRow[j + newColIndex];
					// 0 货币 1 数值 2 百分比 5 日期 6 整数 7 聚合
					// 3 文本 4 下拉列表 (都为string)
					if (origItem.datatype != '7' && origItem.updated != false) {
						if (origItem.datatype == '3') {
							this.setValue(copyItemValue, origItem.newRowIndex, origItem.newColIndex)
						} else if (origItem.datatype == '5') {
							this.setValue(copyItemValue, origItem.newRowIndex, origItem.newColIndex)
							let reg = new RegExp(/^\d{4}(-|\/|年)\d{1,2}(-|\/|月)\d{1,2}(日)$/);
							if (reg.test(copyItemValue)) {
								// 日期处理
								let ds = copyItemValue.replace(/(年|月)+/g, '-').replace(/(日)+/g, '')
								this.setValue(dateToValue(START_DATE, moment(ds)), origItem.newRowIndex, origItem.newColIndex)
							}
						} else if (origItem.datatype == '4') {
							pickListCells.push({ ...origItem, newCopyValue: copyItemValue })
						} else {
							// 百分比处理
							if (origItem.datatype === '2') {
								let value = copyItemValue
								if (copyItemValue.indexOf('%') > -1) {
									value = copyItemValue.replace(/%+/g, '');
								} else {
									value = copyItemValue * 100;
								}
								this.setValue(value, origItem.newRowIndex, origItem.newColIndex)
							} else {
								let num = 0;
								if (origItem.datatype === '1') {
									if (copyItemValue.indexOf("\n") > 0) {
										num = Number(copyItemValue.replace(/\n/g, '')).toFixed(2)
										this.setValue(num, origItem.newRowIndex, origItem.newColIndex)
									} else {
										if (Number(copyItemValue)) {
											this.setValue(Number(copyItemValue), origItem.newRowIndex, origItem.newColIndex)
										}
									}
								} else {
									if (Number(copyItemValue)) {
										this.setValue(Number(copyItemValue), origItem.newRowIndex, origItem.newColIndex)
									}
								}
							}
						}
					}
				}
			}
		}
		// 下拉的请求复制回调函数 add by lynn
		if (pickListCells.length > 0) {
			this._pa.validatePickList && this._pa.validatePickList(pickListCells)
		}

	}
	removeRows = (rows = [], cb) => {
		const pa = this._pa
		if (!pa.leftAllData || pa.leftAllData.length === 0) return
		//if (!pa.tableAllData || pa.tableAllData.length === 0) return
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
		setRowHeight(pa, pa.leftAllData, pa.leftData, pa.tableData)
		this.repaintLeft()
		this.repaintRight()
		this._updateScrollTopNode()
	}
	removeCols = (cols = [], cb) => {
		const pa = this._pa
		if (!pa.headerAllData || pa.headerAllData.length === 0) return
		// if (!pa.tableAllData || pa.tableAllData.length === 0) return
		const obj = removeCols(cols, pa.headerAllData, pa.leftAllData)
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
		setRowHeight(pa, pa.leftAllData, pa.leftData, pa.tableData)
		this._updateWidth()
		this.repaintHeader()
		this.repaintRight()
		this._updateScrollLeftNode()
	}
	addRow = (cell, addCells) => {
		const pa = this._pa
		const index = cell.newRowIndex
		// 行头
		const dynaCell = {
			cells: [{
				...pa.leftAllData[index].cells[0],
				// id: 'DYNA',
				id: `DYNA_${+new Date()}`,
				value: '',
				childCount: 0,
				dynaCell: true,
				updated: true,
				height: 24
			}]
		} || addCells
		const i = pa.leftAllData.findIndex(v => v.cells[0].id === cell.id)
		pa.leftAllData = leftDataAddRow(pa.leftAllData, i, [dynaCell])
		pa.leftData = leftDataAddRow(pa.leftData, index, [dynaCell])
		// table数据
		pa.tableAllData = tableAllDataAddRow(pa.tableAllData, i)
		pa.tableData = setTableData(pa.leftData, pa.headerData, pa.tableAllData)
		// 高度
		pa.leftHeight = getLeftHeight(pa.leftData)
		pa.tableHeight = pa.leftHeight
		// 新增行表头单元格为选中状态
		this.setSelectedCell(dynaCell.cells[0])
		pa.dynaLeftCell = dynaCell.cells[0]
		pa.clickLeftCell = dynaCell.cells[0]
		this.repaintLeft()
		this.repaintRight()
		this._updateScrollTopNode()
	}
	// 升级
	gradeUpRow = (cell) => {
		const pa = this._pa
		const upList = [{ cells: [{ ...cell }] }]
		const upTableList = [pa.tableData[cell.newRowIndex]]
		let flag = false
		let parentCell
		let grandPCell
		// 向上找他的父节点 以及他父节点的父节点
		for (let i = cell.newRowIndex - 1; i >= 0; i--) {
			const leftCell = pa.leftData[i].cells[0]
			if (!parentCell && leftCell.id === cell.parentId) {
				parentCell = leftCell
			}
			if (parentCell && leftCell.id === parentCell.parentId) {
				grandPCell = leftCell
				break;
			}
		}
		const gradeUpRow = (index, allIndex, removeRows) => {
			upList[0].cells[0].parentId = parentCell.parentId
			upList[0].cells[0].reallyParentId = parentCell.parentId
			upList.forEach(v => { v.cells[0].indentCount-- })
			if (grandPCell) {
				pa.leftAllData[grandPCell.rowIndex].cells[0].childCount += upList.length
			}
			pa.leftAllData = leftDataAddRow(pa.leftAllData, allIndex, upList)
			pa.leftData = leftDataAddRow(pa.leftData, index, upList)
			pa.tableAllData = tableAllDataAddRow(pa.tableAllData, allIndex, upTableList)
			this.removeRows(removeRows)
		}
		// 向下找和他父节点同级的节点
		console.log(JSON.parse(JSON.stringify(pa.leftData)), parentCell);
		for (let i = cell.newRowIndex + 1; i < pa.leftData.length; i++) {
			if (parentCell && pa.leftData[i].cells[0].parentId === parentCell.parentId) {
				flag = true
				const index = pa.leftAllData.findIndex(v => v.cells[0].id === pa.leftData[i].cells[0].id)
				gradeUpRow(i, index, upList.map(v => v.cells[0].rowIndex))
				break;
			}
			// 级联变动
			if (upList.some(v => v.cells[0].id === pa.leftData[i].cells[0].parentId)) {
				upList.push(JSON.parse(JSON.stringify(pa.leftData[i])))
				upTableList.push(JSON.parse(JSON.stringify(pa.tableData[i])))
			}
		}
		if (!flag && parentCell) {
			const index = pa.leftAllData.findIndex(v => v.cells[0].id === cell.id)
			gradeUpRow(cell.rowIndex, index, upList.map(v => v.cells[0].rowIndex + upList.length))
			this.removeRows()
		}
	}
	// 降级
	gradeDownRow = (cell) => {
		let flag = false
		const pa = this._pa
		const downList = [{ cells: [{ ...cell }] }]
		const downTableList = [pa.tableData[cell.newRowIndex]]
		const gradeDownRow = (pIndex, index, allIndex, removeRows) => {
			pa.leftData[pIndex].cells[0].open = true
			pa.leftData[pIndex].cells[0].childCount += downList.length
			downList[0].cells[0].parentId = pa.leftData[pIndex].cells[0].id
			downList[0].cells[0].reallyParentId = pa.leftData[pIndex].cells[0].id
			downList.forEach(v => { v.cells[0].indentCount++ })
			pa.leftAllData = leftDataAddRow(pa.leftAllData, allIndex, downList)
			pa.leftData = leftDataAddRow(pa.leftData, index, downList)
			pa.tableAllData = tableAllDataAddRow(pa.tableAllData, allIndex, downTableList)
			this.removeRows(removeRows)
		}
		for (let i = cell.newRowIndex + 1; i < pa.leftData.length; i++) {
			// 第一个成员节点，降级成它相邻下面兄弟节点的子节点
			if (cell.newRowIndex === 0 || cell.parentId === pa.leftData[cell.newRowIndex - 1].cells[0].id) {
				flag = true
				if (pa.leftData[i].cells[0].parentId === cell.parentId) { // 兄弟节点
					const index = pa.leftAllData.findIndex(v => v.cells[0].id === pa.leftData[i].cells[0].id)
					gradeDownRow(i, i + 1, index + 1, downList.map(v => v.cells[0].rowIndex))
					break;
				}
			}
			// 级联变动
			if (downList.some(v => v.cells[0].id === pa.leftData[i].cells[0].parentId)) {
				downList.push(JSON.parse(JSON.stringify(pa.leftData[i])))
				downTableList.push(JSON.parse(JSON.stringify(pa.tableData[i])))
			}
		}
		if (!flag) {
			// 向上找他的兄弟节点
			for (let i = cell.newRowIndex - 1; i >= 0; i--) {
				const leftCell = pa.leftData[i].cells[0]
				if (leftCell.parentId === cell.parentId) {
					const index = pa.leftAllData.findIndex(v => v.cells[0].id === cell.id)
					gradeDownRow(i, cell.rowIndex, index, downList.map(v => v.cells[0].rowIndex + downList.length))
					break;
				}
			}
		}
	}
	openLeftByLevel = (level) => {
		const pa = this._pa
		pa.leftData = openLeftByLevel(pa.leftAllData, level)
		pa.tableData = setTableData(pa.leftData, pa.headerData, pa.tableAllData)
		pa.leftHeight = getLeftHeight(pa.leftData)
		pa.tableHeight = pa.leftHeight
		this._updateScrollTopNode()
		this.repaintLeft()
		this.repaintRight()
	}
	closeLeftByLevel = (level) => {
		const pa = this._pa
		pa.leftData = closeLeftByLevel(pa.leftAllData, level)
		pa.tableData = setTableData(pa.leftData, pa.headerData, pa.tableAllData)
		pa.leftHeight = getLeftHeight(pa.leftData)
		pa.tableHeight = pa.leftHeight
		this._updateScrollTopNode()
		this.repaintLeft()
		this.repaintRight()
	}
	openHeaderByLevel = (level) => {
		const pa = this._pa
		pa.headerData = openHeaderByLevel(pa.headerAllData, level)
		pa.tableData = setTableData(pa.leftData, pa.headerData, pa.tableAllData)
		this._updateWidth()
		this.repaintHeader()
		this.repaintRight()
		this._updateScrollLeftNode()
	}
	closeHeaderByLevel = (level) => {
		const pa = this._pa
		pa.headerData = closeHeaderByLevel(pa.headerAllData, level)
		pa.tableData = setTableData(pa.leftData, pa.headerData, pa.tableAllData)
		this._updateWidth()
		this.repaintHeader()
		this.repaintRight()
		this._updateScrollLeftNode()
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
