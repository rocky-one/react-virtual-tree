import * as React from 'react'
import { NodeItem } from './interface'
import Tree from './Tree'

interface TreeProps<T> {
    data: T[],
    onOpen?: (item: NodeItem) => void,
    onClose?: (item: NodeItem) => void,
    loadData?: (item: NodeItem) => Promise<void>,
    width?: number,
    height?: number,
    nodeHeight?: number,
}
interface TreeState<T> {
    data: Array<NodeItem>
}

export default class Treeo<T> extends React.Component<TreeProps<T>, TreeState<T>> {
    constructor(props: TreeProps<T>) {
        super(props)
        this.state = {
            data: []
        }
    }
    handleTree: any
    treeRef: any
    componentDidMount() {
        
    }
    setTreeRef = (node: any) => {
        if(!this.treeRef){
            this.treeRef = node
            this.setState({})
        }
    }
    render() {
        const {
            data
        } = this.state

        const {
            width,
            height,
            nodeHeight = 30,
        } = this.props

        return <div className="list"
            style={{
                width: width ? `${width}px` : 'auto',
                height: height ? `${height}px` : 'auto',
                overflow: 'auto',
            }}
            ref={this.setTreeRef} >
            {this.treeRef && <Tree 
            {...this.props} 
            treeRef={this.treeRef}
            />}
        </div>
    }
}