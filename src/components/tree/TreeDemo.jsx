import React from 'react';
import Tree from './Tree';

let data = [{
    name: '1',
    parentId: null,
    id: '1',
    open: true,
    children: [
        {
            parentId: '1',
            id: '1.1',
            name: '1-1',
            hasLeaf: true,
        },
        {
            parentId: '1',
            id: '1.2',
            name: '1-2',
            open: true,
            children: [
                {
                    name: '1-1-2',
                    id: '1.1.2',
                    parentId: '1.2',
                    hasLeaf: true,
                    children: [{
                        name: '1-1-2_1',
                        id: '1.1.2.1',
                        parentId: '1.1.2',
                    }],
                },
                {
                    name: '1-1-3',
                    id: '1.1.3',
                    parentId: '1.2'
                },
                {
                    name: '1-1-4',
                    id: '1.1.4',
                    parentId: '1.2'
                }
            ]
        }
    ]
},
{
    name: '2',
    parentId: null,
    id: '2',
    open: true,
    children: [
        {
            name: '2.2',
            id: '2.2',
            parentId: '2'
        }
    ]
}]
for (let i = 0; i < 1; i++) {
    data.push({
        name: (3 + i).toString(),
        parentId: null,
        id: (3 + i).toString(),
    })
}

function loadData() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([{
                name: '哈哈',
                id: '1.1.1',
                parentId: '1.1',
            }])
        }, 500)
    })
}

function onOpen(item) {
    console.log(item, 'onOpen')
}

function onMouseEnter(item) {
    //console.log(item, 'onMouseEnter')
}

function onMouseLeave(item) {
    //console.log(item, 'onMouseLeave')
}
let treeRef

export default class Node extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            searchKeys: []
        }
    }
    onSearch = () => {
        // const res = this.treeRef.handleTree.search(this.inputRef.value)
        this.treeRef.onSearchKeys(this.inputRef.value)
        // this.setState({
        //     searchKeys: [res.item.id]
        // })
    }
    onDelete(item) {
        this.treeRef.handleTree.removeNode(item)
        this.setState({})
    }
    render() {
        return <div style={{ marginLeft: '180px' }} >

            <div>
                <input ref={r => this.inputRef = r} />
                <button onClick={this.onSearch}>搜索</button>
            </div>
            <Tree
                ref={r => this.treeRef = r}
                data={data}
                onOpen={onOpen}
                loadData={loadData}
                width={200}
                height={300}
                nodeHeight={30}
                checkable={true}
                // radio={true}
                renderCheckable={(item) => {
                    if (item.id == 1) {
                        return false
                    }
                    if (item.id == 2) {
                        return <div style={{ color: 'red' }}>*</div>
                    }
                }}
                renderRadio={(item) => {
                    if (item.id == 1) {
                        return false
                    }
                }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                renderMouseEnter={(item) => {
                    return <span style={{ cursor: 'pointer', marginLeft: '6px' }} onClick={() => this.onDelete(item)}>删除</span>
                }}
                searchKeys={this.state.searchKeys}
                linkage={false}
                draggable={true} />
        </div>

    }
}


