import { useEffect, useRef, useState } from "react";
import SmallCube from "./SmallCube.jsx";
import { cubeFaces, dataURLtoBlob, unfilledCube, solvedCube } from "./cubeFaces";
import Instruction from "./Instruction.jsx";

// instructions are of the form: scan [white] face with [blue] on top.
// the color of the face to scan and the one on top are colored

// green is 0-9 : yellow on top : front
// red is 10-18: green on top: left
// white 19-27. orange on top: top
// orange 28-36: blue on top : right
// yellow 37-45: red on top : bottom
// blue 46-54: white on top : back

// the left is orange
// the right is red
// the front is green
// the back is blue
// the top is white
// the bottom is yellow

function CameraCapture() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [image, setImage] = useState(null);
    const [isFetching, setIsFetching] = useState(false);
    const [scanIndex, setScanIndex] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");

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

    const capture = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        canvas.getContext("2d").drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL("image/png", 0.8);
        setImage(dataUrl);

        setIsFetching(true);
        setErrorMessage("");

        /*
        return {
            "ok": False,
            "error": "Invalid center color selected.",
            "tiles": None,
            "detected_center": None,
        }
        
        */
        try {
            const faceScan = await getFaceScan(
                cubeFaces[scanIndex].character,
                dataUrl
            );
            console.log("Face scan data:", faceScan);
            if (faceScan !== null) {


                if (faceScan.ok && faceScan.detected_center === cubeFaces[scanIndex].character) {

                    if (scanIndex < 5) setScanIndex(scanIndex => scanIndex + 1);

                    const element = cubeFaces.find(face => face.character === cubeFaces[scanIndex].character);
                    const startIndex = element.startIndex
                    const faceKey = element.facing;


                    // add the received array to the colors state
                    // /////compare the center square with the cubeFaces[scanIndex].character. to see if its  the same
                    // ///////// get in the cubeFace array the element such that the character is the cubeFaces[scanIndex].character
                    // get the starter index of the colors from the element found 
                    // start from that start index and replace the subsequent characters by the array
                    // the 2d representation of the array should have one more face. 
                    const newColors = { ...colors };
                    newColors[faceKey] = [...colors[faceKey]];
                    for (let i = 0; i < faceScan.tiles.length; i++) {
                        newColors[faceKey][i] = faceScan.tiles[i];
                    }

                    setColors(newColors);                             // new reference triggers re-render
                    if (scanIndex == 5) {
                        const solutionData = await getSolution(newColors);
                        if (solutionData && solutionData.ok) {
                            console.log("Cube solution:", solutionData.solution);
                        }
                        else {
                            setErrorMessage("Could not get solution");
                            setTimeout(() => setErrorMessage(""), 10000);
                        }
                    }
                }
                else {
                    setErrorMessage(faceScan.error);
                    setTimeout(() => setErrorMessage(""), 3000);
                }
            }
            else {
                console.log("No face scan data");
            }
        } catch (e) {
            setErrorMessage("something went wrong");
            setTimeout(() => setErrorMessage(""), 3000);
        } finally {
            setIsFetching(false);
        }




    };
    function translateCubeFormat(input) {
        const output = {};
        for (const face in input) {
            output[face] = [input[face].join("")];
        }
        return output;
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

    async function getFaceScan(face, image) {
        try {
            const blob = dataURLtoBlob(image);
            const formData = new FormData();
            formData.append("image", blob);

            const response = await fetch(`/detect-cube?face=${face}`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json();
                console.error("Error about the response: ", err);
                return null;
            }

            const data = await response.json();

            return data;
        } catch (error) {
            console.error("Request failed:", error);
            return null;
        }
    }
    return (
        <>
            <div>
                <Instruction isFetching={isFetching} scanIndex={scanIndex} />
                {errorMessage.trim() != "" && <p className="text-red-500 text-3xl font-bold">{errorMessage}</p>}
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
                <button className="btn btn-soft btn-primary" onClick={removeFace}>Remove Previous Face</button>

                <canvas ref={canvasRef} style={{ display: "none" }} />
                <SmallCube colors={colors} faceSize={64} />
                {image && <img src={image} alt="screenshot" />}
            </div>

        </>
    );
}

export default CameraCapture;
