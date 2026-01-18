export const cubeFaces = [
    {
        name: "yellow",
        character: "Y",
        range: [36, 44],
        facing: "bottom",
        top: "green" // good
    },
    {
        name: "blue",
        character: "B",
        range: [45, 53],
        facing: "back",
        top: "white" // good
    },
    {
        name: "white",
        character: "W",
        range: [18, 26],
        facing: "top",
        top: "blue" // good
    },
    {
        name: "green",
        character: "G",
        range: [0, 8],
        facing: "front",
        top: "white"
    },
    {
        name: "orange",
        character: "O",
        range: [9, 17],
        facing: "left",
        top: "white" // good
    },

    {
        name: "red",
        character: "R",
        range: [27, 35],
        facing: "right",
        top: "white" // good
    },

];
export const faceTextColor = {
    green: "text-green-500",
    red: "text-red-500",
    white: "text-gray-200",
    orange: "text-orange-500",
    yellow: "text-yellow-400",
    blue: "text-blue-500"
};

export const charToColor = {
    W: "bg-white",
    Y: "bg-[#fdff15]",
    R: "bg-[#ff0000]",
    O: "bg-[#ffa900]",
    B: "bg-blue-500",
    G: "bg-green-500",
    _: "bg-gray-400", // optional for unknown / empty
};
export function centerSticker(color) {
    return ["_", "_", "_", "_", color, "_", "_", "_", "_",]
}

export const colorToChar = {
    white: "W",
    yellow: "Y",
    red: "R",
    orange: "O",
    blue: "B",
    green: "G",
    gray: "_", // optional for unknown / empty
};
export const unfilledCube = {
    front: centerSticker("G"),  // Red
    back: centerSticker("B"),   // Orange
    left: centerSticker("O"),   // Blue
    right: centerSticker("R"),  // Green
    top: centerSticker("W"),    // White
    bottom: centerSticker("Y"), // Yellow
};


export const solvedCube = {
    front: Array(9).fill("G"),  // Red
    back: Array(9).fill("B"),   // Orange
    left: Array(9).fill("R"),   // Blue
    right: Array(9).fill("O"),  // Green
    top: Array(9).fill("W"),    // White
    bottom: Array(9).fill("Y"), // Yellow
}

export function dataURLtoBlob(dataURL) {
    const [header, base64] = dataURL.split(",");
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: "image/png" });
}

// everyone who had blue, change with white
// everyone who had white, change with green

export function translateCubeFormat(input) {
    const output = {};
    for (const face in input) {
        output[face] = [input[face].join("")];
    }
    return output;
}