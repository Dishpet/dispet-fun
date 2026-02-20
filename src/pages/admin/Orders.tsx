import { useEffect, useState } from "react";
import { getOrders } from "@/integrations/wordpress/woocommerce";
import { WCOrder } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";
import {
    Loader2, Package, ChevronRight, Mail, MapPin, Phone, User,
    Search, Filter, Clock, CheckCircle, XCircle, AlertCircle,
    Truck, CreditCard, Palette, Ruler, Image as ImageIcon,
    RefreshCw, ExternalLink, Copy, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

// Status config
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    'processing': { label: 'U obradi', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Clock },
    'completed': { label: 'Završeno', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
    'on-hold': { label: 'Na čekanju', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: AlertCircle },
    'pending': { label: 'Čeka plaćanje', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: Clock },
    'cancelled': { label: 'Otkazano', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
    'refunded': { label: 'Refundirano', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: RefreshCw },
    'failed': { label: 'Neuspjelo', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
};

// Color name map for displaying human-readable color names
const COLOR_NAME_MAP: Record<string, string> = {
    '#231f20': 'Crna',
    '#ffffff': 'Bijela',
    '#e83e70': 'Roza',
    '#e78fab': 'Pink',
    '#a1d7c0': 'Mint',
    '#00aeef': 'Plava',
    '#c7b299': 'Bež',
    '#d4c7b0': 'Krem',
    '#808080': 'Siva',
};

const Orders = () => {
    const [orders, setOrders] = useState<WCOrder[]>([]);
    const [serverOrders, setServerOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
    const [showServerLog, setShowServerLog] = useState(false);
    const { toast } = useToast();

    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Fetch from WooCommerce
            const data = await getOrders();
            setOrders(data);

            // Also fetch from server-side log
            try {
                const logRes = await fetch('/api/orders-log');
                const logData = await logRes.json();
                if (logData.success) {
                    setServerOrders(logData.orders);
                }
            } catch (e) {
                console.warn("Could not fetch server order log:", e);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            toast({
                title: "Greška",
                description: "Neuspješno učitavanje narudžbi.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Update order status via WooCommerce API
    const updateOrderStatus = async (orderId: number, newStatus: string) => {
        setUpdatingStatus(orderId);
        try {
            const res = await fetch(`/api/wc/v3/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            // Update local state
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: newStatus } : o
            ));

            toast({
                title: "Status ažuriran",
                description: `Narudžba #${orderId} → ${STATUS_CONFIG[newStatus]?.label || newStatus}`,
            });
        } catch (error) {
            console.error("Failed to update order status:", error);
            toast({
                title: "Greška",
                description: "Neuspješna promjena statusa.",
                variant: "destructive"
            });
        } finally {
            setUpdatingStatus(null);
        }
    };

    // Filter & search orders
    const filteredOrders = orders.filter(order => {
        // Status filter
        if (statusFilter !== "all" && order.status !== statusFilter) return false;

        // Search filter (by ID, customer name, email)
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchesId = order.id.toString().includes(q);
            const matchesName = `${order.billing?.first_name} ${order.billing?.last_name}`.toLowerCase().includes(q);
            const matchesEmail = order.billing?.email?.toLowerCase().includes(q);
            if (!matchesId && !matchesName && !matchesEmail) return false;
        }

        return true;
    });

    // Sort by date descending (newest first)
    const sortedOrders = [...filteredOrders].sort((a, b) =>
        new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
    );

    // Stats
    const orderStats = {
        total: orders.length,
        processing: orders.filter(o => o.status === 'processing').length,
        completed: orders.filter(o => o.status === 'completed').length,
        onHold: orders.filter(o => o.status === 'on-hold').length,
    };

    // Get enriched data from server log for a given order ID
    const getServerLogData = (orderId: number) => {
        return serverOrders.find(so => so.orderId === orderId || so.orderId === String(orderId));
    };

    // Helper to render meta data value
    const getMetaValue = (metaData: any[] | undefined, key: string) => {
        if (!metaData) return null;
        const meta = metaData.find(m => m.key === key || m.display_key === key);
        return meta?.value || meta?.display_value || null;
    };

    const OrderCard = ({ order }: { order: WCOrder }) => {
        const isExpanded = expandedOrder === order.id;
        const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];
        const StatusIcon = statusInfo.icon;
        const serverData = getServerLogData(order.id);
        const orderDate = new Date(order.date_created);

        return (
            <Card className="overflow-hidden border-none shadow-lg shadow-slate-200/30 bg-white rounded-[2rem] transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/40">
                <div className="p-6 md:p-8">
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            {/* Order Number Badge */}
                            <div className="h-14 w-14 shrink-0 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-lg">
                                #{order.id}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase truncate">
                                    {order.billing?.first_name} {order.billing?.last_name}
                                </h3>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {orderDate.toLocaleDateString('hr-HR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        {' · '}
                                        {orderDate.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <Badge className={cn(
                                        "text-[9px] font-black h-5 px-2 leading-none uppercase tracking-tighter border rounded-full",
                                        statusInfo.bg, statusInfo.color
                                    )}>
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {statusInfo.label}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right hidden sm:block">
                                <div className="text-xl font-black text-slate-900">{parseFloat(order.total).toFixed(2)}€</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">{order.line_items?.length || 0} stavki</div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "rounded-full h-10 w-10 transition-transform duration-300 bg-slate-50",
                                    isExpanded ? "rotate-90 bg-primary/10 text-primary" : "text-slate-400"
                                )}
                                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Quick Info Row */}
                    <div className="mt-5 flex flex-wrap gap-4 pt-5 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {order.billing?.email || 'N/A'}
                        </div>
                        {order.billing?.phone && (
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {order.billing.phone}
                            </div>
                        )}
                        {order.billing?.city && (
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {order.billing.city}
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 sm:hidden">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                            {parseFloat(order.total).toFixed(2)}€
                        </div>
                    </div>

                    {/* Expanded Details */}
                    <Collapsible open={isExpanded}>
                        <CollapsibleContent>
                            <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">

                                {/* Customer Details */}
                                <div className="p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1 mb-4 flex items-center gap-2">
                                        <User className="w-3 h-3" /> Kupac & Dostava
                                    </h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 ml-1">Adresa</p>
                                            <p className="font-bold text-slate-900 bg-white p-3 rounded-xl border border-slate-100 text-sm">
                                                {order.billing?.address_1 || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 ml-1">Grad & Poštanski</p>
                                            <p className="font-bold text-slate-900 bg-white p-3 rounded-xl border border-slate-100 text-sm">
                                                {order.billing?.postcode} {order.billing?.city}, {order.billing?.country}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Line Items */}
                                <div className="p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1 mb-4 flex items-center gap-2">
                                        <Package className="w-3 h-3" /> Stavke Narudžbe
                                    </h4>
                                    <div className="space-y-3">
                                        {order.line_items?.map((item, idx) => {
                                            // Get meta from WooCommerce
                                            const wcSize = getMetaValue(item.meta_data, 'Veličina');
                                            const wcColor = getMetaValue(item.meta_data, 'Boja');
                                            const wcDesignBack = getMetaValue(item.meta_data, 'Dizajn (Leđa)') || getMetaValue(item.meta_data, 'Dizajn');
                                            const wcDesignFront = getMetaValue(item.meta_data, 'Dizajn (Prednji)');

                                            // Fallback to server log data
                                            const serverItem = serverData?.items?.[idx];
                                            const displaySize = wcSize || serverItem?.size || 'N/A';
                                            const displayColor = wcColor || serverItem?.color || null;
                                            const displayDesignBack = wcDesignBack || serverItem?.designs?.back || serverItem?.image || null;
                                            const displayDesignFront = wcDesignFront || serverItem?.designs?.front || null;

                                            const colorName = displayColor ? (COLOR_NAME_MAP[displayColor.toLowerCase()] || displayColor) : 'N/A';

                                            return (
                                                <div key={item.id} className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                                                                <h5 className="font-black text-slate-900 text-sm uppercase truncate">{item.name}</h5>
                                                                <Badge variant="secondary" className="text-[9px] font-bold h-4 px-1.5 rounded-full shrink-0">
                                                                    ×{item.quantity}
                                                                </Badge>
                                                            </div>

                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                {/* Size */}
                                                                <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                                                    <Ruler className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                    <div>
                                                                        <p className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Veličina</p>
                                                                        <p className="text-sm font-black text-slate-900">{displaySize}</p>
                                                                    </div>
                                                                </div>

                                                                {/* Color */}
                                                                <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                                                    <div
                                                                        className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0 shadow-inner"
                                                                        style={{ backgroundColor: displayColor || '#ccc' }}
                                                                    />
                                                                    <div>
                                                                        <p className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Boja</p>
                                                                        <p className="text-sm font-black text-slate-900">{colorName}</p>
                                                                    </div>
                                                                </div>

                                                                {/* Price */}
                                                                <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                                                    <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                    <div>
                                                                        <p className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Cijena</p>
                                                                        <p className="text-sm font-black text-slate-900">{parseFloat(item.total).toFixed(2)}€</p>
                                                                    </div>
                                                                </div>

                                                                {/* Product ID */}
                                                                <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                                                    <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                    <div>
                                                                        <p className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Proizvod</p>
                                                                        <p className="text-sm font-black text-slate-900">#{item.product_id}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Design Images */}
                                                            {(displayDesignBack || displayDesignFront) && (
                                                                <div className="mt-3 flex flex-wrap gap-3">
                                                                    {displayDesignFront && (
                                                                        <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                                                            <ImageIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                            <div>
                                                                                <p className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Prednji dizajn</p>
                                                                                <p className="text-[10px] font-bold text-primary truncate max-w-[200px]">
                                                                                    {displayDesignFront.split('/').pop()}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {displayDesignBack && (
                                                                        <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                                                            <ImageIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                            <div>
                                                                                <p className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Stražnji dizajn</p>
                                                                                <p className="text-[10px] font-bold text-primary truncate max-w-[200px]">
                                                                                    {displayDesignBack.split('/').pop()}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Status Actions */}
                                <div className="p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1 mb-4 flex items-center gap-2">
                                        <Truck className="w-3 h-3" /> Upravljanje Statusom
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {['processing', 'on-hold', 'completed', 'cancelled'].map(status => {
                                            const config = STATUS_CONFIG[status];
                                            const isActive = order.status === status;
                                            return (
                                                <Button
                                                    key={status}
                                                    variant={isActive ? "default" : "outline"}
                                                    size="sm"
                                                    disabled={isActive || updatingStatus === order.id}
                                                    className={cn(
                                                        "rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                                                        isActive ? "bg-primary text-white" : "hover:bg-slate-100"
                                                    )}
                                                    onClick={() => updateOrderStatus(order.id, status)}
                                                >
                                                    {updatingStatus === order.id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                                    ) : (
                                                        <config.icon className="w-3 h-3 mr-1" />
                                                    )}
                                                    {config.label}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex gap-2 flex-wrap">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full text-xs font-bold"
                                        onClick={() => window.open(`https://wp.dispet.fun/wp-admin/admin.php?page=wc-orders&action=edit&id=${order.id}`, '_blank')}
                                    >
                                        <ExternalLink className="w-3 h-3 mr-1" /> WP Admin
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full text-xs font-bold"
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                `Narudžba #${order.id}\nKupac: ${order.billing?.first_name} ${order.billing?.last_name}\nEmail: ${order.billing?.email}\nTelefon: ${order.billing?.phone}\nAdresa: ${order.billing?.address_1}, ${order.billing?.postcode} ${order.billing?.city}\nUkupno: ${order.total}€`
                                            );
                                            toast({ title: "Kopirano!", description: "Podaci narudžbe kopirani u clipboard." });
                                        }}
                                    >
                                        <Copy className="w-3 h-3 mr-1" /> Kopiraj Podatke
                                    </Button>
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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-8">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black font-heading text-slate-900 tracking-tight uppercase">
                        NARUDŽBE
                    </h1>
                    <p className="text-slate-500 text-sm md:text-lg font-medium mt-1">Pratite i upravljajte svim narudžbama.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button
                        variant="outline"
                        className="rounded-full font-bold text-xs uppercase tracking-wider h-10"
                        onClick={fetchOrders}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                        Osvježi
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="border-none shadow-lg bg-white rounded-[1.5rem] p-5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ukupno</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">{orderStats.total}</div>
                </Card>
                <Card className="border-none shadow-lg bg-blue-50 rounded-[1.5rem] p-5 border border-blue-100">
                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" /> U obradi
                    </div>
                    <div className="text-2xl font-black text-blue-700 mt-1">{orderStats.processing}</div>
                </Card>
                <Card className="border-none shadow-lg bg-emerald-50 rounded-[1.5rem] p-5 border border-emerald-100">
                    <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Završeno
                    </div>
                    <div className="text-2xl font-black text-emerald-700 mt-1">{orderStats.completed}</div>
                </Card>
                <Card className="border-none shadow-lg bg-amber-50 rounded-[1.5rem] p-5 border border-amber-100">
                    <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Na čekanju
                    </div>
                    <div className="text-2xl font-black text-amber-700 mt-1">{orderStats.onHold}</div>
                </Card>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Traži po ID-u, imenu ili emailu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-full h-12 border-2 border-slate-100 bg-white focus:border-primary transition-all text-sm font-medium"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                    {[
                        { key: 'all', label: 'Sve' },
                        { key: 'processing', label: 'U obradi' },
                        { key: 'completed', label: 'Završeno' },
                        { key: 'on-hold', label: 'Čekanje' },
                        { key: 'cancelled', label: 'Otkazano' },
                    ].map(f => (
                        <Button
                            key={f.key}
                            variant={statusFilter === f.key ? "default" : "outline"}
                            size="sm"
                            className={cn(
                                "rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0",
                                statusFilter === f.key ? "bg-slate-900 text-white" : ""
                            )}
                            onClick={() => setStatusFilter(f.key)}
                        >
                            {f.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Server Log Toggle */}
            {serverOrders.length > 0 && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-400 font-bold"
                    onClick={() => setShowServerLog(!showServerLog)}
                >
                    <ChevronDown className={cn("w-3 h-3 mr-1 transition-transform", showServerLog && "rotate-180")} />
                    Server Log ({serverOrders.length} zapisa)
                </Button>
            )}

            {showServerLog && serverOrders.length > 0 && (
                <Card className="border-none shadow-lg bg-slate-900 text-white rounded-[1.5rem] p-6 overflow-auto max-h-[400px]">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">📝 Server-side Order Log</h4>
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                        {JSON.stringify(serverOrders, null, 2)}
                    </pre>
                </Card>
            )}

            {/* Order List */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="w-7 h-7 animate-spin text-primary" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Učitavanje narudžbi...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedOrders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                    {sortedOrders.length === 0 && (
                        <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                            <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                                <Package className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">NEMA PRONAĐENIH NARUDŽBI</h3>
                            <p className="text-slate-400 text-sm mt-2">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'Pokušajte promijeniti filter ili pretragu.'
                                    : 'Još nema zaprimljenih narudžbi.'}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Orders;
