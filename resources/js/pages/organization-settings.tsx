import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Building2, CreditCard, Settings2 } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Organization Settings', href: '/organization-settings' }];

type OrganizationSettings = {
    booking_window_days: number;
    cancellation_cutoff_hours: number;
    default_deposit_percent: number;
    require_deposit: boolean;
    allow_public_booking: boolean;
    player_privacy_mode: string;
    logo_url?: string | null;
    website?: string | null;
    facebook?: string | null;
    instagram?: string | null;
    tiktok?: string | null;
    primary_color: string;
    secondary_color: string;
    allow_white_label: boolean;
    receipt_footer?: string | null;
    payment_methods: string[];
    membership_auto_renewal: boolean;
    send_email_notifications: boolean;
    send_sms_notifications: boolean;
    send_push_notifications: boolean;
    live_display_branding?: string | null;
    live_display_rotation_seconds: number;
    scoreboard_portrait_seconds?: number | null;
    live_display_announcement?: string | null;
    live_display_token_required: boolean;
    live_display_token_configured?: boolean;
    payment_gateway?: string | null;
    sms_gateway?: string | null;
    email_provider?: string | null;
    api_access_enabled: boolean;
};

type Organization = {
    id: number;
    name: string;
    owner_name?: string | null;
    email?: string | null;
    phone?: string | null;
    status: string;
    timezone: string;
    currency: string;
    demo_mode: boolean;
    settings: OrganizationSettings;
};

type Subscription = {
    status: string;
    billing_cycle: string;
    trial_ends_at?: string | null;
    current_period_ends_at?: string | null;
    plan?: {
        name: string;
        code: string;
        monthly_price: string | number;
        branch_limit?: number | null;
        court_limit?: number | null;
        staff_limit?: number | null;
        features: { key: string; label: string; enabled: boolean; limit?: number | null }[];
    } | null;
} | null;

const paymentMethods = ['cash', 'card', 'gcash', 'maya', 'bank_transfer', 'wallet', 'other'];

