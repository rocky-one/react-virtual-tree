/**
 * 初始化表格左侧数据 移除空白
 * @param {array} data 
 */
export const initLeftData = (datas = []) => {
    const data = datas // JSON.parse(JSON.stringify(datas));
    const keys = Object.keys(data)
    let leftData = []
    let repeatSign = {} // 移除需要合并的行标记
    // 行
    keys.forEach((key, i) => {
        let newCells = []
        let curCells = data[key]
        if (curCells && curCells.length > 0) {
            curCells.forEach((cell, j) => { // 列
                if (!cell.hasOwnProperty('originalRowIndex')) {
                    datas[key][j].originalRowIndex = cell.rowIndex
                    datas[key][j].originalColumnIndex = cell.columnIndex
                }
                let sign = null;
                if (cell.fullpath) {
                    sign = `${cell.fullpath}${cell.groupIndex}`;
                } else {
                    sign = `${cell.id}${cell.columnIndex}${cell.groupIndex}`;
                }
                if (cell.rowSpan > 1) {
                    if (!repeatSign[sign]) {
                        repeatSign[sign] = true
                    }
                }
                // 移除重复的行
                if (repeatSign[sign] && cell.rowSpan <= 1) {

                } else {
                    // let c = cell
                    // c.menuItemState = cell.menuItemState
                    // c.groupIndex = cell.groupIndex || 0
                    // c.reallyParentId = cell.parentId || null
                    newCells.push(cell)
                }
            })
        }
        leftData.push({
            cells: newCells,
        })
    })
    return leftData
}

/**
 * 初始化头部数据 主要是移除空白列
 * @param {*} data 
 */
export const initHeaderData = (datas = {}) => {
    const data = datas  // JSON.parse(JSON.stringify(datas));
    const keys = Object.keys(data);
    let rowLen = keys.length > 0 ? data[0].length : 0;
    let headerData = new Array(rowLen);
    let repeatSign = {};//移除需要合并的行标记
    if (rowLen == 0) return headerData
    keys.forEach(key => {
        const column = data[key];
        for (let i = 0; i < column.length; i++) {
            const cell = column[i];
            const row = i;
            let sign = null;
            if (cell.fullpath) {
                sign = `${cell.fullpath}${cell.groupIndex}`;
            } else {
                sign = `${cell.id}${cell.rowIndex}${cell.groupIndex}`;
            }

            if (cell.colSpan > 1) {
                if (!repeatSign[sign]) {
                    repeatSign[sign] = true;
                }
            }
            // 移除重复的行
            if (repeatSign[sign] && cell.colSpan <= 1) {
                continue;
            } else {
                if (!headerData[row]) {
                    headerData[row] = {};
                }
                if (!headerData[row].cells) {
                    headerData[row].cells = [];
                }
                headerData[row].cells.push(cell);
            }
        }
    });
    return headerData;
}

export const initLeftDynaRow = (list) => {
    const res = list
    for (let i = 0; i < 1; i++) {
        const v = res[res.length - 1]
        res.push({
            cells: [{
                ...v.cells[0],
                id: 'DYNA',
                parentId: undefined,
                reallyParentId: undefined,
                indentCount: 0,
                dynaCell: true,
                updated: true,
                value: '+新增成员，回车保存',
                rowIndex: v.cells[0].rowIndex + 1,
                // oldRowIndex: v.cells[0].rowIndex + 1,
            }]
        })
    }
    return res
}


export const initTableDynaRow = (list) => {
    const res = list
    for (let i = 0; i < 1; i++) {
        const preRow = res[res.length - 1]
        const newRow = { rowIndex: preRow.rowIndex + 1, cells: [] }
        newRow.cells = preRow.cells.map(v => {
            return {
                ...v,
                updated: true,
                value: '',
                rowIndex: v.rowIndex + 1
            }
        })
        res.push(newRow)
    }
    return res
}

