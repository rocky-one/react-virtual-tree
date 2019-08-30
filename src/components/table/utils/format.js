import moment from 'moment';

export const START_DATE = '1899-12-30';
export const YYYY_MM_DD = 'YYYY-MM-DD';
/**
 * @desc 计算一个起始日期到结束日期之间的天数 dateToValue(moment('1900-01-01'), moment('1900-01-12'))
 * @param {string} startDate
 * @param {string} endDate
 */
export const dateToValue = (startDate, endDate) => {
    return Math.abs(moment(startDate).diff(moment(endDate), 'days'));
}
/**
 * @desc 开始日期 + 天数 = 计算后天数 valueToDate(moment('1900/01/05', 'YYYY-MM-DD'), 100, 'YYYY-MM-DD')
 * @param {string} startDate  日期 默认起始日期为 '1899-12-30'
 * @param {number} days   天数(value)
 * @param {string} format 转换格式
 */
export const valueToDate = (days, format = YYYY_MM_DD, startDate = START_DATE) => {
    if (checkIsNum(days)) {
        if (Number(days) === 0) return ''
    }
    return moment(startDate).add(days, 'days').format(format);
}


// 检查是否为正负浮点数
export const checkIsNum = (nubmer) => {
    var re = /(^.[0-9]+$)|(^-?[0-9]+.?[0-9]+$)|(^-?[0-9]+$)/;
    return re.test(nubmer)
}



// 解决小数计算时精度问题
export const strip = (num, precision = 12) => {
    return scientificToNumber(+parseFloat(num.toPrecision(precision)))
}


const defDateFormat = 'YYYY年MM月DD日'
// 截取
const splitNum = (num) => {
    if (num === '') return num; //!num || 
    let n = num.toString();
    return n.split('.')
};

/**
 * @discription 四舍五入
 * @param num  需要格式化的数字
 * @param v    保留几位小数
 * @returns {*}
 */
const decimal = (num, v) => {
    let numArr = splitNum(num)
    let len = numArr.length
    if (len <= 1 && v > 0) {
        let s = ''
        for (let i = 0; i < v; i++) {
            s += '0'
        }
        return num + '.' + s
    }
    let vv = Math.pow(10, v);
    vv = strip(Math.round(num * vv) / vv);
    // 补齐小数位
    numArr = splitNum(vv)
    if (v > 0) {
        let l = numArr.length > 1 ? v - numArr[1].toString().length : v
        if (l > 0) {
            let ss = ''
            for (let i = 0; i < l; i++) {
                ss += '0'
            }
            vv = vv.toString()
            if (vv.indexOf('.') === -1 && ss != '') {
                vv += '.'
            }
            return vv + ss
        }
    }
    return vv
}
// 保留几位小数 
const numToFixed = (num, len) => {
    return decimal(num, len)
};

// 添加逗号
const addCommas = (num, len) => {
    let n = splitNum(num);
    let n1 = n[0];
    let n2 = n.length > 1 ? n[1] : false;
    let reg = /(\d+)(\d{3})/;
    while (reg.test(n1)) {
        n1 = n1.replace(reg, '$1' + ',' + '$2');
    }
    if (len > 0 && n2 !== false) {
        return n1 + "." + n2;
    }
    return n1;
}
// 
const handleFormat = (value, format, type) => {
    if (value === '') return ''; // || !value!=0
    let arr = splitNum(format);
    let len = arr.length > 1 ? arr[1].length : 0;
    if (type === '2' && len > 0) {
        len -= 1;
    }
    // 小数点后几位
    let v = numToFixed(value, len);
    // 添加逗号
    if (format.indexOf(',') != -1) {
        v = addCommas(v, len);
    }
    if (type === '2') {
        v = v + '%'
    }
    return v;
}
export const formatMomentToStr = (date, format = defDateFormat) => {
    return moment(date).format(format)
}
// 日期5,下拉列表4,百分比2,文本3,父节点汇聚8, 聚合7, 整数6,货币0,数值1  106405
export const cellType = {
    '0': 'number',
    '1': 'number',
    '2': 'percentage',
    '3': 'text',
    '4': 'dropDown',
    '5': 'date',
    '6': 'integer',
    '7': 'number',
    '8': 'number',
}
export const cellTypeInverseMap = {
    'number': '1',
    'percentage': '2',
    // 'text': '3', // 文本格式化 需求变更 暂时不需要此功能
    'dropDown': '4',
    'date': '5',
    'integer': '6',
}

export const defaultFormatStr = {
    'number': '#,##0.00', //'##,###.00',
    'percentage': '#,##0.00%',
    'date': 'YYYY年MM月DD日'
}

