import { faceTextColor } from './cubeFaces'

function ColoredText({ text, color }) {
    return <span className={faceTextColor[color]}>{text}</span>;
}

export default ColoredText
