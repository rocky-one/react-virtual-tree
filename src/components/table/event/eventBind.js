// 事件绑定
const addEvent = (() => {
    if (window.addEventListener) {
        return (el, type, fn) => {
            el.addEventListener(type, fn)
        }
    } else if (window.attachEvent) {
        return (el, type, fn) => {
            el.attachEvent("on" + type, fn)
        }
    }
})()

// 移除事件
const removeEvent = (() => {
    if (window.removeEventListener) {
        return (el, type, fn) => {
            el.removeEventListener(type, fn)
        }
    } else if (window.detachEvent) {
        return (el, type, fn) => {
            el.detachEvent("on" + type, fn)
        }
    }
})()

export {
    addEvent,
    removeEvent
} 