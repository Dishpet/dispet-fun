import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyCredentials } from "@/integrations/wordpress/woocommerce";
import { Loader2 } from "lucide-react";

export const AdminLogin = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Verify credentials against WordPress
            const wpUser = await verifyCredentials(username, password);

            if (wpUser && wpUser.id) {
                // Check if user has admin capabilities
                // wpUser from /wp/v2/users/me includes capabilities
                const isAdmin = wpUser.capabilities?.administrator ||
                    wpUser.roles?.includes('administrator') ||
                    wpUser.roles?.includes('shop_manager');

                if (!isAdmin) {
                    toast.error("Access denied. Admin privileges required.");
                    setLoading(false);
                    return;
                }

                // Create proper Basic Auth hash for API calls
                const authHash = btoa(unescape(encodeURIComponent(`${username}:${password}`)));

                // Use real user data from WordPress
                login(authHash, {
                    id: wpUser.id,
                    username: wpUser.slug || wpUser.username || username,
                    email: wpUser.email || `${username.toLowerCase()}@dispet.fun`,
                    first_name: wpUser.first_name || wpUser.name,
                    last_name: wpUser.last_name || '',
                    role: 'admin'
                });

                toast.success(`Welcome back, ${wpUser.name || username}!`);
            } else {
                throw new Error("Invalid response");
            }
        } catch (error: any) {
            console.error("Admin login failed:", error);
            toast.error("Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl text-center font-bold text-gray-800">Dišpet Admin</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Username</label>
                            <Input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                className="w-full rounded-full px-6"
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full rounded-full px-6"
                                disabled={loading}
                            />
                        </div>
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 rounded-full h-11" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Access Dashboard
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
