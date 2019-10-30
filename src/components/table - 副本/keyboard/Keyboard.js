
import { isTarget } from './BodyHotKey'

const isMac = function () {
    return /macintosh|mac os x/i.test(navigator.userAgent);
}();

const keyCode = {
    '9': 'tab',
    '13': 'enter',
    '17': 'ctrl',
    '17-67': 'ctrlC',
    '17-86': 'ctrlV',
    '18': 'alt',
    '38': 'upArrow',
    '40': 'downArrow',
    '37': 'leftArrow',
    '39': 'rightArrow',
}
if (isMac) {
    keyCode['91'] = 'ctrl'
}

export default new class Keyboard {
    constructor() {

        this.target = document
        // this.callback = callback || {}
        this.ctrl = false
        this.alt = false
        this.target.addEventListener('keydown', this.keyDown, false);
        this.target.addEventListener('keyup', this.keyUp, false);
    }
    init = (option) => {
        const {
            target,
            callback,
            key
        } = option
        // this.target = target || document
        this.callback = callback || {}
        // this.ctrl = false
        // this.alt = false
        this.key = key
        // this.target.addEventListener('keydown', this.keyDown, false);
        // this.target.addEventListener('keyup', this.keyUp, false);
        return this
    }
    keyDown = (event) => {
        if (!this.callback) return
        if (!isTarget(event.target, this.key)) return
        const code = event.keyCode
        let cb = null
        let mapKey = keyCode[`${code}`]
        cb = this.callback[mapKey]
        if (this.ctrl) {
            mapKey = keyCode[`${this.ctrl}-${code}`]
            if (mapKey) cb = this.callback[mapKey]
        }
        if (this.alt) {
            mapKey = keyCode[`${this.alt}-${code}`]
            if (mapKey) cb = this.callback[mapKey]
        }
        if (!cb) {
            cb = this.callback['exceptHotkeyRun']
        }

        if (code === 17) {
            this.ctrl = code
        }
        if(isMac){
            if(code === 91){
                this.ctrl = 17
            }
        }
        if (code === 18) {
            this.alt = code
        }
        cb && cb(event, this.ctrl)
    }
    keyUp = (event) => {
        if (!this.callback) return
        const code = event.keyCode
        if (code === 17) {
            this.ctrl = false
        }
        if (code === 18) {
            this.alt = false
        }
    }
    destroy = () => {
        // this.target.removeEventListener('keydown', this.keyDown, false);
        // this.target.removeEventListener('keyup', this.keyUp, false);
    }
}

