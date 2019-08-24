import * as React from 'react'
import classNames from 'classnames'
import './style/index.scss'

interface checkboxProps {
    checked: boolean,
    onChange: (status: boolean) => void
}

function Checkbox(props: checkboxProps) {
    const [checked, setCheck] = React.useState(props.checked || false)

    return (
        <span className={classNames('r-h-checkbox', {
            'r-h-checked': checked,
            'r-h-unchecked': !checked,
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