
import ColoredText from './ColoredText'
import { cubeFaces } from "./cubeFaces";

function Instruction({ isFetching, scanIndex }) {

    let classArgs = "text-6xl mb-8 font-bold text-center";
    if (isFetching) {
        return <h1 className={classArgs}>Waiting for server to scan face</h1>;
    }

    const face = cubeFaces[scanIndex];

    return (
        <p className={classArgs}>
            Scan{" "}
            <ColoredText text={face.name} color={face.name} />{" "}
            face with{" "}
            <ColoredText text={face.top} color={face.top} />{" "}
            on top
        </p>
    );
}

export default Instruction;
