import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { PageHero } from "@/components/PageHero";
import { Loader2, Package, User as UserIcon, LogOut } from "lucide-react";
import { getOrders } from "@/integrations/wordpress/woocommerce";
import { WCOrder } from "@/integrations/wordpress/types";

const Account = () => {
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();
    const [orders, setOrders] = useState<WCOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            // For now, we might not redirect to allow viewing the template
            // navigate("/login"); 
        }

        const fetchOrders = async () => {
            if (user?.id) {
                try {
                    // Fetch orders for the logged-in user
                    // const userOrders = await getOrders(user.id);
                    // setOrders(userOrders);

                    // Mocking orders for now as we don't have full auth flow yet
                    setOrders([]);
                } catch (error) {
                    console.error("Failed to fetch orders", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [isAuthenticated, navigate, user]);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <PageHero title="Moj Račun" />

            <div className="container px-4 py-12">
                <div className="grid lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card className="p-6 shadow-soft">
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                    <UserIcon className="w-10 h-10 text-primary" />
                                </div>
                                <h3 className="font-heading text-xl">{user?.first_name || "Gost"} {user?.last_name}</h3>
                                <p className="text-sm text-muted-foreground">{user?.email || "Niste prijavljeni"}</p>
                            </div>
                            <div className="space-y-2">
                                <Button variant="ghost" className="w-full justify-start text-primary bg-primary/5">
                                    <Package className="w-4 h-4 mr-2" />
                                    Narudžbe
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Odjava
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        <h2 className="text-2xl font-heading mb-6">Povijest narudžbi</h2>

                        {orders.length > 0 ? (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <Card key={order.id} className="p-4 md:p-6 shadow-soft hover-lift">
                                        <div className="flex flex-wrap justify-between items-center gap-4">
                                            <div>
                                                <p className="font-bold">Narudžba #{order.id}</p>
                                                <p className="text-sm text-muted-foreground">{new Date(order.date_created).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <span className={`px-3 py-1 rounded-full text-sm ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">{order.total} {order.currency}</p>
                                                <p className="text-sm text-muted-foreground">{order.line_items.length} proizvoda</p>
                                            </div>
                                            <Button variant="outline" size="sm">Detalji</Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="p-12 text-center shadow-soft">
                                <Package className="w-16 h-16 mx-auto text-muted mb-4" />
                                <h3 className="text-xl font-heading mb-2">Nemate narudžbi</h3>
                                <p className="text-muted-foreground mb-6">Još niste napravili nijednu narudžbu.</p>
                                <Button onClick={() => navigate("/shop")}>Krenite u kupovinu</Button>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account;
