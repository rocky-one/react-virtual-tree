export interface HandleTreeInterface {
    //transData:(data: any[]) => void; 
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