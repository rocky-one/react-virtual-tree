import { HandleTreeInterface, MapData, NodeItem } from './interface'
import { bfTree, dfsTree } from './utils'

export default class HandleTree implements HandleTreeInterface {
    constructor(option: { data: any; }) {
        this.mapDatas(option.data)
        this.initViewData()
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
            if (item.open && item.isLeaf) {
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
                item.isLeaf = true
                item.requested = true
            }
            dat[`${level}`][parentId].push(item)
        })
        this.mapData = dat
    }
    private initChildData = (parentItem: NodeItem, child: Array<NodeItem> = []) :Array<NodeItem> => {
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
        const newChild = this.initChildData(parentItem, child)
        parentItem.children = newChild
        this.insertChildToViewData(parentItem, newChild)
        this.insertChildToMapData(parentItem, newChild)
    }
    public open = (parentItem: NodeItem): void => {
        parentItem.open = true
        const showChild = this.getShowChildData(parentItem)
        const index = this.viewData.findIndex(item => item.id === parentItem.id)
        index > -1 && this.viewData.splice(index + 1, 0, ...showChild)
    }
    public close = (parentItem: NodeItem): void => {
        parentItem.open = false
        const closeChild = this.getShowChildData(parentItem)
        const index = this.viewData.findIndex(item => item.parentId === parentItem.id)
        index > -1 && this.viewData.splice(index, closeChild.length)
    }

}
