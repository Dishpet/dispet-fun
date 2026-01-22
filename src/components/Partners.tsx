import { useEffect, useState } from "react";
import { getPosts } from "@/integrations/wordpress/posts";

// Default imports for fallback
import caelor from "@/assets/partneri/caelor.png";
import digitalProdukt from "@/assets/partneri/digital-produkt.png";
import nkSpalato from "@/assets/partneri/nk-spalato.png";
import sunCitySport from "@/assets/partneri/sun-city-sport.png";

const DEFAULT_LOGOS = [
    { src: caelor, alt: "Caelor", link: "" },
    { src: digitalProdukt, alt: "Digital Produkt", link: "" },
    { src: nkSpalato, alt: "NK Spalato", link: "" },
    { src: sunCitySport, alt: "Sun City Sport", link: "" },
];

const CONFIG_SLUG = "config-partners";

interface PartnerItem {
    id: string;
    name: string;
    link: string;
    logoUrl: string;
}

export const Partners = () => {
    const [partners, setPartners] = useState<PartnerItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                // Fetch dynamic config
                const posts = await getPosts();
                const found = posts.find(p => p.slug === CONFIG_SLUG);
                if (found) {
                    const cleanJson = found.content.rendered.replace(/<[^>]*>?/gm, '');
                    const parsed = JSON.parse(cleanJson);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setPartners(parsed);
                        setLoading(false);
                        return;
                    }
                }
            } catch (e) {
                console.error("Failed to fetch dynamic partners", e);
            }

            // Fallback to default if no valid dynamic data
            setPartners(DEFAULT_LOGOS.map((l, i) => ({
                id: `default-${i}`,
                name: l.alt,
                link: l.link,
                logoUrl: l.src
            })));
            setLoading(false);
        };

        fetchPartners();
    }, []);

    // Duplicate for scroll effect
    const displayPartners = partners.length > 0 ? partners : [];
    // If fewer than e.g. 5 partners, duplicate more times to ensure smooth scroll?
    // The CSS animation assumes smooth scroll.
    // Let's at least double it.
    const loop = [...displayPartners, ...displayPartners];

    // If loading, maybe show nothing or defaults?
    // We default to defaults if fetch fails or is empty, so `displayPartners` will have something.

    return (
        <section className="py-20 bg-white">
            <div className="container px-4 mx-auto">
                <div className="text-center mb-12 animate-fade-in">
                    <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-4">
                        Prijatelji projekta
                    </h2>
                    <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                        Hvala svim partnerima koji podržavaju naš projekt!
                    </p>
                </div>

                <div className="relative overflow-hidden">
                    {/* Gradient overlays */}
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

                    {/* Scrolling container */}
                    <div className="flex gap-12 md:gap-16 py-8 animate-scroll">
                        {loop.map((logo, index) => (
                            <a
                                key={`${logo.id}-${index}`}
                                href={logo.link || "#"}
                                target={logo.link ? "_blank" : undefined}
                                rel="noopener noreferrer"
                                className={`flex-shrink-0 w-48 h-32 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100 ${!logo.link ? 'cursor-default pointer-events-none' : ''}`}
                            >
                                <img
                                    src={logo.logoUrl}
                                    alt={logo.name}
                                    title={logo.name}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
        </section>
    );
};
