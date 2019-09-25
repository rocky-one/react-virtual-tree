export interface HandleTreeInterface {
    //transData:(data: any[]) => void; 
}
export interface HandleTreeOption {
    data: any;
    nodeHeight: number;
}
export interface NodeItem {
    title: string;
    id: string;
    parentId: string;
    children?: Array<NodeItem>;
    [propName: string]: any;
}

interface TreeDataLevel {
    [propName: string]: Array<NodeItem>
}

export interface MapData {
    [propName: string]: TreeDataLevel;
}

export interface TransformItem {
    title: string;
    id: string;
    parentId: string;
    _level: number;
    children?: Array<NodeItem>;
    [propName: string]: any;
}

interface BaseProps {
    onOpen?: (item: NodeItem) => void,
    onClose?: (item: NodeItem) => void,
    onMouseEnter?: (item: NodeItem) => void,
    onMouseLeave?: (item: NodeItem) => void,
    renderMouseEnter?: (item: NodeItem) => React.ReactNode,
    nodeHeight?: number,
    checkable?: boolean, // 多选
    radio?: boolean, // 单选
    renderCheckable?: (item: NodeItem) => boolean,
    renderRadio?: (item: NodeItem) => boolean,
    linkage?: boolean,
    nodeClassName?: string,
    draggable?: boolean,
    onDragStart?: (item: NodeItem) => void
    onDragOver?: (item: NodeItem) => void
    onDragEnter?: (item: NodeItem) => void
    onDragLeave?: (item: NodeItem) => void
    onDragEnd?: (item: NodeItem) => void
}
export interface NodeProps extends BaseProps {
    item: NodeItem,
    onCheckLinkage?: (item: NodeItem) => void,
    onChangeRadio?: (item: NodeItem, status: boolean) => void,
    handleTree?: any,
    index: number,
}

interface SearchKeys {
    id: string
}
export interface TreeProps<T> extends BaseProps {
    data: T[],
    loadData?: (item: NodeItem) => Promise<void>,
    width?: number,
    height?: number,
    treeRef?: any,
    searchKeys?: Array<SearchKeys>,
}

export interface SearchReturn {
    item?: NodeItem,
    index: number,
}