import { useEffect, useRef, useState } from "react";
import SmallCube from "./SmallCube.jsx";
import { cubeFaces, faceTextColor, unfilledCube, solvedCube } from "./cubeFaces";
import Instruction from "./Instruction.jsx";

// instructions are of the form: scan [white] face with [blue] on top.
// the color of the face to scan and the one on top are colored

// green is 0-9 : yellow on top : front
// red is 10-18: green on top: left
// white 19-27. orange on top: top
// orange 28-36: blue on top : right
// yellow 37-45: red on top : bottom
// blue 46-54: white on top : back
function CameraCapture() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [image, setImage] = useState(null);
    const [isFetching, setIsFetching] = useState(false);
    const [scanIndex, setScanIndex] = useState(0);
    // CameraCapture or wherever you define state
    const [colors, setColors] = useState(unfilledCube);
    function isScanComplete() {
        return Object.values(colors).every(faceColors => !faceColors.includes("_"));
    }
    function resetCube() {
        setColors(unfilledCube)
        setScanIndex(0);
    }




    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                videoRef.current.srcObject = stream;
            });
    }, []);

    const capture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        canvas.getContext("2d").drawImage(video, 0, 0);
        setImage(canvas.toDataURL("image/png"));


        console.log(isScanComplete());
        setIsFetching(true);
        // Simulate a server request
        setTimeout(() => {
            setIsFetching(false);
            setScanIndex(scanIndex => scanIndex + 1)

        }, 2000)

    };
    function setGrey() {
        setColors(unfilledCube)
    }
    function setComplete() {
        setColors(solvedCube)
    }
    return (
        <>
            <div>
                <Instruction isFetching={isFetching} scanIndex={scanIndex} />
                <div className="flex items-center justify-center">
                    <div className="relative border" style={{ width: "1000px", height: "750px" }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="absolute inset-0 w-full h-full object-contain"
                        />

                        {isFetching && (
                            <span
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 loading loading-spinner text-error"
                                style={{ width: "100px", height: "100px" }}
                            />
                        )}
                        <button className="absolute top-13/16 -translate-x-1/2 btn btn-soft btn-primary w-[150px] h-[80px]" onClick={capture} disabled={isFetching}>Take screenshot</button>
                    </div>
                </div>

                <button className="btn btn-soft btn-primary" onClick={setGrey} >set Cube Grey</button>
                <button className="btn btn-soft btn-primary" onClick={setComplete}>set Cube colors</button>
                <button className="btn btn-soft btn-primary" onClick={resetCube}>Reset Cube</button>

                <canvas ref={canvasRef} style={{ display: "none" }} />
                <SmallCube colors={colors} faceSize={64} />
            </div>

        </>
    );
}

export default CameraCapture;
