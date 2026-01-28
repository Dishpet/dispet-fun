import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Mail, Clock, Phone, Reply, Forward, Trash2, Send, Inbox, RefreshCw, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { hr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Message {
    id: number;
    name: string;
    email: string;
    phone: string;
    message: string;
    date: string;
    read: boolean;
}

const Messages = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchMessages = async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true);
        try {
            const apiUrl = import.meta.env.DEV
                ? 'http://localhost:3000/api/messages'
                : '/api/messages';
            const response = await fetch(apiUrl);
            const data = await response.json();
            setMessages(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            toast.error("Neuspješno učitavanje poruka");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Jeste li sigurni da želite obrisati ovu poruku?")) return;

        try {
            const apiUrl = import.meta.env.DEV
                ? `http://localhost:3000/api/messages/${id}`
                : `/api/messages/${id}`;
            const response = await fetch(apiUrl, { method: 'DELETE' });
            if (response.ok) {
                setMessages(messages.filter(m => m.id !== id));
                toast.success("Poruka obrisana");
            }
        } catch (error) {
            toast.error("Brisanje nije uspjelo");
        }
    };

    // Message Action Component for inline reply/forward
    const MessageActions = ({ msg }: { msg: Message }) => {
        const [mode, setMode] = useState<'none' | 'reply' | 'forward'>('none');
        const [body, setBody] = useState("");
        const [to, setTo] = useState("");
        const [localLoading, setLocalLoading] = useState(false);

        const handleAction = async () => {
            setLocalLoading(true);
            try {
                const apiUrl = import.meta.env.DEV
                    ? `http://localhost:3000/api/messages/${mode}`
                    : `/api/messages/${mode}`;

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(mode === 'reply' ? {
                        to: msg.email,
                        subject: `Re: Vaša poruka za Dišpet`,
                        body: body
                    } : {
                        to: to,
                        subject: `Fwd: Poruka od ${msg.name}`,
                        body: body,
                        originalMessage: msg
                    })
                });

                if (response.ok) {
                    toast.success(mode === 'reply' ? "Odgovor poslan!" : "Poruka proslijeđena!");
                    setMode('none');
                } else {
                    throw new Error("Failed");
                }
            } catch (error) {
                toast.error("Slanje nije uspjelo");
            } finally {
                setLocalLoading(false);
            }
        };

        return (
            <div className="mt-8 space-y-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "h-10 rounded-full px-4 font-bold text-[10px] uppercase tracking-wider transition-all",
                            mode === 'reply' ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-blue-600 bg-blue-50/50 hover:bg-blue-100"
                        )}
                        onClick={() => {
                            setMode(mode === 'reply' ? 'none' : 'reply');
                            setBody(`\n\nPoštovani/a ${msg.name},\n\nHvala na vašem upitu.\n\nSrdačan pozdrav,\nDišpet Tim`);
                        }}
                    >
                        <Reply className="w-3.5 h-3.5 mr-2" /> Odgovori
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "h-10 rounded-full px-4 font-bold text-[10px] uppercase tracking-wider transition-all",
                            mode === 'forward' ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10" : "text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100"
                        )}
                        onClick={() => {
                            setMode(mode === 'forward' ? 'none' : 'forward');
                            setBody("Ovdje prosljeđujem ovaj upit...");
                        }}
                    >
                        <Forward className="w-3.5 h-3.5 mr-2" /> Proslijedi
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 rounded-full px-4 font-bold text-[10px] uppercase tracking-wider text-rose-500 bg-rose-50/50 hover:bg-rose-600 hover:text-white transition-all ml-auto"
                        onClick={() => handleDelete(msg.id)}
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Briši
                    </Button>
                </div>

                <Collapsible open={mode !== 'none'}>
                    <CollapsibleContent>
                        <div className="bg-slate-50/80 backdrop-blur-sm p-6 rounded-[2rem] border border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    {mode === 'reply' ? 'Novi Odgovor' : 'Proslijedi Poruku'}
                                </h4>
                                <Button variant="ghost" size="sm" onClick={() => setMode('none')} className="h-6 w-6 p-0 rounded-full">
                                    <ChevronRight className="w-4 h-4 rotate-90" />
                                </Button>
                            </div>

                            {mode === 'forward' && (
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Proslijedi na Email</Label>
                                    <Input
                                        placeholder="ime@primjer.com"
                                        className="h-10 rounded-full bg-white border-none shadow-sm font-bold text-sm px-6"
                                        value={to}
                                        onChange={(e) => setTo(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-500 ml-1">
                                    {mode === 'reply' ? 'Vaš Odgovor' : 'Napomena uz prosljeđivanje'}
                                </Label>
                                <Textarea
                                    className="min-h-[180px] rounded-[1.5rem] bg-white border-none shadow-sm focus-visible:ring-primary/20 p-4 text-sm font-medium leading-relaxed resize-none"
                                    placeholder="Napišite nešto..."
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleAction}
                                    disabled={localLoading}
                                    className={cn(
                                        "h-11 px-8 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg transition-all",
                                        mode === 'reply' ? "bg-blue-600 shadow-blue-500/10" : "bg-emerald-600 shadow-emerald-500/10"
                                    )}
                                >
                                    {localLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                    {mode === 'reply' ? 'Pošalji Odgovor' : 'Proslijedi'}
                                </Button>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Inbox className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-muted-foreground font-medium">Učitavanje inboxa...</p>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-8">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-black font-heading text-slate-900 tracking-tight uppercase">
                            INBOX
                        </h1>
                        <p className="text-slate-500 text-sm md:text-lg font-medium mt-1">
                            Upravljajte porukama posjetitelja i kupaca.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="px-4 h-12 rounded-full bg-slate-100 text-slate-900 font-bold border-none text-xs uppercase tracking-wider">
                            Ukupno: {messages.length}
                        </Badge>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fetchMessages(true)}
                            className={cn(
                                "h-12 w-12 rounded-full border-slate-200 hover:bg-slate-50 transition-all",
                                isRefreshing ? "animate-spin" : ""
                            )}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages List */}
                <div className="space-y-6">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-sm">
                            <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mb-8 shadow-inner">
                                <Inbox className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">VAŠ INBOX JE PRAZAN</h3>
                            <p className="text-slate-500 max-w-xs mt-3 font-medium leading-relaxed">
                                Nove poruke s kontakt forme pojavit će se ovdje automatski.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-8">
                            {messages.map((msg) => (
                                <Card
                                    key={msg.id}
                                    className="group relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-slate-300/40 border-none bg-white rounded-[3rem] shadow-lg shadow-slate-200/30"
                                >
                                    <div className="p-6 md:p-10">
                                        <div className="flex flex-col lg:flex-row gap-10">
                                            {/* Avatar & Info */}
                                            <div className="flex items-start gap-6 min-w-[260px]">
                                                <div className="h-16 w-16 md:h-20 md:w-20 shrink-0 rounded-3xl bg-slate-900 flex items-center justify-center text-white font-black text-2xl md:text-3xl shadow-2xl transform group-hover:-rotate-3 transition-transform">
                                                    {msg.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none h-6">{msg.name}</h3>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                                                                <Clock className="w-3 h-3" />
                                                                {format(new Date(msg.date), "dd. MMM, HH:mm", { locale: hr })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2 pt-1">
                                                        <a href={`mailto:${msg.email}`} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors truncate">
                                                            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                                                <Mail className="w-3.5 h-3.5" />
                                                            </div>
                                                            {msg.email}
                                                        </a>
                                                        {msg.phone && (
                                                            <a href={`tel:${msg.phone}`} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors">
                                                                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                                                    <Phone className="w-3.5 h-3.5" />
                                                                </div>
                                                                {msg.phone}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Message Body */}
                                            <div className="flex-1 min-w-0 flex flex-col pt-2 lg:pl-10 lg:border-l lg:border-slate-100">
                                                <div className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap text-base md:text-lg flex-1">
                                                    {msg.message}
                                                </div>

                                                <MessageActions msg={msg} />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
};

export default Messages;
