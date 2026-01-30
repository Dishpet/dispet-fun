import { useState } from 'react';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Calendar, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StripePaymentFormProps {
    onPaymentSuccess: (token: any) => void;
    amount: number;
    isProcessing: boolean;
    billingDetails?: {
        name: string;
        address_line1: string;
        address_city: string;
        address_zip: string;
        address_country: string;
    };
}

const inputStyle = {
    style: {
        base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
                color: '#aab7c4',
            },
            iconColor: '#c4f0ff',
        },
        invalid: {
            color: '#9e2146',
        },
    },
};

export const StripePaymentForm = ({ onPaymentSuccess, amount, isProcessing, billingDetails }: StripePaymentFormProps) => {
    const stripe = useStripe();
    const elements = useElements();
    const { toast } = useToast();
    const [cardError, setCardError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        const cardNumberElement = elements.getElement(CardNumberElement);
        if (!cardNumberElement) return;

        // Use billing details if provided
        const options = billingDetails ? billingDetails : {};

        const { error, token } = await stripe.createToken(cardNumberElement, options);

        if (error) {
            setCardError(error.message || 'Došlo je do greške s karticom.');
            toast({
                title: "Greška pri plaćanju",
                description: error.message,
                variant: "destructive"
            });
        } else if (token) {
            setCardError(null);
            onPaymentSuccess(token);
        }
    };

    return (
        <div className="w-full space-y-6">
            <div className="space-y-4">
                {/* Card Number */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground ml-1 uppercase flex items-center gap-1.5 opacity-70">
                        <CreditCard className="w-3.5 h-3.5" /> Broj kartice
                    </label>
                    <div className="px-4 py-3 bg-card border-2 rounded-full focus-within:border-primary transition-all">
                        <CardNumberElement options={{ ...inputStyle, showIcon: true }} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Expiry Date */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground ml-1 uppercase flex items-center gap-1.5 opacity-70">
                            <Calendar className="w-3.5 h-3.5" /> Istek
                        </label>
                        <div className="px-4 py-3 bg-card border-2 rounded-full focus-within:border-primary transition-all">
                            <CardExpiryElement options={inputStyle} />
                        </div>
                    </div>

                    {/* CVC */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground ml-1 uppercase flex items-center gap-1.5 opacity-70">
                            <Lock className="w-3.5 h-3.5" /> CVC
                        </label>
                        <div className="px-4 py-3 bg-card border-2 rounded-full focus-within:border-primary transition-all">
                            <CardCvcElement options={inputStyle} />
                        </div>
                    </div>
                </div>
            </div>

            {cardError && (
                <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2 font-medium">
                    <span className="font-bold text-lg">!</span> {cardError}
                </div>
            )}

            <Button
                onClick={handleSubmit}
                disabled={!stripe || isProcessing}
                className="w-full h-12 bg-gradient-to-r from-[#00ffbf] to-[#0089cd] text-white font-bold text-lg hover:scale-[1.02] transition-transform shadow-lg rounded-full mt-4"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Obrađivanje...
                    </>
                ) : (
                    <>Plati {amount.toFixed(2)} €</>
                )}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground flex justify-center items-center gap-1.5 opacity-60">
                <Lock className="w-3 h-3" />
                Transakcija je osigurana 256-bitnom SSL enkripcijom
            </p>
        </div>
    );
};
