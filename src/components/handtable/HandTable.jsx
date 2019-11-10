import * as React from 'react'
import Handsontable from "../../../node_modules/handsontable/dist/handsontable"
import "../../../node_modules/handsontable/dist/handsontable.css"

function createArrow() {

}
class HandTable extends React.Component {
    constructor() {
        super()
    }
    componentDidMount() {

        let hot
        let sourceDataObject = [
            {
                category: 'A',
                artist: '1',
                title: '2',
                label: '3',
                __children: [
                    {
                        category: 'A-1',
                        title: '1-1',
                        artist: '2-2',
                        label: '3-3',
                        __children: [
                            {
                                category: 'A-1-1',
                                title: '1-1-1',
                                artist: '2-2-2',
                                label: '3-3-3',
                            }
                        ]
                    }
                ]
            }]
        function customRenderer(hotInstance, td, row, column, prop, value, cellProperties) {
            Handsontable.renderers.TextRenderer.apply(this, arguments);
            td.innerHTML = '<span>+ 22</span>'
            return td
        }

        // Register an alias
        // Handsontable.renderers.registerRenderer('my.custom', customRenderer);

        Handsontable.hooks.add('beforeOnCellMouseDown', function (e, coords, td) {
            return false
        });
        Handsontable.hooks.add('afterOnCellMouseUp', function (e, coords, td) {
            // console.log(e.target)
            hot.selectRows(coords.row);
        });
        // freezeColumn(column)
        hot = new Handsontable(document.getElementById('handsTable'), {
            data: sourceDataObject,
            rowHeaders: true,
            colHeaders: false,//true,//['成员1', '成员2', '成员3', '成员4', '成员5'],
            nestedRows: true,
            contextMenu: true,
            colWidths: [150, 150, 150, 150, 150, 150],
            margeCells: true,
            fixedColumnsLeft: 2,
            fixedRowsTop: 1,
            manualColumnFreeze: true,
            // mergeCells: [
            //     { row: 0, col: 0, rowspan: 1, colspan: 1},
            //     { row: 0, col: 1, rowspan: 2, colspan: 1},
            //     { row: 1, col: 1, rowspan: 2, colspan: 1 },
            //     { row: 2, col: 2, rowspan: 3, colspan: 1}
            // ],
            columns: [
                {
                    data: 'category',
                    renderer: customRenderer,
                },
                {
                    data: 'title',
                    renderer: customRenderer,
                }, {
                    data: 'artist',
                    renderer: customRenderer,
                }, {
                    data: 'label',
                    renderer: customRenderer,
                }
            ],
            // afterOnCellMouseUp: function (e,cellCoords,td) {
            //     // hot.deselectCell()
            //     //hot.selectRows(cellCoords.row);
            //     //hot.selectRows(1, 4);
            // },
            beforeOnCellMouseDown: function(){
                
            },
            outsideClickDeselects: false,

        });
        hot.updateSettings({
            cells: function (row, col) {
                var cellProperties = {};
                // hot.getData()[row][col]
                // editor
                // readOnly
                if (col === 0) {
                    cellProperties.readOnly = true;
                }

                return cellProperties;
            }
        });

        setTimeout(()=>{
            // hot.createRow(1)
            hot.alter('insert_row', 3);
            // sourceDataObject.push({category: 'AA',
            // artist: '1',
            // title: '2',
            // label: '3',});
            // hot.handsontable("render");
        },3000)
    }
    render() {
        return <div id="handsTable"></div>
    }
}

export default HandTable;