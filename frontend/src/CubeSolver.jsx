// CubeSolver.jsx
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import VirtualCube from './utils/VirtualCube';

// HELPER FUNCTION: Invert Moves
const invertMoves = (moveString) => {
    if (!moveString) return "";
    return moveString
        .trim()
        .split(/\s+/) // Split string into array of moves
        .map((move) => {
            // If move has an apostrophe, remove it
            if (move.includes("'")) {
                return move.replace("'", "");
            }
            // If move has no apostrophe, add one
            return move + "'";
        })
        .reverse() // Reverse the order of the moves
        .join(" "); // Join back into a string
};

// 1. Define the moves first from the backend
const solutionMoves = [
    "U' T' U"
];

// 2. Flatten them into a single string 
const flattenedMoves = solutionMoves.join(" ");

// ============================================
// MOCK BACKEND DATA
// ============================================
const mockSolveData = {
    // Standard 20-move scramble
    initialScramble: invertMoves(flattenedMoves),
    // The Solution broken into Steps (One array item = One Sidebar Update)
    moves: solutionMoves
};

// ============================================
// STEP ANALYZER
// ============================================
const StepAnalyzer = {
    patterns: {
        sexyMove: { pattern: "R U R' U'", name: "Sexy Move", tip: "The most fundamental trigger" },
        antiSexy: { pattern: "U R U' R'", name: "Inverse Sexy", tip: "Reverse of sexy move" },
        sledgehammer: { pattern: "R' F R F'", name: "Sledgehammer", tip: "Corner manipulation" },
        sune: { pattern: "R U R' U R U2 R'", name: "Sune", tip: "Common OLL algorithm" },
        antiSune: { pattern: "R' U' R U' R' U2 R", name: "Anti-Sune", tip: "Mirror of Sune" },
        ollCross: { pattern: "F R U R' U' F'", name: "OLL Cross", tip: "Creates yellow cross" },
        tPerm: { pattern: "R U R' U' R' F R2 U' R' U' R U R' F'", name: "T-Perm", tip: "Headlights on left" },
        insertRight: { pattern: "R U R'", name: "Right Insert", tip: "Basic F2L insertion" },
        insertLeft: { pattern: "L' U' L", name: "Left Insert", tip: "Basic F2L insertion" },
    },

    stages: {
        CROSS: { name: "Cross", color: "#22c55e", icon: "✚", description: "Building the white cross" },
        F2L: { name: "F2L", color: "#3b82f6", icon: "⬛", description: "First two layers" },
        OLL: { name: "OLL", color: "#eab308", icon: "🟨", description: "Orient last layer" },
        PLL: { name: "PLL", color: "#ef4444", icon: "🔄", description: "Permute last layer" },
        AUF: { name: "AUF", color: "#a855f7", icon: "✓", description: "Final alignment" },
    },

    analyzeStep(moves, stepIndex, totalSteps, allMoves, simulatedStage, diff, counts) {
        const normalized = moves.toUpperCase().replace(/\s+/g, ' ').trim();
        const moveCount = this.countMoves(moves);

        // STAGE MUST BE PROVIDED BY SIMULATION
        const stage = simulatedStage || 'Unknown';
        const stageInfo = this.stages[stage] || { name: stage, color: '#94a3b8', icon: '?', description: ' Analyzing...' };

        const recognizedPatterns = [];
        let technique = null;
        const tips = [];

        // PHYSICAL ANALYSIS (Non-Heuristic)
        if (diff) {
            if (stage === 'CROSS' && diff.crossChange > 0) {
                technique = `Solved ${diff.crossChange} Cross Edge${diff.crossChange > 1 ? 's' : ''}`;
            }
            if (diff.f2lChange.fr) technique = "Inserted Front-Right Pair";
            if (diff.f2lChange.fl) technique = "Inserted Front-Left Pair";
            if (diff.f2lChange.br) technique = "Inserted Back-Right Pair";
            if (diff.f2lChange.bl) technique = "Inserted Back-Left Pair";
            if (diff.ollSolved) technique = "Solved OLL";
            if (diff.pllSolved) technique = "Solved PLL";
        }

        // Pattern Fallback
        for (const [key, patternData] of Object.entries(this.patterns)) {
            if (normalized.includes(patternData.pattern.toUpperCase())) {
                recognizedPatterns.push(patternData);
                if (!technique) technique = patternData.name; // Only if not found by physics
                tips.push(patternData.tip);
            }
        }

        const summary = this.generateSummary(stage, stepIndex, totalSteps, technique, counts, diff);
        const detail = this.generateDetail(stage, moves, technique, recognizedPatterns);

        return {
            moves,
            summary,
            detail,
            stage,
            stageInfo,
            moveCount,
            technique,
            recognizedPatterns,
            tips,
            complexity: this.calculateComplexity(moveCount, moves),
            progress: Math.round(((stepIndex + 1) / totalSteps) * 100),
            isFirstStep: stepIndex === 0,
            isLastStep: stepIndex === totalSteps - 1,
            hasRotation: /[xyz]/i.test(moves),
        };
    },

    generateSummary(stage, stepIndex, totalSteps, technique, counts, diff) {
        const stageNames = {
            CROSS: ['White Cross', 'Cross Edge'],
            F2L: ['F2L Pair', 'First Two Layers'],
            OLL: ['OLL', 'Orient Last Layer'],
            PLL: ['PLL', 'Permute Last Layer'],
            AUF: ['AUF', 'Adjust Upper Face'],
        };

        const [name] = stageNames[stage] || ['Step'];

        if (stage === 'CROSS') {
            // Use physical count + 1 to indicate which edge we are working on/solved
            // Clamp to 4
            const num = Math.min(4, (counts?.cross || 0) + (technique && technique.includes('Solved') ? 0 : 1));
            // If we solved it this step, count is X. That means this step was Edge X.
            // If count is X but we didn't solve anything, we are likely setting up Edge X+1.
            const displayNum = counts ? (diff && diff.crossChange > 0 ? counts.cross : counts.cross + 1) : stepIndex + 1;
            const safeNum = Math.min(4, displayNum);
            return `${name} - Edge ${safeNum}`;
        } else if (stage === 'F2L') {
            const pairNum = counts ? (diff && (diff.f2lChange.fr || diff.f2lChange.fl || diff.f2lChange.bl || diff.f2lChange.br) ? counts.f2l : counts.f2l + 1) : (stepIndex - 3);
            const safePair = Math.min(4, Math.max(1, pairNum));
            return `F2L Pair ${safePair}`;
        } else if (technique) {
            return `${stage}: ${technique}`;
        }
        return `${name}`;
    },

    generateDetail(stage, moves, technique, patterns) {
        const details = {
            CROSS: "Solving a cross edge piece to build the white cross foundation.",
            F2L: "Pairing and inserting a corner-edge pair into the correct slot.",
            OLL: "Orienting the last layer pieces to make the top face yellow.",
            PLL: "Permuting the last layer pieces to their solved positions.",
            AUF: "Final alignment turn to complete the solve.",
        };

        let detail = details[stage] || "Executing algorithm.";

        if (technique) {
            detail = `Using ${technique} technique. ${detail}`;
        }

        if (patterns.length > 0) {
            detail += ` Recognized pattern: ${patterns[0].name}.`;
        }

        return detail;
    },

    countMoves(moves) {
        return moves.split(/\s+/).filter(m =>
            m.length > 0 && !['y', "y'", 'y2', 'x', "x'", 'x2', 'z', "z'", 'z2'].includes(m)
        ).length;
    },

    calculateComplexity(count, moves) {
        let score = count;
        if (/[xyz]/i.test(moves)) score += 2;
        if (/[rlfbud]w/i.test(moves)) score += 1;

        if (score <= 4) return { level: "Basic", color: "#22c55e" };
        if (score <= 8) return { level: "Intermediate", color: "#eab308" };
        if (score <= 12) return { level: "Advanced", color: "#f97316" };
        return { level: "Expert", color: "#ef4444" };
    }
};

