import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

import { PageHero } from "@/components/PageHero";

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cartItems, removeFromCart, updateQuantity, cartSubtotal, shippingCost, cartTotal } = useCart();

  const { user } = useAuth();

  const handleCheckout = () => {
    if (!user) {
      toast({
        title: "Potrebna prijava",
        description: "Za nastavak kupovine molimo prijavite se ili kreirajte račun.",
        variant: "default"
      });
      // Redirect to Login, but tell it to come back to Checkout after
      navigate("/login?redirect=/checkout");
    } else {
      navigate("/checkout");
    }
  };

  const handleRemoveItem = (id: string) => {
    removeFromCart(id);
    toast({
      title: "Uklonjeno iz košarice",
      description: "Proizvod je uklonjen iz vaše košarice.",
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen">
        <PageHero title="KOŠARICA" />
        <div className="bg-background py-20">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto text-center">
              <ShoppingBag className="w-24 h-24 mx-auto text-muted mb-6" />
              <h1 className="text-4xl font-heading mb-4">Vaša košarica je prazna</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Dodajte proizvode u košaricu kako biste započeli kupovinu.
              </p>
              <Button variant="default" size="lg" onClick={() => navigate("/shop")}>
                Pregledajte proizvode
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHero title="KOŠARICA" />
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
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => (
                <Card
                  key={item.cartId || item.id}
                  className="p-4 md:p-6 shadow-soft hover-lift animate-bounce-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex gap-4 md:gap-6">
                    <div
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center flex-shrink-0 border relative overflow-hidden"
                      style={{ backgroundColor: item.selectedColor || '#ffffff' }}
                    >
                      {/* Selected Design Preview */}
                      {item.images?.[0] ? (
                        <div className="relative w-full h-full p-2">
                          <img
                            src={item.images[0].src}
                            alt={item.name}
                            className="w-full h-full object-contain relative z-10"
                          />
                        </div>
                      ) : (
                        <div className="text-gray-400 text-xs">Nema slike</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-heading mb-2">{item.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {item.selectedSize && <span className="mr-3">Veličina: <strong>{item.selectedSize}</strong></span>}
                        {item.selectedColor && <span className="flex items-center gap-1 inline-flex align-middle">
                          Boja: <span className="w-3 h-3 rounded-full border border-gray-300 inline-block" style={{ backgroundColor: item.selectedColor }}></span>
                        </span>}
                      </p>
                      <p className="text-2xl font-bold text-primary mb-4 font-heading">
                        {item.sale_price ? parseFloat(item.sale_price).toFixed(2) : parseFloat(item.price).toFixed(2)} €
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            className="w-8 h-8 rounded-full p-0 flex items-center justify-center border-2"
                            onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-12 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            className="w-8 h-8 rounded-full p-0 flex items-center justify-center border-2"
                            onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.cartId)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 shadow-medium sticky top-24 animate-fade-in">
                <h2 className="text-2xl font-heading mb-6">Sažetak narudžbe</h2>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-lg">
                    <span>Međuzbroj:</span>
                    <span className="font-semibold font-heading">{cartSubtotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span>Dostava:</span>
                    {shippingCost === 0 ? (
                      <span className="font-bold font-heading text-green-600">Besplatno</span>
                    ) : (
                      <span className="font-bold font-heading">{shippingCost.toFixed(2)} €</span>
                    )}
                  </div>
                  {cartSubtotal < 70 && (
                    <div className="text-sm text-muted-foreground italic">
                      Još {(70 - cartSubtotal).toFixed(2)}€ do besplatne dostave!
                    </div>
                  )}
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Ukupno:</span>
                      <span className="text-primary font-heading">{cartTotal.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="default"
                  size="lg"
                  className="w-full bg-gradient-to-r from-[#00ffbf] to-[#0089cd] hover:opacity-90 transition-opacity"
                  onClick={handleCheckout}
                >
                  Nastavi na naplatu
                </Button>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate("/shop")}
                >
                  Nastavi kupovati
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
