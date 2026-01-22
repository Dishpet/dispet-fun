import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, MapPin, User, Loader2, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { createOrder } from "@/integrations/wordpress/woocommerce";

import { PageHero } from "@/components/PageHero";

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cartItems, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  // ... (existing state and handlers)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (cartItems.length === 0) {
      toast({
        title: "Košarica je prazna",
        description: "Dodajte proizvode prije naplate.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      const orderData = {
        set_paid: false,
        billing: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address,
          city: formData.city,
          postcode: formData.postalCode,
          country: formData.country,
          email: formData.email,
          phone: formData.phone,
        },
        shipping: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address,
          city: formData.city,
          postcode: formData.postalCode,
          country: formData.country,
        },
        line_items: cartItems.map(item => {
          const cartItem = item as any;
          const meta_data = [];

          if (cartItem.size) {
            meta_data.push({ key: 'Veličina', value: cartItem.size });
          }
          if (cartItem.color) {
            meta_data.push({ key: 'Boja', value: cartItem.color });
          }
          if (cartItem.images?.[0]?.src) {
            // Pass the design URL. This is the custom overlay image.
            meta_data.push({ key: 'Dizajn', value: cartItem.images[0].src });
          }

          return {
            product_id: item.id,
            quantity: item.quantity,
            meta_data
          };
        })
      };

      const response: any = await createOrder(orderData);

      if (response.id && response.order_key) {
        toast({
          title: "Narudžba kreirana",
          description: "Preusmjeravanje na sigurno plaćanje...",
        });

        clearCart();

        // Construct Payment URL dynamically
        // Assuming API URL is like 'https://wp.dispet.fun/wp-json'
        const wpApiUrl = import.meta.env.VITE_WP_API_URL || 'https://wp.dispet.fun/wp-json';
        const wpBaseUrl = wpApiUrl.replace('/wp-json', '');

        // Standard WooCommerce Pay Link - Hardcoded to ensure correct path
        const payUrl = `https://wp.dispet.fun/checkout-2/order-pay/${response.id}/?pay_for_order=true&key=${response.order_key}`;
        console.log("Redirecting to:", payUrl);

        setTimeout(() => {
          window.location.href = payUrl;
        }, 1500);

      } else {
        throw new Error("Invalid order response");
      }

    } catch (error) {
      console.error("Order creation failed:", error);
      toast({
        title: "Greška narudžbe",
        description: error instanceof Error ? error.message : "Došlo je do greške. Provjerite konzolu.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const shipping = 0;
  const total = cartTotal + shipping;

  return (
    <div className="min-h-screen">
      <PageHero title="NAPLATA" />
      <div className="bg-white py-12 md:py-20">
        <div className="container px-4">
          <Button
            variant="ghost"
            className="mb-6 pl-0 hover:bg-transparent hover:text-primary transition-colors"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-6 h-6 mr-2" />
            Natrag
          </Button>
          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Checkout Forms */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Information */}
                <Card className="p-6 shadow-soft animate-bounce-in">
                  <div className="flex items-center gap-3 mb-6">
                    <User className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-heading">Kontakt informacije</h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Ime</Label>
                      <Input id="firstName" required className="rounded-full" value={formData.firstName} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Prezime</Label>
                      <Input id="lastName" required className="rounded-full" value={formData.lastName} onChange={handleInputChange} />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        className="rounded-full"
                        value={formData.email} onChange={handleInputChange}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input id="phone" type="tel" required className="rounded-full" value={formData.phone} onChange={handleInputChange} />
                    </div>
                  </div>
                </Card>

                {/* Shipping Address */}
                <Card className="p-6 shadow-soft animate-bounce-in" style={{ animationDelay: "0.1s" }}>
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-heading">Adresa dostave</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address">Adresa</Label>
                      <Input id="address" required className="rounded-full" value={formData.address} onChange={handleInputChange} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">Grad</Label>
                        <Input id="city" required className="rounded-full" value={formData.city} onChange={handleInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="postalCode">Poštanski broj</Label>
                        <Input id="postalCode" required className="rounded-full" value={formData.postalCode} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="country">Država</Label>
                      <Input id="country" required className="rounded-full" value={formData.country} onChange={handleInputChange} />
                    </div>
                  </div>
                </Card>

                {/* Payment Information */}
                <Card className="p-6 shadow-soft animate-bounce-in" style={{ animationDelay: "0.2s" }}>
                  <div className="flex items-center gap-3 mb-6">
                    <CreditCard className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-heading">Način plaćanja</h2>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-muted-foreground">
                      Bit ćete preusmjereni na sigurnu WordPress stranicu za plaćanje (Kartice / Stripe).
                    </p>
                  </div>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="p-6 shadow-medium sticky top-24 animate-fade-in">
                  <h2 className="text-2xl font-heading mb-6">Sažetak narudžbe</h2>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span>Proizvodi:</span>
                      <span className="font-semibold font-heading">{cartTotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dostava:</span>
                      <span className="font-bold font-heading text-green-600">Besplatno</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-xl font-bold">
                        <span>Ukupno:</span>
                        <span className="text-primary font-heading">{total.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="default"
                    size="lg"
                    className="w-full bg-gradient-primary"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Završi narudžbu"}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Sigurno plaćanje pomoću SSL enkripcije
                  </p>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
