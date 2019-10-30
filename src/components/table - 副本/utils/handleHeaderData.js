import {
	ROW_WIDTH,
	ROW_HEIGHT
} from '../tableConst'
import {
	setCellsOpenStatus
} from './common'

// newColSpan cell宽 总宽 总高
const updateHeader = (headerData, headerAllData, cb) => {
	let len = headerData.length,
		headerWidth = 0,
		headerHeight = 0,
		obj = {}
	for (let i = len - 1; i >= 0; i--) {
		let cells = headerData[i].cells
		if (cells[0]) {
			headerHeight += cells[0].height
		}
		for (let j = 0; j < cells.length; j++) {
			const cell = cells[j]
			const preCell = cell.preCell
			cell.newColIndex = j;
			if (i === len - 1) {
				cell.width = cell.width || ROW_WIDTH
				cell.newColSpan = 1
			}
			if (preCell) { // && cell.show
				//寻找上一个对应的cell 设置其新的newColSpan
				let row = preCell.rowIndex
				let col = preCell.columnIndex
				let pre = headerAllData[row].cells[col]
				if (pre) {
					// 归零处理
					if (!obj[`${row}${col}`]) {
						obj[`${row}${col}`] = true
						pre.newColSpan = 0
						pre.width = 0
					}
					pre.newColSpan += cell.newColSpan || 1
					pre.width += cell.width || ROW_WIDTH
				}
			}
			cb && cb(i, j, headerData)
			if (i === len - 1) {
				headerWidth += cell.width
			}
		}
	}
	return {
		headerData,
		headerWidth,
		headerHeight
	}
}


/**
 * @desc 初始化表格头部数据
 * @param {*} data 
 */
export const initHeaderData = (data = [], open) => {

	if (data.length === 0) return {
		headerAllData: [],
		headerData: []
	}
	let headerAllData = []
	let headerData = []
	let len = data.length
	data.forEach((row, i) => {
		let cells = row.cells,
			newCells = [],
			newAllCells = [],
			nextIndex = 0,
			nextCells = i + 1 < len ? data[i + 1].cells : false

		for (let j = 0; j < cells.length; j++) {
			let cell = cells[j],
				colSpanEndSign = 0,
				colSpan = cell.colSpan

			!cell.colSpan && (cell.colSpan = 1)
			cell.height = cell.height || ROW_HEIGHT
			cell.y = i * cell.height
			cell.width = ROW_WIDTH * cell.colSpan
			cell.oldColumnIndex = cell.columnIndex
			cell.columnIndex = j
			cell.open = open || false
			cell.cid = `${cell.rowIndex}${cell.columnIndex}`
			// 设置对应关系
			if (nextCells) {
				if (!cell.nextCell) {
					cell.nextCell = []
				}
				for (let h = nextIndex; h < nextCells.length; h++) {
					let nextCell = nextCells[h];
					colSpanEndSign += nextCell.colSpan;
					cell.nextCell.push({
						nextColumnIndex: h,
						nextRowIndex: i + 1
					});
					nextCell.preCell = {
						rowIndex: i,
						columnIndex: j,
					}
					if (colSpanEndSign >= colSpan) {
						nextIndex = h + 1;
						colSpanEndSign = 0;
						h = nextCells.length;
						break;
					}
				}
			}
			// 初始化时隐藏的列
			if (!open && !cell.parentId) {
				const cellPreCell = cell.preCell;
				if (cellPreCell) {
					if (data[cellPreCell.rowIndex].cells[cellPreCell.columnIndex].show) {
						newCells.push(cell)
						cell.show = true
					}
				} else {
					newCells.push(cell)
					cell.show = true
				}
			} else if (open) {
				newCells.push(cell)
			}
			newAllCells.push(cell)

			//cell.show = false;
			// if (!open && !cell.parentId) {
			// 	newCells.push(cell)
			// } else if (open) {
			// 	newCells.push(cell)
			// }
			// newAllCells.push(cell)
		}
		// const newAttr = {
		// 	height: row.height,
		// 	y: row.y
		// }

		headerData.push({
			cells: newCells,
			// ...newAttr
		})
		headerAllData.push({
			cells: newAllCells,
			// ...newAttr
		})
	})
	return {
		...updateHeader(headerData, headerAllData, setNewXYAndIndex),
		headerAllData
	}
}


