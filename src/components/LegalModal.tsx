import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface LegalModalProps {
    title: string;
    content: string;
    triggerText: string;
    className?: string;
}

const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];

    const flushList = (keyPrefix: string) => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`${keyPrefix}-ul`} className="list-disc pl-5 my-2 opacity-90">
                    {listItems}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
            flushList(`line-${index}`);
            return;
        }

        // Process bold text: **text**
        const processBold = (str: string) => {
            const parts = str.split(/(\*\*.*?\*\*)/g);
            return parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
                }
                return part;
            });
        };

        // Headers
        if (trimmed.startsWith('### ')) {
            flushList(`header-${index}`);
            elements.push(
                <h3 key={`header-${index}`} className="text-xl font-bold text-[#0089cd] mt-6 mb-2 border-b pb-1">
                    {processBold(trimmed.slice(4))}
                </h3>
            );
            return;
        }

        // List items
        if (trimmed.startsWith('* ') || trimmed.startsWith('✔ ') || trimmed.startsWith('❌ ') || trimmed.startsWith('🔹 ')) {
            // Keep the special chars for style if usage implies bullets
            const content = trimmed.startsWith('* ') ? trimmed.slice(2) : trimmed;
            listItems.push(
                <li key={`li-${index}`} className="mb-1">
                    {processBold(content)}
                </li>
            );
            return;
        }

        // Regular paragraphs
        flushList(`p-${index}`);
        elements.push(
            <p key={`p-${index}`} className="mb-4 leading-relaxed">
                {processBold(trimmed)}
            </p>
        );
    });

    flushList('final');
    return elements;
};

export const LegalModal: React.FC<LegalModalProps> = ({ title, content, triggerText, className }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="link" className={`p-0 h-auto font-normal text-white hover:text-white/80 ${className}`}>
                    {triggerText}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[800px] h-[90vh] flex flex-col p-0 rounded-[2.5rem] overflow-hidden border-none shadow-2xl">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="text-2xl font-bold font-heading text-[#0089cd]">{title}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 p-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                        {parseMarkdown(content)}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
