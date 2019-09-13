import * as React from 'react'
import Checkbox from '../checkbox'
import Radio from '../radio'
import { NodeProps } from './interface'

interface ArrowStyle {
    [propName: string]: any
}
interface NodeState {
    enter: boolean,
}
export default class Node extends React.Component<NodeProps, NodeState>  {
    constructor(props: NodeProps) {
        super(props)
        this.state = {
            enter: false
        }
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
        if (item.hasLeaf) {
            if (!item.open) {
                return <span style={style} onClick={this.onOpen} >+</span>
            }
            return <span style={style} onClick={this.onClose}>-</span>
        }
        return <span style={style} ></span>
    }
    onChangeCheckbox = (status: boolean) => {
        const {
            item,
            linkage,
            onCheckLinkage,
        } = this.props
        item.checked = status ? 1 : 0
        // 联动
        if (linkage) {
            onCheckLinkage(item)
            // 不联动
        } else {
            this.setState({})
        }
    }
    onChangeRadio = (status: boolean) => {
        const {
            item,
            onChangeRadio,
        } = this.props
        onChangeRadio && onChangeRadio(item, status)
    }
    renderCheckbox = () => {
        const {
            checkable,
            item,
            radio,
            renderCheckable,
            renderRadio,
        } = this.props
        if (checkable) {
            if (renderCheckable) {
                const renderItem = renderCheckable(item)
                if (typeof renderItem === 'boolean') {
                    if (!renderItem) return null
                    // 返回 react Node
                } else if (renderItem != undefined) {
                    return <span className="r-h-check-custom">{renderItem}</span>
                }
            }
            return <Checkbox
                checked={item.checked === 1}
                halfSelected={item.checked === 2}
                onChange={this.onChangeCheckbox} />
        } else if (radio) {
            if (renderRadio) {
                const renderItem = renderRadio(item)
                if (typeof renderItem === 'boolean') {
                    if (!renderItem) return null
                    // 返回 react Node
                } else if (renderItem != undefined) {
                    return <span className="r-h-check-custom">{renderItem}</span>
                }
            }
            return <Radio
                checked={item.checked === 1}
                onChange={this.onChangeRadio} />
        }
    }
    onMouseEnter = () => {
        const {
            onMouseEnter,
            item,
        } = this.props
        onMouseEnter && onMouseEnter(item)
        this.setState({
            enter: true
        })
    }
    onMouseLeave = () => {
        const {
            onMouseLeave,
            item
        } = this.props
        onMouseLeave && onMouseLeave(item)
        this.setState({
            enter: false
        })
    }
    renderMouseEnter = () => {
        const {
            item,
            renderMouseEnter,
        } = this.props
        if (this.state.enter && renderMouseEnter) {
            return <span>
                {renderMouseEnter(item)}
            </span>
        }
        return null
    }
    render() {
        const {
            item,
            nodeHeight,
        } = this.props

        return <div
            id={item.id}
            className="virtual-tree-node"
            style={{ height: `${nodeHeight}px` }}
            onMouseEnter={this.onMouseEnter}
            onMouseLeave={this.onMouseLeave}>
            {this.renderArrow()}
            {this.renderCheckbox()}
            <span>{item.name}</span>
            {this.renderMouseEnter()}
        </div>
    }
}