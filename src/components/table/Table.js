import Base from './Base'
import './table.less'
import {
	getPointStartRowIndex,
	getPointEndColIndex,
	getPointStartColIndex,
	getPointEndRowIndex,
	clearRect,
	alignCenterText,
	ellipseText,
	rightAlign,
} from './utils/point'
import {
	isSelectMultipleCell,
	wrapText,
	setRowHeight
} from './utils/common'
import {
	LINE_WIDTH,
	COLOR,
	ROW_HEIGHT,
	BORDER_COLOR,
} from './tableConst'
// import {
// 	setTableData,
// 	initTableAllDataOldIndex,


class Table extends Base {
	constructor(option = {}) {
		super(option)
		this.paintLeftIng = false
		this.paintHeaderIng = false
		this.paintTableIng = false
		this.paintLeft()
		this.paintHeader()
		this.paintTable()
	}
	paintLeft = () => {
		const pa = this._pa,
			scrollTop = pa.scrollTop,
			leftData = pa.leftData

		pa.leftContext.lineWidth = LINE_WIDTH
		pa.leftContext.font = `${pa.font}px Arial`
		pa.paintLeftEnd = 0
		let i = 0 //开始位置从0开始计算 后面需要优化这个开始位置的索引 减少计算
		for (let len = leftData.length; i < len; i++) {
			const leftCells = leftData[i].cells || []
			for (let j = 0, len = leftCells.length; j < len; j++) {
				const cell = leftCells[j]
				let x = cell.x
				let y = cell.y
				let hei = cell.height
				let yScroll = y + hei
				if (yScroll >= scrollTop) {
					y -= scrollTop
				} else {
					continue
				}
				if (y - scrollTop >= pa.tableBodyHeight) {
					pa.paintLeftEnd++
					if (pa.paintLeftEnd === pa.leftInfo.length) {
						return
					}
				}
				pa.paintLeftCellCb && pa.paintLeftCellCb(cell)
				let curWid = cell.width
				let endX = x + curWid
				let endY = y + hei
				// 横线
				pa.leftContext.strokeStyle = BORDER_COLOR
				pa.leftContext.beginPath()
				pa.leftContext.moveTo(x + 0.5, endY + 0.5)
				pa.leftContext.lineTo(endX + 0.5, endY + 0.5)
				// 竖线
				pa.leftContext.moveTo(endX - 0.5, y + 0.5)
				pa.leftContext.lineTo(endX - 0.5, endY + 0.5)
				pa.leftContext.stroke()
				pa.leftContext.closePath()

				this.paintCellBgColor(pa.leftContext, x + 1, y + 1, cell.width - 2, cell.height - 1, cell.backgroundColor)
				pa.leftContext.fillStyle = COLOR
				let indent = (cell.indentCount || 0) * 10
				const textInfo = ellipseText(pa.leftContext, cell.value, cell.width - 30 - indent)
				pa.leftContext.fillText(textInfo.text, x + 24 + indent, y + (hei) / 2 + pa.font / 2)
				if (pa.showExpandArrow) {
					this.paintOpenIcon(pa.leftContext, cell, cell.x + indent, true)
				}
			}
		}
	}

	paintHeader = () => {
		const pa = this._pa,
			headerData = pa.headerData
		if (headerData.length === 0) return
		pa.rightHeaderContext.lineWidth = LINE_WIDTH
		pa.rightHeaderContext.font = `${pa.font}px Arial`
		pa.paintHeaderEnd = 0
		let endColIndex = getPointEndColIndex(pa.tableData, pa.rightSurplusWidth, pa.scrollLeft)
		// 只有表头数据时 全部渲染
		if (pa.tableData.length === 0 && headerData.length > 0) {
			endColIndex = headerData[headerData.length - 1].cells.length
		}
		for (let i = 0, len = headerData.length; i < len; i++) {
			const cells = headerData[i].cells,
				lens = cells.length,
				scrollLeft = pa.scrollLeft
			let j = 0,
				eSum = 0
			for (; j < lens; j++) {
				const cell = cells[j]
				pa.paintHeaderCellCb && pa.paintHeaderCellCb(cell)
				let x = cell.x
				let y = cell.y

				let xScroll = x + (cell.width * cell.colSpan)
				if (xScroll >= scrollLeft) {
					x -= scrollLeft
				} else {
					continue
				}
				if (eSum > endColIndex) break
				eSum += cell.newColSpan
				let endX = x + cell.width
				let endY = y + cell.height
				pa.rightHeaderContext.strokeStyle = BORDER_COLOR
				// 横线
				pa.rightHeaderContext.beginPath()
				pa.rightHeaderContext.moveTo(x + 0.5, endY + 0.5)
				pa.rightHeaderContext.lineTo(endX + 0.5, endY + 0.5)
				// 竖线
				pa.rightHeaderContext.moveTo(endX + 0.5, y + 0.5)
				pa.rightHeaderContext.lineTo(endX + 0.5, endY + 0.5)
				pa.rightHeaderContext.stroke()
				pa.rightHeaderContext.closePath()
				this.paintCellBgColor(pa.rightHeaderContext, x + 1, y + 1, cell.width - 2, cell.height - 1, cell.backgroundColor)
				pa.rightHeaderContext.fillStyle = COLOR
				let arrowWidth = cell.childCount > 0 ? 20 : 10
				const textInfo = ellipseText(pa.rightHeaderContext, cell.value, cell.width - arrowWidth)
				const alignTextX = alignCenterText(x, textInfo.textWidth, cell.width, cell.childCount, textInfo.ellipsis)
				pa.rightHeaderContext.fillText(textInfo.text, alignTextX, endY - pa.font / 2) // x + 24
				if (pa.showExpandArrow) {
					this.paintOpenIcon(pa.rightHeaderContext, cell, alignTextX - 24, false) //x
				}
			}
		}
	}

