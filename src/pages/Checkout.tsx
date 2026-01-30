import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, User, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { createOrder, executeHeadlessPayment } from "@/integrations/wordpress/woocommerce";
import { PageHero } from "@/components/PageHero";
import { useAuth } from "@/contexts/AuthContext";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { StripePaymentForm } from "@/components/StripePaymentForm";

// Initialize Stripe outside of component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { cartItems, cartSubtotal, shippingCost, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "HR",
  });

  // Force Login Check
  useEffect(() => {
    if (!user) {
      toast({
        title: "Potrebna prijava",
        description: "Molimo prijavite se ili kreirajte račun za nastavak kupovine.",
      });
      navigate("/login?redirect=/checkout");
    } else {
      // Auto-populate
      setFormData(prev => ({
        ...prev,
        firstName: user.first_name || user.billing?.first_name || prev.firstName,
        lastName: user.last_name || user.billing?.last_name || prev.lastName,
        email: user.email || user.billing?.email || prev.email,
        phone: user.billing?.phone || prev.phone,
        address: user.billing?.address_1 || prev.address,
        city: user.billing?.city || prev.city,
        postalCode: user.billing?.postcode || prev.postalCode,
        country: user.billing?.country || "HR" // Default to HR code
      }));
    }
  }, [user, navigate]);

  if (!user) return null; // Prevent render until redirect

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // Logic to process order after Stripe token is created
  const handleStripePayment = async (token: any) => {
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

    // Validate Form
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode', 'country'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);

    if (missingFields.length > 0) {
      toast({
        title: "Nedostaju podaci",
        description: "Molimo ispunite sva obavezna polja.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      const orderData = {
        set_paid: true,
        customer_id: user.id > 1000000000000 ? 0 : user.id, // Only use real WP IDs (timestamps are fake)
        payment_method: "stripe",
        payment_method_title: "Credit Card (Stripe)",
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
        shipping_lines: [
          {
            method_id: calculatedShipping === 0 ? "free_shipping" : "flat_rate",
            method_title: calculatedShipping === 0
              ? "Besplatna dostava"
              : (isCroatia ? "Dostava (Hrvatska)" : "International Shipping"),
            total: calculatedShipping.toString()
          }
        ],
        line_items: cartItems.map(item => {
          const cartItem = item as any;
          const meta_data = [];

          if (cartItem.size) meta_data.push({ key: 'Veličina', value: cartItem.size });
          if (cartItem.color) meta_data.push({ key: 'Boja', value: cartItem.color });
          if (cartItem.images?.[0]?.src) meta_data.push({ key: 'Dizajn', value: cartItem.images[0].src });

          return {
            product_id: item.id,
            variation_id: cartItem.variation_id, // Pass solved ID
            quantity: item.quantity,
            meta_data
          };
        }),
        meta_data: [
          { key: '_stripe_source_id', value: token.id }
        ]
      };

      const response: any = await executeHeadlessPayment(orderData, token.id);

      if (response.id) {
        // Send order notification with design details for printing team
        try {
          const notificationApiUrl = import.meta.env.DEV
            ? 'http://localhost:3000/api/order-notification'
            : '/api/order-notification';

          await fetch(notificationApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: response.id,
              customer: {
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                postalCode: formData.postalCode,
              },
              items: cartItems.map(item => ({
                name: item.name,
                image: item.images?.[0]?.src || '',
                color: item.selectedColor || '',
                size: item.selectedSize || '',
                quantity: item.quantity,
              })),
              total: cartTotal.toFixed(2),
            }),
          });
        } catch (notifError) {
          console.error('Failed to send order notification:', notifError);
          // Don't fail the order if notification fails
        }

        toast({
          title: "Narudžba uspješna!",
          description: "Hvala na kupovini. Potvrda je poslana na vaš email.",
        });

        clearCart();
        // Redirect to a success page or account page
        setTimeout(() => {
          navigate('/account');
        }, 1500);

      } else {
        throw new Error("Invalid order response");
      }

    } catch (error) {
      console.error("Order creation failed:", error);
      toast({
        title: "Greška narudžbe",
        description: error instanceof Error ? error.message : "Došlo je do greške.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isCroatia = formData.country.toLowerCase().includes('hrvat') || formData.country.toUpperCase() === 'HR';
  const calculatedShipping = isCroatia ? (cartSubtotal >= 70 ? 0 : 5) : 10;
  const total = cartSubtotal + calculatedShipping;

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

          {/* Wrap everything in Elements provider for Stripe */}
          <Elements stripe={stripePromise}>
            <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">

              {/* Left Column: Input Forms */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Information */}
                <Card className="p-6 shadow-soft animate-bounce-in">
                  <div className="flex items-center gap-3 mb-6">
                    <User className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-heading">Kontakt informacije</h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-bold text-foreground ml-1">Ime <span className="text-destructive">*</span></Label>
                      <Input id="firstName" required className="bg-card rounded-full h-12 border-2 focus:border-primary transition-all" value={formData.firstName} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-bold text-foreground ml-1">Prezime <span className="text-destructive">*</span></Label>
                      <Input id="lastName" required className="bg-card rounded-full h-12 border-2 focus:border-primary transition-all" value={formData.lastName} onChange={handleInputChange} />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="email" className="text-sm font-bold text-foreground ml-1">Email <span className="text-destructive">*</span></Label>
                      <Input id="email" type="email" required className="bg-card rounded-full h-12 border-2 focus:border-primary transition-all" value={formData.email} onChange={handleInputChange} />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="phone" className="text-sm font-bold text-foreground ml-1">Telefon <span className="text-destructive">*</span></Label>
                      <Input id="phone" type="tel" required className="bg-card rounded-full h-12 border-2 focus:border-primary transition-all" value={formData.phone} onChange={handleInputChange} />
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
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-bold text-foreground ml-1">Adresa <span className="text-destructive">*</span></Label>
                      <Input id="address" required className="bg-card rounded-full h-12 border-2 focus:border-primary transition-all" value={formData.address} onChange={handleInputChange} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-bold text-foreground ml-1">Grad <span className="text-destructive">*</span></Label>
                        <Input id="city" required className="bg-card rounded-full h-12 border-2 focus:border-primary transition-all" value={formData.city} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode" className="text-sm font-bold text-foreground ml-1">Poštanski broj <span className="text-destructive">*</span></Label>
                        <Input id="postalCode" required className="bg-card rounded-full h-12 border-2 focus:border-primary transition-all" value={formData.postalCode} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-sm font-bold text-foreground ml-1">Država <span className="text-destructive">*</span></Label>
                      <Input id="country" required className="bg-card rounded-full h-12 border-2 focus:border-primary transition-all" value={formData.country} onChange={handleInputChange} />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: Order Summary & Payment */}
              <div className="lg:col-span-1">
                <Card className="p-6 shadow-medium sticky top-24 animate-fade-in space-y-6">
                  <div>
                    <h2 className="text-2xl font-heading mb-6">Sažetak narudžbe</h2>
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between">
                        <span>Proizvodi:</span>
                        <span className="font-semibold font-heading">{cartSubtotal.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dostava:</span>
                        {calculatedShipping === 0 ? (
                          <span className="font-bold font-heading text-green-600">Besplatna</span>
                        ) : (
                          <span className="font-bold font-heading">{calculatedShipping.toFixed(2)} €</span>
                        )}
                      </div>
                      {!isCroatia && (
                        <p className="text-[10px] text-muted-foreground italic -mt-2">Međunarodna dostava (Flat Rate)</p>
                      )}
                      {isCroatia && cartSubtotal < 70 && (
                        <div className="text-[10px] text-muted-foreground italic -mt-2">
                          Još {(70 - cartSubtotal).toFixed(2)}€ do besplatne dostave u HR!
                        </div>
                      )}
                      <div className="border-t pt-4">
                        <div className="flex justify-between text-xl font-bold">
                          <span>Ukupno:</span>
                          <span className="text-primary font-heading">{total.toFixed(2)} €</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Secure Payment Form Replaces the Standard Button */}
                  <div className="pt-2 border-t">
                    <h3 className="text-lg font-bold mb-4">Plaćanje</h3>
                    <StripePaymentForm
                      amount={total}
                      onPaymentSuccess={handleStripePayment}
                      isProcessing={loading}
                      billingDetails={{
                        name: `${formData.firstName} ${formData.lastName}`,
                        address_line1: formData.address,
                        address_city: formData.city,
                        address_zip: formData.postalCode,
                        address_country: formData.country,
                      }}
                    />
                  </div>

                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Vaši podaci su zaštićeni SSL enkripcijom.
                  </p>
                </Card>
              </div>

            </div>
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
