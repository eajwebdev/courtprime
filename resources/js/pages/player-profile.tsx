import { PhotoUploadField } from '@/components/photo-upload-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Check, IdCard, Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- profile payload comes from PlayerProfileController. */
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Home', href: '/me' },
    { title: 'Profile', href: '/me/profile' },
];

const HANDS = [
    { value: 'right', label: 'Right' },
    { value: 'left', label: 'Left' },
    { value: 'ambidextrous', label: 'Both' },
];

const MATCH_TYPES = [
    { value: 'singles', label: 'Singles' },
    { value: 'doubles', label: 'Doubles' },
    { value: 'mixed_doubles', label: 'Mixed' },
    { value: 'open_play', label: 'Open play' },
];

/* Drives which athlete artwork the identity band shows. "Prefer not to say"
   is a real option, and the fallback never guesses. */
const GENDERS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const SKILL_LEVELS = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'pro', label: 'Pro' },
];

const PRIVACY = [
    ['show_rating', 'Show my rating', 'Other players can see your global rating.'],
    ['show_match_history', 'Show match history', 'Your results appear on your public identity.'],
    ['show_connected_clubs', 'Show connected clubs', 'Reveals which clubs you play at.'],
    ['show_city', 'Show my city', 'Helps nearby players find you for open play.'],
    ['show_achievements', 'Show achievements', 'Badges appear on your public profile.'],
] as const;

/** Which fields belong to which tab, so errors can be routed to the right one. */
const TABS = [
    { id: 'photos', label: 'Photos', fields: ['avatar', 'action_photo'] },
    { id: 'details', label: 'Details', fields: ['display_name', 'first_name', 'last_name', 'mobile_number', 'birthday', 'home_city', 'gender'] },
    { id: 'play', label: 'Play style', fields: ['preferred_playing_hand', 'preferred_match_type', 'skill_level'] },
    { id: 'privacy', label: 'Privacy', fields: [] },
] as const;

type TabId = (typeof TABS)[number]['id'];

