import Face from "./Face.jsx";

export default function SmallCube({ colors, faceSize }) {
  return (
    <div className="flex flex-col items-start">
      {/* Top */}
      <div className="flex flex-row">
        <div style={{ width: `${faceSize}px`, height: `${faceSize}px` }} />
        <Face colors={colors.front} faceSize={faceSize} />
      </div>

      {/* Middle row: left, front, right, back */}
      <div className="flex flex-row">
        <Face colors={colors.left} faceSize={faceSize} />
        <Face colors={colors.top} faceSize={faceSize} />
        <Face colors={colors.right} faceSize={faceSize} />
        <Face colors={colors.bottom} faceSize={faceSize} />
      </div>

      {/* Bottom */}
      <div className="flex flex-row">
        <div style={{ width: `${faceSize}px`, height: `${faceSize}px` }} />
        <Face colors={colors.back} faceSize={faceSize} />
      </div>
    </div>
  );
}