// 初始化就是展开状态 且无法折叠 只计算一次 所以这里单独写一个方法只处理这种简单展示的情况
export const initOpenHeaderData = (data = []) => {
	let headerAllData = [],
		headerData = [],
		headerWidth = 0,
		headerHeight = 0,
		len = data.length
	if (data.length === 0) return {
		headerAllData,
		headerData
	}

	data.forEach((row, i) => {
		let cells = row.cells,
			newAllCells = [],
			// newAttr = {},
			widthSum = 0,
			nextIndex = 0,
			nextCells = i + 1 < len ? data[i + 1].cells : false

		headerHeight += ROW_HEIGHT

		for (let j = 0; j < cells.length; j++) {
			let cell = { ...cells[j] },
				colSpanEndSign = 0,
				colSpan = cell.colSpan
			if (!cell.colSpan) {
				cell.colSpan = 1
			}
			cell.height = ROW_HEIGHT
			cell.y = i * ROW_HEIGHT
			cell.x = widthSum //ROW_WIDTH * cell.colSpan + widthSum
			cell.width = ROW_WIDTH * cell.colSpan
			widthSum += cell.width
			cell.newRowIndex = i
			cell.oldColumnIndex = cell.columnIndex
			cell.newColIndex = j//cell.columnIndex
			cell.newColSpan = cell.colSpan
			// newAttr = {
			// 	height: cell.height,
			// 	y: cell.y
			// }
			newAllCells.push(cell)
			if (i === data.length - 1) {
				headerWidth += cell.width
			}
			// 设置对应关系
			if (nextCells) {
				if (!cell.nextCell) {
					cell.nextCell = []
				}
				for (let h = nextIndex; h < nextCells.length; h++) {
					let nextCell = nextCells[h];
					colSpanEndSign += nextCell.colSpan;
					cell.nextCell.push({
						nextColumnIndex: h,
						nextRowIndex: i + 1
					});
					nextCell.preCell = {
						rowIndex: i,
						columnIndex: j,
					}
					if (colSpanEndSign >= colSpan) {
						nextIndex = h + 1;
						colSpanEndSign = 0;
						h = nextCells.length;
						break;
					}
				}
			}
		}

		headerAllData.push({
			cells: newAllCells,
			// ...newAttr
		})
	})
	return {
		headerAllData,
		headerData: headerAllData,
		headerWidth,
		headerHeight
	}
}

// 设置新的宽度
export const setNewXYAndIndex = (rowIndex, colIndex, headerData) => {
	const cells = headerData[rowIndex].cells
	const cell = cells[colIndex]
	const leftIndex = colIndex - 1
	const leftCell = leftIndex >= 0 ? cells[leftIndex] : false
	cell.newColIndex = colIndex
	cell.newRowIndex = rowIndex
	if (!leftCell) {
		cell.x = 0
	} else {
		cell.x = leftCell.x + leftCell.width
	}
}


export const getLastHeaderCells = (headerData = []) => {
	if (headerData.length === 0) return []
	return headerData[headerData.length - 1].cells
}


/**
 * 集成点击cell 后要展开的数据到data对象中
 * key为行索引
 * @param {object} cell 
 * @param {array} headerAllData 
 */
export const assembleNewData = (cell, headerAllData, show) => {
	const childObj = findCellChildIsShow(cell, headerAllData, show);
	const nextDataObj = findCellsNextData(childObj.data, headerAllData);

	return Object.assign({
		[cell.newRowIndex]: childObj.data
	}, nextDataObj)

}


export const findCellsNextData = (cells, headerAllData, cb) => {
	let nextCells = {};
	let level = 0;
	const loopNext = (cells = [], headerAllData, cb) => {
		if (cells.length === 0) return;
		level = cells[0].rowIndex
		for (let i = 0; i < cells.length; i++) {
			let nextCell = cells[i].nextCell;
			if (nextCell && nextCell.length > 0) {
				let firstIndent = headerAllData[nextCell[0].nextRowIndex].cells[nextCell[0].nextColumnIndex].indentCount;
				for (let j = 0; j < nextCell.length; j++) {
					let n = nextCell[j];
					let nCell = headerAllData[n.nextRowIndex].cells[n.nextColumnIndex];
					let indentCount = nCell.indentCount;
					if (indentCount === firstIndent) {
						if (!nextCells[n.nextRowIndex]) {
							nextCells[n.nextRowIndex] = [];
						}
						//nCell.show = true;
						nextCells[n.nextRowIndex].push(nCell);
						if (nCell.childCount > 0 && !nCell.open) {
							j += nCell.childCount;
						}
					} else {
						if (!nextCells[n.nextRowIndex]) {
							nextCells[n.nextRowIndex] = [];
						}
						//nCell.show = true;
						nextCells[n.nextRowIndex].push(nCell);
					}
				}
			}
		}
		loopNext(nextCells[level + 1], headerAllData, cb);
	}
	loopNext(cells, headerAllData, cb);
	return nextCells;
}