function initials(name: string) {
    return String(name ?? '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export default function PlayerProfile({ profile }: { profile: any }) {
    const [tab, setTab] = useState<TabId>('photos');

    const form = useForm<Record<string, any>>({
        display_name: profile.display_name ?? '',
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        mobile_number: profile.mobile_number ?? '',
        birthday: profile.birthday ?? '',
        gender: profile.gender ?? '',
        home_city: profile.home_city ?? '',
        preferred_playing_hand: profile.preferred_playing_hand ?? '',
        preferred_match_type: profile.preferred_match_type ?? '',
        skill_level: profile.skill_level ?? 'beginner',
        avatar: null as File | null,
        action_photo: null as File | null,
        remove_avatar: false,
        remove_action_photo: false,
        show_connected_clubs: Boolean(profile.privacy_settings?.show_connected_clubs),
        show_match_history: Boolean(profile.privacy_settings?.show_match_history),
        show_rating: Boolean(profile.privacy_settings?.show_rating),
        show_city: Boolean(profile.privacy_settings?.show_city),
        show_achievements: Boolean(profile.privacy_settings?.show_achievements),
    });

    /* With tabs, a validation error on a hidden panel is invisible. Jump to the
       first tab that has one so the user is never stuck on a silent failure. */
    useEffect(() => {
        const keys = Object.keys(form.errors);
        if (keys.length === 0) return;

        const owner = TABS.find((entry) => entry.fields.some((field) => keys.includes(field)));
        if (owner) setTab(owner.id);
    }, [form.errors]);

    /* A gentle nudge, not a scold: shows what is still worth filling in. */
    const completeness = useMemo(() => {
        const checks = [
            Boolean(profile.avatar_url),
            Boolean(form.data.display_name),
            Boolean(form.data.mobile_number),
            Boolean(form.data.home_city),
            Boolean(form.data.preferred_match_type),
            Boolean(form.data.skill_level),
        ];
        return Math.round((checks.filter(Boolean).length / checks.length) * 100);
    }, [profile.avatar_url, form.data]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        /* forceFormData because the payload carries File objects. */
        form.post('/me/profile', { preserveScroll: true, forceFormData: true });
    };

    const errorsFor = (id: TabId) => {
        const entry = TABS.find((item) => item.id === id);
        return entry ? entry.fields.filter((field) => form.errors[field]).length : 0;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile | CourtPrime" />

            <form onSubmit={submit} className="pb-32 lg:pb-8">
                {/* ---- Identity + completeness --------------------------------- */}
                <section className="bg-surface-deep text-surface-deep-foreground relative overflow-hidden rounded-2xl px-5 py-5 sm:px-7 sm:py-6">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(20rem 14rem at 90% 12%, color-mix(in srgb, var(--primary) 24%, transparent) 0%, transparent 62%)',
                        }}
                    />
                    <div className="relative">
                        <div className="flex items-center gap-4">
                            <div className="border-primary/40 size-14 shrink-0 overflow-hidden rounded-full border-2 bg-white/10 sm:size-16">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="" className="size-full object-cover" />
                                ) : (
                                    <span className="text-h2 flex size-full items-center justify-center font-semibold text-white">
                                        {initials(profile.display_name ?? '')}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-eyebrow text-primary uppercase">CourtPrime player ID</p>
                                <p data-numeric className="truncate text-lg font-semibold text-white sm:text-xl">
                                    {profile.courtprime_player_id}
                                </p>
                                <p className="text-meta truncate text-white/55">{profile.email ?? 'Managed in account settings'}</p>
                            </div>
                        </div>

                        <div className="mt-5">
                            <div className="flex items-baseline justify-between gap-3">
                                <p className="text-meta text-white/55">Profile completeness</p>
                                <p data-numeric className="text-label font-semibold text-white">
                                    {completeness}%
                                </p>
                            </div>
                            <div
                                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15"
                                role="progressbar"
                                aria-valuenow={completeness}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label="Profile completeness"
                            >
                                <div
                                    className="bg-primary h-full rounded-full transition-[width] duration-300"
                                    style={{ width: `${completeness}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ---- Tabs. One short panel at a time beats one long scroll. --- */}
                <div role="tablist" aria-label="Profile sections" className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                    {TABS.map((entry) => {
                        const active = entry.id === tab;
                        const errors = errorsFor(entry.id);

                        return (
                            <button
                                key={entry.id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setTab(entry.id)}
                                className={cn(
                                    'text-label relative min-h-11 shrink-0 rounded-lg border px-4 font-medium whitespace-nowrap transition-colors',
                                    active
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-surface text-secondary hover:text-foreground',
                                )}
                            >
                                {entry.label}
                                {errors > 0 && (
                                    <span
                                        className="bg-danger absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full"
                                        aria-label={`${errors} problems`}
                                    >
                                        <TriangleAlert className="size-2.5 text-white" />
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-5">
                    {tab === 'photos' && (
                        <Panel title="Photos" description="Both optional. Without them we show your initials.">
                            <PhotoUploadField
                                label="Profile photo"
                                hint="Head and shoulders. Used on bookings, check-in and leaderboards."
                                shape="avatar"
                                currentUrl={profile.avatar_url}
                                fallback={initials(profile.display_name ?? '')}
                                error={form.errors.avatar as string | undefined}
                                onSelect={(file) => {
                                    form.setData('avatar', file);
                                    if (file) form.setData('remove_avatar', false);
                                }}
                                onRemove={() => form.setData('remove_avatar', true)}
                            />

                            <div className="border-border border-t pt-6">
                                <PhotoUploadField
                                    label="Action shot"
                                    hint="Full body, on court. Shown on your public identity card."
                                    shape="action"
                                    currentUrl={profile.action_photo_url}
                                    error={form.errors.action_photo as string | undefined}
                                    onSelect={(file) => {
                                        form.setData('action_photo', file);
                                        if (file) form.setData('remove_action_photo', false);
                                    }}
                                    onRemove={() => form.setData('remove_action_photo', true)}
                                />
                            </div>
                        </Panel>
                    )}

                    {tab === 'details' && (
                        <Panel title="Your details">
                            <div className="grid gap-5 sm:grid-cols-2">
                                <Field label="Display name" required error={form.errors.display_name as string}>
                                    <Input value={form.data.display_name} onChange={(e) => form.setData('display_name', e.target.value)} required />
                                </Field>
                                <Field label="Mobile number" error={form.errors.mobile_number as string}>
                                    <Input
                                        value={form.data.mobile_number}
                                        onChange={(e) => form.setData('mobile_number', e.target.value)}
                                        inputMode="tel"
                                        autoComplete="tel"
                                    />
                                </Field>
                                <Field label="First name" error={form.errors.first_name as string}>
                                    <Input value={form.data.first_name} onChange={(e) => form.setData('first_name', e.target.value)} />
                                </Field>
                                <Field label="Last name" error={form.errors.last_name as string}>
                                    <Input value={form.data.last_name} onChange={(e) => form.setData('last_name', e.target.value)} />
                                </Field>
                                <Field label="Birthday" error={form.errors.birthday as string}>
                                    <Input type="date" value={form.data.birthday} onChange={(e) => form.setData('birthday', e.target.value)} />
                                </Field>
                                <Field label="Home city" error={form.errors.home_city as string}>
                                    <Input value={form.data.home_city} onChange={(e) => form.setData('home_city', e.target.value)} />
                                </Field>
                            </div>

                            <div className="mt-5">
                                <ChoiceRow
                                    label="Gender"
                                    options={GENDERS}
                                    value={form.data.gender}
                                    onChange={(value) => form.setData('gender', value)}
                                />
                                <p className="text-meta text-muted mt-2">
                                    Used to pick the artwork on your identity card. Leave blank to keep it neutral.
                                </p>
                            </div>
                        </Panel>
                    )}

                    {tab === 'play' && (
                        <Panel title="How you play" description="Helps clubs match you into the right open play sessions.">
                            <ChoiceRow
                                label="Playing hand"
                                options={HANDS}
                                value={form.data.preferred_playing_hand}
                                onChange={(value) => form.setData('preferred_playing_hand', value)}
                            />
                            <ChoiceRow
                                label="Preferred match"
                                options={MATCH_TYPES}
                                value={form.data.preferred_match_type}
                                onChange={(value) => form.setData('preferred_match_type', value)}
                            />
                            <ChoiceRow
                                label="Skill level"
                                options={SKILL_LEVELS}
                                value={form.data.skill_level}
                                onChange={(value) => form.setData('skill_level', value)}
                                required
                            />
                        </Panel>
                    )}

                    {tab === 'privacy' && (
                        <div>
                            <p className="text-label text-secondary mb-3">You control what other players see on your public identity.</p>
                            <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-xl border">
                                {PRIVACY.map(([key, title, description]) => (
                                    <li key={key}>
                                        <label className="hover:bg-surface-muted flex min-h-16 cursor-pointer items-center gap-4 px-4 py-3 transition-colors">
                                            <span className="min-w-0 flex-1">
                                                <span className="text-label text-foreground block font-medium">{title}</span>
                                                <span className="text-meta text-muted block">{description}</span>
                                            </span>
                                            <Toggle checked={Boolean(form.data[key])} onChange={(next) => form.setData(key, next)} label={title} />
                                        </label>
                                    </li>
                                ))}
                            </ul>

                            <p className="text-meta text-muted mt-4 flex items-start gap-2">
                                <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                                Your CourtPrime ID and display name are always visible so clubs can verify you at check-in.
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/me">
                            <IdCard className="size-4" />
                            Back to home
                        </Link>
                    </Button>
                </div>

                {/* Sticky save. Sits above the tab bar on phones. */}
                <div className="border-border bg-background/95 z-sticky fixed inset-x-0 bottom-16 border-t p-3 backdrop-blur-md md:bottom-0 lg:sticky lg:mt-6 lg:rounded-xl lg:border lg:p-4">
                    <div className="mx-auto flex max-w-3xl items-center gap-3">
                        <p className="text-meta min-w-0 flex-1 truncate" aria-live="polite">
                            {form.recentlySuccessful ? (
                                <span className="text-success flex items-center gap-1.5">
                                    <Check className="size-4 shrink-0" /> Saved
                                </span>
                            ) : form.isDirty ? (
                                <span className="text-muted">Unsaved changes</span>
                            ) : null}
                        </p>

                        <Button type="submit" size="touch" disabled={form.processing || !form.isDirty} className="shrink-0 px-8">
                            {form.processing ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" /> Saving
                                </>
                            ) : (
                                'Save'
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
    return (
        <section className="border-border bg-surface space-y-6 rounded-xl border p-4 sm:p-5">
            <div>
                <h2 className="text-h3 text-foreground">{title}</h2>
                {description && <p className="text-meta text-muted mt-1">{description}</p>}
            </div>
            {children}
        </section>
    );
}

function Field({ label, children, error, required }: { label: string; children: ReactNode; error?: string; required?: boolean }) {
    return (
        <div className="grid gap-2">
            <Label>
                {label}
                {!required && <span className="text-muted ml-1 font-normal">(optional)</span>}
            </Label>
            {children}
            {error && <p className="text-meta text-danger">{error}</p>}
        </div>
    );
}

function ChoiceRow({
    label,
    options,
    value,
    onChange,
    required,
}: {
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}) {
    return (
        <div>
            <Label className="text-label">
                {label}
                {!required && <span className="text-muted ml-1 font-normal">(optional)</span>}
            </Label>
            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {options.map((option) => {
                    const selected = value === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onChange(selected && !required ? '' : option.value)}
                            className={cn(
                                'text-label min-h-11 rounded-lg border px-3 font-medium transition-colors sm:px-5',
                                selected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-surface text-secondary hover:border-border-strong hover:text-foreground',
                            )}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-border-strong')}
        >
            <span
                className={cn(
                    'absolute top-0.5 size-5 rounded-full bg-white transition-transform',
                    checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
                )}
            />
        </button>
    );
}
