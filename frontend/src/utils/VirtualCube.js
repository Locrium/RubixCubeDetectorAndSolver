
// VirtualCube.js
// A lightweight 3x3 Cube Simulator for state validation

class VirtualCube {
    constructor() {
        this.reset();
    }

    reset() {
        // Facelets: U:0-8, R:9-17, F:18-26, D:27-35, L:36-44, B:45-53
        // Colors: U:White('w'), R:Red('r'), F:Green('g'), D:Yellow('y'), L:Orange('o'), B:Blue('b')
        this.state = [
            ...'wwwwwwwww', // U (0-8)
            ...'rrrrrrrrr', // R (9-17)
            ...'ggggggggg', // F (18-26)
            ...'yyyyyyyyy', // D (27-35)
            ...'ooooooooo', // L (36-44)
            ...'bbbbbbbbb'  // B (45-53)
        ];
    }

    // Apply a string of moves
    applyAlgorithm(alg) {
        if (!alg) return;
        const moves = alg.trim().split(/\s+/);
        moves.forEach(move => this.move(move));
    }

    move(m) {
        if (!m) return;
        let char = m.charAt(0).toUpperCase();
        let suffix = m.length > 1 ? m.substring(1) : '';

        let times = 1;
        if (suffix.includes("'")) times = 3;
        else if (suffix.includes("2")) times = 2;

        for (let i = 0; i < times; i++) {
            switch (char) {
                case 'U': this.moveU(); break;
                case 'D': this.moveD(); break;
                case 'L': this.moveL(); break;
                case 'R': this.moveR(); break;
                case 'F': this.moveF(); break;
                case 'B': this.moveB(); break;
                case 'X': this.rotateX(); break;
                case 'Y': this.rotateY(); break;
                case 'Z': this.rotateZ(); break;
            }
        }
    }

    // --- Core Operations ---
    cycle(indices) {
        const temp = this.state[indices[indices.length - 1]];
        for (let i = indices.length - 1; i > 0; i--) {
            this.state[indices[i]] = this.state[indices[i - 1]];
        }
        this.state[indices[0]] = temp;
    }

    rotateFaceClockwise(base) {
        // Corners: 0->2->8->6
        this.cycle([base + 0, base + 2, base + 8, base + 6]);
        // Edges: 1->5->7->3
        this.cycle([base + 1, base + 5, base + 7, base + 3]);
    }

    // --- Moves ---
    moveU() {
        this.rotateFaceClockwise(0); // U
        // F0-1-2 <- R0-1-2 <- B0-1-2 <- L0-1-2
        this.cycle([18, 36, 45, 9]);
        this.cycle([19, 37, 46, 10]);
        this.cycle([20, 38, 47, 11]);
    }

    moveD() {
        this.rotateFaceClockwise(27); // D
        // F6-7-8 <- L6-7-8 <- B6-7-8 <- R6-7-8
        this.cycle([24, 42, 51, 15]);
        this.cycle([25, 43, 52, 16]);
        this.cycle([26, 44, 53, 17]);
    }

    moveL() {
        this.rotateFaceClockwise(36); // L
        // F0,3,6 -> D0,3,6 -> B8,5,2 -> U0,3,6
        this.cycle([18, 27, 53, 0]);
        this.cycle([21, 30, 50, 3]);
        this.cycle([24, 33, 47, 6]);
    }

    moveR() {
        this.rotateFaceClockwise(9); // R
        // F2,5,8 -> U2,5,8 -> B6,3,0 -> D2,5,8
        this.cycle([26, 8, 45, 35]);
        this.cycle([23, 5, 48, 32]);
        this.cycle([20, 2, 51, 29]);
    }

    moveF() {
        this.rotateFaceClockwise(18); // F
        // U6,7,8 -> R0,3,6 -> D2,1,0 -> L8,5,2
        this.cycle([6, 9, 29, 44]);
        this.cycle([7, 12, 28, 41]);
        this.cycle([8, 15, 27, 38]);
    }

