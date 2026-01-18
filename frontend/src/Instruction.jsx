
import ColoredText from './ColoredText'
import { cubeFaces, centerSticker, colorToChar } from "./cubeFaces";
import Face from './Face';

function Instruction({ isFetching, scanIndex }) {

    const classArgs = "absolute top-[40px] left-1/2 -translate-x-1/2 text-4xl font-bold text-center";
    if (isFetching) {
        return <div className={classArgs + " flex flex-row gap-5 items-center"}><span className="text-5xl">Waiting for server to scan face</span>

        </div>;
    }

    const face = cubeFaces[scanIndex];

    return (
        <div className={`${classArgs} flex flex-row items-center gap-2 whitespace-nowrap`}>
            <span>Scan</span>
            <ColoredText text={face.name} color={face.name} />
            <Face colors={centerSticker(face.character)} faceSize={64} />
            <span> face with</span>
            <ColoredText text={face.top} color={face.top} />
            <Face colors={centerSticker(colorToChar[face.top])} faceSize={64} />
            <span>face pointing up</span>
        </div>

    );
}

export default Instruction;