// ============================================
// MAIN COMPONENT
// ============================================
const CubeSolver = ({ solution }) => {
    const containerRef = useRef(null);
    const playerRef = useRef(null);
    const wrapperRef = useRef(null);
    const animationFrameRef = useRef(null);
    const targetTimestampRef = useRef(null);

    // CUSTOM ENGINE REFS (Single Source of Truth)
    const timestampRef = useRef(0);
    const isPlayingRef = useRef(false);
    const durationRef = useRef(0);
    const speedRef = useRef(1);
    const lastFrameTimeRef = useRef(0);

    // Stale Closure Fixes
    const currentStepRef = useRef(0);
    const stepTimestampsRef = useRef([]);

    // State
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Playback State
    const [currentStep, setCurrentStep] = useState(0);
    const [timestamp, setTimestamp] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);

    // Move Boundaries
    const [stepTimestamps, setStepTimestamps] = useState([]);

    // Virtual Mirror State
    const [cubeState, setCubeState] = useState({ cross: false, f2l: false, oll: false });

    // Data Preparation
    const solveData = {
        initialScramble: invertMoves(solution),
        moves: solutionMoves
    };
    const fullAlgorithm = useMemo(() => solveData.moves.join(' '), [solveData.moves]);
    const totalSteps = solveData.moves.length;

    // Virtual Cube Instance (Ref to persist across renders)
    const virtualCubeRef = useRef(new VirtualCube());

    // Map "Steps" to Leaf Indices
    const stepToLeafIndexMap = useMemo(() => {
        const map = [];
        let cumulative = 0;
        solveData.moves.forEach((moveLine, i) => {
            const count = moveLine.trim().split(/\s+/).length;
            cumulative += count;
            map.push({ stepIndex: i, endLeafIndex: cumulative });
        });
        return map;
    }, [solveData.moves]);

    // Analyze step content with VIRTUAL CUBE SIMULATION
    const analyzedSteps = useMemo(() => {
        const vCube = new VirtualCube();
        vCube.applyAlgorithmWithRotations(solveData.initialScramble); // Start from scramble

        return solveData.moves.map((moves, index) => {
            // State BEFORE
            const prevCross = vCube.getCrossCount();
            const prevF2L = vCube.getF2LStatus();
            const prevOLL = vCube.checkOLL();
            const prevPLL = vCube.checkPLL();

            // Apply this step's moves
            vCube.applyAlgorithmWithRotations(moves);

            // State AFTER
            const cross = vCube.getCrossCount();
            const f2l = vCube.getF2LStatus();
            const isCrossDone = vCube.checkCross();
            const isOLL = vCube.checkOLL();
            const isPLL = vCube.checkPLL();

            // Calculate DIFF
            const diff = {
                crossChange: cross - prevCross,
                f2lChange: {
                    fr: f2l.fr && !prevF2L.fr,
                    fl: f2l.fl && !prevF2L.fl,
                    bl: f2l.bl && !prevF2L.bl,
                    br: f2l.br && !prevF2L.br,
                },
                ollSolved: isOLL && !prevOLL,
                pllSolved: isPLL && !prevPLL,
                isCrossDone,
                isF2LDone: f2l.fr && f2l.fl && f2l.bl && f2l.br
            };

            // Determine Stage Deterministically
            let stage = 'PLL';
            if (!isCrossDone) stage = 'CROSS';
            else if (!diff.isF2LDone) stage = 'F2L';
            else if (!isOLL) stage = 'OLL';

            const f2lCount = [f2l.fr, f2l.fl, f2l.bl, f2l.br].filter(Boolean).length;
            const counts = { cross: cross, f2l: f2lCount };

            // Analyze with helper (passing deterministic stage + DIFF + COUNTS)
            return StepAnalyzer.analyzeStep(moves, index, totalSteps, solveData.moves, stage, diff, counts);
        });
    }, [solveData.moves, totalSteps, solveData.initialScramble]);

    // Initialize TwistyPlayer
    useEffect(() => {
        let isMounted = true;

        const initPlayer = async () => {
            try {
                const { TwistyPlayer } = await import('cubing/twisty');

                if (!containerRef.current || playerRef.current || !isMounted) return;

                const player = new TwistyPlayer({
                    puzzle: '3x3x3',
                    alg: fullAlgorithm,
                    experimentalSetupAlg: solveData.initialScramble,
                    hintFacelets: 'none',
                    controlPanel: 'none',
                    background: 'none',
                    visualization: '3D',
                    tempoScale: 0, // CRITICAL: Disable native playback so we drive it manually
                    experimentalDragInput: 'auto',
                });

                player.style.width = '100%';
                player.style.height = '100%';
                containerRef.current.appendChild(player);
                playerRef.current = player;

                // CUSTOM DRIVER LOOP
                // We drive the player manually to ensure precise control.
                const tick = (time) => {
                    animationFrameRef.current = requestAnimationFrame(tick);

                    if (!player || !isMounted) return;

                    // Calculate Delta
                    const now = performance.now();
                    const delta = now - (lastFrameTimeRef.current || now);
                    lastFrameTimeRef.current = now;

                    // Get Target Timestamp based on CURRENT STEP from REF
                    // If step 0, target 0. If step N, target stepTimestampsRef[N-1]
                    let targetTs = 0;
                    const cStep = currentStepRef.current;
                    const sStamps = stepTimestampsRef.current;

                    if (cStep > 0 && sStamps.length > 0) {
                        const idx = cStep - 1;
                        if (idx < sStamps.length) targetTs = sStamps[idx];
                        else targetTs = durationRef.current; // End
                    }

                    // Smoothly move towards target
                    const currentTs = timestampRef.current;
                    const diff = targetTs - currentTs;

                    // Deadband / Snap
                    if (Math.abs(diff) < 10) {
                        if (currentTs !== targetTs) {
                            timestampRef.current = targetTs;
                            setTimestamp(targetTs); // Sync UI
                            if (player.experimentalModel) player.experimentalModel.timestampRequest.set(targetTs);
                            else player.timestamp = targetTs;
                        }

                        // AUTO-ADVANCE LOGIC (Loop-Driven)
                        // If we are playing and have reached the target (the end of the current step), add a delay then go next.
                        if (isPlayingRef.current) {
                            const now = performance.now();
                            if (!lastFrameTimeRef.currentStepFinishTime) {
                                lastFrameTimeRef.currentStepFinishTime = now;
                            }

                            // Wait 500ms? or speed based?
                            // Let's say 200ms pause between steps for clarity?
                            if (now - lastFrameTimeRef.currentStepFinishTime > (200 / (speedRef.current || 1))) {
                                // Trigger Next Step
                                if (currentStepRef.current < totalSteps) {
                                    setCurrentStep(s => s + 1);
                                    lastFrameTimeRef.currentStepFinishTime = 0; // Reset timer
                                } else {
                                    // End of solve
                                    setIsPlaying(false);
                                    isPlayingRef.current = false;
                                }
                            }
                        } else {
                            lastFrameTimeRef.currentStepFinishTime = 0;
                        }

                    } else {
                        // Interpolate
                        lastFrameTimeRef.currentStepFinishTime = 0; // Reset finish timer if moving

                        // Speed factor: 5ms per frame * speed
                        const direction = Math.sign(diff);
                        const stepSize = delta * speedRef.current;
                        let nextTs = currentTs + direction * Math.min(Math.abs(diff), stepSize);

                        timestampRef.current = nextTs;
                        setTimestamp(nextTs); // Sync UI

                        // Push to Player
                        if (player.experimentalModel) player.experimentalModel.timestampRequest.set(nextTs);
                        else player.timestamp = nextTs;
                    }
                };

                lastFrameTimeRef.current = performance.now();
                animationFrameRef.current = requestAnimationFrame(tick);

                // Indexer
                const waitForIndexer = async () => {
                    try {
                        // Wait briefly for model
                        await new Promise(r => setTimeout(r, 100));

                        if (!player.experimentalModel || !player.experimentalModel.indexer) {
                            throw new Error("Model not ready");
                        }

                        const indexer = await player.experimentalModel.indexer.get();

                        const stamps = stepToLeafIndexMap.map(item => {
                            const mIdx = item.endLeafIndex - 1;
                            if (mIdx < 0) return 0;
                            try {
                                const start = indexer.indexToMoveStartTimestamp(mIdx);
                                const dur = indexer.moveDuration(mIdx);
                                return start + dur;
                            } catch (err) {
                                return 0;
                            }
                        });

                        const validStamps = stamps.filter(s => s > 0);
                        const totalDur = validStamps.length > 0 ? validStamps[validStamps.length - 1] : 5000;

                        if (isMounted) {
                            // CRITICAL FIX: Save the calculated timestamps!
                            // If stamps look invalid (e.g. all 0), force fallback
                            if (validStamps.length < stepToLeafIndexMap.length) {
                                throw new Error("Indexer returned invalid timestamps");
                            }
                            setStepTimestamps(stamps);
                            stepTimestampsRef.current = stamps; // Sync Ref
                            setDuration(totalDur);
                            durationRef.current = totalDur;
                            setIsLoaded(true);
                        }
                    } catch (e) {
                        console.warn("Indexer failed or timed out, using fallback timestamps", e);
                        // FALLBACK: 1.5s per step
                        const fallbackStamps = stepToLeafIndexMap.map((_, i) => (i + 1) * 1500);
                        if (isMounted) {
                            setStepTimestamps(fallbackStamps);
                            stepTimestampsRef.current = fallbackStamps; // Sync Ref
                            setDuration(fallbackStamps[fallbackStamps.length - 1]);
                            durationRef.current = fallbackStamps[fallbackStamps.length - 1];
                            setIsLoaded(true);
                        }
                    }
                };
                waitForIndexer();

            } catch (error) {
                console.error('Failed to load cubing.js:', error);
                setLoadError(error.message);
            }
        };

        initPlayer();

        return () => {
            isMounted = false;
            cancelAnimationFrame(animationFrameRef.current);
            if (playerRef.current && containerRef.current) {
                playerRef.current.pause();
                containerRef.current.innerHTML = '';
                playerRef.current = null;
            }
        };
    }, [fullAlgorithm, solveData.initialScramble]); // eslint-disable-line react-hooks/exhaustive-deps

    // Speed effect
    useEffect(() => {
        speedRef.current = speed; // Sync for loop
        if (playerRef.current) playerRef.current.tempoScale = 0; // Disable native playback
    }, [speed]);

    // Sync Duration Ref
    useEffect(() => {
        durationRef.current = duration;
    }, [duration]);



    // VIRTUAL MIRROR LOGIC (Only on Step Change)
    useEffect(() => {
        // Sync Ref for Loop
        currentStepRef.current = currentStep;

        // Re-calculate state based on Current Step
        // We do this by resetting and re-applying moves up to currentStep.
        const vCube = new VirtualCube();

        // 1. Apply Scramble
        vCube.applyAlgorithmWithRotations(solveData.initialScramble);

        // 2. Apply moves up to current step
        const movesToApply = solveData.moves.slice(0, currentStep).join(' ');
        vCube.applyAlgorithmWithRotations(movesToApply);

        // 3. Check Flags
        setCubeState({
            cross: vCube.checkCross(),
            f2l: vCube.checkF2L(),
            oll: vCube.checkOLL(),
            isSolved: vCube.checkSolved()
        });
    }, [currentStep, solveData.initialScramble, solveData.moves]);

    // --- Controls ---

    const togglePlay = useCallback(() => {
        // Just toggle state, the LOOP handles the auto-advance now.
        const newPlaying = !isPlaying;
        setIsPlaying(newPlaying);
        isPlayingRef.current = newPlaying;
    }, [isPlaying]);

    const handleStepForward = useCallback(() => {
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        setIsPlaying(false);
        isPlayingRef.current = false;
    }, [totalSteps]);

    const handleStepBackward = useCallback(() => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
        setIsPlaying(false);
        isPlayingRef.current = false;
    }, []);

    const handleReset = useCallback(() => {
        setCurrentStep(0);
        setIsPlaying(false);
        isPlayingRef.current = false;
    }, []);

    const handleJumpToEnd = useCallback(() => {
        setCurrentStep(totalSteps);
        setIsPlaying(false);
        isPlayingRef.current = false;
    }, [totalSteps]);

    const handleTimelineChange = useCallback((e) => {
        const stepVal = parseInt(e.target.value, 10);
        setCurrentStep(stepVal);
        setIsPlaying(false);
        isPlayingRef.current = false;
    }, []);

    // Fullscreen
    const toggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await wrapperRef.current?.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => {
        const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleChange);
        return () => document.removeEventListener('fullscreenchange', handleChange);
    }, []);

    // Get active info for sidebar
    // If step is 0, we are at start (no step info). 
    // If step is 1, we show info for analyzedSteps[0].
    const activeStepInfo = currentStep > 0 ? analyzedSteps[currentStep - 1] : null;

    // Styles (Unchanged)
    const styles = {
        wrapper: {
            width: '100%',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            color: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        },
        header: {
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(10px)',
        },
        title: {
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 700,
            background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        },
        subtitle: { margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#94a3b8' },
        badge: {
            padding: '0.5rem 1rem',
            background: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '9999px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            fontSize: '0.875rem',
        },
        iconButton: {
            padding: '0.625rem',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '0.5rem',
            color: '#f8fafc',
            cursor: 'pointer',
            fontSize: '1.125rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        progressBar: { height: '4px', background: 'rgba(255,255,255,0.1)' },
        progressFill: {
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #d946ef)',
            transition: 'width 0.3s ease',
        },
        mainContent: { flex: 1, display: 'flex', minHeight: 0 },
        cubeStage: {
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
        },
        infoPanel: {
            width: '340px',
            padding: '1.5rem',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
        },
        controlBar: {
            padding: '1.25rem 2rem',
            background: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
        },
        timeline: { display: 'flex', alignItems: 'center', gap: '1rem' },
        timelineSlider: {
            flex: 1,
            height: '6px',
            appearance: 'none',
            WebkitAppearance: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            outline: 'none',
        },
        controlsRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
        },
        speedControl: { display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '200px' },
        playbackControls: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
        navButton: {
            padding: '0.75rem 1.25rem',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '0.75rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: 'rgba(255,255,255,0.1)',
            color: '#f8fafc',
        },
        playButton: {
            padding: '0.875rem 2rem',
            border: 'none',
            borderRadius: '1rem',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
        },
    };

    if (loadError) {
        return (
            <div style={{ ...styles.wrapper, alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <h2 style={{ color: '#ef4444' }}>Failed to load cube visualizer</h2>
                    <p style={{ color: '#94a3b8' }}>{loadError}</p>
                </div>
            </div>
        );
    }

    const progressPercent = duration > 0 ? (timestamp / duration) * 100 : 0;

    return (
        <div ref={wrapperRef} style={styles.wrapper}>
            <style>{`
                twisty-player { --background: transparent !important; }
                twisty-player::part(wrapper) { background: transparent !important; }
            `}</style>

            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>Cube Solver</h1>
                    <p style={styles.subtitle}>Step-by-step solution • CFOP Method</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={styles.badge}>
                        {currentStep === 0 ? 'Scrambled' : `Step ${currentStep} of ${totalSteps}`}
                    </div>
                    {currentStep > 0 && stepToLeafIndexMap[currentStep - 1] && (
                        <div style={{ ...styles.badge, background: 'rgba(168, 85, 247, 0.2)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
                            Move {stepToLeafIndexMap[currentStep - 1].endLeafIndex} / {stepToLeafIndexMap[stepToLeafIndexMap.length - 1].endLeafIndex}
                        </div>
                    )}
                    <button onClick={toggleFullscreen} style={styles.iconButton}>
                        {isFullscreen ? '⊙' : '⛶'}
                    </button>
                </div>
            </header>

            <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
            </div>

            <div style={styles.mainContent}>
                <div style={styles.cubeStage}>
                    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {!isLoaded && (
                            <div style={{ color: '#94a3b8', textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🧊</div>
                                <p>Loading cube...</p>
                            </div>
                        )}
                    </div>
                </div>

                <aside style={styles.infoPanel}>
                    {currentStep === 0 ? (
                        <InitialStatePanel solveData={solveData} totalSteps={totalSteps} analyzedSteps={analyzedSteps} />
                    ) : activeStepInfo ? (
                        <StepInfoPanel
                            stepInfo={activeStepInfo}
                            stepIndex={currentStep - 1}
                            totalSteps={totalSteps}
                            cubeState={cubeState}
                        />
                    ) : null}
                </aside>
            </div>

            <div style={styles.controlBar}>
                <div style={styles.timeline}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', minWidth: '3rem' }}>
                        Step {currentStep}
                    </span>
                    <input
                        type="range"
                        min={0}
                        max={totalSteps}
                        value={currentStep}
                        onChange={handleTimelineChange}
                        step="1"
                        style={{
                            ...styles.timelineSlider,
                            background: `linear-gradient(to right, #8b5cf6 ${(currentStep / totalSteps) * 100}%, rgba(255,255,255,0.2) ${(currentStep / totalSteps) * 100}%)`,
                        }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', minWidth: '3rem', textAlign: 'right' }}>
                        {totalSteps}
                    </span>
                </div>

                <div style={styles.controlsRow}>
                    <div style={styles.speedControl}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Speed</span>
                        <input
                            type="range"
                            min={0.25}
                            max={3}
                            step={0.25}
                            value={speed}
                            onChange={(e) => setSpeed(parseFloat(e.target.value))}
                            style={{ width: '100px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#f8fafc', background: 'rgba(139, 92, 246, 0.3)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                            {speed}x
                        </span>
                    </div>

                    <div style={styles.playbackControls}>
                        <button onClick={handleReset} style={{ ...styles.iconButton, fontSize: '1.25rem' }} title="Reset">⟲</button>
                        <button onClick={handleStepBackward} style={styles.navButton}>← Prev</button>
                        <button
                            onClick={togglePlay}
                            style={{
                                ...styles.playButton,
                                background: isPlaying ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                color: '#ffffff',
                                boxShadow: isPlaying ? '0 0 30px rgba(239, 68, 68, 0.4)' : '0 0 30px rgba(139, 92, 246, 0.4)',
                            }}
                        >
                            {isPlaying ? '⏸ Pause' : '▶ Play'}
                        </button>
                        <button onClick={handleStepForward} style={styles.navButton}>Next →</button>
                        <button onClick={handleJumpToEnd} style={{ ...styles.iconButton, fontSize: '1.25rem' }} title="Jump to end">⏭</button>
                    </div>

                    <div style={{ minWidth: '200px' }} />
                </div>
            </div>
        </div>
    );
};

// ============================================
// SUB-COMPONENTS
// ============================================
const InitialStatePanel = ({ solveData, totalSteps, analyzedSteps }) => (
    <>
        <div style={{ padding: '1rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))', borderRadius: '1rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: '#60a5fa' }}>🎲 Scramble</h3>
            <code style={{ display: 'block', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#e2e8f0', wordBreak: 'break-all' }}>
                {solveData.initialScramble}
            </code>
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.7 }}>
            Click <strong style={{ color: '#f8fafc' }}>Play</strong> or <strong style={{ color: '#f8fafc' }}>Next</strong> to start the solution.
        </p>

        <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '0.75rem', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <h4 style={{ margin: '0 0 0.75rem', color: '#4ade80', fontSize: '0.875rem' }}>📊 Solution Overview</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ade80' }}>{totalSteps}</div>
                    <div style={{ fontSize: '0.65rem', color: '#86efac' }}>Steps</div>
                </div>
                <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#60a5fa' }}>CFOP</div>
                    <div style={{ fontSize: '0.65rem', color: '#93c5fd' }}>Method</div>
                </div>
            </div>
        </div>

        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem' }}>
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Solution Steps Preview</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {analyzedSteps.slice(0, 6).map((step, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem'
                    }}>
                        <span style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: step.stageInfo.color + '33',
                            border: `1px solid ${step.stageInfo.color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6rem',
                            color: step.stageInfo.color
                        }}>
                            {i + 1}
                        </span>
                        <span style={{ color: '#cbd5e1', flex: 1 }}>{step.summary}</span>
                        <code style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{step.moveCount}m</code>
                    </div>
                ))}
                {totalSteps > 6 && (
                    <div style={{ color: '#64748b', fontSize: '0.7rem', textAlign: 'center', padding: '0.25rem' }}>
                        + {totalSteps - 6} more steps...
                    </div>
                )}
            </div>
        </div>
    </>
);

const StepInfoPanel = ({ stepInfo, stepIndex, totalSteps, cubeState }) => (
    <>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: `${stepInfo.stageInfo.color}22`, borderRadius: '9999px', border: `1px solid ${stepInfo.stageInfo.color}44`, alignSelf: 'flex-start' }}>
            <span>{stepInfo.stageInfo.icon}</span>
            <span style={{ color: stepInfo.stageInfo.color, fontWeight: 600, fontSize: '0.875rem' }}>{stepInfo.stage}</span>
        </div>

        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>{stepInfo.summary}</h2>

        <div style={{ padding: '0.75rem 1rem', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '0.75rem', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <div style={{ fontSize: '0.7rem', color: '#a78bfa', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Algorithm</div>
            <code style={{ display: 'block', fontSize: '1.1rem', color: '#e2e8f0', fontWeight: 500, fontFamily: "'JetBrains Mono', monospace" }}>{stepInfo.moves}</code>
        </div>

        <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.7 }}>{stepInfo.detail}</p>

        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem' }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Current Phase</h4>
            <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.875rem' }}>{stepInfo.stageInfo.description}</p>
        </div>

        {stepInfo.technique && (
            <div style={{ padding: '1rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '0.75rem', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                <h4 style={{ margin: '0 0 0.5rem', color: '#fbbf24', fontSize: '0.875rem' }}>💡 Technique: {stepInfo.technique}</h4>
                {stepInfo.tips.slice(0, 2).map((tip, i) => (
                    <p key={i} style={{ margin: i === 0 ? 0 : '0.5rem 0 0', color: '#fde68a', fontSize: '0.8rem' }}>• {tip}</p>
                ))}
            </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <div style={{ padding: '0.75rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#60a5fa' }}>{stepInfo.moveCount}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Moves</div>
            </div>
            <div style={{ padding: '0.75rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: stepInfo.complexity.color }}>{stepInfo.complexity.level}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Difficulty</div>
            </div>
            <div style={{ padding: '0.75rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#a78bfa' }}>{stepInfo.progress}%</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Progress</div>
            </div>
        </div>

        {/* Step navigation indicator */}
        <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Step {stepIndex + 1} of {totalSteps}</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{stepInfo.progress}% Complete</span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    width: `${stepInfo.progress}%`,
                    background: `linear-gradient(90deg, ${stepInfo.stageInfo.color}, #8b5cf6)`,
                    transition: 'width 0.3s ease'
                }} />
            </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Virtual Mirror Checks</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <div style={{
                    padding: '0.5rem',
                    background: cubeState?.cross ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    border: cubeState?.cross ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid transparent'
                }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: cubeState?.cross ? '#4ade80' : '#64748b' }}>Cross</div>
                    <div style={{ fontSize: '1rem' }}>{cubeState?.cross ? '✅' : '⬜'}</div>
                </div>
                <div style={{
                    padding: '0.5rem',
                    background: cubeState?.f2l ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    border: cubeState?.f2l ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent'
                }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: cubeState?.f2l ? '#60a5fa' : '#64748b' }}>F2L</div>
                    <div style={{ fontSize: '1rem' }}>{cubeState?.f2l ? '✅' : '⬜'}</div>
                </div>
                <div style={{
                    padding: '0.5rem',
                    background: cubeState?.oll ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    border: cubeState?.oll ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid transparent'
                }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: cubeState?.oll ? '#facc15' : '#64748b' }}>OLL</div>
                    <div style={{ fontSize: '1rem' }}>{cubeState?.oll ? '✅' : '⬜'}</div>
                </div>
            </div>
        </div>

        {stepInfo.isLastStep && (
            <div style={{ padding: '1.25rem', background: cubeState?.isSolved ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))' : 'rgba(255,255,255,0.05)', borderRadius: '0.75rem', border: cubeState?.isSolved ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem' }}>{cubeState?.isSolved ? '🎉' : '🏁'}</div>
                <h3 style={{ margin: '0.5rem 0 0.25rem', color: cubeState?.isSolved ? '#4ade80' : '#e2e8f0', fontSize: '1.1rem' }}>{cubeState?.isSolved ? 'Cube Solved!' : 'Sequence Finished'}</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: cubeState?.isSolved ? '#86efac' : '#94a3b8' }}>
                    {cubeState?.isSolved ? `All ${totalSteps} steps completed.` : 'Cube is not fully solved.'}
                </p>
            </div>
        )}
    </>
);

export default CubeSolver;