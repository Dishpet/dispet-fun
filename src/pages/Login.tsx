import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { PageHero } from "@/components/PageHero";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { verifyCredentials, getCustomer, syncGoogleUserToWP } from "@/integrations/wordpress/woocommerce";

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const redirectPath = queryParams.get('redirect') || '/account';

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

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const decoded: any = jwtDecode(credentialResponse.credential);
            console.log("Google User:", decoded);

            // In a real app, you would send credentialResponse.credential to your backend 
            // to verify and get a WP user token.
            // For now, we will create a session based on the Google profile.

            const googleUser = {
                id: Date.now(), // Temporary ID
                username: decoded.email.split('@')[0],
                email: decoded.email,
                first_name: decoded.given_name,
                last_name: decoded.family_name,
                billing: {
                    first_name: decoded.given_name,
                    last_name: decoded.family_name,
                    email: decoded.email,
                    address_1: "",
                    city: "",
                    postcode: "",
                    country: "",
                    phone: ""
                },
                shipping: {
                    first_name: decoded.given_name,
                    last_name: decoded.family_name,
                    address_1: "",
                    city: "",
                    postcode: "",
                    country: ""
                }
            };

            // SYNC TO WP
            try {
                const wpUser = await syncGoogleUserToWP(googleUser);
                console.log("Synced WP User:", wpUser);

                // Use the REAL WP ID
                googleUser.id = wpUser.id;
                // Merge WP data (billing etc)
                googleUser.billing = { ...googleUser.billing, ...wpUser.billing };
                googleUser.shipping = { ...googleUser.shipping, ...wpUser.shipping };

            } catch (syncError) {
                console.error("Failed to sync Google User to WP:", syncError);
                toast({
                    title: "Greška sinkronizacije",
                    description: "Nismo uspjeli povezati vaš račun sa serverom.",
                    variant: "destructive"
                });
                return; // Stop login if sync fails
            }

            login("google-session-token", googleUser);

            toast({
                title: "Uspješna Google prijava",
                description: `Dobrodošli, ${decoded.name}!`,
            });

            navigate(redirectPath);
        } catch (error) {
            console.error("Google Login Error", error);
            toast({
                title: "Greška",
                description: "Neuspješna prijava putem Google-a.",
                variant: "destructive"
            });
        }
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
                // Store Basic Auth Credential so we can make API calls as this user
                // Security Note: In a production app, use JWT tokens via a plugin for better security.
                const authHash = btoa(unescape(encodeURIComponent(`${formData.username}:${formData.password}`)));
                login(authHash, customerData);

                toast({
                    title: "Uspješna prijava",
                    description: `Dobrodošli natrag, ${customerData.first_name || customerData.username}!`,
                });

                navigate(redirectPath);
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

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Ili nastavite putem</span>
                            </div>
                        </div>

                        <div className="flex justify-center w-full">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => {
                                    console.log('Login Failed');
                                    toast({
                                        title: "Greška",
                                        description: "Neuspješna prijava putem Google-a.",
                                        variant: "destructive"
                                    });
                                }}
                                useOneTap
                                theme="filled_blue"
                                shape="pill"
                                width="300"
                            />
                        </div>

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
