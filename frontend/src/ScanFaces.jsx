import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import CameraCapture from './CameraCapture.jsx'

function ScanFaces() {
    const [count, setCount] = useState(0)

    return (
        <>
            <CameraCapture />
        </>
    )
}

export default ScanFaces
