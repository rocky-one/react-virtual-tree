import * as React from 'react'
import { initLeftData, initHeaderData } from './handleWorkbookData/initData'
import Table from './Table'

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

export default class TableDemo extends React.Component {
    componentDidMount(){
        this.initTable()
    }
    initTable = () => {
        const {
            width,
            height,
            formCellData,
        } = this.props;
        const leftAllData = initLeftData(formCellData.rowCells);
        const headerAllData = initHeaderData(formCellData.colCells);
        const tableAllData = formCellData.table ? formCellData.table.rows || [] : [];
        this.leftAllData = leftAllData;
        this.headerAllData = headerAllData;
        this.tableInstance = new Table({
            ele: document.getElementById(`tableDemo`),
            width,
            height,
            headerData: headerAllData,
            leftData: leftAllData,
            tableData: tableAllData,
            rowOpenLevel: Infinity,
            colOpenLevel: Infinity,
            fakeValue: this.props.patternStatus === 2,

            handleLeftOpen: (cell) => {

            },
            handleHeaderOpen: (cell) => {

            },
            // 右键
            contextmenu: (cell, x, y) => {
            },
            // handleMouseDown: (cell) => {
            //     if (!cell.updated || cell.cellReadOnly) return false
            //     return true
            // },
            handleClick: (cell) => {
                if (!cell.updated || cell.cellReadOnly) return false
                if (cell.datatype === '5') {
                    return false
                }
                if (cell.datatype === '2') {
                    // this.setState({
                    //     showTableDropDown: true,
                    //     tdCell: cell,
                    // })
                    // return false
                }
                return true
            },
            // 是否响应默认双击 cell类型为下拉 日期 只读 时不响应默认双击行为，返回 false
            handleDoubleClick: (cell) => {
                if (!cell.updated || this.props.patternStatus === 2) return false
                if (cell.datatype === '5') { // date
                    this.sign = true
                    this.setState({
                        showDatePicker: true,
                        tdCell: cell,
                        positionStyle: this.caclPositionStyle()
                    })
                    return false
                }
                if (cell.datatype === '4') { // dropDown
                    return false
                }
                return true
            },
            responseBodyClick: (cell) => {
                if (!cell.updated || this.props.patternStatus === 2 || cell.cellReadOnly) {
                    return false
                }
                return true
            },
            // 响应表格数据区域mouseDown
            responseBodyMouseDown: (cell) => {
                if (!cell.updated || cell.datatype === '5' || cell.datatype === '4' || cell.cellReadOnly || this.props.patternStatus === 2) return false
                return true
            },
            // 单元格响应键盘
            // 废弃
            // responseHotkey: (cell, keyCode) => {
            //     if (!cell || !cell.updated || this.props.patternStatus === 2 || keyCode === 17) return false
            //     if (cell.datatype === '5' || cell.datatype === '4') {
            //         if(keyCode === 8 || keyCode === 46){
            //             return true
            //         }
            //         return false
            //     }
            //     return true
            // },
            // 键盘事件
            keyboardEvent: (cell, keyCode) => {
                if (this.props.patternStatus === 2 || keyCode === 17) return false
                if (keyCode === 46) { //批量删除
                    const area = this.tableInstance.getSelectedRegion()
                    area.forEach(cell => {
                        if (cell.updated && !cell.cellReadOnly) {
                            this.tableInstance.setValue('', cell.newRowIndex, cell.newColIndex)
                        }
                    })
                    this.tableInstance.repaintRight()
                    return false
                }
                if (!cell || !cell.updated) return false
                if (cell && (cell.datatype === '4' || cell.datatype === '5')) {
                    if (keyCode === 8 || keyCode === 46) {
                        this.tableInstance.setValue('', cell.newRowIndex, cell.newColIndex)
                    }
                    return false
                }
                return true
            },
            // 快捷键
            hotKey: {
                ctrlC: (e) => {
                    this.handleCopy()
                },
                ctrlV: (event) => {
                    this.handlePaste()
                }
            },
            verticalScrollCb: (scrollTop) => {
            },
            horizontalScrollCb: (scrollLeft) => {
            },
            paintHeaderCellCb: (cell) => {
                cell.backgroundColor = '#F8F8F8'
            },
            paintLeftCellCb: (cell) => {
                cell.backgroundColor = '#F8F8F8'
            },
            // 绘制单元格时的回调 此时有机会修改cell属性
            paintTableCellCb: (cell) => {

                if (!cell.hasOwnProperty('value')) {
                    cell.value = ''
                }

                let isNum = false
                // 对齐方式 0,1,2,5,6,7,8
                const dt = cell.datatype
                if (dt === '0' || dt === '1' || dt === '2' || dt === '6' || dt === '7' || dt === '8') {
                    isNum = true
                }
                if (!cell.align) {
                    if (isNum || dt === '5') {
                        cell.align = 'right'
                    }
                }
                cell.cellType = cellType[dt]
                // 如果编辑过显示编辑过的颜色 后续的验证颜色不再执行
                if (cell.isEdit) return cell
                // 颜色提示优先级 校验规则 > 设置 > 只读 > 规则覆盖 > 父项只读
                // 校验规则
                // const validateRules = getVerifyResult(cell.fullpath, this.props.formCellData);
                // if (validateRules && validateRules.backgroundColor) {
                //     cell.validateRules = validateRules;
                //     cell.backgroundColor = validateRules.backgroundColor;
                // } else 
                if (cell.color) {
                    cell.backgroundColor = cell.color;
                } else if (cell.cellReadOnly) {
                    cell.backgroundColor = '#CFE8FB';
                } else if (!cell.updated) {
                    cell.backgroundColor = '#CFE8FB';
                }
                // else if (cell.ruleCovered) {
                //     cell.backgroundColor = '#FFF568';
                // }
                return cell;
            },
            // 自定义绘制
            paintTableCellRender: (cell, context, positionInfo) => {
                if (cell.hasRemark) {
                    context.beginPath()
                    context.fillStyle = '#ef6c00'
                    context.fillRect(
                        positionInfo.x + 2,
                        positionInfo.y + positionInfo.height - 5,
                        4,
                        4)
                    context.fill()
                }
                if (cell.reserved) {
                    context.beginPath()
                    context.fillStyle = '#689F38'
                    context.fillRect(
                        positionInfo.x + positionInfo.width - 6,
                        positionInfo.y + positionInfo.height - 5,
                        4,
                        4)
                    context.fill()
                }
            },
            // 鼠标滑过回调
            handleMouseMove: (cell) => {
                // console.log(cell)
            },
            // 数据区域 滑过时是否显示toolTip 返回一个字符串 否则返回false
            // toolTipRender: (cell) => {
            //     let html = '';
            //     if (cell.formatValue != '' && cell.formatValue != 0) {
            //         html += `<p style="margin:0;padding: 3px 10px;text-algin:left;font-size: 12px;">${cell.formatValue}</p>`;
            //     }
            //     // 校验规则
            //     if (cell.validateRules) {
            //         const res = cell.validateRules.message;
            //         if (res && res.length > 0) {
            //             html += `<p style="margin:0;padding: 3px 10px;text-algin:left;font-size: 12px;">校验提示: </p>`;
            //         }
            //         res.forEach(msa => {
            //             if (msa) {
            //                 html += `<p style="margin:0;padding: 3px 10px;text-algin:left;font-size: 12px;">${msa}</p>`
            //             }
            //         })
            //     }
            //     if (html === '') {
            //         return false
            //     }
            //     return html;
            // },
            // // 左侧toolTip
            // leftToolTipRender: (cell) => {
            //     let html = `<p style="margin:0;padding: 3px 10px;text-align:center;font-size: 12px;">${cell.description || cell.value}</p>`
            //     return html;
            // },
            // // 头部toolTip
            // headerToolTipRender: (cell) => {
            //     let html = `<p style="margin:0;padding: 3px 10px;text-align:center;font-size: 12px;">${cell.description || cell.value}</p>`
            //     return html;
            // },
            // 下拉
            handleClickDropDown: (cell) => {
            },
            blurCb: (cell) => {
            },
            handleRightTdMouseUp: () => {

            },
            handleHeaderThClick: (cell) => {
               
            },
            handleLeftTdClick: (cell) => {
               
            },
            setValueBefore: (cell) => {
                
            },
            // 设置value之后执行 一般用于校验输入值是否合法
            setValueAfter: (cell, beforeVal) => {

            }
        })
        
    }
    render(){
        return (
            <div id="tableDemo" style={{border:'1px solid #ccc'}}>

            </div>
        )
    }
    
}
