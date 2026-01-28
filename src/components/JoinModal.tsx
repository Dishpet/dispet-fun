import { useState } from "react";
import { X, Bell, ShoppingBag, Star, Percent, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createCustomer } from "@/integrations/wordpress/woocommerce";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

interface JoinModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const JoinModal = ({ isOpen, onClose }: JoinModalProps) => {
    const { toast } = useToast();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        username: "",
        password: "",
        firstName: "",
        lastName: ""
    });

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await createCustomer({
                email: formData.email,
                username: formData.username,
                password: formData.password,
                first_name: formData.firstName,
                last_name: formData.lastName,
            });

            if (response.id) {
                toast({
                    title: "Dobrodošli!",
                    description: "Vaš račun je uspješno kreiran.",
                });
                // Automatically login the user
                // Note: In a real app, we'd get a JWT token here. 
                // For now, we'll simulate login with the returned user data and a dummy token if the API doesn't return one.
                // WooCommerce create customer doesn't return a JWT usually. 
                // We might need a separate login call, but let's just set the user context for now.
                login("dummy-token", response);
                onClose();
            } else {
                throw new Error("Registration failed");
            }
        } catch (error: any) {
            console.error("Registration error:", error);
            toast({
                title: "Greška",
                description: "Došlo je do greške prilikom registracije. Provjerite podatke ili pokušajte kasnije.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[90vh] md:h-auto">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 z-50 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors md:text-white text-gray-800"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Left Side - Benefits (Gradient Background) */}
                <div className="md:w-2/5 bg-gradient-to-br from-[#0044bf] to-[#ad00e9] p-4 md:p-8 text-white flex flex-col justify-center relative overflow-hidden shrink-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/pattern.png')] opacity-10"></div>

                    <h2 className="text-xl md:text-3xl font-heading font-bold mb-2 md:mb-6 relative z-10 text-center md:text-left pt-2 md:pt-0">
                        Pridruži se Dišpet Klubu!
                    </h2>
                    <p className="mb-0 md:mb-8 text-white/90 relative z-10 text-sm md:text-base hidden md:block">Postani dio ekipe i uživaj u ekskluzivnim pogodnostima:</p>

                    <div className="space-y-6 relative z-10 hidden md:block">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Bell className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold">Obavijesti</h3>
                                <p className="text-sm text-white/80">Saznaj prvi za vrijeme i lokaciju sljedećeg Dišpeta!</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold">Merch Drops</h3>
                                <p className="text-sm text-white/80">Ekskluzivan pristup novim kolekcijama.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Star className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold">Nove Značajke</h3>
                                <p className="text-sm text-white/80">Isprobaj nove igre i AI alate prije svih.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Percent className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold">Popusti</h3>
                                <p className="text-sm text-white/80">Posebni popusti samo za članove kluba.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Registration Form */}
                <div className="md:w-3/5 p-4 md:p-8 bg-white overflow-y-auto">
                    <div className="max-w-md mx-auto">
                        <h3 className="text-2xl font-heading font-bold text-[#e83e70] mb-6">Kreiraj svoj račun</h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="ml-1 font-bold">Ime</Label>
                                    <Input id="firstName" required value={formData.firstName} onChange={handleInputChange} className="rounded-full h-12 border-2 bg-gray-50 focus:bg-white focus:border-primary transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="ml-1 font-bold">Prezime</Label>
                                    <Input id="lastName" required value={formData.lastName} onChange={handleInputChange} className="rounded-full h-12 border-2 bg-gray-50 focus:bg-white focus:border-primary transition-all" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="username" className="ml-1 font-bold">Korisničko ime</Label>
                                <Input id="username" required value={formData.username} onChange={handleInputChange} className="rounded-full h-12 border-2 bg-gray-50 focus:bg-white focus:border-primary transition-all" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="ml-1 font-bold">Email</Label>
                                <Input id="email" type="email" required value={formData.email} onChange={handleInputChange} className="rounded-full h-12 border-2 bg-gray-50 focus:bg-white focus:border-primary transition-all" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="ml-1 font-bold">Lozinka</Label>
                                <Input id="password" type="password" required value={formData.password} onChange={handleInputChange} className="rounded-full h-12 border-2 bg-gray-50 focus:bg-white focus:border-primary transition-all" />
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-br from-[#0044bf] to-[#ad00e9] text-white hover:opacity-90 font-bold py-6 rounded-full shadow-lg transition-all transform hover:-translate-y-1"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Registriraj se"}
                                </Button>
                            </div>

                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-muted-foreground">Ili nastavite putem</span>
                                </div>
                            </div>

                            <div className="flex justify-center w-full">
                                <GoogleLogin
                                    onSuccess={async (credentialResponse) => {
                                        try {
                                            const decoded: any = jwtDecode(credentialResponse.credential!);
                                            console.log("Google User in Join:", decoded);

                                            // Create session from Google
                                            const googleUser = {
                                                id: Date.now(),
                                                username: decoded.email.split('@')[0],
                                                email: decoded.email,
                                                first_name: decoded.given_name,
                                                last_name: decoded.family_name,
                                                billing: {
                                                    first_name: decoded.given_name,
                                                    last_name: decoded.family_name,
                                                    email: decoded.email,
                                                    address_1: "", city: "", postcode: "", country: "", phone: ""
                                                },
                                                shipping: {
                                                    first_name: decoded.given_name,
                                                    last_name: decoded.family_name,
                                                    address_1: "", city: "", postcode: "", country: ""
                                                }
                                            };

                                            login("google-session-token", googleUser);

                                            toast({
                                                title: "Uspješna registracija",
                                                description: `Dobrodošli, ${decoded.name}!`,
                                            });

                                            onClose();
                                        } catch (error) {
                                            console.error("Google Login Error", error);
                                        }
                                    }}
                                    onError={() => console.log('Login Failed')}
                                    useOneTap
                                    theme="filled_blue"
                                    shape="pill"
                                    width="100%"
                                />
                            </div>

                            <p className="text-center text-sm text-gray-500 mt-4">
                                Već imaš račun? <a href="/login" className="text-[#e83e70] font-bold hover:underline">Prijavi se</a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
