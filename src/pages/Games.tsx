import { useState } from "react";
import { PageHero } from "@/components/PageHero";
import dispetWeb3 from "@/assets/dispet-web-1.png";
import { Activity, Brain, Smile, Clock, Target, Zap, Palette, Puzzle, Dumbbell, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemoryGame } from "@/components/games/MemoryGame";
import { ColorSequenceGame } from "@/components/games/ColorSequenceGame";
import { DailyTraining } from "@/components/games/DailyTraining";

type GameView = 'menu' | 'game-selection' | 'memory' | 'sequence' | 'training';

const Games = () => {
    const [currentView, setCurrentView] = useState<GameView>('menu');

    const renderContent = () => {
        switch (currentView) {
            case 'memory':
                return <MemoryGame onBack={() => setCurrentView('game-selection')} />;
            case 'sequence':
                return <ColorSequenceGame onBack={() => setCurrentView('game-selection')} />;
            case 'training':
                return <DailyTraining onBack={() => setCurrentView('menu')} />;
            case 'game-selection':
                return (
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center mb-8">
                            <Button onClick={() => setCurrentView('menu')} variant="ghost" className="text-gray-600 hover:text-gray-900">
                                <ArrowLeft className="w-6 h-6 mr-2" /> Natrag
                            </Button>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center text-primary mb-12">
                            Odaberi Igru
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    </div>
                );
            default:
                return (
                    <>
                        {/* Intro Header */}
                        <div className="text-center mb-16 space-y-4">
                            <div className="flex justify-center mb-4">
                                <div className="bg-yellow-400 rounded-full p-3 animate-bounce">
                                    <Activity className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary">
                                Dobrodošli u <br className="md:hidden" />
                                Dječji Kutak!
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
                                Mjesto gdje djeca treniraju tijelo i um kroz zabavne igre i vježbe!
                            </p>
                        </div>

                        {/* Cards Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                            {/* Dnevni Trening Card */}
                            <div className="bg-card rounded-2xl p-8 shadow-soft border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 group hover-lift">
                                <div className="flex justify-center mb-6">
                                    <div className="bg-primary rounded-full p-6 transform group-hover:scale-110 transition-transform duration-300">
                                        <Dumbbell className="w-12 h-12 text-primary-foreground" />
                                    </div>
                                </div>

                                <h3 className="text-3xl font-heading font-bold text-center mb-4 text-primary">
                                    Dnevni Trening
                                </h3>

                                <p className="text-center text-muted-foreground mb-8 font-medium">
                                    Personalizirane dnevne vježbe za tebe! Svaki dan nova avantura s AI-generiranim treninzima! 🔄
                                </p>

                                <div className="bg-primary-50 rounded-xl p-6 mb-8 space-y-3">
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Target className="w-5 h-5 text-primary" />
                                        <span className="font-bold">Dob:</span> 6-10 godina
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Clock className="w-5 h-5 text-primary" />
                                        <span className="font-bold">Trajanje:</span> 5-10 minuta
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Zap className="w-5 h-5 text-primary" />
                                        <span className="font-bold">Fokus:</span> Fizička aktivnost
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Activity className="w-5 h-5 text-primary" />
                                        <span className="font-bold">AI-generirano:</span> Svaki dan novo!
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setCurrentView('training')}
                                    className="w-full bg-primary hover:bg-primary/90 text-white text-xl py-6 rounded-full font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
                                >
                                    Počni Trening! 🏃‍♂️
                                </Button>
                            </div>

                            {/* Igre za Mozak Card */}
                            <div className="bg-card rounded-2xl p-8 shadow-soft border-2 border-secondary/20 hover:border-secondary/50 transition-all duration-300 group hover-lift">
                                <div className="flex justify-center mb-6">
                                    <div className="bg-secondary rounded-full p-6 transform group-hover:scale-110 transition-transform duration-300">
                                        <Brain className="w-12 h-12 text-secondary-foreground" />
                                    </div>
                                </div>

                                <h3 className="text-3xl font-heading font-bold text-center mb-4 text-secondary">
                                    Igre za Mozak
                                </h3>

                                <p className="text-center text-muted-foreground mb-8 font-medium">
                                    Zabavne igre koje treniraju pamćenje, koncentraciju i brzo razmišljanje! 🧠
                                </p>

                                <div className="bg-secondary-50 rounded-xl p-6 mb-8 space-y-3">
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Puzzle className="w-5 h-5 text-secondary" />
                                        <span className="font-bold">Memorijske Karte</span> - Pronađi parove!
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Palette className="w-5 h-5 text-secondary" />
                                        <span className="font-bold">Slijed Boja</span> - Simon Says igra!
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Clock className="w-5 h-5 text-secondary" />
                                        <span className="font-bold">Trajanje:</span> 3-7 minuta po igri
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Target className="w-5 h-5 text-secondary" />
                                        <span className="font-bold">Fokus:</span> Pamćenje i fokus
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setCurrentView('game-selection')}
                                    className="w-full bg-secondary hover:bg-secondary/90 text-white text-xl py-6 rounded-full font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
                                >
                                    Pokreni Igre! 🎮
                                </Button>
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
                                    Ovdje možeš trenirati tijelo kroz zabavne vježbe i razvijati svoj mozak kroz pametne igre! Hajde da zajedno budemo zdravi i pametni! 🌟
                                </p>
                            </div>
                        </div>

                        {/* Footer Note */}
                        <div className="text-center mt-16 text-muted-foreground font-medium flex items-center justify-center gap-2">
                            Napravljeno s <span className="text-destructive animate-pulse">❤️</span> za najmlađe sportaše i mozgoljupce
                        </div>
                    </>
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
