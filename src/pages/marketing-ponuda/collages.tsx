/**
 * Marketing Ponuda v2 — editorial photo collages.
 *
 * Four section-specific arrangements built from one shared card.
 * Every card opens the section lightbox; accent colors stay per section.
 */
import { type CSSProperties } from "react";
import { MediaItem, Parallax, Reveal } from "./shared";

interface CollageProps {
    photos: string[];
    accentColor: string;
    shadowColor: string;
    onPhotoClick: (idx: number) => void;
}

const CollageCard = ({
    src,
    alt,
    onClick,
    accentColor,
    shadowColor,
    aspect,
    rotate = "",
    hoverScale = "hover:scale-[1.02]",
    frame = "border border-white/10",
}: {
    src: string;
    alt: string;
    onClick: () => void;
    accentColor: string;
    shadowColor: string;
    aspect: string;
    rotate?: string;
    hoverScale?: string;
    frame?: string;
}) => (
    <button
        type="button"
        onClick={onClick}
        className={`group relative w-full ${aspect} ${rotate} cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl ${frame} transition-all duration-500 hover:z-20 ${hoverScale} hover:rotate-0 hover:border-[var(--hover-border)] hover:shadow-[var(--hover-shadow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mk-pink)]`}
        style={{
            ["--hover-border" as string]: accentColor,
            ["--hover-shadow" as string]: `0 20px 40px -15px ${shadowColor}`,
        } as CSSProperties}
    >
        <MediaItem src={src} alt={alt} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-30" />
    </button>
);

/** Two staggered overlapping cards (O nama). */
export const AboutCollage = ({ photos, accentColor, shadowColor, onPhotoClick }: CollageProps) => (
    <Reveal fromX={-30} fromY={0} className="mx-auto w-full max-w-[560px]">
        <Parallax dist={15}>
            <CollageCard src={photos[0]} alt="Dišpet o nama" aspect="aspect-[4/5]" accentColor={accentColor} shadowColor={shadowColor} onClick={() => onPhotoClick(0)} />
        </Parallax>
    </Reveal>
);

/** Wide video banner + two image cards below (Na terenu). */
export const TerenCollage = ({ photos, accentColor, shadowColor, onPhotoClick }: CollageProps) => (
    <div className="grid gap-4 sm:gap-6">
        {/* photos[1] is the section video — top row */}
        <Reveal fromY={40}>
            <Parallax dist={10}>
                <CollageCard src={photos[1]} alt="Dišpet teren video" aspect="aspect-[16/9] sm:aspect-[2.4/1]" hoverScale="hover:scale-[1.01]" accentColor={accentColor} shadowColor={shadowColor} onClick={() => onPhotoClick(1)} />
            </Parallax>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <Reveal fromX={-30} fromY={20} delay={0.05}>
                <Parallax dist={-15}>
                    <CollageCard src={photos[0]} alt="Dišpet teren 1" aspect="aspect-[4/3]" accentColor={accentColor} shadowColor={shadowColor} onClick={() => onPhotoClick(0)} />
                </Parallax>
            </Reveal>
            <Reveal fromX={30} fromY={20} delay={0.1}>
                <Parallax dist={20}>
                    <CollageCard src={photos[2]} alt="Dišpet teren 2" aspect="aspect-[4/3]" accentColor={accentColor} shadowColor={shadowColor} onClick={() => onPhotoClick(2)} />
                </Parallax>
            </Reveal>
        </div>
    </div>
);

/** Parallel offset columns (Sponzorske površine). */
export const SponsorCollage = ({ photos, accentColor, shadowColor, onPhotoClick }: CollageProps) => (
    <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 sm:gap-6">
        <Reveal fromY={40}>
            <Parallax dist={20}>
                <CollageCard src={photos[0]} alt="Dišpet sponzorstvo" aspect="aspect-[4/3] sm:aspect-[3/4]" accentColor={accentColor} shadowColor={shadowColor} onClick={() => onPhotoClick(0)} />
            </Parallax>
        </Reveal>
        <Reveal fromY={40} delay={0.1} className="sm:mt-12">
            <Parallax dist={-20}>
                <CollageCard src={photos[1]} alt="Dišpet sponzori" aspect="aspect-[4/3] sm:aspect-[3/4]" accentColor={accentColor} shadowColor={shadowColor} onClick={() => onPhotoClick(1)} />
            </Parallax>
        </Reveal>
    </div>
);

/** Two tilted polaroid-style cards (Partneri). */
export const PartneriCollage = ({ photos, accentColor, shadowColor, onPhotoClick }: CollageProps) => (
    <div className="relative h-[280px] w-full sm:h-[380px] md:h-[480px]">
        <Reveal fromX={-30} fromRotate={-6} className="absolute left-1 top-1 w-[62%] origin-bottom-left sm:left-4 sm:top-4 sm:w-[60%]">
            <Parallax dist={10}>
                <CollageCard
                    src={photos[0]}
                    alt="Dišpet partner"
                    aspect="aspect-[4/5]"
                    rotate="-rotate-2 sm:-rotate-3"
                    hoverScale="hover:scale-[1.04]"
                    frame="border-2 border-[rgba(7,17,35,0.8)] ring-1 ring-white/10"
                    accentColor={accentColor}
                    shadowColor={shadowColor}
                    onClick={() => onPhotoClick(0)}
                />
            </Parallax>
        </Reveal>
        <Reveal fromX={30} fromRotate={6} delay={0.1} className="absolute bottom-1 right-1 w-[62%] origin-bottom-right sm:bottom-4 sm:right-4 sm:w-[60%]">
            <Parallax dist={-15}>
                <CollageCard
                    src={photos[1]}
                    alt="Dišpet partnerstvo"
                    aspect="aspect-[4/5]"
                    rotate="rotate-2 sm:rotate-3"
                    hoverScale="hover:scale-[1.04]"
                    frame="border-2 border-[rgba(7,17,35,0.8)] ring-1 ring-white/10"
                    accentColor={accentColor}
                    shadowColor={shadowColor}
                    onClick={() => onPhotoClick(1)}
                />
            </Parallax>
        </Reveal>
    </div>
);
