import { useState, useEffect } from "react";
import { PageHero } from "@/components/PageHero";
import rokoKontakt from "@/assets/roko-kontakt.webp";
import ekipaImg from "@/assets/ekipa.png";
import { MapPin, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getPosts, getPostBySlug } from "@/integrations/wordpress/posts";

const CONFIG_SLUG = "config-contact";

interface ContactConfig {
    location: string;
    emails: string[];
    phones: string[];
}

const DEFAULT_CONTACT: ContactConfig = {
    location: "Split, Croatia",
    emails: ["info@dispet.fun"],
    phones: ["(+385) 555 6666"]
};

// Legacy interface for safety
interface LegacyContactConfig {
    location: string;
    email?: string;
    phone?: string;
    emails?: string[];
    phones?: string[];
}

const Contact = () => {
    const [contactInfo, setContactInfo] = useState<ContactConfig>(DEFAULT_CONTACT);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // Use specific slug fetch for reliability
                const found = await getPostBySlug(CONFIG_SLUG);

                if (found) {
                    const cleanJson = found.content.rendered.replace(/<[^>]*>?/gm, '');
                    const parsed = JSON.parse(cleanJson) as LegacyContactConfig;
                    if (parsed && typeof parsed === 'object') {
                        // Migrate legacy fields to arrays
                        const emails = parsed.emails || (parsed.email ? [parsed.email] : DEFAULT_CONTACT.emails);
                        const phones = parsed.phones || (parsed.phone ? [parsed.phone] : DEFAULT_CONTACT.phones);

                        setContactInfo({
                            location: parsed.location || DEFAULT_CONTACT.location,
                            emails,
                            phones
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to fetch contact config", e);
            }
        };
        fetchConfig();
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <PageHero title="KONTAKT" characterImage={ekipaImg}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 text-center lg:text-left mt-12 md:mt-16 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    {/* Location */}
                    <div className="flex flex-col items-center lg:items-start space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm shadow-sm transition-transform hover:scale-110">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold tracking-wide font-heading">Lokacija</h3>
                        </div>
                        <div className="lg:pl-2">
                            <p className="text-white/90 text-lg leading-relaxed">{contactInfo.location}</p>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col items-center lg:items-start space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm shadow-sm transition-transform hover:scale-110">
                                <Mail className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold tracking-wide font-heading">Email</h3>
                        </div>
                        <div className="lg:pl-2 flex flex-col gap-1">
                            {contactInfo.emails.map((email, i) => (
                                <a key={i} href={`mailto:${email}`} className="text-white/90 text-lg leading-relaxed hover:text-white transition-colors underline-offset-4 hover:underline">
                                    {email}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col items-center lg:items-start space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm shadow-sm transition-transform hover:scale-110">
                                <Phone className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold tracking-wide font-heading">Telefon</h3>
                        </div>
                        <div className="lg:pl-2 flex flex-col gap-1">
                            {contactInfo.phones.map((phone, i) => (
                                <a key={i} href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="text-white/90 text-lg leading-relaxed hover:text-white transition-colors underline-offset-4 hover:underline">
                                    {phone}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </PageHero>

            {/* Contact Form Section */}
            <section className="bg-white py-12 md:py-20">
                <div className="container px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            {/* Left Column - Image */}
                            <div className="relative flex justify-center animate-fade-in">
                                <img
                                    src={rokoKontakt}
                                    alt="Roko Contact"
                                    className="w-full max-w-md h-auto object-contain hover-scale"
                                />
                            </div>

                            {/* Right Column - Form */}
                            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                                <div className="mb-8">
                                    <h2 className="text-3xl font-heading font-bold mb-4 text-foreground">Slobodno nam se obratite</h2>
                                </div>

                                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-bold text-foreground ml-1">Ime i prezime <span className="text-destructive">*</span></label>
                                        <Input
                                            id="name"
                                            className="bg-card rounded-full h-12 border-2 focus:border-primary transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="phone" className="text-sm font-bold text-foreground ml-1">Telefon <span className="text-destructive">*</span></label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            className="bg-card rounded-full h-12 border-2 focus:border-primary transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-bold text-foreground ml-1">Email adresa <span className="text-destructive">*</span></label>
                                        <Input
                                            id="email"
                                            type="email"
                                            className="bg-card rounded-full h-12 border-2 focus:border-primary transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="message" className="text-sm font-bold text-foreground ml-1">Vaša poruka <span className="text-destructive">*</span></label>
                                        <Textarea
                                            id="message"
                                            className="min-h-[150px] bg-card rounded-3xl border-2 focus:border-primary p-4 transition-all"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="gradient"
                                        size="lg"
                                        className="w-full md:w-auto px-8"
                                    >
                                        Pošalji Poruku
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