    moveB() {
        this.rotateFaceClockwise(45); // B
        // U0,1,2 -> L6,3,0 -> D8,7,6 -> R2,5,8
        this.cycle([2, 36, 33, 17]);
        this.cycle([1, 39, 34, 14]);
        this.cycle([0, 42, 35, 11]);
    }

    // --- Rotations ---
    // x: Rotate whole cube on R axis (R face center)
    // Same as R M' L' ?
    // x follows R.
    rotateX() {
        // x = R M' L'
        // R: this.moveR()
        // L': this.moveL() three times
        // M': Middle slice rotation. M is same direction as L. M' is same direction as R.
        // M' affects U, F, D, B faces.
        // U: 1, 4, 7 -> F: 19, 22, 25 -> D: 34, 31, 28 -> B: 46, 49, 52 -> U
        // This is complex to implement directly.
        // For now, we'll implement it as a series of face rotations and slice rotations.
        // A full x rotation is equivalent to:
        // R (CW)
        // L' (CCW)
        // M' (Middle slice, same direction as R)
        this.moveR();
        this.moveL(); this.moveL(); this.moveL(); // L'

        // M' rotation:
        // U (middle column) -> F (middle column) -> D (middle column) -> B (middle column)
        // U: 1, 4, 7
        // F: 19, 22, 25
        // D: 34, 31, 28 (reversed order for D)
        // B: 46, 49, 52 (reversed order for B)
        this.cycle([1, 19, 34, 46]);
        this.cycle([4, 22, 31, 49]);
        this.cycle([7, 25, 28, 52]);
    }

    rotateY() {
        // y: U stays, D stays. F->R->B->L->F
        // U rotates CW
        this.rotateFaceClockwise(0);
        // D rotates CCW (3x CW)
        this.rotateFaceClockwise(27);
        this.rotateFaceClockwise(27);
        this.rotateFaceClockwise(27);

        // Cycle F->R->B->L
        // Rows 1, 2, 3 of each face.
        // Indices: F(18..26), R(9..17), B(45..53), L(36..44)
        // Warning: B is usually "upside down" in some maps, but here we just map 1:1 facelet indices
        // if B is 45(TopL)..53(BotR).
        // Standard y:
        // F1 -> R1, R1 -> B1, B1 -> L1, L1 -> F1
        for (let i = 0; i < 9; i++) {
            this.cycle([18 + i, 9 + i, 45 + i, 36 + i]);
        }
    }

    rotateZ() {
        // z: F stays CW, B stays CCW. U->L->D->R->U
        // F rotates CW
        this.rotateFaceClockwise(18);
        // B rotates CCW (3x CW)
        this.rotateFaceClockwise(45);
        this.rotateFaceClockwise(45);
        this.rotateFaceClockwise(45);

        // Cycle U->L->D->R->U
        // U: 0,1,2,3,4,5,6,7,8
        // L: 36,37,38,39,40,41,42,43,44
        // D: 27,28,29,30,31,32,33,34,35
        // R: 9,10,11,12,13,14,15,16,17
        // This is tricky because the orientation changes.
        // U (top row) -> L (right column) -> D (bottom row, inverted) -> R (left column, inverted) -> U
        // U0, U1, U2 -> L38, L41, L44 (L top-right, mid-right, bot-right)
        // L38, L41, L44 -> D35, D34, D33 (D bot-right, bot-mid, bot-left)
        // D35, D34, D33 -> R11, R14, R17 (R bot-left, mid-left, top-left)
        // R11, R14, R17 -> U0, U1, U2

        // Top row of U (0,1,2) goes to right column of L (38,41,44)
        this.cycle([0, 38, 35, 11]);
        this.cycle([1, 41, 34, 14]);
        this.cycle([2, 44, 33, 17]);

        // Middle row of U (3,4,5) goes to middle column of L (37,40,43)
        this.cycle([3, 37, 32, 10]);
        this.cycle([4, 40, 31, 13]);
        this.cycle([5, 43, 30, 16]);

        // Bottom row of U (6,7,8) goes to left column of L (36,39,42)
        this.cycle([6, 36, 29, 9]);
        this.cycle([7, 39, 28, 12]);
        this.cycle([8, 42, 27, 15]);
    }