	paintTable = () => {
		const pa = this._pa,
			area = pa.area || {},
			tableData = pa.tableData,
			scrollTop = pa.scrollTop,
			scrollLeft = pa.scrollLeft,
			startRow = area.startRowIndex,
			startCol = area.startColIndex,
			endRow = area.endRowIndex,
			endCol = area.endColIndex,
			isMultipleCell = isSelectMultipleCell(area)
		if (tableData.length === 0) return
		pa.tableContext.lineWidth = LINE_WIDTH
		pa.tableContext.font = `${pa.font}px Arial`
		let i = getPointStartRowIndex(tableData, scrollTop),
			endRowIndex = getPointEndRowIndex(tableData, pa.tableBodyHeight, scrollTop),
			firstCellsIndex = getPointStartColIndex(tableData, scrollLeft),
			endColIndex = getPointEndColIndex(tableData, pa.rightSurplusWidth, scrollLeft)

		for (; i < tableData.length; i++) {
			const cells = tableData[i].cells

			if (i > endRowIndex) break

			let lens = cells.length
			for (let j = firstCellsIndex; j < lens; j++) {
				const cell = cells[j]
				if (j > endColIndex) {
					break
				}
				// 绘制时回调 此时可以更改cell属性
				pa.paintTableCellCb && pa.paintTableCellCb(cell)
				let x = cell.x - scrollLeft
				let y = cell.y - scrollTop
				let endX = x + cell.width
				let endY = y + cell.height
				let v = cell.value
				let paintAreaBg = false
				if (pa.selectedCell && isMultipleCell && pa.selectedCell.id != cell.id) {
					if (i >= startRow && i <= endRow) {
						if (j >= startCol && j <= endCol) {
							paintAreaBg = true
						}
					}
				}
				// 绘制背景
				if (paintAreaBg) {
					this.paintCellBgColor(
						pa.tableContext,
						x + 1,
						y,
						cell.width - 1,
						cell.height - 1,
						'#ccc')
				} else {
					this.paintCellBgColor(
						pa.tableContext,
						x + 1,
						y + 1,
						cell.width - 1,
						cell.height - 1,
						cell.backgroundColor)
				}
				//文字
				pa.tableContext.fillStyle = COLOR
				// 这里是格式化函数
				if (pa.format && pa.format[cell.cellType]) {
					v = pa.format[cell.cellType](cell, pa.fakeValue)
				}
				cell.formatValue = v
				let boundary = 6
				if (cell.cellType === 'dropDown') {
					boundary += 16
				}
				// 文本类型折行显示
				if (cell.datatype === '3' || cell.datatype === '4') {
					const wrapList = wrapText(
						pa,
						cell.value,
						cell.width - boundary,
						cell.x + 6,
						cell.y + ROW_HEIGHT - pa.font / 2,
						cell.height)
					wrapList.map(v => pa.tableContext.fillText(v.line, v.x - scrollLeft, v.y - scrollTop))
				} else {
					const textInfo = ellipseText(pa.tableContext, v, cell.width - boundary)
					pa.tableContext.fillText(
						textInfo.text,
						rightAlign(pa.tableContext, textInfo, cell) - scrollLeft,
						endY - pa.font / 2)
				}

				this.paintDropDown(pa.tableContext, cell)
				pa.paintTableCellRender && pa.paintTableCellRender(cell, pa.tableContext, {
					x: x,
					y: y,
					width: cell.width,
					height: cell.height
				})
				// 横线
				pa.tableContext.strokeStyle = BORDER_COLOR;
				pa.tableContext.beginPath()
				pa.tableContext.moveTo(x + 0.5, endY + 0.5)
				pa.tableContext.lineTo(endX + 0.5, endY + 0.5)
				// 竖线
				pa.tableContext.moveTo(endX + 0.5, y + 0.5)
				pa.tableContext.lineTo(endX + 0.5, endY + 0.5)
				pa.tableContext.stroke()
				pa.tableContext.closePath()
			}
		}
		// 表格以外区域白色
		pa.tableContext.beginPath()
		pa.tableContext.fillStyle = '#fff'
		pa.tableContext.fillRect(0, pa.leftHeight + 1, pa.width - pa.leftWidth, pa.tableBodyHeight - pa.leftHeight)
		pa.tableContext.fill()
		pa.selectedCell && this.paintAreaBorder()
	}
	paintOpenIcon = (ctx, cell, x, leftIcon) => {
		if (!cell || !cell.childCount) return
		let pa = this._pa,
			sideLen = 8,
			hei = cell.height,
			cellY = leftIcon ? cell.y - pa.scrollTop : cell.y,
			startY2 = hei / 2 + cellY + 1,
			fillStyle = '#999999';
		let startX = x + sideLen,
			startY = cellY + (hei / 2)

		if (!cell.open) {
			ctx.beginPath()
			ctx.strokeStyle = fillStyle
			ctx.moveTo(startX + 0.5, startY + 0.5)
			ctx.lineTo(startX + 10 + 0.5, startY + 0.5)

			ctx.moveTo(startX + 5 + 0.5, startY - 5 + 0.5)
			ctx.lineTo(startX + 5 + 0.5, startY + 5 + 0.5)
			ctx.closePath()
			ctx.stroke()
		} else {
			ctx.beginPath()
			ctx.strokeStyle = fillStyle
			ctx.moveTo(startX + 0.5, startY2 + 0.5)
			ctx.lineTo(startX + 10 + 0.5, startY2 + 0.5)
			ctx.closePath()
			ctx.stroke()
		}
		cell.arrowXy = {
			x: startX - 4,
			y: startY2 - 8,
			width: 20,
			height: 20
		}
	}

