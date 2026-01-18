import { useEffect, useRef, useState } from "react";
import SmallCube from "./SmallCube.jsx";
import { cubeFaces, dataURLtoBlob, unfilledCube, solvedCube, translateCubeFormat } from "./cubeFaces";
import Instruction from "./Instruction.jsx";
import CubeSolver from "./CubeSolver.jsx";


function CameraCapture() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [image, setImage] = useState(null);
    const [isFetching, setIsFetching] = useState(false);
    const [scanIndex, setScanIndex] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");
    const [endScan, setEndScan] = useState(false);
    //const [displaySolution, setIsDisplaySolution] = useState("U2 R L2 F B U L D R' F U B2 R2 D R2 B2 U L2 U' F2 U B2 L2 D2 R2");
    const [displaySolution, setIsDisplaySolution] = useState("");

    // CameraCapture or wherever you define state
    const [colors, setColors] = useState(unfilledCube);
    function isScanComplete() {
        return Object.values(colors).every(faceColors => !faceColors.includes("_"));
    }
    function resetCube() {
        setColors(unfilledCube)
        setScanIndex(0);
    }
    function setSpecificColor(face, newColor, index) {
        console.log("Setting color for face:", face, " index:", index, " to color:", newColor);
        setColors(prev => {
            const newColors = { ...prev };
            newColors[face][index] = newColor;
            return newColors;
        });
    }




    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                videoRef.current.srcObject = stream;
            });
    }, []);

    const capture = async () => {
        setIsFetching(true);
        setErrorMessage("");
        const dataUrl = captureImage();
        setImage(dataUrl);

        try {
            const faceScan = await fetchFaceScan(dataUrl, cubeFaces[scanIndex].character);
            if (!faceScan) return;

            handleFaceScan(faceScan);
        } catch (e) {
            setErrorMessage("Something went wrong");
            setTimeout(() => setErrorMessage(""), 3000);
        } finally {
            setIsFetching(false);
        }
    };

    // 1. Capture current video frame to canvas and return data URL
    function captureImage() {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        canvas.getContext("2d").drawImage(video, 0, 0);
        return canvas.toDataURL("image/png", 0.8);
    }

    // 2. Send the captured image to backend and get face scan
    async function fetchFaceScan(imageDataUrl, faceChar) {
        try {
            const blob = dataURLtoBlob(imageDataUrl);
            const formData = new FormData();
            formData.append("image", blob);

            const response = await fetch(`/detect-cube?face=${faceChar}`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json();
                console.error("Error about the response: ", err);
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error("Request failed:", error);
            return null;
        }
    }

    // 3. Process face scan result and update state
    async function handleFaceScan(faceScan) {
        if (faceScan.ok && faceScan.detected_center === cubeFaces[scanIndex].character) {
            updateColors(faceScan.tiles);
            advanceScanIndex();

            if (scanIndex === 5) {
                const element = cubeFaces.find(face => face.character === cubeFaces[scanIndex].character);
                const faceKey = element.facing;
                const newColors = { ...colors };
                newColors[faceKey] = [...faceScan.tiles];
                setEndScan(true);

                const solutionData = await getSolution(newColors);
                if (solutionData && solutionData.ok) {
                    console.log("Cube solution:", solutionData.solution);
                    setIsDisplaySolution(solutionData.solution);
                } else {
                    setErrorMessage("Could not get solution");
                    setTimeout(() => setErrorMessage(""), 10000);
                }
            }
        } else {
            setErrorMessage(faceScan.error);
            setTimeout(() => setErrorMessage(""), 10000);
        }
    }

    // 4. Update cube colors with scanned face
    function updateColors(tiles) {
        const element = cubeFaces.find(face => face.character === cubeFaces[scanIndex].character);
        const faceKey = element.facing;

        setColors(prev => {
            const newColors = { ...prev };
            newColors[faceKey] = [...tiles];
            return newColors;
        });
    }

    // 5. Increment scan index
    function advanceScanIndex() {
        if (scanIndex < 5) setScanIndex(prev => prev + 1);
    }



    async function getSolution(CubeColors) {
        console.log("Getting solution for cube colors: ", CubeColors);
        try {

            const goodFormat = translateCubeFormat(CubeColors);

            const response = await fetch(`/solve-cube`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(goodFormat),
            });

            if (!response.ok) {
                const err = await response.json();
                console.error("Error about the response: ", err);
                return null;
            }
            const data = await response.json();
            console.log("Response received from /solve-cube:" + data);

            return data;
        } catch (error) {
            console.error("Request failed:", error);
            return null;
        }


    }

    function removeFace() {
        if (scanIndex == 0) return;
        const element = cubeFaces.find(face => face.character === cubeFaces[scanIndex - 1].character);
        const faceKey = element.facing;
        setColors(prev => {
            const newColors = { ...prev };                 // copy top-level object
            newColors[faceKey] = Array(9).fill("_");      // reset array for the face
            return newColors;                             // new reference triggers re-render
        });
        setScanIndex(scanIndex - 1);
    }
    function setGrey() {
        setColors(unfilledCube)
    }
    function setComplete() {
        setColors(solvedCube)
    }


    return displaySolution ? (
        <CubeSolver solution={displaySolution} />
    ) : (
        <div className="flex flex-col items-center gap-6">
            <div className="relative w-[1100px] h-[650px] rounded-xl overflow-hidden shadow-lg">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-black/20" />

                <Instruction isFetching={isFetching} scanIndex={scanIndex} endScan={endScan} />

                {isFetching && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <span className="loading loading-spinner w-20 h-20 text-primary" />
                        <p className="text-white text-xl">Scanning</p>
                    </div>
                )}

                {errorMessage && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-red-400 text-2xl font-bold">{errorMessage}</p>
                    </div>
                )}

                <button
                    onClick={capture}
                    disabled={isFetching}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 btn btn-primary btn-lg w-[260px]"
                >
                    Scan Face
                </button>

                <div className="absolute bottom-6 right-6">
                    <SmallCube colors={colors} faceSize={72} />
                </div>

                {image && (
                    <img
                        src={image}
                        alt="capture"
                        className="absolute top-3 right-3 w-[160px] h-[160px] rounded-lg border"
                    />
                )}
            </div>

            <div className="flex gap-6">
                <button className="btn btn-warning" onClick={removeFace}>
                    Remove Previous
                </button>
                <button className="btn btn-error" onClick={resetCube}>
                    Reset Cube
                </button>
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}

export default CameraCapture;