    // This `update` method is not standard and might conflict with `applyAlgorithm`.
    // The instruction implies it's for handling 'y' rotations specifically.
    // I will rename it to `applyAlgorithmWithRotations` to avoid confusion.
    applyAlgorithmWithRotations(alg) {
        if (!alg) return;
        const moves = alg.trim().split(/\s+/);
        moves.forEach(m => {
            if (m.toLowerCase().startsWith('y')) {
                // Handle y, y', y2
                if (m === 'y') this.rotateY();
                else if (m === 'y\'') { this.rotateY(); this.rotateY(); this.rotateY(); }
                else if (m === 'y2') { this.rotateY(); this.rotateY(); }
            } else if (m.toLowerCase().startsWith('x')) {
                if (m === 'x') this.rotateX();
                else if (m === 'x\'') { this.rotateX(); this.rotateX(); this.rotateX(); }
                else if (m === 'x2') { this.rotateX(); this.rotateX(); }
            } else if (m.toLowerCase().startsWith('z')) {
                if (m === 'z') this.rotateZ();
                else if (m === 'z\'') { this.rotateZ(); this.rotateZ(); this.rotateZ(); }
                else if (m === 'z2') { this.rotateZ(); this.rotateZ(); }
            }
            else {
                this.move(m);
            }
        });
    }

    // --- Checkers ---

    // Basic Color Getters
    get U() { return 0; }
    get R() { return 9; }
    get F() { return 18; }
    get D() { return 27; }
    get L() { return 36; }
    get B() { return 45; }

    getColor(index) {
        return this.state[index];
    }

    // Get Center Colors
    get centerU() { return this.state[4]; }
    get centerR() { return this.state[13]; }
    get centerF() { return this.state[22]; }
    get centerD() { return this.state[31]; }
    get centerL() { return this.state[40]; }
    get centerB() { return this.state[49]; }

    checkCross() {
        // User Requirement: "Are the 4 white edges at the bottom?"
        // We assume "Bottom" is the D face (indices 27-35).
        // The D edges are indices 28, 30, 32, 34.
        // We also need to check that they align with the side centers (F, R, B, L) for a *solved* cross.
        // But the prompt says "Are the 4 white edges at the bottom?". It implies the permutation matters too usually.
        // Let's assume Valid Cross: White stickers on D edges, and the side stickers match the side centers.

        const white = 'w';

        // 1. Check D edges are White
        const dEdges = [28, 30, 32, 34];
        const dMatch = dEdges.every(i => this.state[i] === white);

        if (!dMatch) return false;

        // 2. Check adjacent stickers match side centers
        // D28 (Top D edge) adj F25 (Bottom F edge) -> F Center (22)
        // D30 (Left D edge) adj L43 (Bottom L edge) -> L Center (40)
        // D32 (Right D edge) adj R16 (Bottom R edge) -> R Center (13)
        // D34 (Bottom D edge) adj B52 (Bottom B edge) -> B Center (49)

        return (
            this.state[25] === this.state[22] && // F edge matches F center
            this.state[43] === this.state[40] && // L edge matches L center
            this.state[16] === this.state[13] && // R edge matches R center
            this.state[52] === this.state[49]    // B edge matches B center
        );
    }

