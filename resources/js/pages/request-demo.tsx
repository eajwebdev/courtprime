import { AthleteArtwork, BrandWordmark, EquipmentArtwork } from '@/components/marketing-artwork';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Building2, CalendarCheck, CheckCircle2, ListChecks, Sparkles, type LucideIcon } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';

const featureOptions = [
    'Court Reservation',
    'POS',
    'Inventory',
    'Membership',
    'Tournament',
    'Open Play',
    'Live Scoring',
    'Player Ranking',
    'Staff Management',
    'Financial Reports',
    'Mobile Player Portal',
    'Digital Display',
    'API Integration',
    'Other',
];

const steps: { title: string; hint: string; icon: LucideIcon }[] = [
    { title: 'Your club', hint: 'How do we reach you?', icon: Building2 },
    { title: 'Your operation', hint: 'How big is the business today?', icon: ListChecks },
    { title: 'What you need', hint: 'Which modules matter most?', icon: Sparkles },
    { title: 'Schedule', hint: 'When suits you for a walkthrough?', icon: CalendarCheck },
    { title: 'Review', hint: 'Confirm and send', icon: CheckCircle2 },
];

export default function RequestDemo() {
    const reduce = useReducedMotion();
    const [step, setStep] = useState(1);
    const form = useForm({
        business_name: '',
        contact_person: '',
        email: '',
        mobile_number: '',
        website: '',
        facebook_page: '',
        branches_count: 1,
        courts_count: 1,
        estimated_members: '',
        estimated_monthly_reservations: '',
        existing_software: '',
        pain_points: '',
        features_needed: [] as string[],
        demo_preference: 'google_meet',
        preferred_date: '',
        preferred_time: '',
        notes: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/request-demo');
    };

    const toggleFeature = (feature: string) => {
        form.setData(
            'features_needed',
            form.data.features_needed.includes(feature)
                ? form.data.features_needed.filter((item) => item !== feature)
                : [...form.data.features_needed, feature],
        );
    };

    /* Step 1 is the only step with required fields, so it is the only gate. */
    const canContinue = step !== 1 || Boolean(form.data.business_name && form.data.contact_person && form.data.email);
    const active = steps[step - 1];

    return (
        <>
            <Head title="Book a demo | EAJ CourtPrime" />

            <div className="grid min-h-svh lg:grid-cols-[0.85fr_1.15fr]">
                {/* ---- Brand panel ------------------------------------------- */}
                <aside className="bg-surface-deep text-surface-deep-foreground relative hidden overflow-hidden p-10 lg:flex lg:flex-col">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(32rem 26rem at 80% 18%, color-mix(in srgb, var(--primary) 22%, transparent) 0%, transparent 62%), radial-gradient(28rem 22rem at 8% 90%, color-mix(in srgb, var(--brand-blue) 18%, transparent) 0%, transparent 60%)',
                        }}
                    />

                    <Link href="/" className="relative z-10 w-fit" aria-label="EAJ CourtPrime home">
                        <BrandWordmark variant="onDark" height={38} priority className="h-9" />
                    </Link>

                    <div className="relative z-10 mt-14 max-w-sm">
                        <h2 className="text-[2rem] leading-[1.1] font-semibold tracking-tight text-white">
                            Let&apos;s map your pickleball operation.
                        </h2>
                        <p className="text-label mt-4 text-white/60">
                            Tell us how your club runs today. We&apos;ll walk you through exactly the modules you need, no generic sales deck.
                        </p>

                        {/* Vertical step rail doubles as progress. */}
                        <ol className="mt-10 space-y-1">
                            {steps.map((item, index) => {
                                const number = index + 1;
                                const isActive = number === step;
                                const isDone = number < step;
                                return (
                                    <li key={item.title} className="flex items-center gap-3 py-2">
                                        <span
                                            data-numeric
                                            className={cn(
                                                'text-meta flex size-7 shrink-0 items-center justify-center rounded-full font-semibold transition-colors',
                                                isActive && 'bg-primary text-primary-foreground',
                                                isDone && 'bg-white/15 text-white',
                                                !isActive && !isDone && 'border border-white/20 text-white/40',
                                            )}
                                        >
                                            {isDone ? <CheckCircle2 className="size-4" /> : number}
                                        </span>
                                        <span className={cn('text-label', isActive ? 'font-medium text-white' : 'text-white/45')}>{item.title}</span>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>

                    <AthleteArtwork
                        asset="/cp-model3.png"
                        decorative
                        sizes="420px"
                        className="pointer-events-none absolute -right-16 -bottom-8 h-[52%] w-auto opacity-80"
                    />

                    <p className="text-meta relative z-10 mt-auto text-white/45">
                        You&apos;ll receive a tracked demo reference immediately after submitting.
                    </p>
                </aside>

                {/* ---- Form column -------------------------------------------- */}
                <main className="bg-background px-5 py-8 sm:px-10 lg:py-12">
                    <div className="mx-auto w-full max-w-2xl">
                        <div className="flex items-center justify-between gap-4 lg:hidden">
                            <Link href="/" aria-label="EAJ CourtPrime home">
                                <EquipmentArtwork asset="/cp.png" decorative width={40} height={40} sizes="40px" className="size-9" />
                            </Link>
                            <Link href="/" className="text-meta text-muted hover:text-foreground inline-flex items-center gap-1.5">
                                <ArrowLeft className="size-3.5" /> Back
                            </Link>
                        </div>

                        <div className="mt-8 lg:mt-0">
                            <p className="text-eyebrow text-primary uppercase">
                                Step {step} of {steps.length}
                            </p>
                            <h1 className="text-h1 text-foreground mt-2">{active.title}</h1>
                            <p className="text-label text-secondary mt-1.5">{active.hint}</p>
                        </div>

                        {/* Progress, mobile carries the whole rail as one bar. */}
                        <div className="mt-6 flex gap-1.5" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={steps.length}>
                            {steps.map((item, index) => (
                                <span
                                    key={item.title}
                                    className={cn(
                                        'h-1.5 flex-1 rounded-full transition-colors duration-300',
                                        index + 1 <= step ? 'bg-primary' : 'bg-border',
                                    )}
                                />
                            ))}
                        </div>

                        <form onSubmit={submit} className="mt-8">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={reduce ? { opacity: 0 } : { opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={reduce ? { opacity: 0 } : { opacity: 0, x: -16 }}
                                    transition={{ duration: reduce ? 0.01 : 0.25, ease: EASE }}
                                >
                                    {step === 1 && (
                                        <FieldGrid>
                                            <Field
                                                label="Business / club name"
                                                required
                                                value={form.data.business_name}
                                                onChange={(v) => form.setData('business_name', v)}
                                                error={form.errors.business_name}
                                            />
                                            <Field
                                                label="Owner / contact person"
                                                required
                                                value={form.data.contact_person}
                                                onChange={(v) => form.setData('contact_person', v)}
                                                error={form.errors.contact_person}
                                            />
                                            <Field
                                                label="Email"
                                                type="email"
                                                required
                                                value={form.data.email}
                                                onChange={(v) => form.setData('email', v)}
                                                error={form.errors.email}
                                            />
                                            <Field
                                                label="Mobile number"
                                                value={form.data.mobile_number}
                                                onChange={(v) => form.setData('mobile_number', v)}
                                                error={form.errors.mobile_number}
                                            />
                                            <Field label="Website" optional value={form.data.website} onChange={(v) => form.setData('website', v)} />
                                            <Field
                                                label="Facebook page"
                                                optional
                                                value={form.data.facebook_page}
                                                onChange={(v) => form.setData('facebook_page', v)}
                                            />
                                        </FieldGrid>
                                    )}

                                    {step === 2 && (
                                        <FieldGrid>
                                            <Field
                                                label="Number of branches"
                                                type="number"
                                                value={form.data.branches_count}
                                                onChange={(v) => form.setData('branches_count', Number(v))}
                                            />
                                            <Field
                                                label="Number of courts"
                                                type="number"
                                                value={form.data.courts_count}
                                                onChange={(v) => form.setData('courts_count', Number(v))}
                                            />
                                            <Field
                                                label="Estimated members"
                                                type="number"
                                                optional
                                                value={form.data.estimated_members}
                                                onChange={(v) => form.setData('estimated_members', v)}
                                            />
                                            <Field
                                                label="Monthly reservations"
                                                type="number"
                                                optional
                                                value={form.data.estimated_monthly_reservations}
                                                onChange={(v) => form.setData('estimated_monthly_reservations', v)}
                                            />
                                            <Field
                                                label="Existing software"
                                                optional
                                                value={form.data.existing_software}
                                                onChange={(v) => form.setData('existing_software', v)}
                                            />
                                            <TextareaField
                                                label="What is hardest about running the club today?"
                                                optional
                                                value={form.data.pain_points}
                                                onChange={(v) => form.setData('pain_points', v)}
                                            />
                                        </FieldGrid>
                                    )}

                                    {step === 3 && (
                                        <>
                                            <p className="text-meta text-muted mb-4">Select as many as apply, this shapes what we show you.</p>
                                            <div className="grid gap-2.5 sm:grid-cols-2">
                                                {featureOptions.map((feature) => {
                                                    const checked = form.data.features_needed.includes(feature);
                                                    return (
                                                        <label
                                                            key={feature}
                                                            className={cn(
                                                                'text-label flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-colors',
                                                                checked
                                                                    ? 'border-primary bg-primary-soft text-foreground'
                                                                    : 'border-border bg-surface text-secondary hover:border-border-strong',
                                                            )}
                                                        >
                                                            <Checkbox checked={checked} onCheckedChange={() => toggleFeature(feature)} />
                                                            {feature}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}

                                    {step === 4 && (
                                        <div className="space-y-6">
                                            <fieldset>
                                                <legend className="text-label text-foreground font-medium">How would you like the demo?</legend>
                                                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                                                    {[
                                                        ['google_meet', 'Google Meet'],
                                                        ['zoom', 'Zoom'],
                                                        ['on_site_meeting', 'On-site visit'],
                                                        ['online_demo', 'Recorded walkthrough'],
                                                    ].map(([value, label]) => (
                                                        <label
                                                            key={value}
                                                            className={cn(
                                                                'text-label flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-colors',
                                                                form.data.demo_preference === value
                                                                    ? 'border-primary bg-primary-soft text-foreground'
                                                                    : 'border-border bg-surface text-secondary hover:border-border-strong',
                                                            )}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="demo_preference"
                                                                value={value}
                                                                checked={form.data.demo_preference === value}
                                                                onChange={(event) => form.setData('demo_preference', event.target.value)}
                                                                className="size-4 accent-[var(--primary)]"
                                                            />
                                                            {label}
                                                        </label>
                                                    ))}
                                                </div>
                                            </fieldset>

                                            <FieldGrid>
                                                <Field
                                                    label="Preferred date"
                                                    type="date"
                                                    value={form.data.preferred_date}
                                                    onChange={(v) => form.setData('preferred_date', v)}
                                                />
                                                <Field
                                                    label="Preferred time"
                                                    type="time"
                                                    value={form.data.preferred_time}
                                                    onChange={(v) => form.setData('preferred_time', v)}
                                                />
                                                <TextareaField
                                                    label="Anything else we should know?"
                                                    optional
                                                    value={form.data.notes}
                                                    onChange={(v) => form.setData('notes', v)}
                                                />
                                            </FieldGrid>
                                        </div>
                                    )}

                                    {step === 5 && (
                                        <div className="border-border bg-surface overflow-hidden rounded-xl border">
                                            <div className="border-border bg-success-soft flex items-center gap-3 border-b px-5 py-4">
                                                <CheckCircle2 className="text-success size-5 shrink-0" />
                                                <p className="text-label text-foreground font-semibold">Ready to send</p>
                                            </div>
                                            <dl className="divide-border divide-y">
                                                <SummaryRow label="Club" value={form.data.business_name || '-'} />
                                                <SummaryRow label="Contact" value={form.data.contact_person || '-'} />
                                                <SummaryRow label="Email" value={form.data.email || '-'} />
                                                <SummaryRow
                                                    label="Size"
                                                    value={`${form.data.branches_count} branch(es) · ${form.data.courts_count} court(s)`}
                                                />
                                                <SummaryRow
                                                    label="Modules"
                                                    value={
                                                        form.data.features_needed.length > 0
                                                            ? form.data.features_needed.join(', ')
                                                            : 'Show me everything'
                                                    }
                                                />
                                                <SummaryRow
                                                    label="Demo"
                                                    value={[
                                                        form.data.demo_preference.replaceAll('_', ' '),
                                                        form.data.preferred_date,
                                                        form.data.preferred_time,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                />
                                            </dl>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Sticky action bar, never make the user hunt for submit. */}
                            <div className="border-border bg-background/95 sticky bottom-0 mt-8 flex items-center justify-between gap-3 border-t py-4 backdrop-blur-sm">
                                <Button type="button" variant="ghost" disabled={step === 1} onClick={() => setStep((current) => current - 1)}>
                                    <ArrowLeft className="size-4" /> Back
                                </Button>

                                {step < steps.length ? (
                                    <Button type="button" size="touch" disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>
                                        Continue <ArrowRight className="size-4" />
                                    </Button>
                                ) : (
                                    <Button type="submit" size="touch" disabled={form.processing}>
                                        {form.processing ? 'Sending…' : 'Submit demo request'}
                                    </Button>
                                )}
                            </div>

                            {step === 1 && !canContinue && (
                                <p className="text-meta text-muted pb-4 text-right">Club name, contact person and email are required to continue.</p>
                            )}
                        </form>
                    </div>
                </main>
            </div>
        </>
    );
}

/* -------------------------------------------------------------------------- */

function FieldGrid({ children }: { children: ReactNode }) {
    return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}

function Field({
    label,
    value,
    onChange,
    error,
    type = 'text',
    required = false,
    optional = false,
}: {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    error?: string;
    type?: string;
    required?: boolean;
    optional?: boolean;
}) {
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>
                {label}
                {optional && <span className="text-muted ml-1 font-normal">(optional)</span>}
            </Label>
            <Input
                id={id}
                type={type}
                required={required}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                aria-invalid={Boolean(error) || undefined}
            />
            {error && <p className="text-meta text-danger">{error}</p>}
        </div>
    );
}

function TextareaField({
    label,
    value,
    onChange,
    optional,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    optional?: boolean;
}) {
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return (
        <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor={id}>
                {label}
                {optional && <span className="text-muted ml-1 font-normal">(optional)</span>}
            </Label>
            <textarea
                id={id}
                className="border-input bg-surface text-label text-foreground placeholder:text-muted focus-visible:ring-ring min-h-28 w-full rounded-md border px-3 py-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-5 py-3">
            <dt className="text-meta text-muted w-24 shrink-0 tracking-wide uppercase">{label}</dt>
            <dd className="text-label text-foreground min-w-0 flex-1">{value}</dd>
        </div>
    );
}
