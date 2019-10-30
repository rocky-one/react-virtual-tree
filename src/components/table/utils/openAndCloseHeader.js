import {
    assembleNewData,
    insertDataToHeader,
    initHeaderColSpan,
    setNewXYAndIndex,
} from './handleHeaderData'

export const closeHeaderByLevel = (headerAllData, level = 0) => {
    for (let i = 0; i < headerAllData.length; i++) {
        const cells = headerAllData[i].cells
        for (let j = 0; j < cells.length; j++) {
            if (cells[j].childCount > 0) {
                if (cells[j].indentCount >= level) {
                    cells[j].open = false
                }
            }
        }
    }
    const cell = {
        newRowIndex: 0,
        columnIndex: -1,
        newColIndex: -1,
        indentCount: -1,
        open: true,
    }

    // 集成要展开的数据
    let newData = assembleNewData(cell, headerAllData, true);

    // 插入数据
    newData = insertDataToHeader(newData, [], 0);
    // 重新计算colSpan
    return initHeaderColSpan(newData, headerAllData, setNewXYAndIndex);
}

export const openHeaderByLevel = (headerAllData, level = 0) => {
    for (let i = 0; i < headerAllData.length; i++) {
        const cells = headerAllData[i].cells
        for (let j = 0; j < cells.length; j++) {
            if (cells[j].childCount > 0) {
                if (cells[j].indentCount < level) {
                    cells[j].open = true
                } else {
                    cells[j].open = false
                }
            }
        }
    }
    const cell = {
        newRowIndex: 0,
        columnIndex: -1,
        newColIndex: -1,
        indentCount: -1,
        open: true,
    }

    // 集成要展开的数据
    let newData = assembleNewData(cell, headerAllData, true);

    // 插入数据
    newData = insertDataToHeader(newData, [], 0);
    // 重新计算colSpan
    return initHeaderColSpan(newData, headerAllData, setNewXYAndIndex);
}