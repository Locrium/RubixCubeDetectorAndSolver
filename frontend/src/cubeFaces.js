export const cubeFaces = [
    {
        name: "green",
        character: "G",
        range: [0, 8],
        facing: "front",
        top: "yellow"
    },
    {
        name: "red",
        character: "R",
        range: [9, 17],
        facing: "left",
        top: "green"
    },
    {
        name: "white",
        character: "W",
        range: [18, 26],
        facing: "top",
        top: "orange"
    },
    {
        name: "orange",
        character: "O",
        range: [27, 35],
        facing: "right",
        top: "blue"
    },
    {
        name: "yellow",
        character: "Y",
        range: [36, 44],
        facing: "bottom",
        top: "red"
    },
    {
        name: "blue",
        character: "B",
        range: [45, 53],
        facing: "back",
        top: "white"
    }
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
    Y: "bg-yellow-500",
    R: "bg-red-500",
    O: "bg-orange-500",
    B: "bg-blue-500",
    G: "bg-green-500",
    _: "bg-gray-400", // optional for unknown / empty
};

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
    front: Array(9).fill("_"),  // Red
    back: Array(9).fill("_"),   // Orange
    left: Array(9).fill("_"),   // Blue
    right: Array(9).fill("_"),  // Green
    top: Array(9).fill("_"),    // White
    bottom: Array(9).fill("_"), // Yellow
};
export const solvedCube = {
    front: Array(9).fill("G"),  // Red
    back: Array(9).fill("B"),   // Orange
    left: Array(9).fill("R"),   // Blue
    right: Array(9).fill("O"),  // Green
    top: Array(9).fill("W"),    // White
    bottom: Array(9).fill("Y"), // Yellow
}