/**
 * 获取当前点击的cell的索引 到第0个位置的rowSpan之和
 */
export const getCellBeforeColSpanSum = (cells, startIndex) => {
	let sum = 0;
	for (let i = startIndex; i >= 0; i--) {
		sum += (cells[i].newColSpan || cells[i].colSpan);
	}

	return sum;
}

/**
 * 展开头部时 把合成好的数据插入到headerData
 * @param {object} datas 
 * @param {array} headerData 
 * @param {number} cellBeforeRowSpanSum 
 */
export const insertDataToHeader = (data, headerData, cellBeforeRowSpanSum) => {
	const indexs = Object.keys(data);
	if (!headerData || headerData.length === 0) {
		headerData = new Array(indexs.length)
	}
	indexs.forEach(i => {
		if (!headerData[i]) {
			headerData[i] = {
				cells: []
			}
		}
		// headerData[i] ? headerData[i].cells : headerData[i].cells=[];
		let cells = headerData[i].cells
		let spliceStart = 1;
		let indexSum2 = 0;
		for (let i = 0; i < cells.length; i++) {
			indexSum2 += (cells[i].newColSpan || cells[i].colSpan);
			if (indexSum2 === cellBeforeRowSpanSum) {
				spliceStart = i + 1;
				break;
			}
		}
		cells.splice(spliceStart, 0, ...data[i]);
		headerData[i].cells = cells
	});

	return headerData;
}

/**
 * 初始化colSpan 计算当前headerData
 * @param {array} headerData 
 */
export const initHeaderColSpan = (headerData, headerAllData, cb) => {
	let newLen = headerData.length
	const obj = {};
	for (let i = newLen - 1; i >= 0; i--) {
		let cells = headerData[i].cells
		for (let j = 0; j < cells.length; j++) {
			let preCell = cells[j].preCell
			if (i === newLen - 1) {
				cells[j].width = cells[j].width || ROW_WIDTH
				cells[j].newColSpan = 1
			}
			if (preCell) { // && cells[j].show
				//寻找上一个对应的cell 设置其新的newColSpan
				let row = preCell.rowIndex
				let col = preCell.columnIndex
				let pre = headerAllData[row].cells[col]
				if (pre) {
					// 归零处理
					if (!obj[`${row}${col}`]) {
						obj[`${row}${col}`] = true
						pre.newColSpan = 0
						pre.width = 0;
					}
					pre.newColSpan += cells[j].newColSpan || 1
					pre.width += cells[j].width || ROW_WIDTH
				}
			}
			cb(i, j, headerData)
		}
	}

	return headerData;
}

export const openHeaderTr = (cell, headerData, headerAllData) => {
	if (cell.open) {
		return closeHeaderTr(cell, headerData, headerAllData)
	}
	let rowIndex = cell.newRowIndex;
	let newColIndex = cell.newColIndex;
	cell.open = true;
	// 集成要展开的数据
	const newData = assembleNewData(cell, headerAllData, true);
	// 求和
	const cellBeforeRowSpanSum = getCellBeforeColSpanSum(headerData[rowIndex].cells, newColIndex);
	// 插入数据
	headerData = insertDataToHeader(newData, headerData, cellBeforeRowSpanSum);
	// 重新计算colSpan
	initHeaderColSpan(headerData, headerAllData, setNewXYAndIndex);
	return headerData;
}



/**
 * 表格头部收起操作
 * @param {object} cell 当前点击的cell
 * @param {array} headerData 当前头部展示出来的数据
 * @param {array} headerAllData 头部所有数据
 */
export const closeHeaderTr = (cell, headerData, headerAllData) => {

	let cells = headerData[cell.newRowIndex].cells;
	// 如果当前点击的cell前面还有则统计前面cell的长度(合并数相加), 用来截取下一行开始的标记
	let spliceStart = getCellBeforeColSpanSum(cells, cell.newColIndex);
	// 统计要删除的长度
	let colSpanSum = getDelHeaderLen(cell, headerData); //headerAllData
	cell.open = false;
	// 删除头部数据
	headerData = delHeaderData(cell, spliceStart, colSpanSum, headerData);
	// 重新计算colSpan
	initHeaderColSpan(headerData, headerAllData, setNewXYAndIndex);

	return headerData;
}

