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

                // Group by date for the chart
                // Helper to format date key
                const getDayKey = (dateStr: string) => new Date(dateStr).toLocaleDateString('hr-HR', { day: 'numeric', month: 'short' });

                // Aggregate sales by day
                const salesByDay: Record<string, number> = {};
                validOrders.forEach((o: any) => {
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
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-3xl font-bold font-heading text-gray-900 tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">Pregled vašeg poslovanja u zadnjih 30 dana.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ukupna Prodaja</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">€{stats.totalSales.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">+20.1% od prošlog mjeseca</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Narudžbe</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                        <p className="text-xs text-muted-foreground">+180.1% od prošlog mjeseca</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Prosječna Narudžba</CardTitle>
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">€{stats.averageOrder.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">+19% od prošlog mjeseca</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-dashed">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Google Analytics</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium mb-2">Pregledaj statistiku</div>
                        <p className="text-xs text-muted-foreground mb-4">Posjetitelji, pregledi i pretraživanja</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs gap-2"
                            onClick={() => window.open('https://wp.dispet.fun/wp-admin/admin.php?page=googlesitekit-dashboard', '_blank')}
                        >
                            Otvori Site Kit <ExternalLink size={12} />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <AnalyticsChart data={chartData} title="Prodaja u zadnjih 30 dana" />
        </div>
    );
};

export default Dashboard;
