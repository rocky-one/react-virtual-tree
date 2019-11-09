import * as React from 'react'
import Handsontable from "../../../node_modules/handsontable/dist/handsontable"
import "../../../node_modules/handsontable/dist/handsontable.css"
class HandTable extends React.Component {
    constructor(){
        super()
    }
    componentDidMount() {

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
          td.innerHTML = '2'
          return td
      }

      // Register an alias
      // Handsontable.renderers.registerRenderer('my.custom', customRenderer);

      const handsontables = new Handsontable(document.getElementById('handsTable'), {
          data: sourceDataObject,
          rowHeaders: true,
          colHeaders: ['成员1', '成员2', '成员3', '成员4', '成员5'],
          nestedRows: true,
          contextMenu: true,
          colWidths: [150, 150, 150, 150, 150, 150],
          columns: [
              {
                  data: 'category',
                  renderer: customRenderer,
              },
              {   
                  data: 'title',
                  renderer: customRenderer,
              },{
                  data: 'artist',
                  renderer: customRenderer,
              },{
                  data: 'label',
                  renderer: customRenderer,
              }
          ],
          afterOnCellMouseUp:function(){
              
          }
      });

  }
  render() {
      return <div id="handsTable"></div>
  }
}

export default HandTable;