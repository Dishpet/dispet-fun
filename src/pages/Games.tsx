import { useState } from "react";
import { PageHero } from "@/components/PageHero";
import dispetWeb3 from "@/assets/dispet-web-1.png";
import { Puzzle, Palette, Smile } from "lucide-react";
import { MemoryGame } from "@/components/games/MemoryGame";
import { ColorSequenceGame } from "@/components/games/ColorSequenceGame";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type GameView = 'menu' | 'memory' | 'sequence';

const Games = () => {
    const [currentView, setCurrentView] = useState<GameView>('menu');

    const renderContent = () => {
        switch (currentView) {
            case 'memory':
                return <MemoryGame onBack={() => setCurrentView('menu')} />;
            case 'sequence':
                return <ColorSequenceGame onBack={() => setCurrentView('menu')} />;
            default:
                // Game Selection Menu (default landing page)
                return (
                    <div className="max-w-4xl mx-auto">
                        {/* Intro Header */}
                        <div className="text-center mb-12 space-y-4">
                            <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary">
                                Odaberi Igru
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
                                Zabavne igre koje treniraju pamćenje, koncentraciju i brzo razmišljanje! 🧠
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                            {/* Memory Game Selection */}
                            <div
                                onClick={() => setCurrentView('memory')}
                                className="bg-card rounded-2xl p-8 shadow-soft border-2 border-primary/20 hover:border-primary/50 cursor-pointer transition-all duration-300 group hover-lift"
                            >
                                <div className="flex justify-center mb-6">
                                    <div className="bg-primary rounded-full p-6 transform group-hover:scale-110 transition-transform duration-300">
                                        <Puzzle className="w-12 h-12 text-primary-foreground" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-heading font-bold text-center mb-2 text-primary">Memorijske Karte</h3>
                                <p className="text-center text-muted-foreground">Pronađi parove i testiraj svoje pamćenje!</p>
                            </div>

                            {/* Color Sequence Selection */}
                            <div
                                onClick={() => setCurrentView('sequence')}
                                className="bg-card rounded-2xl p-8 shadow-soft border-2 border-secondary/20 hover:border-secondary/50 cursor-pointer transition-all duration-300 group hover-lift"
                            >
                                <div className="flex justify-center mb-6">
                                    <div className="bg-secondary rounded-full p-6 transform group-hover:scale-110 transition-transform duration-300">
                                        <Palette className="w-12 h-12 text-secondary-foreground" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-heading font-bold text-center mb-2 text-secondary">Slijed Boja</h3>
                                <p className="text-center text-muted-foreground">Ponovi slijed boja i zvukova!</p>
                            </div>
                        </div>

                        {/* Bottom Welcome Box */}
                        <div className="bg-card rounded-2xl p-8 shadow-soft border-2 border-accent/20 flex flex-col md:flex-row items-center gap-8">
                            <div className="bg-accent rounded-full p-6 shrink-0">
                                <Smile className="w-12 h-12 text-accent-foreground" />
                            </div>
                            <div className="text-center md:text-left space-y-2">
                                <h2 className="text-2xl font-heading font-bold text-accent-foreground">
                                    Dobrodošli u Dječji Kutak!
                                </h2>
                                <p className="text-gray-600 font-medium">
                                    Ovdje možeš razvijati svoj mozak kroz pametne igre! Hajde da zajedno budemo zdravi i pametni! 🌟
                                </p>
                            </div>
                        </div>

                        {/* Footer Note */}
                        <div className="text-center mt-16 text-muted-foreground font-medium flex items-center justify-center gap-2">
                            Napravljeno s <span className="text-destructive animate-pulse">❤️</span> za najmlađe sportaše i mozgoljupce
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <PageHero title="DJEČJI KUTAK" characterImage={dispetWeb3} />

            <div className="container px-4 py-12 md:py-16 max-w-6xl mx-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default Games;
