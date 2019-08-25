import React from 'react';

import { storiesOf } from '@storybook/react';

import Tree from '../src/components/tree';


const data = [{
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


function loadData(){
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
function onOpen(item){
    console.log(item, 'onOpen')
}


storiesOf('Tree', module)
    .add('Tree', () => <Tree data={data}
        onOpen={onOpen}
        loadData={loadData}
        width={200}
        height={300}
        nodeHeight={30} 
        checkable={true} />)

