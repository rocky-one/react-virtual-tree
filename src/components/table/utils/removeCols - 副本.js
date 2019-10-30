import { findPre } from './common'

// 更新colSpan
function updateColSpan(cols = [], headerData) {
	const len = headerData.length
	const lastRowCells = headerData[len - 1].cells
	const colsMap = {}
	cols.forEach(i => colsMap[i] = i)

	for (let i = 0; i < lastRowCells.length; i++) {
		const col = lastRowCells[i].columnIndex
		if (colsMap.hasOwnProperty(col)) {
			const cell = lastRowCells[i]
			cell.delete = true
			findPre(cell, headerData, (pre) => {
				// if (pre.nextCell) { pre.nextCell = null }
				// pre.width -= cell.width

				// if (pre.newColSpan && pre.newColSpan > 1) {
				// 	pre.newColSpan -= 1
				// } else if (pre.newColSpan === 1) {
				// 	pre.delete = true
				// }
				if (pre.colSpan && pre.colSpan > 1) {
					pre.colSpan -= 1
				} else if (pre.colSpan === 1) {
					pre.delete = true
				}
			})
		}
	}
	return headerData
}


// 更新宽
function updateWidth(headerData) {
	const len = headerData.length
	const cells = headerData[len - 1].cells
	for (let i = 0; i < cells.length; i++) {
		const cell = cells[i]
		findPre(cell, headerData, function (pre) {
			if (!pre.width) {
				pre.width = cell.width
			} else {
				pre.width += cell.width
			}
		})
	}
	return headerData
}
// 更新parentId indentCount childCount
function updateParentId(delCell, data) {
	const childCount = delCell.childCount
	if (childCount > 0) {
		const cells = data[delCell.rowIndex].cells
		let newParentId = delCell.parentId
		let start = false
		for (let i = 0; i < cells.length; i++) {
			// 从当前删除索引的下一个cell开始
			if (cells[i].cid === delCell.cid && cells[i].groupIndex === delCell.groupIndex) {
				start = true
				continue
			}
			if (!start) continue
			// 边界跳出
			if (cells[i].indentCount <= delCell.indentCount) {
				break
			}
			if (cells[i].parentId === delCell.id) {
				cells[i].parentId = newParentId
				cells[i].indentCount -= 1
				newParentId = cells[i].id
			} else if (cells[i].parentId === newParentId) {
				cells[i].indentCount -= 1
				newParentId = cells[i].id
			}
		}
	}

	if (delCell.parentId) {
		let pId = delCell.parentId
		const cells = data[delCell.rowIndex].cells
		const len = cells.length
		for (let i = delCell.columnIndex; i >= 0; i--) {
			if (i < len) {
				if (cells[i].id === pId) {
					pId = cells[i].parentId
					cells[i].childCount -= 1
					if (!pId) break
				}
			}
		}
	}
}


// 删除
function removeHasDelete(data = [], cb) {
	for (let i = 0; i < data.length; i++) {
		const cells = data[i].cells
		for (let j = 0; j < cells.length; j++) {
			cells[j].nextCell = null
			cells[j].preCell = null
			if (i != data.length - 1) {
				cells[j].width = null
			}
			if (cells[j].delete) {
				cb && cb(cells[j], data)
				cells.splice(j, 1)
				j--
			}
		}
		if (cells.length === 0) {
			data.splice(i, 1)
			i--
		}
	}
	return data
}
// 更新对应关系
function updateLink(data) {
	const rowMap = {}
	for (let i = 0; i < data.length; i++) {
		const cells = data[i].cells
		if (!rowMap[i]) { rowMap[i] = { start: 0 } }

		for (let j = 0; j < cells.length; j++) {
			const cell = cells[j]
			cell.open = true
			cell.newRowIndex = i
			cell.rowIndex = i
			cell.newColIndex = j
			cell.columnIndex = j
			cell.newColSpan = cell.colSpan

			// 下一个
			if (i + 1 < data.length) {
				let indexSign = 0
				let breakSign = 0
				const nCells = data[i + 1].cells
				for (let h = 0; h < nCells.length; h++) {
					if (breakSign >= cell.colSpan) {
						breakSign = 0
						break
					}
					indexSign += nCells[h].colSpan
					if (indexSign > rowMap[i].start) {
						breakSign += nCells[h].colSpan
						nCells[h].preCell = {
							columnIndex: cell.columnIndex,
							rowIndex: cell.rowIndex,
						}
						if (!cell.nextCell) {
							cell.nextCell = []
						}
						cell.nextCell.push({
							nextColumnIndex: h,
							nextRowIndex: i + 1
						})
					}
				}
			}
			rowMap[i].start += cell.colSpan
		}
	}
	return data
}
// 更新索引
function updateIndex(data = []) {
	if (data.length === 0) {
		return {
			data,
			width: 0
		}
	}
	const xMap = {}
	// const rowMap = {}
	let width = 0
	for (let i = 0; i < data.length; i++) {
		const cells = data[i].cells
		if (!xMap[i]) { xMap[i] = { x: 0 } }
		// if (!rowMap[i]) { rowMap[i] = { start: 0 } }

		for (let j = 0; j < cells.length; j++) {

			const cell = cells[j]
			// cell.open = true
			// cell.newRowIndex = i
			// cell.rowIndex = i
			// cell.newColIndex = j
			// cell.columnIndex = j
			// cell.newColSpan = cell.colSpan
			let x = xMap[i].x
			cell.x = x
			xMap[i].x = x + cell.width

			if (i === 0) {
				width += cell.width
			}

			// 下一个
			// if (i + 1 < data.length) {
			// 	let indexSign = 0
			// 	let breakSign = 0
			// 	const nCells = data[i + 1].cells
			// 	for (let h = 0; h < nCells.length; h++) {
			// 		if (breakSign >= cell.colSpan) {
			// 			breakSign = 0
			// 			break
			// 		}
			// 		indexSign += nCells[h].colSpan
			// 		if (indexSign > rowMap[i].start) {
			// 			breakSign += nCells[h].colSpan
			// 			nCells[h].preCell = {
			// 				columnIndex: cell.columnIndex,
			// 				rowIndex: cell.rowIndex,
			// 			}
			// 			if (!cell.nextCell) {
			// 				cell.nextCell = []
			// 			}
			// 			cell.nextCell.push({
			// 				nextColumnIndex: h,
			// 				nextRowIndex: i + 1
			// 			})
			// 		}
			// 	}
			// }
			// rowMap[i].start += cell.colSpan
		}
	}

	return {
		data,
		width
	}
}

// 移除列
export const removeCols = (cols = [], headerData) => {
	if (cols.length === 0) return false
	headerData = updateColSpan(cols, headerData)
	headerData = removeHasDelete(headerData, updateParentId)
	headerData = updateLink(headerData)
	headerData = updateWidth(headerData)
	const obj = updateIndex(headerData)

	return {
		headerData: obj.data,
		headerAllData: obj.data,
		width: obj.width
	}
}


export const removeBodyCols = (cols = [], data = []) => {
	if (data.length === 0 || cols.length === 0) return data
	const colsMap = {}
	cols.forEach(i => { colsMap[i] = true })

	for (let i = 0; i < data.length; i++) {
		const cells = data[i].cells
		for (let j = 0; j < cells.length; j++) {
			if (colsMap[cells[j].columnIndex]) {
				cells.splice(j, 1)
				j--
			} else {
				cells[j].columnIndex = j
			}
		}

	}
	return data
}