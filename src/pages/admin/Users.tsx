import { useEffect, useState } from "react";
import { getCustomers } from "@/integrations/wordpress/woocommerce";
import { WCCustomer } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, MapPin, User, ChevronRight, Phone, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const Users = () => {
    const [users, setUsers] = useState<WCCustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [expandedUser, setExpandedUser] = useState<number | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const data = await getCustomers(1, 100);
                setUsers(data);
            } catch (error) {
                console.error("Failed to fetch users:", error);
                toast({
                    title: "Greška",
                    description: "Neuspješno učitavanje korisnika.",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const UserCard = ({ user }: { user: WCCustomer }) => {
        const isExpanded = expandedUser === user.id;
        const Initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();

        return (
            <Card className="overflow-hidden border-none shadow-lg shadow-slate-200/30 bg-white rounded-[2rem] transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/40">
                <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 shrink-0 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xl shadow-lg">
                                {Initials || <User className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
                                    {user.first_name} {user.last_name}
                                </h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Korisnik #{user.id}</span>
                                    {user.role === 'admin' && (
                                        <Badge className="bg-primary text-white text-[9px] font-black h-4 px-1 leading-none uppercase tracking-tighter">Admin</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "rounded-full h-10 w-10 transition-transform duration-300 bg-slate-50",
                                isExpanded ? "rotate-90 bg-primary/10 text-primary" : "text-slate-400"
                            )}
                            onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-4 pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {user.email}
                        </div>
                        {user.billing?.city && (
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {user.billing.city}
                            </div>
                        )}
                    </div>

                    <Collapsible open={isExpanded}>
                        <CollapsibleContent>
                            <div className="mt-8 p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Podaci za Dostavu</h4>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Adresa</Label>
                                            <p className="font-bold text-slate-900 bg-white p-3 rounded-xl border border-slate-100 text-sm">
                                                {user.billing?.address_1 || 'Nije uneseno'} {user.billing?.address_2}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Grad i Poštanski broj</Label>
                                            <p className="font-bold text-slate-900 bg-white p-3 rounded-xl border border-slate-100 text-sm">
                                                {user.billing?.postcode} {user.billing?.city}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Telefon</Label>
                                            <p className="font-bold text-slate-900 bg-white p-3 rounded-xl border border-slate-100 text-sm flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5 text-primary" />
                                                {user.billing?.phone || 'Nema broja'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Država</Label>
                                            <p className="font-bold text-slate-900 bg-white p-3 rounded-xl border border-slate-100 text-sm">
                                                {user.billing?.country || 'Hrvatska'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </Card>
        );
    };

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-8">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black font-heading text-slate-900 tracking-tight uppercase">
                        KORISNICI
                    </h1>
                    <p className="text-slate-500 text-sm md:text-lg font-medium mt-1">Pregledajte vaše kupce i partnere.</p>
                </div>
                <div className="flex w-full md:w-auto items-center gap-3">
                    <Badge variant="secondary" className="w-full md:w-auto flex justify-center px-4 h-12 rounded-full bg-slate-100 text-slate-900 font-bold border-none text-xs uppercase tracking-wider">
                        Ukupno: {users.length}
                    </Badge>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="w-7 h-7 animate-spin text-primary" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Učitavanje baze korisnika...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {users.map((user) => (
                        <UserCard key={user.id} user={user} />
                    ))}
                    {users.length === 0 && (
                        <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                            <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                                <User className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">NEMA PRONAĐENIH KORISNIKA</h3>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


export default Users;