const formatFn = (showNulls) => ({
    percentage: (cell, fakeValue) => {
        if (!checkIsNum(cell.value)) {
            return cell.value;
        }
        // 当cube不配置此参数时, 输入0 统一显示为''
        if (!showNulls) {
            if (Number(cell.value) === 0) {
                cell.value = ''
                return cell.value
            }
        }
        let format = cell.formatString || defaultFormatStr['percentage'];
        let v = strip((cell.value || 0) * 100);
        if (fakeValue && cell.datatype != '3') {
            v = 0;
        }
        return handleFormat(v.toString(), format, '2');
    },
    number: (cell, fakeValue) => {
        if (!checkIsNum(cell.value)) {
            return cell.value;
        }

        // 当cube不配置此参数时, 输入0 统一显示为''
        if (!showNulls) {
            if (Number(cell.value) === 0) {
                cell.value = ''
                return cell.value
            }
        }
        let format = cell.formatString || defaultFormatStr['number'];
        let v = cell.value;
        if (fakeValue && cell.datatype != '3') {
            v = 0;
        }
        v = handleFormat(v, format)
        return v
    },
    date: (cell, fakeValue) => {
        // 后端返回数据错误 这种情况不做格式化处理 否则前端显示不正确
        if (cell.formatString && cell.formatString.indexOf('###,##') === 0) {
            cell.formatString = defDateFormat//cell.text
        }
        if (fakeValue) {
            return moment().format(cell.formatString || defDateFormat)
        }
        // 文本日期格式 直接返回
        if (cell.datatype === '3') {
            return cell.value;
        }
        if (!cell.value) return '';
        return valueToDate(cell.value, cell.formatString || defDateFormat)
    },
    integer: (cell, fakeValue) => {
        // 当cube不配置此参数时, 输入0 统一显示为''
        if (!showNulls) {
            if (Number(cell.value) === 0) {
                cell.value = ''
                return cell.value
            }
        }
        if (checkIsNum(cell.value)) {
            return parseInt(cell.value);
        }
        let format = cell.formatString || '##,###';
        let v = cell.value;
        if (fakeValue && cell.datatype != '3') {
            v = 0;
        }
        return handleFormat(v, format)
    },
})
export const formatValueMap = (showNulls) => {
    const formatObj = formatFn(showNulls)
    return {
        // 文本格式化 需求变更 暂时不需要此功能
        // text: (cell, fakeValue) => {
        //     const type = matchTypeByFormat(cell.formatString)
        //     if(!type) return cell.value;
        //     cell.cellType = cellType[type];
        //     if (formatFn[cell.cellType]) {
        //         return formatFn[cell.cellType](cell, fakeValue)
        //     }
        //     return cell.value
        // },
        percentage: formatObj.percentage,
        number: formatObj.number,
        date: formatObj.date,
        integer: formatObj.integer,
    }
}



// 保存时的格式
export const textFormat = {
    '1': ['##,###.00'],
    '2': ['##,###.00'],
    '5': ['YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY年MM月DD日'],
    '6': ['##,###'],
}
// 根据输入格式内容 推测出格式是否正确
const textReg = {
    '1': [/^##,###.\d+$/],
    '2': [/^##,###.\d+$/], // 校验是无 %号 后续格式化是加上
    '5': [/^YYYY(\-)MM\1DD$/i, /^YYYY(\/)MM\1DD$/i, /^YYYY年(\-)MM月\1DD日$/i],
    '6': [/^##,###\d+$/]
}
// 校验内容格式
export const textValueReg = {
    '1': [/^(\-|\+|\.)?\d+(\.\d+)?$/],
    '2': [/^(\-|\+|\.)?\d+(\.\d+)?$/],
    // 文本格式化 需求变更 暂时不需要此功能
    // '5': [/^\d{4}(\-)\d{1,2}\1\d{1,2}$/, /^\d{4}(\/)\d{1,2}\1\d{1,2}$/, /^\d{4}年-\d{1,2}月-\d{1,2}日$/],
    '6': [/^(0|[1-9][0-9]*|-[1-9][0-9]*)$/],
}
// 根据格式 匹配 类型
export const matchTypeByFormat = (format) => {
    if (!format) return false;
    const keys = Object.keys(textReg)
    for (let i = 0; i < keys.length; i++) {
        const regs = textReg[keys[i]];
        for (let j = 0; j < regs.length; j++) {
            const reg = new RegExp(regs[j]);
            if (reg.test(format)) {
                return keys[i];
            }
        }
    }
    return false
}
// 校验设置时输入的格式是否正确
export const caclTextCellType = (format) => {
    const typeKeys = Object.keys(textReg);
    let type = false;
    for (let i = 0; i < typeKeys.length; i++) {
        const key = typeKeys[i];
        const curRegs = textReg[key];
        for (let j = 0; j < curRegs.length; j++) {
            const reg = new RegExp(curRegs[j]);
            if (reg.test(format)) {
                type = key;
                break;
            }
        }
    }
    return type;
}
// 校验设置时文本格式是否正确
export const caclTextCellValue = (value, regKey) => {
    let type = false;
    if (!regKey) return type
    const regs = textValueReg[regKey];
    for (let i = 0; i < regs.length; i++) {
        const reg = new RegExp(regs[i]);
        if (reg.test(value)) {
            type = regKey;
        }
        return type;
    }
    return type;
}

export const changeTextCellType = (cell, format) => {
    if (cell.datatype != '3') return cell;
    let regKey = caclTextCellType(format || cell.formatString);
    regKey = caclTextCellValue(cell.value, regKey)
    if (regKey) {
        cell.cellType = cellType[regKey];
    }
    return cell;
}

