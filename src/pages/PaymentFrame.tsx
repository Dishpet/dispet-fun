import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHero } from "@/components/PageHero";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentFrame = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [payUrl, setPayUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Try to get URL from state (secure/clean) or query param (fallback)
        const stateUrl = location.state?.payUrl;
        const queryUrl = new URLSearchParams(location.search).get('url');

        if (stateUrl) {
            setPayUrl(stateUrl);
        } else if (queryUrl) {
            setPayUrl(decodeURIComponent(queryUrl));
        } else {
            // No URL provided, redirect back to cart
            navigate('/cart');
        }
    }, [location, navigate]);

    if (!payUrl) return null;

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <PageHero title="ZAVRŠITE NARUDŽBU" />

            <div className="flex-1 container px-4 py-8 flex flex-col items-center">
                <div className="max-w-4xl w-full space-y-6">

                    {/* Status Message & Primary Action */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border text-center space-y-4">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h2 className="text-2xl font-heading font-bold">Narudžba je kreirana!</h2>
                            <p className="text-gray-600 max-w-lg mx-auto">
                                Za završetak kupovine, molimo izvršite plaćanje. Ako se obrazac za plaćanje ne učita ispod, kliknite na gumb.
                            </p>
                        </div>

                        <Button
                            onClick={() => window.open(payUrl, '_self')}
                            size="lg"
                            className="w-full sm:w-auto min-w-[200px] bg-gradient-to-r from-[#00ffbf] to-[#0089cd] text-white font-bold text-lg hover:scale-105 transition-transform"
                        >
                            Plati sigurno
                        </Button>
                    </div>

                    {/* Iframe Container */}
                    <div className="relative w-full h-[800px] border-2 border-gray-100 rounded-2xl overflow-hidden shadow-lg bg-gray-50">
                        {/* Loading Overlay */}
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 backdrop-blur-sm">
                                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                                <p className="text-xl font-heading text-gray-600">Učitavanje sigurnog plaćanja...</p>
                            </div>
                        )}

                        <iframe
                            src={payUrl}
                            className="w-full h-full border-0"
                            onLoad={() => setIsLoading(false)}
                            title="Payment Page"
                            onError={() => setIsLoading(false)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentFrame;
