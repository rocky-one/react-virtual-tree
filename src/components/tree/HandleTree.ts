import {
    HandleTreeInterface, HandleTreeOption, MapData, NodeItem,
    SearchReturn
} from './interface'
import {
    bfTree,
    dfsTree,
    getParentCheckStatus,
    removeViewDataNode,
    removeMapDataNode,
    setCheckStatusByDel,
    getItemParentInMapData,
} from './utils'

export default class HandleTree implements HandleTreeInterface {
    constructor(option: HandleTreeOption) {
        this._attrs = {
            nodeHeight: option.nodeHeight
        }
        this.mapDatas(option.data)
        this.initViewData()
        console.log(this.mapData, 'mapData')
        console.log(this.viewData, 'viewData')
    }
    private _attrs = {}
    private viewData: Array<NodeItem> = []
    public getViewData = () => this.viewData
    private mapData: MapData = {}
    public getMapData = () => this.mapData
    // 获取要显示的子节点 注意可能跨级显示
    // autoOpenLevel1 是否自动展开当前节点的第一层  
    public getShowChildData = (item: NodeItem, autoOpenLevel1: boolean = true) => {
        const mapData = this.mapData[item.level + 1][item.id]
        const child: Array<NodeItem> = []
        dfsTree(mapData, (c: NodeItem) => {
            if (item.level + 1 == c.level) {
                autoOpenLevel1 && child.push(c)
                if (!c.open) return false
            } else {
                child.push(c)
                if (!c.open) return false
            }
        })
        return child
    }

