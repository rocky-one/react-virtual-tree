import { HandleTreeInterface, MapData, NodeItem, SearchReturn } from './interface'
import {
    bfTree,
    dfsTree,
    getParentCheckStatus,
    removeViewDataNode,
    removeMapDataNode,
    setCheckStatusByDel,
} from './utils'

export default class HandleTree implements HandleTreeInterface {
    constructor(option: { data: any; }) {
        this.mapDatas(option.data)
        this.initViewData()
        console.log(this.mapData, 'mapData')
        console.log(this.viewData, 'viewData')
    }
    private viewData: Array<NodeItem> = []
    public getViewData = () => this.viewData
    private mapData: MapData = {}

    // 获取要显示的子节点 注意可能跨级显示
    private getShowChildData = (item: NodeItem) => {
        const mapData = this.mapData[item.level + 1][item.id]
        const child: Array<NodeItem> = []
        dfsTree(mapData, (c: NodeItem) => {
            if (item.level + 1 == c.level) {
                child.push(c)
                if (!c.open) return false
            } else {
                child.push(c)
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
            level: parentItem.level + 1
        }))
    }
    private insertChildToViewData = (parentItem: NodeItem, child: Array<NodeItem> = []): void => {
        const index = this.viewData.findIndex(item => item.id === parentItem.id)
        index > -1 && this.viewData.splice(index + 1, 0, ...child)
    }
    private insertChildToMapData = (parentItem: NodeItem, child: Array<NodeItem> = []): void => {
        const childMap = this.mapData[parentItem.level + 1]
        if (!childMap) {
            this.mapData[parentItem.level + 1] = {}
        }
        this.mapData[parentItem.level + 1][parentItem.id] = child
    }
    // 销毁
    public destory = (): void => {
        this.viewData = null
        this.mapData = null
    }
    // 插入子节点到 当前的节点下
    // 1 插入到viewData 2 插入到映射mapData
    public insertChild = (parentItem: NodeItem, child: Array<NodeItem> = []): void => {
        parentItem.open = true
        parentItem.requested = true
        parentItem.hasLeaf = true
        const newChild = this.initChildData(parentItem, child)
        parentItem.children = newChild
        this.insertChildToViewData(parentItem, newChild)
        this.insertChildToMapData(parentItem, newChild)
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
        // else if(checkType==='radio'){

        // }
    }
    public close = (parentItem: NodeItem): void => {
        parentItem.open = false
        const closeChild = this.getShowChildData(parentItem)
        const index = this.viewData.findIndex(item => item.parentId === parentItem.id)
        index > -1 && this.viewData.splice(index, closeChild.length)

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
}
