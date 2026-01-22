import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, ChevronLeft, Loader2, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Import reference images
import rokoDresMase from "@/assets/ROKO-dres-mase.png";
import rokoDresCool from "@/assets/ROKO-dres-cool.png";

interface Exercise {
    id: number;
    title: string;
    description: string;
    instructions: string[];
    duration: string;
    prompt: string;
}

const EXERCISES: Exercise[] = [
    {
        id: 1,
        title: "Majmunski Skokovi",
        description: "Skači visoko kao sretni majmun!",
        instructions: [
            "Čučni dolje, stavi ruke na pod i skoči naprijed kao majmun!",
            "Nastavi skakati i kretati se po sobi.",
            "Pazi da imaš dovoljno mjesta!"
        ],
        duration: "1 minuta",
        prompt: "jumping high like a monkey, hands in the air, happy expression, dynamic pose"
    },
    {
        id: 2,
        title: "Rakova Šetnja",
        description: "Hodaj postrance i unazad kao rak na plaži!",
        instructions: [
            "Sjedni na pod, stavi ruke iza leđa i podigni guzu.",
            "Hodaj na rukama i nogama, ali unazad ili u stranu!",
            "Pokušaj držati guzu visoko u zraku."
        ],
        duration: "1 minuta",
        prompt: "doing a crab walk exercise, hands and feet on floor, body facing up, funny and cute pose"
    },
    {
        id: 3,
        title: "Avion",
        description: "Leti mirno i stabilno kao avion!",
        instructions: [
            "Stani na jednu nogu.",
            "Raširi ruke kao krila i nagni se naprijed.",
            "Pokušaj zadržati ravnotežu što duže možeš, pa zamijeni nogu!"
        ],
        duration: "1 minuta",
        prompt: "balancing on one leg with arms spread out like an airplane, focused expression, stable pose"
    }
];

export const DailyTraining = ({ onBack }: { onBack: () => void }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});
    const [isGenerating, setIsGenerating] = useState(false);

    const currentExercise = EXERCISES.find(e => e.id === currentStep) || EXERCISES[0];

    // Helper to convert image URL to Base64
    const imageUrlToBase64 = async (url: string): Promise<string> => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const generateImage = async (exercise: Exercise) => {
        if (generatedImages[exercise.id]) return;

        setIsGenerating(true);
        try {
            const { generateImageWithGemini } = await import("@/integrations/gemini/client");
            // Simple prompt construction for training
            const trainingPrompt = `Cartoon 3D render of a donkey character named Roko doing exercise: ${exercise.prompt}. White or simple background. High quality, cute, energetic.`;

            const base64Image = await generateImageWithGemini(trainingPrompt, "{prompt}"); // Pass through prompt directly

            if (base64Image) {
                setGeneratedImages(prev => ({
                    ...prev,
                    [exercise.id]: base64Image
                }));
            }
        } catch (error) {
            console.error('Error generating image:', error);
            toast.error("Ups! Nismo uspjeli generirati sliku. Provjerite postavke.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Generate image when step changes
    useEffect(() => {
        generateImage(currentExercise);
    }, [currentStep]);

    const handleNext = () => {
        if (currentStep < EXERCISES.length) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Finish training
            toast.success("Bravo! Trening završen! 🎉");
            onBack();
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between mb-8">
                <Button onClick={onBack} variant="ghost" className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-6 h-6 mr-2" /> Natrag
                </Button>
                <h2 className="text-2xl font-bold text-blue-500" style={{ fontFamily: 'Bubblegum Sans, cursive' }}>
                    Dnevni Trening
                </h2>
                <div className="w-24"></div> {/* Spacer for centering */}
            </div>

            {/* Progress Bar */}
            <div className="bg-card rounded-2xl p-6 shadow-soft border border-primary/20 mb-8">
                <div className="flex justify-between items-center relative">
                    {/* Progress Line */}
                    <div className="absolute left-0 right-0 top-1/2 h-1 bg-muted -z-10 rounded-full" />
                    <div
                        className="absolute left-0 top-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-500"
                        style={{ width: `${((currentStep - 1) / (EXERCISES.length - 1)) * 100}%` }}
                    />

                    {EXERCISES.map((ex) => (
                        <div key={ex.id} className="flex flex-col items-center gap-2 bg-card px-2">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${currentStep >= ex.id
                                    ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                                    : 'bg-muted text-muted-foreground'
                                    }`}
                            >
                                {ex.id}
                            </div>
                            <span className={`text-sm font-medium ${currentStep >= ex.id ? 'text-primary' : 'text-muted-foreground'}`}>
                                Vježba {ex.id}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-card rounded-2xl p-8 shadow-strong border-2 border-primary/20 relative overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl shadow-md">
                        {currentExercise.id}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary">
                        {currentExercise.title}
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Image Section */}
                    <div className="aspect-square bg-accent/20 rounded-2xl border-4 border-accent/30 flex items-center justify-center relative overflow-hidden shadow-inner group">
                        {isGenerating && !generatedImages[currentExercise.id] ? (
                            <div className="flex flex-col items-center gap-4 text-accent-foreground">
                                <Loader2 className="w-12 h-12 animate-spin" />
                                <span className="font-medium animate-pulse">Roko se priprema...</span>
                            </div>
                        ) : generatedImages[currentExercise.id] ? (
                            <img
                                src={generatedImages[currentExercise.id]}
                                alt={currentExercise.title}
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-accent-foreground/50">
                                <Loader2 className="w-12 h-12" />
                                <span className="font-medium">Čekamo Roka...</span>
                            </div>
                        )}

                        {/* Sparkles decoration */}
                        <div className="absolute top-4 right-4 text-yellow-400 animate-pulse">✨</div>
                        <div className="absolute bottom-4 left-4 text-yellow-400 animate-pulse delay-75">✨</div>
                    </div>

                    {/* Instructions Section */}
                    <div className="flex flex-col justify-center space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-lg font-bold text-gray-700">
                                <span>📝 Upute:</span>
                            </div>
                            <ol className="space-y-4">
                                {currentExercise.instructions.map((instruction, idx) => (
                                    <li key={idx} className="flex gap-3 text-muted-foreground font-medium text-lg leading-relaxed">
                                        <span className="text-primary font-bold">{idx + 1}.</span>
                                        {instruction}
                                    </li>
                                ))}
                            </ol>
                        </div>

                        <div className="bg-secondary/20 rounded-xl p-4 border border-secondary/30">
                            <div className="flex items-center gap-2 text-secondary font-bold mb-1">
                                <Timer className="w-5 h-5" />
                                Ponavljanja:
                            </div>
                            <div className="text-3xl font-heading font-bold text-primary">
                                {currentExercise.duration}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="flex justify-between items-center mt-8 px-4">
                <Button
                    onClick={handlePrev}
                    disabled={currentStep === 1}
                    variant="outline"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-lg font-medium"
                >
                    <ChevronLeft className="w-6 h-6 mr-2" /> Prethodno
                </Button>

                <Button
                    onClick={handleNext}
                    className="bg-gradient-primary hover:scale-105 text-primary-foreground px-8 py-6 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                    {currentStep === EXERCISES.length ? 'Završi Trening 🎉' : 'Sljedeće'} <ChevronRight className="w-6 h-6 ml-2" />
                </Button>
            </div>
        </div>
    );
};
