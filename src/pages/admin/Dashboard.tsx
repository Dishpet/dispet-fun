import { useEffect, useState } from "react";

import AnalyticsChart from "@/components/admin/AnalyticsChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getReports } from "@/integrations/wordpress/woocommerce";
import { Loader2, DollarSign, ShoppingBag, Users as UsersIcon } from "lucide-react";

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
                // Fetch reports (mocking simple structure assumption from WC API)
                const reports = await getReports('month');
                // Transform data for chart
                const formattedData = reports.map((day: any) => ({
                    date: new Date(day.date_created).toLocaleDateString('hr-HR', { day: 'numeric', month: 'short' }),
                    total: parseFloat(day.total_sales)
                }));

                // Calculate totals
                const totalSales = reports.reduce((acc: number, curr: any) => acc + parseFloat(curr.total_sales), 0);
                const totalOrders = reports.reduce((acc: number, curr: any) => acc + parseInt(curr.total_orders), 0);

                setStats({
                    totalSales,
                    totalOrders,
                    averageOrder: totalOrders > 0 ? totalSales / totalOrders : 0
                });
                setChartData(formattedData);
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
            </div>

            <AnalyticsChart data={chartData} title="Prodaja u zadnjih 30 dana" />
        </div>
    );
};

export default Dashboard;
