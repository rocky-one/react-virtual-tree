import {
    ROW_WIDTH,
    ROW_HEIGHT,
} from '../tableConst'

/**
 * @desc 计算左侧数据开始绘制的索引
 * @param {*} leftData 
 * @param {*} scrollTop 
 */
export const caclLeftStartPaintIndex = (leftData, scrollTop) => {
    let index = 0,//Math.floor(scrollTop / ROW_HEIGHT),
        firstIndex = index

    for (let i = index, len = leftData.length; i < len; i++) {
        const cells = leftData[i].cells || []
        const cell = cells[0] || null
        if (cell && cell.columnIndex === 0) {
            let y = leftData[firstIndex].cells[0].y
            if (y > scrollTop) {
                i -= Math.ceil((y - scrollTop) / ROW_HEIGHT)
                i = i < 0 ? 0 : i
                firstIndex = i
                continue
            }
            if (y < scrollTop && y + (cell.height * cell.rowSpan) > scrollTop) {
                return i
            }
        }
    }
    return 0
}


// 获取表格行开始绘制的索引
export const getPointStartRowIndex = (data = [], scrollTop, key) => {
    // let i = Math.floor(scrollTop / ROW_HEIGHT)
    for (let i = 0; i < data.length; i++) {
        const cells = data[i].cells
        if (cells.length === 0) continue
        const cell = cells[0]
        if (cell.y + cell.height >= scrollTop && cell.y <= scrollTop) {
            return key ? data[i + 1 > data.length - 1 ? data.length - 1 : i + 1][key] : i
        }
        // if (!key && cell.y > scrollTop) {
        //     i -= 2
        //     if(i<0){
        //         i=0
        //     }
        // }
    }
    return 0
}

export const getPointEndRowIndex = (data, bodyHeight, scrollTop, key) => {
    for (let i = 0; i < data.length; i++) {
        const cells = data[i].cells
        if (cells.length === 0) continue
        const cell = cells[0]
        if (cell.y + cell.height >= scrollTop + bodyHeight && cell.y <= scrollTop + bodyHeight) {
            return key ? data[i - 1 < 0 ? 0 : i - 1][key] : i
        }
    }
    return key ? data[data.length - 1][key] : data.length - 1
}


// 获取表格列绘制结束的索引
export const getPointEndColIndex = (data = [], bodyWidth = 0, scrollLeft = 0, key) => {
    if (data.length > 0) {
        const cells = data[0].cells
        if (cells.length > 0) {
            for (let i = 0; i < cells.length; i++) {
                if (cells[i].x + cells[i].width >= scrollLeft + bodyWidth && cells[i].x <= scrollLeft + bodyWidth) {
                    return key ? cells[i - 1 < 0 ? 0 : i - 1][key] : i
                }
            }
            return key ? cells[cells.length - 1][key] : cells.length - 1
        }
    }
    return 0
}

// 获取表格列绘制开始的索引
export const getPointStartColIndex = (data = [], scrollLeft = 0, key) => {
    if (data.length > 0) {
        const cells = data[0].cells
        for (let i = 0; i < cells.length; i++) {
            if (cells[i].x <= scrollLeft && cells[i].x + cells[i].width >= scrollLeft) {
                return key ? cells[i + 1 > cells.length - 1 ? cells.length - 1 : i + 1][key] : i
            }
        }
    }
    return 0
}


// 擦除区域
export const clearRect = (context, x, y, width, height) => {
    context.clearRect(x + 2, y + 2, width - 4, height - 4);
}

// 对齐
export const alignCenterText = (x, textWidth, width, childCount, ellipsis) => {
    if (ellipsis) {
        if (childCount) {
            return x + 20
        }
        return x + 10
    } else {
        return x + (width - textWidth) / 2
    }
}
// 超出添加省略号
export const ellipseText = (ctx, text, maxWidth) => {
    let width = ctx.measureText(text).width;
    if (maxWidth <= 10) {
        return {
            text: '',
            ellipsis: true,
            textWidth: width,
        }
    }
    let ellipsis = '...';
    let ellipsisWidth = ctx.measureText(ellipsis).width;
    if (width <= maxWidth || width <= ellipsisWidth) {
        return {
            text,
            ellipsis: false,
            textWidth: width,
        };
    } else {
        let len = text.length;
        while (width >= maxWidth - ellipsisWidth && len-- > 0) {
            text = text.substring(0, len);
            width = ctx.measureText(text).width;
        }
        return {
            text: text + ellipsis,
            ellipsis: true,
            textWidth: width,
        }
    }
};

// 右对齐
export const rightAlign = (ctx, textInfo, cell) => {
    if (!textInfo.ellipsis && cell.align === 'right') {
        let width = ctx.measureText(textInfo.text).width
        let cellWidth = cell.width
        let left = cellWidth - width
        return cell.x + left - 3
    }
    return cell.x + 6
}

export const findStartIndex = (scrollTop, data) => {
    let len = data.length
    let oneNum = Math.ceil(len / 10)
    let num = Math.ceil(len / oneNum)
    let s = 0
    if (scrollTop === 0) return 0
    for (let i = 0; i <= num + 1; i++) {
        const cells = data[s].cells
        const last = cells[cells.length - 1]
        if (last.y > scrollTop) {
            let newOneNum = Math.ceil(oneNum / 10)
            num = Math.ceil(oneNum / newOneNum)
            s -= oneNum
            oneNum = newOneNum
            i = 0
            continue
        } if (last.y + last.height >= scrollTop && last.y <= scrollTop) {
            return s
        }
        s += oneNum
        if (s >= len) {
            s = len - 1
        }
    }
}

export const findEndIndex = (scrollTop, bodyHeight, data) => {
    let len = data.length
    let oneNum = Math.ceil(len / 10)
    let num = Math.ceil(len / oneNum)
    let s = 0
    for (let i = 0; i <= num + 1; i++) {
        const cells = data[s].cells
        const last = cells[cells.length - 1]
        const hei = scrollTop + bodyHeight
        if (last.y > hei) {
            let newOneNum = Math.ceil(oneNum / 10)
            num = Math.ceil(oneNum / newOneNum)
            s -= oneNum
            oneNum = newOneNum
            i = 0
            continue
        } if (last.y + last.height >= hei && last.y <= hei) {
            return s
        }
        s += oneNum
        if (s >= len) {
            s = len - 1
        }
    }
}