    // 拉平要显示的数据放到数组中
    private initViewData = () => {
        const dataMap = this.mapData['0']
        const data = Object.values(dataMap)
        this.viewData = data[0].map(item => item)
        for (let i = 0; i < this.viewData.length; i++) {
            const item = this.viewData[i]
            if (item.open && item.hasLeaf) {
                const child = this.getShowChildData(item)
                const len = child.length
                this.viewData.splice(i + 1, 0, ...child)
                i += len
            }
        }
    }
    // 组装成新的结构 根据层级 id为key
    private mapDatas = (data: []) => {
        const dat = this.mapData
        bfTree(data, (item: NodeItem) => {
            const parentId = item.parentId || 'root'
            const level = item.level
            if (!dat[level]) dat[level] = {}
            if (!dat[level][parentId]) dat[level][parentId] = []
            if (item.children) {
                item.hasLeaf = true
                item.requested = true
            }
            dat[`${level}`][parentId].push(item)
        })
        this.mapData = dat
    }
    private initChildData = (parentItem: NodeItem, child: Array<NodeItem> = []): Array<NodeItem> => {
        return child.map(item => ({
            ...item,
            level: parentItem.level + 1,
            parentId: parentItem.id,
        }))
    }
    private insertChildToViewData = (parentItem: NodeItem, child: Array<NodeItem> = [], index?: number): void => {
        index = index >= 0 ? index : this.viewData.findIndex(item => item.id === parentItem.id)
        const list: Array<NodeItem> = []
        dfsTree(child, (c: NodeItem) => {
            list.push(c)
            if (!c.open) return false
        })
        index > -1 && this.viewData.splice(index + 1, 0, ...list)
    }
    private insertChildToMapData = (parentItem: NodeItem, child: Array<NodeItem> = [], index?: number): void => {
        const hasChild = parentItem.children && parentItem.children.length>0
        bfTree([{
            ...parentItem,
            children: child
        }], (item: NodeItem) => {
            if (item.id === parentItem.id) return
            const parentId = item.parentId || 'root'
            const level = item.level
            if (!this.mapData[level]) this.mapData[level] = {}
            if (!this.mapData[level][parentId]) this.mapData[level][parentId] = []
            if (item.children) {
                item.hasLeaf = true
                item.requested = true
            }
            if (index >= 0 && item.level === parentItem.level + 1) {
                this.mapData[level][parentId].splice(index + 1, 0, item)
            } else {
                this.mapData[level][parentId].push(item)
            }
        })
        
        if (hasChild) {
            if (index >= 0) {
                parentItem.children.splice(index + 1, 0, ...child)
            } else {
                parentItem.children.push(...child)
            }
        }else{
            parentItem.children = child
        }
    }
    // 销毁
    public destory = (): void => {
        this.viewData = null
        this.mapData = null
    }
    // 插入子节点到 当前的节点下
    // 1 插入到viewData 2 插入到映射mapData
    public insertChild = (parentItem: NodeItem, child: Array<NodeItem> = [], mapDataindex?: number, viewDataindex?: number): void => {
        const oldOpen = parentItem.open
        parentItem.open = true
        parentItem.requested = true
        parentItem.hasLeaf = true
        const newChild = this.initChildData(parentItem, child)
        // parentItem.children = newChild
        this.insertChildToMapData(parentItem, newChild, mapDataindex)
        this.insertChildToViewData(parentItem, !oldOpen ? parentItem.children : newChild, viewDataindex)
        this.onCheckedChild(parentItem)
    }
    // 移除节点
    public removeNode = (item: NodeItem): void => {
        removeViewDataNode(item, this.viewData)
        removeMapDataNode(item, this.mapData)
        setCheckStatusByDel(item, this.mapData)
    }
    public open = (parentItem: NodeItem, checkType: string, linkage: boolean): void => {
        parentItem.open = true
        const showChild = this.getShowChildData(parentItem)
        const index = this.viewData.findIndex(item => item.id === parentItem.id)
        index > -1 && this.viewData.splice(index + 1, 0, ...showChild)
        if (checkType === 'check' && linkage) {
            this.onCheckedChild(parentItem)
        }
    }
    public close = (parentItem: NodeItem): void => {
        parentItem.open = false
        const closeChild = this.getShowChildData(parentItem)
        const index = this.viewData.findIndex(item => item.parentId === parentItem.id)
        index > -1 && this.viewData.splice(index, closeChild.length)

    }
    private setInsertChildAttrs = (parentItem: NodeItem = null, child: Array<NodeItem> = []) => {
        let parentId = null, level = 0
        if (parentItem) {
            parentId = parentItem.parentId
            level = parentItem.level + 1
        }
        return child.map(c => {
            c.parentId = parentId
            c.level = level
            return c
        })
    }
    // 获取同级
    private getSameLevelData = (item: NodeItem): Array<NodeItem> => {
        return this.mapData[item.level][item.parentId || 'root']
    }
    // 获取子集
    private getChildData = (item: NodeItem): Array<NodeItem> => {
        if (item.hasLeaf) {
            return this.mapData[item.level - 1][item.id]
        }
        return []
    }
    private onCheckedChild = (item: NodeItem) => {
        if (item.hasLeaf) {
            dfsTree(item.children, (n: NodeItem) => {
                n.checked = item.checked || 0
            })
        }
    }
    public onCheckLinkage = (item: NodeItem) => {
        let cur = item
        // 向上
        for (let i = item.level; i >= 0; i--) {
            let status = getParentCheckStatus(this.getSameLevelData(cur))
            // 同级是否都选中 如果是 则父级选中
            if (cur.parentId) {
                const keys = Object.keys(this.mapData[cur.level - 1])
                sign:
                for (let i = 0; i < keys.length; i++) {
                    const data = this.mapData[cur.level - 1][keys[i]]
                    for (let j = 0; j < data.length; j++) {
                        if (data[j].id === cur.parentId) {
                            data[j].checked = status
                            cur = data[j]
                            break sign
                        }
                    }
                }
            }
        }
        this.onCheckedChild(item)
    }
    // public onCheckUnLinkage = (item: NodeItem) => {
    //     if (item.checked === 1) {
    //         item.checked = 0
    //     } else if(item.checked === 0){
    //         item.checked = 1
    //     }
    //     return item
    // }
    public onChangeRadio = (item: NodeItem, status: boolean) => {
        const radioItem = this.viewData.find(n => n.checked === 1)
        if (radioItem) {
            radioItem.checked = 0
        }
        item.checked = status ? 1 : 0
    }
    public search = (text: string, index: number = 0): SearchReturn => {
        const list = this.viewData
        let item: NodeItem, searchIndex = 0
        for (let i = index; i < list.length; i++) {
            if (list[i].name.indexOf(text) != -1) {
                item = list[i]
                searchIndex = i
                break
            }
        }
        return {
            item: item,
            index: searchIndex,
        }
    }
    public getItemParentInMapData = (item: NodeItem): any => {

        return getItemParentInMapData(item, this.getMapData())
    }
    public getItemIndexInSiblings = (item: NodeItem, siblings: Array<NodeItem> = []): number => {
        for (let i = 0; i < siblings.length; i++) {
            if (siblings[i].id === item.id) {
                return i
            }
        }
        return siblings.length
    }
    public getItemById = (id: string, level: number): NodeItem => {
        let data = this.getMapData()[level]
        let dataKeys = Object.keys(data)
        let item: NodeItem
        breakSign:
        for (let i = 0; i < dataKeys.length; i++) {
            const d = data[dataKeys[i]] || []
            for (let j = 0; j < d.length; j++) {
                if (d[j].id === id) {
                    item = d[j]
                    break breakSign
                }
            }
        }
        return item
    }
}
