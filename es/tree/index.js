import { createElement, Component } from 'react';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function bfTree(tree = [], cb) {
    let queue = [];
    for (let i = 0; i < tree.length; i++) {
        tree[i].level = 0;
        queue.push(tree[i]);
    }
    while (queue.length != 0) {
        let item = queue.shift();
        cb && cb(item);
        if (item.children) {
            for (let i = 0; i < item.children.length; i++) {
                item.children[i].level = item.level + 1;
                queue.push(item.children[i]);
            }
        }
    }
}

function dfsTree(tree = [], cb) {
    let nodeList = [];
    if (tree && tree.length > 0) {
        let queue = [];
        let index = 0;
        for (let i = 0; i < tree.length; i++) {
            if (!tree[i].hasOwnProperty('level')) tree[i].level = 0;
            queue.push(tree[i]);
        }
        while (queue.length != 0) {
            let item = queue.shift();
            nodeList.push(item);
            let go = true;
            if (cb) {
                go = cb(item);
            }
            if (go !== false) {
                let childrenList = item.children || [];
                for (let j = 0; j < childrenList.length; j++) {
                    if (!childrenList[j].hasOwnProperty('level')) childrenList[j].level = item.level + 1;
                    queue.splice(index, 0, childrenList[j]);
                }
            }
        }
    }
    return nodeList
}

var HandleTree = /** @class */ (function () {
    function HandleTree(option) {
        var _this = this;
        this.viewData = [];
        this.getViewData = function () { return _this.viewData; };
        this.mapData = {};
        // 获取要显示的子节点 注意可能跨级显示
        this.getShowChildData = function (item) {
            var mapData = _this.mapData[item.level + 1][item.id];
            var child = [];
            dfsTree(mapData, function (c) {
                if (item.level + 1 == c.level) {
                    child.push(c);
                    if (!c.open)
                        return false;
                }
                else {
                    child.push(c);
                }
            });
            return child;
        };
        // 拉平要显示的数据放到数组中
        this.initViewData = function () {
            var _a;
            var dataMap = _this.mapData['0'];
            var data = Object.values(dataMap);
            _this.viewData = data[0].map(function (item) { return item; });
            for (var i = 0; i < _this.viewData.length; i++) {
                var item = _this.viewData[i];
                if (item.open && item.isLeaf) {
                    var child = _this.getShowChildData(item);
                    var len = child.length;
                    (_a = _this.viewData).splice.apply(_a, [i + 1, 0].concat(child));
                    i += len;
                }
            }
        };
        // 组装成新的结构 根据层级 id为key
        this.mapDatas = function (data) {
            var dat = _this.mapData;
            bfTree(data, function (item) {
                var parentId = item.parentId || 'root';
                var level = item.level;
                if (!dat[level])
                    dat[level] = {};
                if (!dat[level][parentId])
                    dat[level][parentId] = [];
                if (item.children) {
                    item.isLeaf = true;
                    item.requested = true;
                }
                dat["" + level][parentId].push(item);
            });
            _this.mapData = dat;
        };
        this.initChildData = function (parentItem, child) {
            if (child === void 0) { child = []; }
            return child.map(function (item) { return (__assign({}, item, { level: parentItem.level + 1 })); });
        };
        this.insertChildToViewData = function (parentItem, child) {
            var _a;
            if (child === void 0) { child = []; }
            var index = _this.viewData.findIndex(function (item) { return item.id === parentItem.id; });
            index > -1 && (_a = _this.viewData).splice.apply(_a, [index + 1, 0].concat(child));
        };
        this.insertChildToMapData = function (parentItem, child) {
            if (child === void 0) { child = []; }
            var childMap = _this.mapData[parentItem.level + 1];
            if (!childMap) {
                _this.mapData[parentItem.level + 1] = {};
            }
            _this.mapData[parentItem.level + 1][parentItem.id] = child;
        };
        // 插入子节点到 当前的节点下
        // 1 插入到viewData 2 插入到映射mapData
        this.insertChild = function (parentItem, child) {
            if (child === void 0) { child = []; }
            parentItem.open = true;
            parentItem.requested = true;
            var newChild = _this.initChildData(parentItem, child);
            parentItem.children = newChild;
            _this.insertChildToViewData(parentItem, newChild);
            _this.insertChildToMapData(parentItem, newChild);
        };
        this.open = function (parentItem) {
            var _a;
            parentItem.open = true;
            var showChild = _this.getShowChildData(parentItem);
            var index = _this.viewData.findIndex(function (item) { return item.id === parentItem.id; });
            index > -1 && (_a = _this.viewData).splice.apply(_a, [index + 1, 0].concat(showChild));
        };
        this.close = function (parentItem) {
            parentItem.open = false;
            var closeChild = _this.getShowChildData(parentItem);
            var index = _this.viewData.findIndex(function (item) { return item.parentId === parentItem.id; });
            index > -1 && _this.viewData.splice(index, closeChild.length);
        };
        this.mapDatas(option.data);
        this.initViewData();
    }
    return HandleTree;
}());

