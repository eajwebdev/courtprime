import { AthleteArtwork, BrandWordmark, BrandWordmarkAuto } from '@/components/marketing-artwork';
import { EASE } from '@/lib/motion';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

const proof = [
    ['One identity', 'Register once, play at every connected club'],
    ['Verified record', 'Ratings and match history follow you'],
    ['Private operations', 'Club business data stays inside the club'],
] as const;

/**
 * Branded auth shell. Athlete artwork sits on the navy panel, never on the
 * form side, where the matting fringe would show against white and the art
 * would compete with the inputs.
 */
export default function AuthBrandLayout({ children, title, description }: AuthLayoutProps) {
    const reduce = useReducedMotion();

    const enter = (delay: number) =>
        reduce
            ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.01 } }
            : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, delay, ease: EASE } };

    return (
        <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
            {/* ---- Brand panel (desktop) ------------------------------------ */}
            <aside className="bg-surface-deep text-surface-deep-foreground relative hidden overflow-hidden p-10 lg:flex lg:flex-col">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(34rem 26rem at 78% 22%, color-mix(in srgb, var(--primary) 22%, transparent) 0%, transparent 62%), radial-gradient(30rem 24rem at 10% 88%, color-mix(in srgb, var(--brand-blue) 18%, transparent) 0%, transparent 60%)',
                    }}
                />

                <Link href="/" className="relative z-10 w-fit" aria-label="EAJ CourtPrime home">
                    <BrandWordmark variant="onDark" height={38} priority className="h-9" />
                </Link>

                <motion.div {...enter(0.1)} className="relative z-10 mt-16 max-w-md">
                    <h2 className="text-[2.25rem] leading-[1.1] font-semibold tracking-tight text-white">
                        One player identity.
                        <br />
                        <span className="text-primary">Every connected court.</span>
                    </h2>

                    <ul className="mt-10 space-y-5">
                        {proof.map(([label, copy], index) => (
                            <motion.li key={label} {...enter(0.2 + index * 0.08)} className="border-primary/40 border-l-2 pl-4">
                                <p className="text-label font-semibold text-white">{label}</p>
                                <p className="text-meta mt-0.5 text-white/55">{copy}</p>
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>

                <AthleteArtwork
                    asset="/cp-model4.png"
                    decorative
                    sizes="460px"
                    className="pointer-events-none absolute -right-12 -bottom-6 h-[62%] w-auto opacity-90"
                />

                <p className="text-meta relative z-10 mt-auto flex items-center gap-2 text-white/45">
                    <ShieldCheck className="size-4 shrink-0" />
                    Tenant-isolated by design. Your club data is never shared.
                </p>
            </aside>

            {/* ---- Form column ---------------------------------------------- */}
            <main className="bg-background flex flex-col justify-center px-5 py-10 sm:px-10">
                <div className="mx-auto w-full max-w-sm">
                    <div className="lg:hidden">
                        <Link href="/" className="inline-flex" aria-label="EAJ CourtPrime home">
                            <BrandWordmarkAuto height={34} priority className="h-8" />
                        </Link>
                    </div>

                    <Link
                        href="/"
                        className="text-meta text-muted hover:text-foreground mt-8 hidden items-center gap-1.5 transition-colors lg:inline-flex"
                    >
                        <ArrowLeft className="size-3.5" />
                        Back to CourtPrime
                    </Link>

                    <motion.div {...enter(0.05)} className="mt-8">
                        {title && <h1 className="text-h1 text-foreground">{title}</h1>}
                        {description && <p className="text-label text-secondary mt-2">{description}</p>}
                    </motion.div>

                    <motion.div {...enter(0.12)} className="mt-8">
                        {children}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
