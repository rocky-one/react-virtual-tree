import * as React from 'react'
import classNames from 'classnames'
import Checkbox from '../checkbox'
import Radio from '../radio'
import { NodeProps } from './interface'

interface ArrowStyle {
    [propName: string]: any
}
interface NodeState {
    enter: boolean;
    dragYByNodeHeight: number;
    dragLinePosition: string
}
export default class Node extends React.Component<NodeProps, NodeState>  {
    constructor(props: NodeProps) {
        super(props)
        this.state = {
            enter: false,
            dragYByNodeHeight: props.nodeHeight / 3,
            dragLinePosition: 'none',
        }
    }
    nodeRef: any
    dragEnterNodeRect: any
    startEnterKey: string
    dragEnterNode: any
    prePos: string = 'none'
    static defaultProps = {
        nodeClassName: ''
    }
    componentDidMount() {
        this.initDrag()
    }
    initDrag = () => {
        const {
            onDragStart,
            onDragEnter,
            onDragOver,
            onDragLeave,
            onDragEnd,
        } = this.props

        if (this.nodeRef) {
            if (onDragStart) this.nodeRef.ondragstart = onDragStart
            if (onDragEnter) this.nodeRef.ondragenter = onDragEnter
            if (onDragOver) this.nodeRef.ondragover = onDragOver
            if (onDragLeave) this.nodeRef.ondragleave = onDragLeave
            if (onDragEnd) this.nodeRef.ondragend = onDragEnd

            this.dragEnterNodeRect = this.nodeRef.getBoundingClientRect()

        }
    }
    onDragEnter = (e) => {
        const {
            onDragEnter,
        } = this.props
        e.preventDefault()
        this.dragEnterNodeRect = this.nodeRef.getBoundingClientRect()
        //if (this.dragEnterNode) {
        // this.dragEnterNode.style.border = 'none'
        //}
        // const dataMapKey = e.target.getAttribute('data-map-key')
        // if (dataMapKey) {
        //     if (!this.startEnterKey || this.startEnterKey != dataMapKey) {
        //         this.dragEnterNodeRect = e.target.getBoundingClientRect()
        //         // this.dragEnterNode = e.target
        //         this.startEnterKey = dataMapKey
        //     }
        // }
        // onDragEnter(e)
    }
    onDragOver = (e) => {
        const {
            onDragOver,
            nodeHeight,
        } = this.props
        //if (this.dragEnterNode) {
        const dy = this.state.dragYByNodeHeight
        this.dragEnterNode.style.border = 'none'
        this.dragEnterNode.style.height = 0
        if (e.pageY >= this.dragEnterNodeRect.top && e.pageY <= this.dragEnterNodeRect.top + dy) {
            //this.dragEnterNode.style.borderTop = '1px solid green'
            this.dragEnterNode.style.top = '2px'
            this.dragEnterNode.style.borderTop = '1px solid red'
            // this.state.dragLinePosition != 'top' && this.setState({
            //     dragLinePosition: 'top'
            // })
        } else if (e.pageY > this.dragEnterNodeRect.top + dy && e.pageY < this.dragEnterNodeRect.bottom - dy) {
            //this.dragEnterNode.style.border = '1px solid red'

            this.dragEnterNode.style.top = '2px'
            this.dragEnterNode.style.height = `${nodeHeight - 4}px`
            this.dragEnterNode.style.border = '1px solid #1890ff'
            // this.state.dragLinePosition != 'middle' && this.setState({
            //     dragLinePosition: 'middle'
            // })
        } else if (e.pageY > this.dragEnterNodeRect.bottom - dy && e.pageY <= this.dragEnterNodeRect.bottom) {
            //this.dragEnterNode.style.borderBottom = '1px solid red'
            this.dragEnterNode.style.top = `${nodeHeight - 2}px`
            this.dragEnterNode.style.borderTop = '1px solid #000'
            // this.setState({
            //     dragLinePosition: 'bottom'
            // })
        }
        //}
        // onDragOver(e)
    }
    onDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.dragEnterNode.style.border = 'none'
        // this.dragEnterNode.style.height = 0
        // this.setState({
        //     dragLinePosition: 'none'
        // })
    }
    onDragEnd = (e) => {
        this.dragEnterNode.style.border = 'none'
        this.dragEnterNode.style.height = 'none'
        console.log(this.dragEnterNode, 'onDragEnd')

        // this.setState({
        //     dragLinePosition: 'none'
        // })
    }
    renderDragEnterLine = () => {
        const {
            draggable,
            nodeHeight,
        } = this.props
        const {
            dragLinePosition
        } = this.state
        if (draggable) {
            // const styles = {
            //     top: 'none',
            //     bottom: 'none',
            //     height: '1px',
            //     border: 'none',
            //     borderTop: 'none',
            // }
            // if (dragLinePosition === 'top') {
            //     styles.top = '2px'
            //     styles.borderTop = '1px solid red'
            // } else if (dragLinePosition === 'middle') {
            //     styles.top = '2px'
            //     styles.height = `${nodeHeight - 2}px`
            //     styles.border = '1px solid #1890ff'
            // } else if (dragLinePosition === 'bottom') {
            //     styles.top = `${nodeHeight - 2}px`
            //     styles.borderTop = '1px solid #000'
            // }

            return <div ref={r => this.dragEnterNode = r} className="r-h-tree-enter-line"></div>
        }
        return null
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
        }
        if (item.hasLeaf) {
            if (!item.open) {
                return <span className="r-h-tree-node-arrow" style={style} onClick={this.onOpen} >+</span>
            }
            return <span className="r-h-tree-node-arrow" style={style} onClick={this.onClose}>-</span>
        }
        return <span className="r-h-tree-node-arrow" style={style} ></span>
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
            nodeClassName,
            draggable,
            index,
        } = this.props

        return <div
            data-map-key={`${item.level}-${item.parentId}-${item.id}`}
            data-index={index}
            ref={r => this.nodeRef = r}
            className={classNames("r-h-tree-node", nodeClassName)}
            style={{ height: `${nodeHeight}px` }}
            onMouseEnter={this.onMouseEnter}
            onMouseLeave={this.onMouseLeave}
            draggable={draggable}>
            {this.renderDragEnterLine()}
            {this.renderArrow()}
            {this.renderCheckbox()}
            <span title={item.name} className="r-h-tree-node-text">{item.name}</span>
            {this.renderMouseEnter()}
        </div>
    }
}