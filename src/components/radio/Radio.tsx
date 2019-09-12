import * as React from 'react'
import classNames from 'classnames'
import './style/index.scss'

interface radioProps {
    checked: boolean,
    onChange: (status: boolean) => void
}

function Radio(props: radioProps) {
    const [checked, setCheck] = React.useState(props.checked || false)
    React.useEffect(() => {
        setCheck(props.checked)
    }, [props.checked, setCheck])
    
    return (
        <span className={classNames('r-h-radio', {
            'r-h-radio-checked': checked,
        })}
            onClick={() => {
                let status = !checked
                setCheck(status)
                if (props.onChange) {
                    props.onChange(status)
                }
            }}>
                <span className={classNames('r-h-radio-inner',{
                    'r-h-radio-inner-checked': checked,
                })}></span>
            </span>
    )
}

export default Radio;