export default function OrganizationSettings({
    organization,
    subscription,
    usage,
    canCustomizeBranding,
}: {
    organization: Organization;
    subscription: Subscription;
    usage: Record<string, number>;
    canCustomizeBranding: boolean;
}) {
    const form = useForm({
        name: organization.name,
        owner_name: organization.owner_name ?? '',
        email: organization.email ?? '',
        phone: organization.phone ?? '',
        timezone: organization.timezone,
        currency: organization.currency,
        booking_window_days: organization.settings.booking_window_days,
        cancellation_cutoff_hours: organization.settings.cancellation_cutoff_hours,
        default_deposit_percent: organization.settings.default_deposit_percent,
        require_deposit: organization.settings.require_deposit,
        allow_public_booking: organization.settings.allow_public_booking,
        player_privacy_mode: organization.settings.player_privacy_mode,
        logo_url: organization.settings.logo_url ?? '',
        website: organization.settings.website ?? '',
        facebook: organization.settings.facebook ?? '',
        instagram: organization.settings.instagram ?? '',
        tiktok: organization.settings.tiktok ?? '',
        primary_color: organization.settings.primary_color,
        secondary_color: organization.settings.secondary_color,
        allow_white_label: organization.settings.allow_white_label,
        receipt_footer: organization.settings.receipt_footer ?? '',
        payment_methods: organization.settings.payment_methods ?? ['cash'],
        membership_auto_renewal: organization.settings.membership_auto_renewal,
        send_email_notifications: organization.settings.send_email_notifications,
        send_sms_notifications: organization.settings.send_sms_notifications,
        send_push_notifications: organization.settings.send_push_notifications,
        live_display_branding: organization.settings.live_display_branding ?? 'CourtPrime',
        live_display_rotation_seconds: organization.settings.live_display_rotation_seconds,
        scoreboard_portrait_seconds: organization.settings.scoreboard_portrait_seconds ?? 10,
        live_display_announcement: organization.settings.live_display_announcement ?? '',
        live_display_token_required: organization.settings.live_display_token_required,
        live_display_token: '',
        payment_gateway: organization.settings.payment_gateway ?? '',
        sms_gateway: organization.settings.sms_gateway ?? '',
        email_provider: organization.settings.email_provider ?? '',
        api_access_enabled: organization.settings.api_access_enabled,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            currency: data.currency.toUpperCase(),
            booking_window_days: Number(data.booking_window_days),
            cancellation_cutoff_hours: Number(data.cancellation_cutoff_hours),
            default_deposit_percent: Number(data.default_deposit_percent),
            live_display_rotation_seconds: Number(data.live_display_rotation_seconds),
            scoreboard_portrait_seconds: Number(data.scoreboard_portrait_seconds),
        }));
        form.post('/organization-settings', { preserveScroll: true });
    };

    const togglePaymentMethod = (method: string, checked: boolean) => {
        const next = checked
            ? Array.from(new Set([...form.data.payment_methods, method]))
            : form.data.payment_methods.filter((item) => item !== method);

        form.setData('payment_methods', next.length ? next : ['cash']);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Organization Settings" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Organization Settings</h1>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Manage tenant identity, booking rules, privacy posture, and subscription limits.
                        </p>
                    </div>
                    <StatusBadge status={organization.status} />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Settings2 className="size-4 text-pink-600" />
                                Tenant Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-5">
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Field
                                        label="Organization Name"
                                        value={form.data.name}
                                        onChange={(value) => form.setData('name', value)}
                                        error={form.errors.name}
                                    />
                                    <Field
                                        label="Owner"
                                        value={form.data.owner_name}
                                        onChange={(value) => form.setData('owner_name', value)}
                                        error={form.errors.owner_name}
                                    />
                                    <Field
                                        label="Email"
                                        type="email"
                                        value={form.data.email}
                                        onChange={(value) => form.setData('email', value)}
                                        error={form.errors.email}
                                    />
                                    <Field
                                        label="Phone"
                                        value={form.data.phone}
                                        onChange={(value) => form.setData('phone', value)}
                                        error={form.errors.phone}
                                    />
                                    <Field
                                        label="Timezone"
                                        value={form.data.timezone}
                                        onChange={(value) => form.setData('timezone', value)}
                                        error={form.errors.timezone}
                                    />
                                    <Field
                                        label="Currency"
                                        value={form.data.currency}
                                        onChange={(value) => form.setData('currency', value)}
                                        error={form.errors.currency}
                                    />
                                </div>

                                <div className="grid gap-3 md:grid-cols-3">
                                    <Field
                                        label="Booking Window"
                                        type="number"
                                        value={form.data.booking_window_days}
                                        onChange={(value) => form.setData('booking_window_days', Number(value))}
                                        error={form.errors.booking_window_days}
                                    />
                                    <Field
                                        label="Cancel Cutoff"
                                        type="number"
                                        value={form.data.cancellation_cutoff_hours}
                                        onChange={(value) => form.setData('cancellation_cutoff_hours', Number(value))}
                                        error={form.errors.cancellation_cutoff_hours}
                                    />
                                    <Field
                                        label="Deposit %"
                                        type="number"
                                        value={form.data.default_deposit_percent}
                                        onChange={(value) => form.setData('default_deposit_percent', Number(value))}
                                        error={form.errors.default_deposit_percent}
                                    />
                                </div>

                                <div className="grid gap-3 md:grid-cols-3">
                                    <Toggle
                                        label="Require deposits"
                                        checked={form.data.require_deposit}
                                        onChange={(checked) => form.setData('require_deposit', checked)}
                                    />
                                    <Toggle
                                        label="Public booking"
                                        checked={form.data.allow_public_booking}
                                        onChange={(checked) => form.setData('allow_public_booking', checked)}
                                    />
                                    <div className="space-y-2">
                                        <Label>Player Privacy</Label>
                                        <select
                                            className="bg-background h-10 w-full rounded-md border px-3 text-sm capitalize"
                                            value={form.data.player_privacy_mode}
                                            onChange={(event) => form.setData('player_privacy_mode', event.target.value)}
                                        >
                                            {['strict', 'balanced', 'open'].map((mode) => (
                                                <option key={mode} value={mode}>
                                                    {mode}
                                                </option>
                                            ))}
                                        </select>
                                        {form.errors.player_privacy_mode && <p className="text-xs text-red-600">{form.errors.player_privacy_mode}</p>}
                                    </div>
                                </div>

                                <SectionTitle title="Public channels" />
                                {/* Shown on the club's booking page, which is
                                    where players reach a club now. */}
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Field
                                        label="Website"
                                        value={form.data.website}
                                        onChange={(value) => form.setData('website', value)}
                                        error={form.errors.website}
                                    />
                                    <Field
                                        label="Facebook"
                                        value={form.data.facebook}
                                        onChange={(value) => form.setData('facebook', value)}
                                        error={form.errors.facebook}
                                    />
                                    <Field
                                        label="Instagram"
                                        value={form.data.instagram}
                                        onChange={(value) => form.setData('instagram', value)}
                                        error={form.errors.instagram}
                                    />
                                    <Field
                                        label="TikTok"
                                        value={form.data.tiktok}
                                        onChange={(value) => form.setData('tiktok', value)}
                                        error={form.errors.tiktok}
                                    />
                                </div>

                                <SectionTitle title="Branding" />
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Field
                                        label="Logo URL"
                                        value={form.data.logo_url}
                                        onChange={(value) => form.setData('logo_url', value)}
                                        error={form.errors.logo_url}
                                    />
                                    <Field
                                        label="Live Display Branding"
                                        value={form.data.live_display_branding}
                                        onChange={(value) => form.setData('live_display_branding', value)}
                                        error={form.errors.live_display_branding}
                                    />
                                    <Field
                                        label="Primary Color"
                                        type="color"
                                        value={form.data.primary_color}
                                        onChange={(value) => form.setData('primary_color', value)}
                                        error={form.errors.primary_color}
                                    />
                                    <Field
                                        label="Secondary Color"
                                        type="color"
                                        value={form.data.secondary_color}
                                        onChange={(value) => form.setData('secondary_color', value)}
                                        error={form.errors.secondary_color}
                                    />
                                    <Toggle
                                        disabled={!canCustomizeBranding}
                                        label="White label enabled"
                                        checked={form.data.allow_white_label}
                                        onChange={(checked) => form.setData('allow_white_label', checked)}
                                    />
                                </div>

                                <SectionTitle title="POS & Membership" />
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Field
                                        label="Receipt Footer"
                                        value={form.data.receipt_footer}
                                        onChange={(value) => form.setData('receipt_footer', value)}
                                        error={form.errors.receipt_footer}
                                    />
                                    <Toggle
                                        label="Membership auto-renewal"
                                        checked={form.data.membership_auto_renewal}
                                        onChange={(checked) => form.setData('membership_auto_renewal', checked)}
                                    />
                                </div>
                                <div className="grid gap-2 md:grid-cols-4">
                                    {paymentMethods.map((method) => (
                                        <Toggle
                                            key={method}
                                            label={method.replaceAll('_', ' ')}
                                            checked={form.data.payment_methods.includes(method)}
                                            onChange={(checked) => togglePaymentMethod(method, checked)}
                                        />
                                    ))}
                                </div>
                                {form.errors.payment_methods && <p className="text-xs text-red-600">{form.errors.payment_methods}</p>}

                                <SectionTitle title="Notifications & Display" />
                                <div className="grid gap-3 md:grid-cols-3">
                                    <Toggle
                                        label="Email alerts"
                                        checked={form.data.send_email_notifications}
                                        onChange={(checked) => form.setData('send_email_notifications', checked)}
                                    />
                                    <Toggle
                                        label="SMS alerts"
                                        checked={form.data.send_sms_notifications}
                                        onChange={(checked) => form.setData('send_sms_notifications', checked)}
                                    />
                                    <Toggle
                                        label="Push alerts"
                                        checked={form.data.send_push_notifications}
                                        onChange={(checked) => form.setData('send_push_notifications', checked)}
                                    />
                                    <Field
                                        label="Display Rotation"
                                        type="number"
                                        value={form.data.live_display_rotation_seconds}
                                        onChange={(value) => form.setData('live_display_rotation_seconds', Number(value))}
                                        error={form.errors.live_display_rotation_seconds}
                                    />
                                    {/* How long a player's picture holds on the
                                        courtside boards before the next one. */}
                                    <Field
                                        label="Portrait Hold (seconds)"
                                        type="number"
                                        value={form.data.scoreboard_portrait_seconds}
                                        onChange={(value) => form.setData('scoreboard_portrait_seconds', Number(value))}
                                        error={form.errors.scoreboard_portrait_seconds}
                                    />
                                    <Field
                                        label="Display Announcement"
                                        value={form.data.live_display_announcement}
                                        onChange={(value) => form.setData('live_display_announcement', value)}
                                        error={form.errors.live_display_announcement}
                                    />
                                    <Toggle
                                        label="Require display token"
                                        checked={form.data.live_display_token_required}
                                        onChange={(checked) => form.setData('live_display_token_required', checked)}
                                    />
                                    <Field
                                        label={organization.settings.live_display_token_configured ? 'Replace Display Token' : 'Display Token'}
                                        value={form.data.live_display_token}
                                        onChange={(value) => form.setData('live_display_token', value)}
                                        error={form.errors.live_display_token}
                                    />
                                </div>

                                <SectionTitle title="Integrations" />
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Field
                                        label="Payment Gateway"
                                        value={form.data.payment_gateway}
                                        onChange={(value) => form.setData('payment_gateway', value)}
                                        error={form.errors.payment_gateway}
                                    />
                                    <Field
                                        label="SMS Gateway"
                                        value={form.data.sms_gateway}
                                        onChange={(value) => form.setData('sms_gateway', value)}
                                        error={form.errors.sms_gateway}
                                    />
                                    <Field
                                        label="Email Provider"
                                        value={form.data.email_provider}
                                        onChange={(value) => form.setData('email_provider', value)}
                                        error={form.errors.email_provider}
                                    />
                                    <Toggle
                                        label="API access ready"
                                        checked={form.data.api_access_enabled}
                                        onChange={(checked) => form.setData('api_access_enabled', checked)}
                                    />
                                </div>

                                <Button disabled={form.processing}>Save Settings</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CreditCard className="size-4 text-pink-600" />
                                    Subscription Foundation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {subscription?.plan ? (
                                    <>
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xl font-semibold">{subscription.plan.name}</p>
                                                <p className="text-muted-foreground text-sm">
                                                    {currency(subscription.plan.monthly_price)} monthly baseline
                                                </p>
                                            </div>
                                            <StatusBadge status={subscription.status} />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 text-sm">
                                            <Limit label="Branches" used={usage.branches} limit={subscription.plan.branch_limit} />
                                            <Limit label="Courts" used={usage.courts} limit={subscription.plan.court_limit} />
                                            <Limit label="Staff" used={usage.staff} limit={subscription.plan.staff_limit} />
                                        </div>
                                        <div className="space-y-2">
                                            {subscription.plan.features.slice(0, 6).map((feature) => (
                                                <div
                                                    key={feature.key}
                                                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                                                >
                                                    <span>{feature.label}</span>
                                                    <StatusBadge status={feature.enabled ? 'active' : 'inactive'} />
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground text-sm">No subscription is attached to this organization yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="grid grid-cols-3 gap-3 p-4">
                                <Metric icon={Building2} label="Branches" value={usage.branches} />
                                <Metric icon={Building2} label="Courts" value={usage.courts} />
                                <Metric icon={Building2} label="Staff" value={usage.staff} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function Field({
    label,
    value,
    onChange,
    error,
    type = 'text',
}: {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    error?: string;
    type?: string;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Input type={type} step={type === 'number' ? '0.01' : undefined} value={value} onChange={(event) => onChange(event.target.value)} />
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

function Toggle({
    label,
    checked,
    onChange,
    disabled = false,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <label className="flex h-10 items-center gap-3 rounded-md border px-3 text-sm">
            <input type="checkbox" disabled={disabled} checked={checked} onChange={(event) => onChange(event.target.checked)} />
            <span>{label}</span>
        </label>
    );
}

function SectionTitle({ title }: { title: string }) {
    return <p className="border-t pt-5 text-sm font-semibold">{title}</p>;
}

function Limit({ label, used, limit }: { label: string; used: number; limit?: number | null }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">{label}</p>
            <p className="mt-1 font-semibold">
                {used} / {limit ?? 'Custom'}
            </p>
        </div>
    );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
    return (
        <div className="rounded-lg border p-3">
            <Icon className="size-4 text-pink-600" />
            <p className="text-muted-foreground mt-2 text-xs">{label}</p>
            <p className="font-semibold">{value}</p>
        </div>
    );
}
