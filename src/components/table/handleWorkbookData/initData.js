/**
 * 初始化表格左侧数据 移除空白
 * @param {array} data 
 */
export const initLeftData = (datas = []) => {
    const data = JSON.parse(JSON.stringify(datas));
    const keys = Object.keys(data)
    let leftData = []
    let repeatSign = {} // 移除需要合并的行标记
    // 行
    keys.forEach((key, i) => {
        let newCells = []
        let curCells = data[key]
        if (curCells && curCells.length > 0) {
            curCells.forEach((cell, j) => { // 列
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
                    let c = cell
                    //c.member = cell.dims
                    c.menuItemState = cell.menuItemState
                    //c.dimId = cell.dims ? cell.dims[0].current.dimId : null
                    // c.id= `${cell.path}${cell.groupIndex}`
                    c.groupIndex = cell.groupIndex || 0
                    c.reallyParentId = cell.parentId || null
                    //c.parentId = setParentId(cell, data) // 后端数据 只有第一个td有parentId字段,所以要把第一个之后的parentId也设置上
                    newCells.push(c)
                }
            })
        }
        leftData.push({
            cells: newCells,
        })
    })
    return leftData
}

const setParentId = (cell, data) => {
    let cells = data[cell.rowIndex]
    let pId = null
    for (let i = cell.columnIndex; i >= 0; i--) {
        if (cells[i].parentId) {
            return cells[i].parentId
        }
    }
    return pId;
}

/**
 * 初始化头部数据 主要是移除空白列
 * @param {*} data 
 */
export const initHeaderData = (datas = {}) => {
    const data = JSON.parse(JSON.stringify(datas));
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