var Node = /** @class */ (function (_super) {
    __extends(Node, _super);
    function Node(props) {
        var _this = _super.call(this, props) || this;
        _this.onOpen = function () {
            var _a = _this.props, item = _a.item, onOpen = _a.onOpen;
            onOpen(item);
        };
        _this.onClose = function () {
            var _a = _this.props, item = _a.item, onClose = _a.onClose;
            onClose(item);
        };
        _this.renderArrow = function () {
            var item = _this.props.item;
            var style = {
                marginLeft: item.level * 10 + "px",
                cursor: 'pointer',
                display: 'inline-block',
                width: '12px',
                textAlign: 'center',
            };
            if (item.isLeaf) {
                if (!item.open) {
                    return createElement("span", { style: style, onClick: _this.onOpen }, "+");
                }
                return createElement("span", { style: style, onClick: _this.onClose }, "-");
            }
            return createElement("span", { style: style });
        };
        return _this;
    }
    Node.prototype.render = function () {
        var _a = this.props, item = _a.item, nodeHeight = _a.nodeHeight;
        return createElement("div", { className: "virtual-tree-node", style: { height: nodeHeight + "px" } },
            this.renderArrow(),
            createElement("span", null, item.name));
    };
    return Node;
}(Component));

var Tree = /** @class */ (function (_super) {
    __extends(Tree, _super);
    function Tree(props) {
        var _this = _super.call(this, props) || this;
        _this.onOpen = function (item) {
            var loadData = _this.props.loadData;
            if (!item.requested) {
                if (loadData && typeof loadData === 'function') {
                    loadData(item).then(function (child) {
                        _this.handleTree.insertChild(item, child);
                        _this.setState({
                            data: _this.handleTree.getViewData()
                        });
                    });
                }
            }
            else {
                _this.handleTree.open(item);
                _this.setState({
                    data: _this.handleTree.getViewData()
                });
            }
        };
        _this.onClose = function (item) {
            _this.handleTree.close(item);
            _this.setState({
                data: _this.handleTree.getViewData()
            });
        };
        _this.setTreeRef = function (node) {
            if (!_this.treeRef) {
                _this.treeRef = node;
                _this.setState({});
            }
        };
        _this.onScroll = function () {
            _this.setState({});
        };
        _this.renderChild = function () {
            if (!_this.treeRef)
                return null;
            var data = _this.state.data;
            var _a = _this.props.nodeHeight, nodeHeight = _a === void 0 ? 30 : _a;
            // 计算开始和结束数据的索引
            var height = _this.treeRef.offsetHeight;
            var startIndex = Math.floor(_this.treeRef.scrollTop / nodeHeight);
            var viewDataLen = Math.ceil(height / nodeHeight) + 1;
            var end = false;
            if (startIndex + viewDataLen >= data.length) {
                viewDataLen -= 1;
                end = true;
            }
            var newData = data.slice(startIndex, startIndex + viewDataLen);
            var sumHeight = nodeHeight * data.length;
            var topHeight = startIndex * nodeHeight;
            var middleHeight = height + (end ? 0 : nodeHeight);
            var bottomHeight = sumHeight - middleHeight - topHeight;
            return [
                createElement("div", { key: "top", style: { height: topHeight + "px" } }),
                createElement("div", { key: "middle", style: { height: middleHeight + "px", overflow: 'hidden' } }, newData.map(function (item) { return createElement("div", { key: item.id },
                    createElement(Node, { item: item, onOpen: _this.onOpen, onClose: _this.onClose, nodeHeight: nodeHeight })); })),
                createElement("div", { key: "bottom", style: { height: bottomHeight + "px" } })
            ];
        };
        _this.state = {
            data: []
        };
        return _this;
    }
    Tree.prototype.componentDidMount = function () {
        this.handleTree = new HandleTree({
            data: this.props.data
        });
        this.setState({
            data: this.handleTree.getViewData()
        });
    };
    Tree.prototype.render = function () {
        var _a = this.props, width = _a.width, height = _a.height;
        return createElement("div", { className: "list", style: {
                width: width ? width + "px" : 'auto',
                height: height ? height + "px" : 'auto',
                overflow: 'auto',
            }, ref: this.setTreeRef, onScroll: this.onScroll }, this.renderChild());
    };
    return Tree;
}(Component));

export default Tree;
