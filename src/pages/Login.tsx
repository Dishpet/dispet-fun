import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { PageHero } from "@/components/PageHero";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { verifyCredentials, getCustomer } from "@/integrations/wordpress/woocommerce";

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Verify Credentials via WP User API
            const wpUser = await verifyCredentials(formData.username, formData.password);

            if (wpUser && wpUser.id) {
                // 2. Fetch rich customer data (Billing/Shipping)
                let customerData = wpUser;
                try {
                    const wcCustomer = await getCustomer(wpUser.id);
                    if (wcCustomer) {
                        // Merge WP User + WC Customer data
                        customerData = { ...wpUser, ...wcCustomer };
                    }
                } catch (wcError) {
                    console.warn("Failed to fetch WC customer details, using basic WP user", wcError);
                }

                // 3. Login
                // Storing a simple session marker. 
                // Security Note: In a production app, use JWT tokens.
                login("basic-auth-session", customerData);

                toast({
                    title: "Uspješna prijava",
                    description: `Dobrodošli natrag, ${customerData.first_name || customerData.username}!`,
                });

                navigate("/account");
            } else {
                throw new Error("Invalid response");
            }

        } catch (error: any) {
            console.error("Login Check Failed:", error);
            toast({
                title: "Greška pri prijavi",
                description: "Netočno korisničko ime ili lozinka.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <PageHero title="Prijava" />
            <div className="container px-4 py-12 flex justify-center">
                <Card className="w-full max-w-md p-6 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Korisničko ime ili Email</Label>
                            <Input id="username" required value={formData.username} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Lozinka</Label>
                            <Input id="password" type="password" required value={formData.password} onChange={handleInputChange} />
                        </div>
                        <Button type="submit" className="w-full bg-gradient-to-r from-[#0044bf] to-[#ad00e9] text-white font-bold" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Prijavi se"}
                        </Button>
                    </form>
                    <p className="text-center text-sm text-gray-500 mt-4">
                        Nemate račun? <span className="text-primary font-bold">Pridružite se klikom na gumb u izborniku!</span>
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default Login;
