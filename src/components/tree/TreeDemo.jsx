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
                    parentId: '1.2'
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
for (let i = 0; i < 100; i++) {
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
        }, 1000)
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
function onDelete(item) {
    treeRef.handleTree.removeNode(item)
    console.log(item, treeRef, 'onDelete')
}
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
    render() {
        return [
            <div>
                <input ref={r => this.inputRef = r} />
                <button onClick={this.onSearch}>搜索</button>
            </div>,
            <Tree
                ref={r => this.treeRef = r}
                data={data}
                onOpen={onOpen}
                loadData={loadData}
                width={200}
                height={300}
                nodeHeight={30}
                // checkable={true}
                radio={true}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                renderMouseEnter={(item) => {
                    return <span style={{ cursor: 'pointer', marginLeft: '6px' }} onClick={() => onDelete(item)}>删除</span>
                }}
                searchKeys={this.state.searchKeys} 
                linkage={false} />]
    }
}


