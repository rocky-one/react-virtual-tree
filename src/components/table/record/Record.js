class Record {
    constructor(option) {
        this.history = []
        this.edited = []
    }
    historyPush = (item) => {
        this.history.push(item);
        this.editedPush(item)
    }
    editedPush = (item) => {
        const index = this.edited.findIndex(o => {
            const s = `${o.newRowIndex}${o.newColIndex}`
            const c = `${item.newRowIndex}${item.newColIndex}`
            return s === c
        })
        if (index >= 0) {
            this.edited.splice(index, 1, item)
        } else {
            this.edited.push(item)
        }
    }
    cleanUpEdit = () => {
        this.edited = []
    }
    cleanUpHistory = () => {
        this.history = []
    }
    cleanAll = () => {
        this.edited = []
        this.history = []
    }
    getEditedData = () => {
        return this.edited
    }
    
}

export default Record