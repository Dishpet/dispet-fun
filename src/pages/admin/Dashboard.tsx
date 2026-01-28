import { useEffect, useState } from "react";

import AnalyticsChart from "@/components/admin/AnalyticsChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getReports, getOrders } from "@/integrations/wordpress/woocommerce";
import { Loader2, DollarSign, ShoppingBag, Users as UsersIcon, Activity, ExternalLink } from "lucide-react";

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSales: 0,
        totalOrders: 0,
        averageOrder: 0
    });
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // Fetch ALL orders (recent ones) - giving a better real-time view than the reports endpoint
                const orders = await getOrders();
                console.log("Real-time Orders (All Statuses):", orders);

                // Strict filter: Only count orders that are likely "real sales" in WP Admin terms
                // Usually WP Analytics counts 'completed', 'processing', and 'on-hold'. 
                // It ignores 'pending' (abandoned checkout), 'cancelled', 'failed', 'refunded', 'trash'.
                const validDetails = ['completed', 'processing', 'on-hold'];

                const validOrders = orders.filter((o: any) => validDetails.includes(o.status));
                const ignoredOrders = orders.filter((o: any) => !validDetails.includes(o.status));

                if (ignoredOrders.length > 0) {
                    console.log("Ignored Orders (Pending/Cancelled/etc):", ignoredOrders.map((o: any) => ({ id: o.id, status: o.status, total: o.total })));
                }

                // Calculate Totals
                const totalSales = validOrders.reduce((acc: number, curr: any) => acc + parseFloat(curr.total), 0);
                const totalOrdersCount = validOrders.length;

                // Sort valid orders by date ASCENDING for the chart
                const chronologicalOrders = [...validOrders].sort((a, b) =>
                    new Date(a.date_created).getTime() - new Date(b.date_created).getTime()
                );

                // Group by date for the chart
                // Helper to format date key
                const getDayKey = (dateStr: string) => new Date(dateStr).toLocaleDateString('hr-HR', { day: 'numeric', month: 'short' });

                // Aggregate sales by day in chronological order
                const salesByDay: Record<string, number> = {};
                chronologicalOrders.forEach((o: any) => {
                    const key = getDayKey(o.date_created);
                    salesByDay[key] = (salesByDay[key] || 0) + parseFloat(o.total);
                });

                const formattedData = Object.keys(salesByDay).map(date => ({
                    date,
                    total: salesByDay[date]
                }));

                setStats({
                    totalSales,
                    totalOrders: totalOrdersCount,
                    averageOrder: totalOrdersCount > 0 ? totalSales / totalOrdersCount : 0
                });
                setChartData(formattedData as any);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-8">
                <div>
                    <h2 className="text-2xl md:text-4xl font-black font-heading text-slate-900 tracking-tight uppercase">
                        Dashboard
                    </h2>
                    <p className="text-slate-500 text-sm md:text-lg font-medium mt-1">Pregled vašeg poslovanja u zadnjih 30 dana.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" className="w-full md:w-auto rounded-full font-bold text-xs uppercase tracking-wider h-10 md:h-11" onClick={() => window.location.reload()}>
                        Osvježi
                    </Button>
                </div>
            </div>

            <div className="grid gap-3 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden border-none shadow-xl shadow-blue-500/5 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-[2rem] transition-transform hover:scale-[1.01]">
                    <div className="absolute top-0 right-0 p-6 opacity-20 transform translate-x-4 -translate-y-4">
                        <DollarSign size={80} strokeWidth={1} />
                    </div>
                    <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-blue-100/80 text-xs font-bold uppercase tracking-widest">Ukupna Prodaja</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-black mb-1">€{stats.totalSales.toFixed(2)}</div>
                        <p className="text-blue-100/60 text-xs font-semibold">+20.1% vs prošli mj.</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-none shadow-xl shadow-indigo-500/5 bg-white rounded-[2rem] transition-transform hover:scale-[1.01]">
                    <div className="absolute bottom-0 right-0 p-4 text-indigo-50 opacity-10">
                        <ShoppingBag size={100} strokeWidth={1} />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-slate-400 text-xs font-bold uppercase tracking-widest">Narudžbe</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-900 mb-1">{stats.totalOrders}</div>
                        <p className="text-emerald-500 text-xs font-bold">+180.1% vs prošli mj.</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-none shadow-xl shadow-purple-500/5 bg-slate-900 text-white rounded-[2rem] transition-transform hover:scale-[1.01]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-slate-400 text-xs font-bold uppercase tracking-widest">Prosjek</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black mb-1">€{stats.averageOrder.toFixed(2)}</div>
                        <p className="text-purple-400 text-xs font-bold">+19% vs prošli mj.</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-[2rem] flex flex-col justify-between">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <Activity className="h-3 w-3" /> External Tools
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Pristupite detaljnoj Google Analytics statistici.</p>
                    </CardContent>
                    <div className="px-6 pb-6">
                        <Button
                            variant="default"
                            size="sm"
                            className="w-full bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-full font-bold text-[10px] uppercase tracking-wider shadow-sm"
                            onClick={() => window.open('https://wp.dispet.fun/wp-admin/admin.php?page=googlesitekit-dashboard', '_blank')}
                        >
                            Site Kit <ExternalLink size={10} className="ml-2" />
                        </Button>
                    </div>
                </Card>
            </div>

            <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30">
                <AnalyticsChart data={chartData} title="Statistika Prodaje" />
            </div>
        </div>
    );
};

export default Dashboard;
