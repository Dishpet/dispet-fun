import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Mail, Clock, Phone, Reply, Forward, Trash2, Send, Inbox, RefreshCw, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { hr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

    // Action States
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [replyOpen, setReplyOpen] = useState(false);
    const [forwardOpen, setForwardOpen] = useState(false);

    // Form States
    const [replyBody, setReplyBody] = useState("");
    const [forwardEmail, setForwardEmail] = useState("");
    const [forwardBody, setForwardBody] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchMessages = async (showLoading = false) => {
        if (showLoading) setIsRefreshing(true);
        try {
            const apiUrl = import.meta.env.DEV
                ? 'http://localhost:3000/api/messages'
                : '/api/messages';

            const response = await fetch(apiUrl);
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
            toast.error("Greška pri osvježavanju poruka");
        } finally {
            setLoading(false);
            if (showLoading) setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(() => fetchMessages(false), 30000);
        return () => clearInterval(interval);
    }, []);

    const handleDelete = async (id: number) => {
        // Optimistically remove
        const previousMessages = [...messages];
        setMessages(prev => prev.filter(m => m.id !== id));
        toast.promise(
            async () => {
                const apiUrl = import.meta.env.DEV
                    ? `http://localhost:3000/api/messages/${id}`
                    : `/api/messages/${id}`;
                const response = await fetch(apiUrl, { method: 'DELETE' });
                if (!response.ok) throw new Error("Failed");
            },
            {
                loading: 'Brisanje...',
                success: 'Poruka obrisana',
                error: () => {
                    setMessages(previousMessages); // Revert on error
                    return 'Neuspješno brisanje';
                }
            }
        );
    };

    const openReply = (msg: Message) => {
        setSelectedMessage(msg);
        setReplyBody(`\n\nPoštovani/a ${msg.name},\n\nHvala na vašem upitu.\n\nSrdačan pozdrav,\nDišpet Tim`);
        setReplyOpen(true);
    };

    const openForward = (msg: Message) => {
        setSelectedMessage(msg);
        setForwardBody("Ovdje prosljeđujem ovaj upit...");
        setForwardOpen(true);
    };

    const handleSendReply = async () => {
        if (!selectedMessage) return;
        setActionLoading(true);

        try {
            const apiUrl = import.meta.env.DEV
                ? 'http://localhost:3000/api/messages/reply'
                : '/api/messages/reply';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: selectedMessage.email,
                    subject: `Re: Vaša poruka za Dišpet`,
                    body: replyBody
                })
            });

            if (response.ok) {
                toast.success("Odgovor uspješno poslan!");
                setReplyOpen(false);
            } else {
                throw new Error("Send failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Slanje nije uspjelo");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendForward = async () => {
        if (!selectedMessage) return;
        setActionLoading(true);

        try {
            const apiUrl = import.meta.env.DEV
                ? 'http://localhost:3000/api/messages/forward'
                : '/api/messages/forward';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: forwardEmail,
                    subject: `Fwd: Poruka od ${selectedMessage.name}`,
                    body: forwardBody,
                    originalMessage: selectedMessage
                })
            });

            if (response.ok) {
                toast.success("Poruka uspješno proslijeđena!");
                setForwardOpen(false);
            } else {
                throw new Error("Send failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Slanje nije uspjelo");
        } finally {
            setActionLoading(false);
        }
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
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                            Inbox
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            Upravljajte porukama posjetitelja i kupaca.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="px-3 py-1 text-sm h-9">
                            Ukupno: {messages.length}
                        </Badge>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fetchMessages(true)}
                            className={isRefreshing ? "animate-spin" : ""}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages List */}
                <div className="space-y-4">
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
                        <div className="grid gap-6">
                            {messages.map((msg) => (
                                <Card
                                    key={msg.id}
                                    className="group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200 border-none bg-white rounded-[2.5rem]"
                                >
                                    <div className="absolute top-0 left-0 w-2 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="p-8">
                                        <div className="flex flex-col lg:flex-row gap-8">
                                            {/* Avatar & Info */}
                                            <div className="flex items-start gap-5 min-w-[240px]">
                                                <div className="h-16 w-16 shrink-0 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white font-black text-2xl shadow-xl transform group-hover:rotate-6 transition-transform">
                                                    {msg.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none pt-1">{msg.name}</h3>
                                                    <div className="flex flex-col gap-2 pt-2">
                                                        <span className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-primary transition-colors cursor-pointer truncate">
                                                            <Mail className="w-3.5 h-3.5" /> {msg.email}
                                                        </span>
                                                        {msg.phone && (
                                                            <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                                <Phone className="w-3.5 h-3.5" /> {msg.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Message Body */}
                                            <div className="flex-1 min-w-0 py-2 lg:px-8 lg:border-l lg:border-slate-100">
                                                <div className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap text-sm lg:text-base">
                                                    {msg.message}
                                                </div>
                                            </div>

                                            {/* Actions & Date */}
                                            <div className="flex sm:flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-6 min-w-[160px] lg:pl-4 lg:border-l lg:border-slate-100">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {format(new Date(msg.date), "dd. MMM, HH:mm", { locale: hr })}
                                                </div>

                                                <div className="flex items-center gap-2 pt-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-12 w-12 rounded-2xl text-blue-600 bg-blue-50/50 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                        onClick={() => openReply(msg)}
                                                    >
                                                        <Reply className="w-5 h-5" />
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-12 w-12 rounded-2xl text-emerald-600 bg-emerald-50/50 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                        onClick={() => openForward(msg)}
                                                    >
                                                        <Forward className="w-5 h-5" />
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-12 w-12 rounded-2xl text-rose-500 bg-rose-50/50 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                        onClick={() => handleDelete(msg.id)}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reply Dialog */}
                <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <Reply className="w-5 h-5 text-primary" />
                                Odgovori korisniku
                            </DialogTitle>
                            <DialogDescription>
                                Vaš odgovor bit će poslan direktno na email korisnika.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="to" className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Primatelj</Label>
                                <Input id="to" value={selectedMessage?.email || ''} disabled className="bg-gray-50 border-gray-200" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="subject" className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Predmet</Label>
                                <Input id="subject" value="Re: Vaša poruka za Dišpet" disabled className="bg-gray-50 border-gray-200" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="message" className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Vaš Odgovor</Label>
                                <Textarea
                                    id="message"
                                    value={replyBody}
                                    onChange={(e) => setReplyBody(e.target.value)}
                                    className="min-h-[250px] font-normal leading-relaxed resize-none p-4"
                                    placeholder="Napišite svoj odgovor ovdje..."
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setReplyOpen(false)}>Odustani</Button>
                            <Button onClick={handleSendReply} disabled={actionLoading} className="pl-4 pr-6">
                                <Send className="w-4 h-4 mr-2" />
                                {actionLoading ? "Slanje..." : "Pošalji Odgovor"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Forward Dialog */}
                <Dialog open={forwardOpen} onOpenChange={setForwardOpen}>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <Forward className="w-5 h-5 text-green-600" />
                                Proslijedi poruku
                            </DialogTitle>
                            <DialogDescription>
                                Proslijedite originalnu poruku trećoj strani.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="fwd-to" className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Proslijedi na Email</Label>
                                <Input
                                    id="fwd-to"
                                    placeholder="ime@primjer.com"
                                    value={forwardEmail}
                                    onChange={(e) => setForwardEmail(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="fwd-message" className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Napomena (Opcionalno)</Label>
                                <Textarea
                                    id="fwd-message"
                                    value={forwardBody}
                                    onChange={(e) => setForwardBody(e.target.value)}
                                    className="min-h-[120px] resize-none"
                                    placeholder="Dodajte napomenu uz prosljeđenu poruku..."
                                />
                            </div>
                            <div className="bg-gray-50 p-4 rounded-md border text-sm text-gray-500">
                                <p className="font-semibold text-gray-700 mb-1">Originalna poruka:</p>
                                <p className="line-clamp-3 italic">"{selectedMessage?.message}"</p>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setForwardOpen(false)}>Odustani</Button>
                            <Button onClick={handleSendForward} disabled={actionLoading} className="bg-green-600 hover:bg-green-700 text-white pl-4 pr-6">
                                <Forward className="w-4 h-4 mr-2" />
                                {actionLoading ? "Slanje..." : "Proslijedi"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
};

export default Messages;
