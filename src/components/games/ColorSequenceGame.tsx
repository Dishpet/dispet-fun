import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Trophy, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// Import assets for buttons
import yellowBtn from "@/assets/elements/graphic-element (2).png";
import pinkBtn from "@/assets/elements/graphic-element (22).png";
import blueBtn from "@/assets/elements/graphic-element (42).png";
import greenBtn from "@/assets/elements/graphic-element (62).png";

const COLORS = [
    { id: 'yellow', color: 'bg-yellow-400', activeColor: 'bg-yellow-300', img: yellowBtn, sound: 261.63 },
    { id: 'pink', color: 'bg-pink-500', activeColor: 'bg-pink-400', img: pinkBtn, sound: 329.63 },
    { id: 'blue', color: 'bg-blue-500', activeColor: 'bg-blue-400', img: blueBtn, sound: 392.00 },
    { id: 'green', color: 'bg-green-500', activeColor: 'bg-green-400', img: greenBtn, sound: 523.25 }
];

export const ColorSequenceGame = ({ onBack }: { onBack: () => void }) => {
    const [sequence, setSequence] = useState<string[]>([]);
    const [userSequence, setUserSequence] = useState<string[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isUserTurn, setIsUserTurn] = useState(false);
    const [activeColor, setActiveColor] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [message, setMessage] = useState("Pritisni Start za igru!");

    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const playSound = (freq: number) => {
        if (!audioContextRef.current) return;
        const osc = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioContextRef.current.currentTime);
        gain.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioContextRef.current.destination);
        osc.start();
        osc.stop(audioContextRef.current.currentTime + 0.5);
    };

    const startGame = () => {
        setSequence([]);
        setUserSequence([]);
        setScore(0);
        setGameOver(false);
        setIsPlaying(true);
        setMessage("Gledaj pažljivo...");
        addToSequence([]);
    };

    const addToSequence = (currentSeq: string[]) => {
        const colors = ['yellow', 'pink', 'blue', 'green'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const newSeq = [...currentSeq, randomColor];
        setSequence(newSeq);
        playSequence(newSeq);
    };

    const playSequence = async (seq: string[]) => {
        setIsUserTurn(false);
        setMessage("Gledaj pažljivo...");

        for (let i = 0; i < seq.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 800));
            const color = COLORS.find(c => c.id === seq[i]);
            if (color) {
                setActiveColor(seq[i]);
                playSound(color.sound);
                await new Promise(resolve => setTimeout(resolve, 400));
                setActiveColor(null);
            }
        }

        setIsUserTurn(true);
        setMessage("Tvoj red!");
    };

    const handleColorClick = (colorId: string) => {
        if (!isPlaying || !isUserTurn || gameOver) return;

        const color = COLORS.find(c => c.id === colorId);
        if (color) playSound(color.sound);

        setActiveColor(colorId);
        setTimeout(() => setActiveColor(null), 200);

        const newUserSeq = [...userSequence, colorId];
        setUserSequence(newUserSeq);

        // Check correctness
        if (newUserSeq[newUserSeq.length - 1] !== sequence[newUserSeq.length - 1]) {
            // Wrong move
            setGameOver(true);
            setIsPlaying(false);
            setMessage("Krivi potez! 😢");
            if (score > highScore) setHighScore(score);
            return;
        }

        // Check if sequence complete
        if (newUserSeq.length === sequence.length) {
            setScore(prev => prev + 1);
            setUserSequence([]);
            setIsUserTurn(false);
            setMessage("Bravo! Sljedeća razina...");
            setTimeout(() => addToSequence(sequence), 1000);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto text-center">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <Button variant="outline" onClick={onBack} className="self-start">
                    ← Natrag
                </Button>

                <div className="flex items-center gap-6 bg-card p-4 rounded-2xl shadow-soft border border-secondary/20">
                    <div className="flex items-center gap-2 text-secondary font-bold text-xl">
                        <Trophy className="w-6 h-6" />
                        <span>Rezultat: {score}</span>
                    </div>
                    <div className="text-muted-foreground font-medium">
                        Najbolji: {highScore}
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-700 mb-8 animate-pulse">
                {message}
            </h2>

            {/* Game Board */}
            <div className="relative w-80 h-80 md:w-96 md:h-96 mx-auto mb-12">
                {/* Background Circle */}
                <div className="absolute inset-0 rounded-full bg-card shadow-strong border-8 border-muted"></div>

                {/* Center Start Button */}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="bg-white rounded-full p-2 shadow-lg z-20 pointer-events-auto">
                        {!isPlaying ? (
                            <Button
                                onClick={startGame}
                                className="w-24 h-24 rounded-full bg-foreground hover:bg-foreground/90 text-background font-bold text-lg shadow-inner border-4 border-muted"
                            >
                                {gameOver ? <RotateCcw className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                            </Button>
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-foreground flex items-center justify-center text-background font-bold text-2xl shadow-inner border-4 border-muted">
                                {score}
                            </div>
                        )}
                    </div>
                </div>

                {/* Color Buttons */}
                <div className="absolute inset-0 grid grid-cols-2 gap-2 p-4">
                    {COLORS.map((btn) => (
                        <button
                            key={btn.id}
                            onClick={() => handleColorClick(btn.id)}
                            className={cn(
                                "relative w-full h-full rounded-2xl transition-all duration-200 transform active:scale-95 focus:outline-none shadow-md border-b-4 border-black/10",
                                btn.color,
                                activeColor === btn.id ? "brightness-125 scale-95 shadow-inner border-none" : "hover:brightness-110",
                                !isUserTurn && isPlaying && activeColor !== btn.id && "opacity-80 cursor-default"
                            )}
                            disabled={!isUserTurn && isPlaying}
                        >
                            <img
                                src={btn.img}
                                alt={btn.id}
                                className="absolute inset-0 w-full h-full object-contain p-4 opacity-50 pointer-events-none mix-blend-overlay"
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Game Over Modal */}
            {gameOver && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-3xl p-8 max-w-md w-full text-center animate-bounce-in shadow-strong">
                        <div className="bg-destructive w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <RotateCcw className="w-10 h-10 text-destructive-foreground" />
                        </div>
                        <h2 className="text-3xl font-heading font-bold text-foreground mb-2">Kraj Igre!</h2>
                        <p className="text-muted-foreground mb-6">
                            Osvojili ste {score} bodova. Pokušajte ponovno!
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button onClick={onBack} variant="outline">
                                Izbornik
                            </Button>
                            <Button onClick={startGame} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                                Igraj Ponovno
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
