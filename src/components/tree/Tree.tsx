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
    dragMapKey: string
    dragItemIndex: number
    dragEnterMapKey: string
    dragEnterNode: any
    dragLineNode: any
    dragMovePosition: string
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
        this.dragMapKey = e.target.getAttribute('data-map-key')
        this.dragItemIndex = Number(e.target.getAttribute('data-index'))
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
            if (!this.dragEnterMapKey || this.dragEnterMapKey != dataMapKey) {
                this.dragEnterNodeRect = e.target.getBoundingClientRect()
                this.dragEnterNode = e.target
                this.dragLineNode = e.target.firstChild
                this.dragEnterMapKey = dataMapKey
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
            this.dragLineNode.style.height = 0
            this.dragMovePosition = ''
            // 上中下三种情况
            if (e.pageY >= this.dragEnterNodeRect.top && e.pageY <= this.dragEnterNodeRect.top + dy) {
                this.dragLineNode.style.top = '2px'
                this.dragLineNode.style.borderTop = '1px dashed #1890ff'
                this.dragMovePosition = 'top'
            } else if (e.pageY > this.dragEnterNodeRect.top + dy && e.pageY < this.dragEnterNodeRect.bottom - dy) {
                this.dragLineNode.style.top = '2px'
                this.dragLineNode.style.height = `${nodeHeight - 5}px`
                this.dragLineNode.style.border = '1px dashed #1890ff'
                this.dragMovePosition = 'middle'
            } else if (e.pageY > this.dragEnterNodeRect.bottom - dy && e.pageY <= this.dragEnterNodeRect.bottom) {
                this.dragLineNode.style.top = `${nodeHeight - 4}px`
                this.dragLineNode.style.borderTop = '1px dashed #1890ff'
                this.dragMovePosition = 'bottom'
            }
        }
    }
    onDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.dragLineNode.style.border = 'none'
        return false
    }
    onDragEnd = (e) => {
        if (!this.dragEnterMapKey) return
        this.dragLineNode.style.border = 'none'
        this.dragLineNode.style.height = 0
        this.getParentItemByMapKey()
        this.dragMovePosition = ''
        this.setState({})
    }
    getParentItemByMapKey = () => {
        if (!this.dragEnterMapKey) return
        // 先删除原来数据
        let dragKeys = this.dragMapKey.split('-')
        let dragItem = this.handleTree.getItemById(dragKeys[2], dragKeys[0])
        let dragParent = this.handleTree.getItemById(dragKeys[1], Number(dragKeys[0]) - 1)
                // this.handleTree.getItemParentInMapData({
                //     id: dragKeys[2],
                //     parentId: dragKeys[1],
                //     level: Number(dragKeys[0])
                // })
        // if (dragItem.hasLeaf) {
        //     const levelData = this.handleTree.getMapData()[dragItem.level + 1]
        //     delete levelData[dragItem.id]
        // }
        // let dragSiblingsData
        // if (dragParent) {
        //     dragSiblingsData = this.handleTree.getMapData()[dragParent.level + 1][dragParent.id]
        // } else {
        //     dragSiblingsData = this.handleTree.getMapData()[0]['root']
        // }
        // let dragItemIndex = this.handleTree.getItemIndexInSiblings({
        //     id: dragKeys[2],
        //     parentId: dragKeys[1],
        //     level: Number(dragKeys[0])
        // }, dragSiblingsData)

        // let delData = dragSiblingsData.splice(dragItemIndex, 1)
        // let listChild = delData
        // if (dragParent) {
        //     listChild.push(...this.handleTree.getShowChildData(delData[0], false))
        // }
        // this.handleTree.getViewData().splice(this.dragItemIndex, listChild.length)

        this.handleTree.removeNode(dragItem)

        // 再插入到tree和list 注意子节点也要一起插入 [...this.handleTree.getItemById(dragKeys[2],dragKeys[0])]
        let keys = this.dragEnterMapKey.split('-')
        let parent
        if (this.dragMovePosition === 'middle') {
            parent = this.handleTree.getItemById(keys[2], keys[0])
        } else {
            parent = this.handleTree.getItemParentInMapData({
                id: keys[2],
                parentId: keys[1],
                level: Number(keys[0])
            })
        }
        let siblingsData //= parent ? parent.children : this.handleTree.getMapData()[0]['root']
        let mapDataIndex
        let viewDataindex
        if (parent) {
            const p = this.handleTree.getMapData()[parent.level + 1]
            if (!p) {
                this.handleTree.getMapData()[parent.level + 1] = {}
            }
            if (!this.handleTree.getMapData()[parent.level + 1][parent.id]) {
                this.handleTree.getMapData()[parent.level + 1][parent.id] = []
            }
            siblingsData = this.handleTree.getMapData()[parent.level + 1][parent.id]
        } else {
            siblingsData = this.handleTree.getMapData()[0]['root']
        }

        viewDataindex = this.handleTree.getViewData().findIndex(v => v.id === keys[2])
        if (this.dragMovePosition !== 'middle') {
            mapDataIndex = this.handleTree.getItemIndexInSiblings({
                id: keys[2],
                parentId: keys[1],
                level: Number(keys[0])
            }, siblingsData)

        } else {
            const viewData = this.handleTree.getViewData()
            mapDataIndex = siblingsData.length
            for(let i = viewDataindex+1; i<viewData.length;i++){
                if(viewData[i].level<=parent.level){
                    viewDataindex = i-1
                    break
                }
            }
        }
        if (this.dragMovePosition == 'top') {
            viewDataindex = viewDataindex > 0 ? viewDataindex -= 1 : viewDataindex
            mapDataIndex = mapDataIndex > 0 ? mapDataIndex -= 1 : mapDataIndex
        }
        this.handleTree.insertChild(parent, [dragItem], mapDataIndex, viewDataindex)
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
                    newData.map((item: NodeItem, i) => <Node
                        key={item.id}
                        index={startIndex + i}
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