	paintAreaBorder = () => {
		const pa = this._pa,
			area = pa.area
		if (!area) return
		const tableData = pa.tableData
		let x = 0,
			y = 0,
			width = 0,
			height = 0,
			startRow = area.startRowIndex,
			startCol = area.startColIndex,
			endRow = area.endRowIndex,
			endCol = area.endColIndex,
			len = tableData.length
		for (let i = startRow; i <= endRow; i++) {
			const cells = tableData[i].cells

			// if(i>=len) break
			if (i === startRow) {
				const c = cells[0]
				y = c.y
			}
			height += cells[0].height
			for (let j = startCol; j <= endCol; j++) {
				const cell = cells[j]
				if (i === area.startRowIndex) {
					width += cell.width
				}
				if (j === startCol) {
					x = cell.x
				}
			}
		}
		let rectX = x - pa.scrollLeft + 2,
			rectY = y - pa.scrollTop + 2
		pa.tableContext.strokeStyle = '#4b89ff'
		pa.tableContext.lineWidth = LINE_WIDTH * 2
		pa.tableContext.beginPath()
		pa.tableContext.rect(rectX, rectY, width - 3, height - 3);
		pa.tableContext.stroke()
		pa.tableContext.closePath()

	}
	// 绘制背景颜色
	paintCellBgColor = (context, x, y, width, height, fillStyle) => {
		context.beginPath()
		context.fillStyle = fillStyle || '#fff'
		context.fillRect(x, y, width, height)
		context.fill()
	}
	// 绘制下拉箭头
	paintDropDown = (ctx, cell) => {
		if (!cell || cell.cellType != 'dropDown') return
		let pa = this._pa,
			sideLen = 4,
			vertex = 8,
			hei = cell.height,
			cellY = cell.y - pa.scrollTop,
			startY2 = hei / 2 + cellY - 2,
			fillStyle = '#4a4a4a',
			startX = cell.x + sideLen + cell.width - pa.scrollLeft - 20

		ctx.beginPath()
		ctx.moveTo(startX, startY2)
		ctx.lineTo(startX + vertex, startY2)
		ctx.lineTo(startX + (vertex / 2), startY2 + sideLen)
		ctx.fillStyle = fillStyle
		ctx.fill()
		ctx.closePath()
		cell.dropDownXy = {
			x: startX - 6,
			y: startY2 - 6,
			width: 24,
			height: 24
		}
	}
	// 重绘左侧
	repaintLeft = () => {
		const pa = this._pa
		window.requestAnimationFrame(() => {
			pa.leftCanvas.width = pa.leftCanvas.width
			this.paintLeft()
		});
	}
	// 重绘右侧
	repaintRight = () => {
		const pa = this._pa
		window.requestAnimationFrame(() => {
			pa.tableCanvas.width = pa.tableCanvas.width
			this.paintTable()
		});

	}
	// 重绘头部
	repaintHeader = () => {
		const pa = this._pa
		window.requestAnimationFrame(() => {
			pa.rightHeaderCanvas.width = pa.rightHeaderCanvas.width
			this.paintHeader()
		});
	}
	// 重绘全部
	repaint = () => {
		window.requestAnimationFrame(() => {
			this.repaintLeft()
			this.repaintRight()
			this.repaintHeader()
		});
	}

