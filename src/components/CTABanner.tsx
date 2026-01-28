import { useState } from "react";
import { Bell, ShoppingBag, Star, Percent, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createCustomer } from "@/integrations/wordpress/woocommerce";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

export const CTABanner = () => {
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
                login("dummy-token", response);
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
        <section className="py-24 bg-white relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* Left Side - Text & Benefits */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-heading font-black text-[#43bfe6] mb-6 leading-tight">
                                Pridruži se <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0044bf] to-[#ad00e9]">Dišpet</span> Klubu!
                            </h2>
                            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                                Postani dio ekipe i uživaj u ekskluzivnim pogodnostima koje su rezervirane samo za naše članove.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:border-[#0044bf]/20">
                                <div className="p-3 bg-white rounded-lg shadow-sm text-[#0044bf]">
                                    <Bell className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Obavijesti</h3>
                                    <p className="text-sm text-gray-500 mt-1">Saznaj prvi za vrijeme i lokaciju sljedećeg Dišpeta!</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:border-[#ad00e9]/20">
                                <div className="p-3 bg-white rounded-lg shadow-sm text-[#ad00e9]">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Merch Drops</h3>
                                    <p className="text-sm text-gray-500 mt-1">Ekskluzivan pristup novim kolekcijama.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:border-[#00ffbf]/50">
                                <div className="p-3 bg-white rounded-lg shadow-sm text-[#0089cd]">
                                    <Star className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Nove Značajke</h3>
                                    <p className="text-sm text-gray-500 mt-1">Isprobaj nove igre i AI alate prije svih.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:border-[#e83e70]/20">
                                <div className="p-3 bg-white rounded-lg shadow-sm text-[#e83e70]">
                                    <Percent className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Popusti</h3>
                                    <p className="text-sm text-gray-500 mt-1">Posebni popusti samo za članove kluba.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Registration Form */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 relative">
                        {/* Decorative gradient blob behind */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#0044bf] to-[#ad00e9] rounded-3xl blur opacity-20 -z-10"></div>

                        <div className="max-w-md mx-auto">
                            <h3 className="text-2xl font-bold text-[#e83e70] mb-6 text-center">Kreiraj svoj račun</h3>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="cta-firstName" className="ml-1 font-bold">Ime</Label>
                                        <Input id="firstName" required value={formData.firstName} onChange={handleInputChange} className="rounded-full h-12 border-2 bg-gray-50 focus:bg-white focus:border-primary transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cta-lastName" className="ml-1 font-bold">Prezime</Label>
                                        <Input id="lastName" required value={formData.lastName} onChange={handleInputChange} className="rounded-full h-12 border-2 bg-gray-50 focus:bg-white focus:border-primary transition-all" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cta-username" className="ml-1 font-bold">Korisničko ime</Label>
                                    <Input id="username" required value={formData.username} onChange={handleInputChange} className="rounded-full h-12 border-2 bg-gray-50 focus:bg-white focus:border-primary transition-all" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cta-email" className="ml-1 font-bold">Email</Label>
                                    <Input id="email" type="email" required value={formData.email} onChange={handleInputChange} className="rounded-full h-12 border-2 bg-gray-50 focus:bg-white focus:border-primary transition-all" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cta-password" className="ml-1 font-bold">Lozinka</Label>
                                    <Input id="password" type="password" required value={formData.password} onChange={handleInputChange} className="rounded-full h-12 border-2 bg-gray-50 focus:bg-white focus:border-primary transition-all" />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-br from-[#0044bf] to-[#ad00e9] text-white hover:opacity-90 font-bold py-6 rounded-full shadow-lg transition-all text-base mt-4"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Registriraj se besplatno"}
                                </Button>

                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-gray-200" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-gray-500 font-medium">Ili</span>
                                    </div>
                                </div>

                                <div className="flex justify-center w-full">
                                    <GoogleLogin
                                        onSuccess={async (credentialResponse) => {
                                            try {
                                                const decoded: any = jwtDecode(credentialResponse.credential!);
                                                // Login logic...
                                                const googleUser = {
                                                    id: Date.now(),
                                                    username: decoded.email.split('@')[0],
                                                    email: decoded.email,
                                                    first_name: decoded.given_name,
                                                    last_name: decoded.family_name,
                                                    billing: { first_name: decoded.given_name, last_name: decoded.family_name, email: decoded.email, address_1: "", city: "", postcode: "", country: "", phone: "" },
                                                    shipping: { first_name: decoded.given_name, last_name: decoded.family_name, address_1: "", city: "", postcode: "", country: "" }
                                                };
                                                login("google-session-token", googleUser);
                                                toast({ title: "Uspješna registracija", description: `Dobrodošli, ${decoded.name}!` });
                                            } catch (error) { console.error("Google Login Error", error); }
                                        }}
                                        onError={() => console.log('Login Failed')}
                                        useOneTap
                                        theme="outline"
                                        shape="pill"
                                        width="100%"
                                    />
                                </div>

                                <p className="text-center text-sm text-gray-500 mt-4">
                                    Već imaš račun? <a href="/login" className="text-blue-600 font-bold hover:underline">Prijavi se</a>
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
