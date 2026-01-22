import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

// Import assets for cards
import card1 from "@/assets/elements/graphic-element (4).png";
import card2 from "@/assets/elements/graphic-element (14).png";
import card3 from "@/assets/elements/graphic-element (24).png";
import card4 from "@/assets/elements/graphic-element (34).png";
import card5 from "@/assets/elements/graphic-element (44).png";
import card6 from "@/assets/elements/graphic-element (54).png";
import card7 from "@/assets/elements/graphic-element (64).png";
import card8 from "@/assets/elements/graphic-element (74).png";

const CARD_IMAGES = [card1, card2, card3, card4, card5, card6, card7, card8];

interface Card {
    id: number;
    imageId: number;
    isFlipped: boolean;
    isMatched: boolean;
}

export const MemoryGame = ({ onBack }: { onBack: () => void }) => {
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [matches, setMatches] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameWon, setGameWon] = useState(false);

    // Initialize game
    useEffect(() => {
        startNewGame();
    }, []);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && !gameWon) {
            interval = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, gameWon]);

    const startNewGame = () => {
        const newCards: Card[] = [];
        // Create pairs
        CARD_IMAGES.forEach((img, index) => {
            newCards.push({ id: index * 2, imageId: index, isFlipped: false, isMatched: false });
            newCards.push({ id: index * 2 + 1, imageId: index, isFlipped: false, isMatched: false });
        });

        // Shuffle
        for (let i = newCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
        }

        setCards(newCards);
        setFlippedCards([]);
        setMoves(0);
        setMatches(0);
        setTimer(0);
        setIsPlaying(true);
        setGameWon(false);
    };

    const handleCardClick = (id: number) => {
        if (!isPlaying || gameWon) return;

        // Find card index
        const cardIndex = cards.findIndex(c => c.id === id);
        const card = cards[cardIndex];

        // Ignore if already flipped or matched
        if (card.isFlipped || card.isMatched) return;

        // Ignore if 2 cards already flipped
        if (flippedCards.length >= 2) return;

        // Flip card
        const newCards = [...cards];
        newCards[cardIndex].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedCards, id];
        setFlippedCards(newFlipped);

        // Check match if 2 cards flipped
        if (newFlipped.length === 2) {
            setMoves(prev => prev + 1);
            checkForMatch(newFlipped, newCards);
        }
    };

    const checkForMatch = (flippedIds: number[], currentCards: Card[]) => {
        const card1 = currentCards.find(c => c.id === flippedIds[0]);
        const card2 = currentCards.find(c => c.id === flippedIds[1]);

        if (card1 && card2 && card1.imageId === card2.imageId) {
            // Match found
            setTimeout(() => {
                setCards(prev => prev.map(c =>
                    flippedIds.includes(c.id) ? { ...c, isMatched: true } : c
                ));
                setFlippedCards([]);
                setMatches(prev => {
                    const newMatches = prev + 1;
                    if (newMatches === CARD_IMAGES.length) {
                        setGameWon(true);
                        setIsPlaying(false);
                    }
                    return newMatches;
                });
            }, 500);
        } else {
            // No match
            setTimeout(() => {
                setCards(prev => prev.map(c =>
                    flippedIds.includes(c.id) ? { ...c, isFlipped: false } : c
                ));
                setFlippedCards([]);
            }, 1000);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <Button variant="outline" onClick={onBack} className="self-start">
                    ← Natrag
                </Button>

                <div className="flex items-center gap-6 bg-card p-4 rounded-2xl shadow-soft border border-primary/20">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <RotateCcw className="w-5 h-5" />
                        <span>Potezi: {moves}</span>
                    </div>
                    <div className="flex items-center gap-2 text-secondary font-bold">
                        <Timer className="w-5 h-5" />
                        <span>Vrijeme: {formatTime(timer)}</span>
                    </div>
                </div>

                <Button
                    onClick={startNewGame}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
                >
                    Nova Igra
                </Button>
            </div>

            {/* Game Grid */}
            <div className="grid grid-cols-4 gap-3 md:gap-4 aspect-square md:aspect-video max-w-2xl mx-auto">
                {cards.map((card) => (
                    <div
                        key={card.id}
                        onClick={() => handleCardClick(card.id)}
                        className={cn(
                            "relative cursor-pointer transition-all duration-500 transform preserve-3d aspect-square",
                            card.isFlipped || card.isMatched ? "rotate-y-180" : "hover:scale-105"
                        )}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Front (Hidden) */}
                        <div className={cn(
                            "absolute inset-0 w-full h-full bg-gradient-to-br from-primary to-secondary rounded-xl shadow-md flex items-center justify-center backface-hidden",
                            (card.isFlipped || card.isMatched) && "opacity-0 pointer-events-none"
                        )}>
                            <span className="text-4xl text-white/50">?</span>
                        </div>

                        {/* Back (Revealed) */}
                        <div className={cn(
                            "absolute inset-0 w-full h-full bg-card border-2 border-primary/30 rounded-xl shadow-md flex items-center justify-center backface-hidden rotate-y-180",
                            !(card.isFlipped || card.isMatched) && "opacity-0"
                        )}>
                            <img
                                src={CARD_IMAGES[card.imageId]}
                                alt="card"
                                className="w-3/4 h-3/4 object-contain"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Win Modal Overlay */}
            {gameWon && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-3xl p-8 max-w-md w-full text-center animate-bounce-in shadow-strong">
                        <div className="bg-accent w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trophy className="w-10 h-10 text-accent-foreground" />
                        </div>
                        <h2 className="text-3xl font-heading font-bold text-foreground mb-2">Čestitamo! 🎉</h2>
                        <p className="text-muted-foreground mb-6">
                            Završili ste igru u {moves} poteza i {formatTime(timer)}!
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button onClick={onBack} variant="outline">
                                Izbornik
                            </Button>
                            <Button onClick={startNewGame} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                Igraj Ponovno
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
        </div>
    );
};