/**
 * 获取要删除的长度
 * @param {object} cell 当前cell
 * @param {array} headerAllData 
 */
const getDelHeaderLen = (cell, headerData) => {
	let data = findCellChildIsShow(cell, headerData, false);
	return data.colSpanSum;
}

/**
 * 删除头部数据
 * @param {object} cell 当前点击的cell
 * @param {number} delLen 要删除的长度 
 * @param {array} headerData 
 */
const delHeaderData = (cell, spliceStart, delLen, headerData) => {
	// rowIndex
	for (let i = cell.newRowIndex; i < headerData.length; i++) {
		let cells = headerData[i].cells;
		let start = 0;
		let realStart = 0;
		let realEnd = 0;
		for (let j = 0; j < cells.length; j++) {
			start += (cells[j].newColSpan || cells[j].colSpan);
			if (start > spliceStart) {
				realStart = j;
			}
			if (realStart > 0) {
				realEnd += (cells[j].newColSpan || cells[j].colSpan);
				cells.splice(j, 1);
				j--;
			}
			if (realEnd > 0 && realEnd >= delLen) {
				break;
			}
		}
	}
	return headerData;
}

/** 
 * 递归当前行 计算当前行的data 和 当前data的colSpan和
 * @param {object} cell 当前点击的cell
 * @param {array} headerAllData 当前所有的头部的data
 * @param {boolean} show 是展开还是收起的标记 展开时从所有数据索引开始 关闭时传的是当前headerData 索引从newColIndex开始
*/
const findCellChildIsShow = (cell, headerAllData, open) => {
	let data = [];
	let colSpanSum = 0;
	if (!cell || !headerAllData || headerAllData.length === 0) return {
		data,
		colSpanSum
	}
	let cells = headerAllData[cell.newRowIndex].cells; // rowIndex
	let newColIndex = open ? cell.columnIndex : cell.newColIndex;
	let openParentId = {}
	//let pIdArr = [];
	//cell.show = true;
	// if (!cell.open) {
	// 	return {
	// 		data: [cell],
	// 		colSpanSum: cell.newColSpan || cell.colSpan
	// 	}
	// }
	let len = cells.length;

	for (let i = newColIndex + 1; i < len; i++) {
		if (cells[i].indentCount <= cell.indentCount) break
		// 直接子集
		if (cells[i].indentCount === cell.indentCount + 1) { // && cells[i].parentId === cell.id
			//cells[i].show = show;
			data.push(cells[i]);
			colSpanSum += (cells[i].newColSpan || cells[i].colSpan);
			if (cells[i].childCount > 0 && cells[i].open) {
				openParentId[cells[i].id] = cells[i].id
			}
		}
		if (openParentId[cells[i].parentId]) {
			data.push(cells[i]);
			colSpanSum += (cells[i].newColSpan || cells[i].colSpan);
			if (cells[i].childCount > 0 && cells[i].open) {
				openParentId[cells[i].id] = cells[i].id
			}
		}
		// 间接子集且是展开状态
		// if (cells[i].indentCount > cell.indentCount + 1 && cells[i].show) {
		// 	data.push(cells[i]);
		// 	colSpanSum += (cells[i].newColSpan || cells[i].colSpan);
		// 	//有子节点
		// 	// if (cells[i].childCount > 0) {
		// 	// 	pIdArr.push(cells[i].id);
		// 	// }
		// }
	}
	return {
		data,
		colSpanSum
	};
}


export const closeAllHeader = (headerAllData) => {
	const cell = {
		newRowIndex: 0,
		columnIndex: -1,
		newColIndex: -1,
		indentCount: -1,
		open: true,
	}
	setCellsOpenStatus(headerAllData, false)

	// 集成要展开的数据
	let newData = assembleNewData(cell, headerAllData, true);

	// 插入数据
	newData = insertDataToHeader(newData, [], 0);

	// 重新计算colSpan
	return initHeaderColSpan(newData, headerAllData, setNewXYAndIndex);

}

export const initHideCols = () => {
	const cell = {
		newRowIndex: 0,
		columnIndex: -1,
		newColIndex: -1,
		indentCount: -1,
		open: true,
	}
	setCellsOpenStatus(headerAllData, false)
	let newData = assembleNewData(cell, headerAllData, true);
	newData = insertDataToHeader(newData, [], 0);
	return initHeaderColSpan(newData, headerAllData, setNewXYAndIndex);
}