	setValue = (value, row, col) => {
		const pa = this._pa;
		const tableData = pa.tableData || []
		const cell = tableData[row].cells[col]
		const newX = cell.x - pa.scrollLeft + 1
		const newY = cell.y - pa.scrollTop + 1
		const endY = newY + cell.height
		const oldVal = cell.value
		if (oldVal === value) return
		cell.value = value
		pa.setValueBefore && pa.setValueBefore(cell)
		let v = cell.value
		if (pa.format && pa.format[cell.cellType]) {
			v = pa.format[cell.cellType](cell, pa.fakeValue)
		}
		pa.setValueAfter && pa.setValueAfter(cell, oldVal)
		cell.formatValue = v
		clearRect(pa.tableContext, newX, newY, cell.width - 1, cell.height - 1)
		this.paintCellBgColor(pa.tableContext, newX, newY, cell.width - 1, cell.height - 1, cell.backgroundColor)
		pa.tableContext.fillStyle = COLOR
		let boundary = 6
		if (cell.cellType === 'dropDown') {
			boundary += 16
		}
		if (cell.datatype === '3' || cell.datatype === '4') {
			const wrapList = wrapText(
				pa,
				cell.value,
				cell.width - boundary,
				cell.x + 6,
				cell.y + ROW_HEIGHT - pa.font / 2,
				cell.height)
			wrapList.map(v => pa.tableContext.fillText(v.line, v.x - pa.scrollLeft, v.y - pa.scrollTop))
			setRowHeight(pa, pa.leftAllData, pa.leftData, pa.tableData)
			this._updateHeight()
			this._updateScrollTopNode()
			this.repaintLeft()
			this.repaintRight()
		} else {
			const textInfo = ellipseText(pa.tableContext, v, cell.width - boundary)
			pa.tableContext.fillText(textInfo.text, rightAlign(pa.tableContext, textInfo, cell) - pa.scrollLeft, endY - pa.font / 2)//newX + 6
		}
		this.paintDropDown(pa.tableContext, cell)
		pa.paintTableCellRender && pa.paintTableCellRender(cell, pa.tableContext, {
			x: newX,
			y: newY,
			width: cell.width,
			height: cell.height
		})
		// 保存修改过的cell pa.selectedCell
		pa.record.historyPush(cell)
	}
	setData = (data) => {
		if (!data) {
			throw "data is undefined!"
		}
		this.initData(data)
		this.initSizeAttr()
		this._updateScrollLeftNode()
		this._updateScrollTopNode()
		this.repaint()
	}

	setBodyData = (data = []) => {
		const pa = this._pa
		const oldData = pa.tableAllData
		for (let i = 0; i < oldData.length; i++) {
			const oCells = oldData[i].cells
			const oldRow = oCells[0].oldRowIndex
			const nCells = data[oldRow].cells
			if (oCells[0].oldRowIndex === nCells[0].rowIndex) {
				for (let h = 0; h < oCells.length; h++) {
					for (let q = 0; q < nCells.length; q++) {
						//const oldCol = oCells[h].oldColumnIndex
						if (oCells[h].fullpath === nCells[q].fullpath && oCells[h].groupIndex === nCells[q].groupIndex) {
							if (nCells[q].hasOwnProperty('value')) {
								oCells[h].value = nCells[q].value
								oCells[h].text = nCells[q].text
								oCells[h].dataChanged = nCells[q].dataChanged
							} else {
								oCells[h].value = ''
							}
							oCells[h].backgroundColor = null
							oCells[h].isEdit = null
						}
					}
				}
			}
		}
		pa.tableAllData = oldData
		this.repaintRight()
	}
}

export default Table
