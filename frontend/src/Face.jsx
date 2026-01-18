import { charToColor } from "./cubeFaces";

export default function Face({ colors, faceSize = 64 }) {


    const Cell = ({ code }) => (
        <div className={`aspect-square ${charToColor[code] || "bg-gray-400"} border`} />
    );

    return (
        <div
            className="grid grid-cols-3"
            style={{ width: `${faceSize}px`, height: `${faceSize}px` }}
        >
            {colors.map((code, index) => (
                <Cell key={index} code={code} />
            ))}
        </div>
    );
}
