import * as React from 'react';
import { NodeItem } from './interface'

interface NodeProps {
    item: NodeItem
    onOpen?: (item: NodeItem) => void,
    onClose?: (item: NodeItem) => void,
    nodeHeight?: number,
}

interface ArrowStyle { 
    [propName: string]: any
} 
export default class Node extends React.Component<NodeProps>  {
    constructor(props: NodeProps) {
        super(props)
    }
    onOpen = () => {
        const {
            item,
            onOpen,
        } = this.props
        onOpen(item)
    }
    onClose = () => {
        const {
            item,
            onClose,
        } = this.props
        onClose(item)
    }
    renderArrow = () => {
        const {
            item
        } = this.props
        let style: ArrowStyle = {
            marginLeft: `${item.level * 10}px`,
            cursor: 'pointer',
            display: 'inline-block',
            width: '12px',
            textAlign: 'center',
        }
        if (item.isLeaf) {
            if (!item.open) {
                return <span style={style} onClick={this.onOpen} >+</span>
            }
            return <span style={style} onClick={this.onClose}>-</span>
        }
        return <span style={style} ></span>
    }
    render() {
        const {
            item,
            nodeHeight,
        } = this.props

        return <div className="virtual-tree-node" style={{height: `${nodeHeight}px`}}>
            {this.renderArrow()}
            <span >{item.name}</span>
        </div>
    }
}