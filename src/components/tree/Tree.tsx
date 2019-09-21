import * as React from 'react'
import HandleTree from './HandleTree'
import { TreeProps, NodeItem } from './interface'
import Node from './Node'
import './style/tree.scss'

interface TreeState<T> {
    data: Array<NodeItem>;
    dragYByNodeHeight: number;
}

export default class Tree<T> extends React.Component<TreeProps<T>, TreeState<T>> {
    constructor(props: TreeProps<T>) {
        super(props)
        this.state = {
            data: [],
            dragYByNodeHeight: props.nodeHeight / 3,
        }
    }
    static defaultProps = {
        nodeHeight: 30,
        linkage: true,
        draggable: false,
    }
    handleTree: any
    treeRef: any
    treeMiddleRef: any
    dragEnterNodeRect: any
    startEnterKey: string
    dragEnterNode: any
    dragLineNode: any
    componentDidMount() {
        this.handleTree = new HandleTree({
            data: this.props.data,
            nodeHeight: this.props.nodeHeight,
        })
        this.setState({
            data: this.handleTree.getViewData()
        })
    }
    componentDidUpdate() {
        // this.onSearchKeys()
    }
    onDragStart = (e) => {
        // e.dataTransfer.dropEffect = "move"
        console.log('onDragStart')
        e.stopPropagation()
    }
    onDragEnter = (e) => {
        e.preventDefault()
        if (this.dragLineNode) {
            this.dragLineNode.style.border = 'none'
        }
        const dataMapKey = e.target.getAttribute('data-map-key')
        if (dataMapKey) {
            if (!this.startEnterKey || this.startEnterKey != dataMapKey) {
                this.dragEnterNodeRect = e.target.getBoundingClientRect()
                this.dragEnterNode = e.target
                this.dragLineNode = e.target.firstChild
                this.startEnterKey = dataMapKey
            }
        }
    }
    onDragOver = (e) => {
        e.preventDefault()
        if (this.dragLineNode) {
            const {
                nodeHeight
            } = this.props
            const dy = this.state.dragYByNodeHeight
            this.dragLineNode.style.border = 'none'
            if (e.pageY >= this.dragEnterNodeRect.top && e.pageY <= this.dragEnterNodeRect.top + dy) {
                // this.dragLineNode.style.borderTop = '1px solid green'
                this.dragLineNode.style.top = '2px'
                this.dragLineNode.style.borderTop = '1px solid red'
            } else if (e.pageY > this.dragEnterNodeRect.top + dy && e.pageY < this.dragEnterNodeRect.bottom - dy) {
                // this.dragLineNode.style.border = '1px solid red'
                this.dragLineNode.style.top = '2px'
                this.dragLineNode.style.height = `${nodeHeight - 5}px`
                this.dragLineNode.style.border = '1px solid #1890ff'
            } else if (e.pageY > this.dragEnterNodeRect.bottom - dy && e.pageY <= this.dragEnterNodeRect.bottom) {
                // this.dragLineNode.style.borderBottom = '1px solid red'
                this.dragLineNode.style.top = `${nodeHeight - 4}px`
                this.dragLineNode.style.borderTop = '1px solid #000'
            }
        }
    }
    onDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const dataMapKey = e.target.getAttribute('data-map-key')
        // console.log(e.target,dataMapKey,this.startEnterKey,'onDragLeave')
        this.dragLineNode.style.border = 'none'
        return false
    }
    onDragEnd = (e) => {
        console.log('onDragEnd')
        this.dragLineNode.style.border = 'none'
        this.dragLineNode.style.height = 'none'
    }
    onSearchKeys = (text: string) => {
        const {
            nodeHeight,
        } = this.props
        const res = this.handleTree.search(text)
        if (res && res.item) {
            const index = this.handleTree.getViewData().findIndex((item: NodeItem) => (item.id).toString() == (res.item.id).toString())
            this.treeRef.scrollTo(0, nodeHeight * index);
        }
    }
    onOpen = (item: NodeItem) => {
        const {
            loadData,
            checkable,
            linkage,
        } = this.props

        if (!item.requested) {
            if (loadData && typeof loadData === 'function') {
                loadData(item).then(child => {
                    this.handleTree.insertChild(item, child)
                    this.setState({
                        data: this.handleTree.getViewData()
                    })
                })
            }
        } else {
            this.handleTree.open(item, checkable ? 'check' : null, linkage)
            this.setState({
                data: this.handleTree.getViewData()
            })
        }
    }
    onClose = (item: NodeItem) => {
        this.handleTree.close(item)
        this.setState({
            data: this.handleTree.getViewData()
        })
    }
    setTreeRef = (node: any) => {
        if (!this.treeRef) {
            this.treeRef = node
            this.setState({})
        }
    }
    onScroll = () => {
        this.setState({})
    }
    onCheckLinkage = (item: NodeItem) => {
        this.handleTree.onCheckLinkage(item)
        this.setState({})
    }
    onChangeRadio = (item: NodeItem, status: boolean) => {
        this.handleTree.onChangeRadio(item, status)
        this.setState({})
    }
    renderChild = () => {
        if (!this.treeRef) return null
        const {
            data
        } = this.state
        const {
            nodeHeight = 30,
            checkable,
            linkage,
            onMouseEnter,
            onMouseLeave,
            renderMouseEnter,
            radio,
            renderCheckable,
            renderRadio,
            draggable,
        } = this.props

        // 计算开始和结束数据的索引
        const height = this.treeRef.offsetHeight
        const startIndex = Math.floor(this.treeRef.scrollTop / nodeHeight)
        let viewDataLen = Math.ceil(height / nodeHeight) + 1
        let end = false
        if (startIndex + viewDataLen >= data.length) {
            viewDataLen -= 1
            end = true
        }
        const newData = data.slice(startIndex, startIndex + viewDataLen)
        const sumHeight = nodeHeight * data.length
        const topHeight = startIndex * nodeHeight
        const middleHeight = height + (end ? 0 : nodeHeight)
        const bottomHeight = sumHeight - middleHeight - topHeight

        return [
            <div key="top" style={{ height: `${topHeight}px` }}></div>,
            <div ref={r => this.treeMiddleRef = r} key="middle" style={{ height: `${middleHeight}px`, overflow: 'hidden' }}>
                {
                    newData.map((item: NodeItem) => <Node
                        key={item.id}
                        item={item}
                        onOpen={this.onOpen}
                        onClose={this.onClose}
                        nodeHeight={nodeHeight}
                        checkable={checkable}
                        renderCheckable={renderCheckable}
                        radio={radio}
                        renderRadio={renderRadio}
                        linkage={linkage}
                        onCheckLinkage={this.onCheckLinkage}
                        onChangeRadio={this.onChangeRadio}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                        renderMouseEnter={renderMouseEnter}
                        handleTree={this.handleTree}
                        draggable={draggable}
                        onDragStart={this.onDragStart}
                        onDragEnter={this.onDragEnter}
                        onDragOver={this.onDragOver}
                        onDragLeave={this.onDragLeave}
                        onDragEnd={this.onDragEnd}
                    />)
                }
            </div>,
            <div key="bottom" style={{ height: `${bottomHeight}px` }}></div>
        ]
    }
    render() {
        const {
            width,
            height,
        } = this.props

        return <div className="r-h-tree"
            style={{
                width: width ? `${width}px` : 'auto',
                height: height ? `${height}px` : 'auto',
                overflow: 'auto',
            }}
            ref={this.setTreeRef}
            onScroll={this.onScroll}>
            {this.renderChild()}
        </div>
    }
}