import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
                    <h1 className="text-4xl font-black text-foreground mb-4">Ups! Nešto je pošlo po zlu.</h1>
                    <p className="text-xl text-muted-foreground mb-8">Dogodila se neočekivana greška. Molimo osvježite stranicu.</p>
                    <Button
                        size="lg"
                        onClick={() => window.location.reload()}
                        className="font-bold"
                    >
                        Osvježi stranicu
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