    // --- Granular Status Checkers (For Dynamic Analysis) ---
    getF2LStatus() {
        const cF = this.state[22];
        const cR = this.state[13];
        const cB = this.state[49];
        const cL = this.state[40];
        const cD = this.state[31];

        // Slot FR (Front-Right)
        const fr =
            this.state[26] === cF && this.state[15] === cR && this.state[29] === cD && // Corner
            this.state[23] === cF && this.state[12] === cR;                            // Edge

        // Slot FL (Front-Left)
        const fl =
            this.state[24] === cF && this.state[44] === cL && this.state[27] === cD &&
            this.state[21] === cF && this.state[41] === cL;

        // Slot BL (Back-Left)
        const bl =
            this.state[53] === cB && this.state[42] === cL && this.state[33] === cD &&
            this.state[50] === cB && this.state[39] === cL;

        // Slot BR (Back-Right)
        const br =
            this.state[51] === cB && this.state[17] === cR && this.state[35] === cD &&
            this.state[48] === cB && this.state[14] === cR;

        return { fr, fl, bl, br };
    }

    checkF2L() {
        // "Are the 4 "slots" (corner + edge) in the correct place?"
        if (!this.checkCross()) return false;
        const status = this.getF2LStatus();
        return status.fr && status.fl && status.bl && status.br;
    }

    getCrossCount() {
        const white = 'w'; // Or this.centerU usually, but we assume white D
        // D edges: 28, 30, 32, 34
        // Check if D edge is white AND adj matches center
        // F(25)/F(22), L(43)/L(40), R(16)/R(13), B(52)/B(49)
        const dEdges = [28, 30, 32, 34];
        let count = 0;

        // F Edge
        if (this.state[28] === white && this.state[25] === this.state[22]) count++;
        // L Edge
        if (this.state[30] === white && this.state[43] === this.state[40]) count++;
        // R Edge
        if (this.state[32] === white && this.state[16] === this.state[13]) count++;
        // B Edge
        if (this.state[34] === white && this.state[52] === this.state[49]) count++;

        return count;
    }

    checkOLL() {
        // "Is the top face one solid color?"
        // Usually Yellow if White Cross.
        // We check if all U facelets (0-8) match the U center (4).
        const centerU = this.state[4];
        for (let i = 0; i < 9; i++) {
            if (this.state[i] !== centerU) return false;
        }
        return true;
    }

    checkPLL() {
        // OLL must be solved first
        if (!this.checkOLL()) return false;

        // All side faces must be solved (all stickers on each side face must be the same color as their center)
        // Check F face (18-26)
        const cF = this.centerF;
        for (let i = 18; i <= 26; i++) {
            if (this.state[i] !== cF) return false;
        }
        // Check R face (9-17)
        const cR = this.centerR;
        for (let i = 9; i <= 17; i++) {
            if (this.state[i] !== cR) return false;
        }
        // Check B face (45-53)
        const cB = this.centerB;
        for (let i = 45; i <= 53; i++) {
            if (this.state[i] !== cB) return false;
        }
        // Check L face (36-44)
        const cL = this.centerL;
        for (let i = 36; i <= 44; i++) {
            if (this.state[i] !== cL) return false;
        }

        // If OLL is solved and all side faces are solved, then PLL is solved.
        return true;
    }

    checkSolved() {
        // All faces must be monochromatic and match their center color.
        // U face
        const cU = this.centerU;
        for (let i = 0; i <= 8; i++) {
            if (this.state[i] !== cU) return false;
        }
        // R face
        const cR = this.centerR;
        for (let i = 9; i <= 17; i++) {
            if (this.state[i] !== cR) return false;
        }
        // F face
        const cF = this.centerF;
        for (let i = 18; i <= 26; i++) {
            if (this.state[i] !== cF) return false;
        }
        // D face
        const cD = this.centerD;
        for (let i = 27; i <= 35; i++) {
            if (this.state[i] !== cD) return false;
        }
        // L face
        const cL = this.centerL;
        for (let i = 36; i <= 44; i++) {
            if (this.state[i] !== cL) return false;
        }
        // B face
        const cB = this.centerB;
        for (let i = 45; i <= 53; i++) {
            if (this.state[i] !== cB) return false;
        }
        return true;
    }
}

export default VirtualCube;
