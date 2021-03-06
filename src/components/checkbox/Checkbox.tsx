import * as React from 'react'
import classNames from 'classnames'
import './style/index.scss'

interface checkboxProps {
    checked: boolean,
    halfSelected?: boolean,
    onChange: (status: boolean) => void
}

function Checkbox(props: checkboxProps) {
    const [checked, setCheck] = React.useState(props.checked || false)
    React.useEffect(() => {
        setCheck(props.checked)
    }, [props.checked, setCheck])
    
    return (
        <span className={classNames('r-h-checkbox', {
            'r-h-checked': checked,
            'r-h-unchecked': !checked,
            'r-h-half-selected': props.halfSelected
        })}
            onClick={() => {
                let status = !checked
                setCheck(status)
                if (props.onChange) {
                    props.onChange(status)
                }
            }}></span>
    )
}

export default Checkbox;