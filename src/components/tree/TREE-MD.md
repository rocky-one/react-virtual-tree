## TREE ##

### tree组件说明 ###
tree组件具有较高的性能，特别是较大的数据量时能保持渲染流畅。通过滚动加载，也就是只渲染可视区域内的节点，滚动时根据滚动的scrollTop和tree组件每个节点的高度来计算当前可视区域应该从哪条数据开始渲染。

### 实现原理
1. 拉平嵌套的dom结构为list列表的形式
2. 拉平tree数据结构
3. 滚动时根据scrollTop和节点高度计算截取数据

### 原理分析
#### 1 拉平嵌套的dom结构为list列表的形式
常见的tree组件一般都是ul li然后递归的形式嵌套形成和tree数据结构一致的一棵树，但是这样的嵌套对应滚动加载处理很不方便。常见的滚动加载一般以list结构居多。结构转换如下:

```javascript
// 常见的树形dom结构
<ul>
    <li>1
    <ul>
        <li>1-1
            <ul>
                <li>1-1-1</li>
            </ul>
        </li>
        <li>1-2</li>
    </ul>
    </li>
</ul>
```
```javascript
// 转换后dom结构 list结构，根据层级来控制缩进效果
<div>
    <div>1</div>
    <div>1-1</div>
    <div>1-1-1</div>
    <div>1-2</div>
</div>
```

#### 2 拉平tree数据结构
dom结构处理成list后，需要接受一个一维数组的来渲染，那么我们需要把树形结构的数据转换成一维数组的格式。
正常的tree的数据结构一般如下:

```javascript

[
    {
        name: '1',
        parentId: null,
        id: '1',
        children: [
            {
                parentId: '1',
                id: '1.1',
                name: '1-1',
                children: [
                    {
                        parentId: '1.1',
                        id: '1.1.1',
                        name: '1-1-1',
                    }
                ]
            }
        ]
    }
]
```
拉平后的数据格式,一个一维数组结构
```javascript
[{
	name: '1',
	parentId: null,
	id: '1',
	open: true,
	children: [],
	level: 0,
	hasLeaf: true,
}, {
	parentId: '1',
	id: '1.1',
	name: '1-1',
	open: true,
	children: [],
	level: 1,
	hasLeaf: true,
}, {
	parentId: '1.1',
	id: '1.1.1',
	name: '1-1-1',
	level: 2
}]
```
这样转换成一位数组后对于滚动加载的处理就会便捷很多。为了数据处理起来更加的方便这了还增加了另一种数据结构用来映射整个tree，比如在展开收起，或者添加移除的时候能够更快的找到对应的节点,映射的数据结构主要是用来计算。数据结构如下：
```javascript
// 对象的第一层的key: '0', '1', '2'表示的是数据的层级
// 对象的第二层开始key的值是节点的父ID
// 这样比如展开一个节点可以根据当前节点的层级以及parentId快速定位到父节点以及兄弟节点，把数据插入进来。
{
	"0": { //第一层
		"root": [{ // 根节点
			"name": "1",
			"parentId": null,
			"id": "1",
			"children": [{
				"parentId": "1",
				"id": "1.1",
				"name": "1-1",
				"children": [{
					"parentId": "1.1",
					"id": "1.1.1",
					"name": "1-1-1",
					"level": 2
				}],
				"level": 1,
				"hasLeaf": true,
			}],
			"level": 0,
			"hasLeaf": true,
		}]
	},
	"1": { //第二层
		"1": [{ // parentId是1
			"parentId": "1",
			"id": "1.1",
			"name": "1-1",
			"children": [{
				"parentId": "1.1",
				"id": "1.1.1",
				"name": "1-1-1",
				"level": 2
			}],
			"level": 1,
			"hasLeaf": true,
		}]
	},
}
```

#### 3 滚动时根据scrollTop和节点高度计算截取数据

##### 计算开始截取数据的索引startIndex：

 - 根据scrollTop的值计算上方位置滚动出了多少条数据。总数据长度减去滚动出去的数据就是开始的位置的索引。

 - 比如list.length=100，scrollTop=60，nodeHeight=30，这里的nodeHeight可以通过props传递给组件不穿默认30px。

 - 计算截取数据开始的索引： const startIndex = Math.floor(scrollTop / nodeHeight)

##### 计算开始截取数据的索引startIndex：

 - 有开始的索引还要有结束的索引，结束的索引就是startIndex加上当前tree可视区域的高度内能展示多少条数据。

 - 比如可视区域的高度是100, viewHeight=100,nodeHeight=30
 
 - 计算可视区域内能放多少条数据: const viewDataLen = Math.ceil(height / nodeHeight)

 - 结束的索引就可以计算出来了 const endIndex = startIndex+viewDataLen

##### 计算可视区域要展示的数据newlist：
 
 - 开始和结束的索引都计算完毕，下面截取数据就ok了。const newlist = list.slice(startIndex, endIndex)


------

到此tree组件的基本原理已经介绍完毕，若有错误之处还请多多指教，组件还在不断完善中，后续会继续更新。代码源码请到https://github.com/rocky-one/react-high-performance-ui/blob/master/src/components/tree/Tree.tsx