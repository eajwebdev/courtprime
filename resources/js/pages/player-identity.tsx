import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Award, BadgeCheck, ClipboardList, ExternalLink, FileSignature, History, IdCard, Shield } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Players', href: '/players' },
    { title: 'Identity', href: '#' },
];

type Privacy = {
    show_connected_clubs: boolean;
    show_match_history: boolean;
    show_rating: boolean;
    show_city: boolean;
    show_achievements: boolean;
};

export default function PlayerIdentity({
    organizationPlayer,
    profile,
    identityUrl,
    qrIdentityUrl,
    canClaim,
    canUpdatePrivacy,
    canManageCustomer,
    memberships,
    waivers,
    waiverTemplates,
    crmNotes,
    achievements,
    timeline,
}: {
    organizationPlayer: any;
    profile: any;
    identityUrl: string;
    qrIdentityUrl: string;
    canClaim: boolean;
    canUpdatePrivacy: boolean;
    canManageCustomer: boolean;
    memberships: any[];
    waivers: any[];
    waiverTemplates: any[];
    crmNotes: any[];
    achievements: any[];
    timeline: any[];
}) {
    const claimForm = useForm({});
    const qrForm = useForm({});
    const waiverForm = useForm({
        waiver_template_id: '',
        version: 'v1',
        signature_name: profile.display_name,
        guardian_name: '',
    });
    const noteForm = useForm({
        note_type: 'general',
        visibility: 'team',
        body: '',
        follow_up_at: '',
    });
    const achievementForm = useForm({
        code: '',
        title: '',
        description: '',
        badge_color: 'pink',
        visibility: 'public',
        tournament_id: '',
        earned_at: new Date().toISOString().slice(0, 10),
    });
    const privacyForm = useForm<Privacy>({
        show_connected_clubs: profile.privacy_settings.show_connected_clubs,
        show_match_history: profile.privacy_settings.show_match_history,
        show_rating: profile.privacy_settings.show_rating,
        show_city: profile.privacy_settings.show_city,
        show_achievements: profile.privacy_settings.show_achievements,
    });

    const savePrivacy = (event: FormEvent) => {
        event.preventDefault();
        privacyForm.post(`/players/${organizationPlayer.id}/privacy`, { preserveScroll: true });
    };

    const saveWaiver = (event: FormEvent) => {
        event.preventDefault();
        waiverForm.post(`/players/${organizationPlayer.id}/waivers`, { preserveScroll: true, onSuccess: () => waiverForm.reset('guardian_name') });
    };

    const saveNote = (event: FormEvent) => {
        event.preventDefault();
        noteForm.post(`/players/${organizationPlayer.id}/crm-notes`, {
            preserveScroll: true,
            onSuccess: () => noteForm.reset('body', 'follow_up_at'),
        });
    };

    const saveAchievement = (event: FormEvent) => {
        event.preventDefault();
        achievementForm.post(`/players/${organizationPlayer.id}/achievements`, {
            preserveScroll: true,
            onSuccess: () => achievementForm.reset('code', 'title', 'description', 'tournament_id'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${profile.display_name} Identity`} />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.95fr_1.4fr]">
                <Card className="overflow-hidden">
                    <div className="bg-slate-950 p-6 text-white">
                        <div className="flex items-start justify-between gap-4">
                            <img src="/cp.png" alt="CourtPrime" className="size-14 rounded-xl bg-white/10 object-contain p-2" />
                            <StatusBadge status={profile.verification_status} />
                        </div>
                        <p className="mt-6 text-sm text-white/60">CourtPrime Player ID</p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-normal">{profile.courtprime_player_id}</h1>
                        <p className="mt-3 text-xl font-medium">{profile.display_name}</p>
                        <p className="text-sm text-white/60">{profile.email ?? profile.mobile_number ?? 'No public contact'}</p>
                    </div>
                    <CardContent className="space-y-4 p-6">
                        <IdentityPattern payload={qrIdentityUrl} />
                        <div className="rounded-lg border p-3">
                            <p className="text-muted-foreground text-xs">Signed QR Check-In URL</p>
                            <p className="mt-1 text-sm font-medium break-all">{qrIdentityUrl}</p>
                            <p className="text-muted-foreground mt-2 text-xs">
                                Version {profile.qr_token_version ?? 1}
                                {profile.qr_token_rotated_at ? ` - rotated ${profile.qr_token_rotated_at}` : ''}
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                            <Metric label="Rating" value={profile.global_rating} />
                            <Metric label="Matches" value={profile.global_match_count} />
                            <Metric label="Local No." value={organizationPlayer.local_player_number ?? '-'} />
                        </div>
                        <Button asChild variant="outline" className="w-full">
                            <Link href={identityUrl}>
                                <ExternalLink className="size-4" />
                                Open Public Identity
                            </Link>
                        </Button>
                        {canClaim && (
                            <Button
                                className="w-full"
                                disabled={claimForm.processing}
                                onClick={() => claimForm.post(`/players/${organizationPlayer.id}/claim`, { preserveScroll: true })}
                            >
                                <BadgeCheck className="size-4" />
                                Claim This Identity
                            </Button>
                        )}
                        {(canUpdatePrivacy || canManageCustomer) && (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={qrForm.processing}
                                onClick={() => qrForm.post(`/players/${organizationPlayer.id}/qr/rotate`, { preserveScroll: true })}
                            >
                                Rotate QR Identity
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <IdCard className="size-4 text-pink-600" />
                                Connected Club Record
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-2">
                            <Info label="Organization" value={organizationPlayer.organization?.name ?? '-'} />
                            <Info label="Home Branch" value={organizationPlayer.home_branch?.name ?? '-'} />
                            <Info label="Local Skill" value={organizationPlayer.organization_skill_level ?? profile.skill_level} />
                            <Info label="Status" value={organizationPlayer.status} />
                            <Info label="First Visit" value={organizationPlayer.first_visit_at ?? '-'} />
                            <Info label="Last Visit" value={organizationPlayer.last_visit_at ?? '-'} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <History className="size-4 text-pink-600" />
                                Activity Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {timeline.map((event) => (
                                <div key={event.id} className="rounded-lg border p-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="font-semibold">{event.title}</p>
                                        <StatusBadge status={event.visibility} />
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        {event.event_type} - {event.occurred_at ?? 'Just now'}
                                    </p>
                                    {event.description && <p className="mt-2 text-sm">{event.description}</p>}
                                    <p className="text-muted-foreground mt-2 text-xs">{event.actor ?? 'CourtPrime system'}</p>
                                </div>
                            ))}
                            {timeline.length === 0 && <p className="text-muted-foreground text-sm">No activity timeline events yet.</p>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BadgeCheck className="size-4 text-pink-600" />
                                Organization Memberships
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {memberships.map((membership) => (
                                <div key={membership.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_auto] md:items-center">
                                    <div>
                                        <p className="font-semibold">{membership.plan}</p>
                                        <p className="text-muted-foreground text-sm">
                                            {membership.starts_on} to {membership.ends_on ?? 'Ongoing'}
                                        </p>
                                    </div>
                                    <StatusBadge status={membership.status} />
                                </div>
                            ))}
                            {memberships.length === 0 && <p className="text-muted-foreground text-sm">No organization membership is attached yet.</p>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Shield className="size-4 text-pink-600" />
                                Global Privacy
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={savePrivacy} className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Toggle
                                        disabled={!canUpdatePrivacy}
                                        label="Show connected clubs"
                                        checked={privacyForm.data.show_connected_clubs}
                                        onChange={(value) => privacyForm.setData('show_connected_clubs', value)}
                                    />
                                    <Toggle
                                        disabled={!canUpdatePrivacy}
                                        label="Show match count"
                                        checked={privacyForm.data.show_match_history}
                                        onChange={(value) => privacyForm.setData('show_match_history', value)}
                                    />
                                    <Toggle
                                        disabled={!canUpdatePrivacy}
                                        label="Show rating"
                                        checked={privacyForm.data.show_rating}
                                        onChange={(value) => privacyForm.setData('show_rating', value)}
                                    />
                                    <Toggle
                                        disabled={!canUpdatePrivacy}
                                        label="Show city"
                                        checked={privacyForm.data.show_city}
                                        onChange={(value) => privacyForm.setData('show_city', value)}
                                    />
                                    <Toggle
                                        disabled={!canUpdatePrivacy}
                                        label="Show achievements"
                                        checked={privacyForm.data.show_achievements}
                                        onChange={(value) => privacyForm.setData('show_achievements', value)}
                                    />
                                </div>
                                <Button disabled={!canUpdatePrivacy || privacyForm.processing}>Save Privacy</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Award className="size-4 text-pink-600" />
                                Global Achievements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-2">
                                {achievements.map((achievement) => (
                                    <div key={achievement.id} className="rounded-lg border p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold">{achievement.title}</p>
                                                <p className="text-muted-foreground mt-1 text-sm">
                                                    {achievement.description ?? achievement.organization ?? 'CourtPrime network achievement'}
                                                </p>
                                            </div>
                                            <AchievementBadge color={achievement.badge_color} />
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <StatusBadge status={achievement.visibility} />
                                            {achievement.tournament && <StatusBadge status="tournament" />}
                                        </div>
                                        {achievement.earned_at && (
                                            <p className="text-muted-foreground mt-2 text-xs">Earned {achievement.earned_at}</p>
                                        )}
                                    </div>
                                ))}
                                {achievements.length === 0 && (
                                    <p className="text-muted-foreground text-sm">No global achievements have been awarded yet.</p>
                                )}
                            </div>

                            {canManageCustomer && (
                                <form onSubmit={saveAchievement} className="space-y-3 rounded-lg border p-3">
                                    <p className="text-sm font-semibold">Award Achievement</p>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <Field
                                            label="Title"
                                            value={achievementForm.data.title}
                                            onChange={(value) => achievementForm.setData('title', value)}
                                            error={achievementForm.errors.title}
                                        />
                                        <Field
                                            label="Code"
                                            value={achievementForm.data.code}
                                            onChange={(value) => achievementForm.setData('code', value)}
                                            error={achievementForm.errors.code}
                                        />
                                        <Select
                                            label="Color"
                                            value={achievementForm.data.badge_color}
                                            options={['pink', 'blue', 'emerald', 'amber', 'slate']}
                                            onChange={(value) => achievementForm.setData('badge_color', value)}
                                        />
                                        <Select
                                            label="Visibility"
                                            value={achievementForm.data.visibility}
                                            options={['public', 'organization']}
                                            onChange={(value) => achievementForm.setData('visibility', value)}
                                        />
                                        <Field
                                            label="Earned At"
                                            type="date"
                                            value={achievementForm.data.earned_at}
                                            onChange={(value) => achievementForm.setData('earned_at', value)}
                                            error={achievementForm.errors.earned_at}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <textarea
                                            className="bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                                            value={achievementForm.data.description}
                                            onChange={(event) => achievementForm.setData('description', event.target.value)}
                                        />
                                        {achievementForm.errors.description && (
                                            <p className="text-xs text-red-600">{achievementForm.errors.description}</p>
                                        )}
                                    </div>
                                    <Button disabled={achievementForm.processing}>Save Achievement</Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileSignature className="size-4 text-pink-600" />
                                Waivers
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                {waivers.map((waiver) => (
                                    <div key={waiver.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_auto] md:items-center">
                                        <div>
                                            <p className="font-semibold">{waiver.signature_name}</p>
                                            <p className="text-muted-foreground text-sm">
                                                {waiver.template?.title ? `${waiver.template.title} ` : ''}
                                                {waiver.version} - {waiver.accepted_at ?? 'Pending'}
                                            </p>
                                        </div>
                                        <StatusBadge status={waiver.status} />
                                    </div>
                                ))}
                                {waivers.length === 0 && (
                                    <p className="text-muted-foreground text-sm">No waiver has been recorded for this organization relationship.</p>
                                )}
                            </div>
                            <form onSubmit={saveWaiver} className="grid gap-3 md:grid-cols-[1fr_0.4fr_1fr_1fr_auto] md:items-end">
                                <TemplateSelect
                                    label="Template"
                                    value={String(waiverForm.data.waiver_template_id)}
                                    templates={waiverTemplates}
                                    onChange={(templateId) => {
                                        const template = waiverTemplates.find((item) => String(item.id) === templateId);
                                        waiverForm.setData({
                                            ...waiverForm.data,
                                            waiver_template_id: templateId,
                                            version: template?.version ?? waiverForm.data.version,
                                        });
                                    }}
                                />
                                <Field
                                    label="Version"
                                    value={waiverForm.data.version}
                                    onChange={(value) => waiverForm.setData('version', value)}
                                    error={waiverForm.errors.version}
                                />
                                <Field
                                    label="Signature"
                                    value={waiverForm.data.signature_name}
                                    onChange={(value) => waiverForm.setData('signature_name', value)}
                                    error={waiverForm.errors.signature_name}
                                />
                                <Field
                                    label="Guardian"
                                    value={waiverForm.data.guardian_name}
                                    onChange={(value) => waiverForm.setData('guardian_name', value)}
                                    error={waiverForm.errors.guardian_name}
                                />
                                <Button disabled={waiverForm.processing}>Record</Button>
                            </form>
                        </CardContent>
                    </Card>

                    {canManageCustomer && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <ClipboardList className="size-4 text-pink-600" />
                                    Private CRM Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <form onSubmit={saveNote} className="space-y-3">
                                    <div className="grid gap-3 md:grid-cols-3">
                                        <Select
                                            label="Type"
                                            value={noteForm.data.note_type}
                                            options={['general', 'follow_up', 'risk', 'preference', 'support']}
                                            onChange={(value) => noteForm.setData('note_type', value)}
                                        />
                                        <Select
                                            label="Visibility"
                                            value={noteForm.data.visibility}
                                            options={['team', 'manager']}
                                            onChange={(value) => noteForm.setData('visibility', value)}
                                        />
                                        <Field
                                            label="Follow Up"
                                            type="datetime-local"
                                            value={noteForm.data.follow_up_at}
                                            onChange={(value) => noteForm.setData('follow_up_at', value)}
                                            error={noteForm.errors.follow_up_at}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Note</Label>
                                        <textarea
                                            className="bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
                                            value={noteForm.data.body}
                                            onChange={(event) => noteForm.setData('body', event.target.value)}
                                        />
                                        {noteForm.errors.body && <p className="text-xs text-red-600">{noteForm.errors.body}</p>}
                                    </div>
                                    <Button disabled={noteForm.processing}>Save Private Note</Button>
                                </form>
                                <div className="space-y-3">
                                    {crmNotes.map((note) => (
                                        <div key={note.id} className="rounded-lg border p-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <StatusBadge status={note.note_type} />
                                                    <StatusBadge status={note.visibility} />
                                                </div>
                                                <p className="text-muted-foreground text-xs">{note.creator ?? 'CourtPrime team'}</p>
                                            </div>
                                            <p className="mt-3 text-sm">{note.body}</p>
                                            {note.follow_up_at && (
                                                <p className="text-muted-foreground mt-2 text-xs">Follow up: {note.follow_up_at}</p>
                                            )}
                                        </div>
                                    ))}
                                    {crmNotes.length === 0 && <p className="text-muted-foreground text-sm">No private CRM notes yet.</p>}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function IdentityPattern({ payload }: { payload: string }) {
    const cells = Array.from({ length: 144 }, (_, index) => {
        const char = payload.charCodeAt(index % payload.length);
        return (char + index * 17) % 5 < 2 || index % 13 === 0;
    });

    return (
        <div className="mx-auto grid size-48 grid-cols-12 gap-1 rounded-xl border bg-white p-3">
            {cells.map((active, index) => (
                <span key={index} className={active ? 'rounded-sm bg-slate-950' : 'rounded-sm bg-slate-100'} />
            ))}
        </div>
    );
}

function TemplateSelect({
    label,
    value,
    templates,
    onChange,
}: {
    label: string;
    value: string;
    templates: any[];
    onChange: (value: string) => void;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <select
                className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                <option value="">Manual version</option>
                {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                        {template.title} - {template.version}
                    </option>
                ))}
            </select>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 font-semibold capitalize">{value}</p>
        </div>
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
            <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <select
                className="bg-background h-10 w-full rounded-md border px-3 text-sm capitalize"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option.replaceAll('_', ' ')}
                    </option>
                ))}
            </select>
        </div>
    );
}

function AchievementBadge({ color }: { color: string }) {
    const classes: Record<string, string> = {
        pink: 'bg-pink-50 text-pink-700 border-pink-100',
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        slate: 'bg-slate-100 text-slate-700 border-slate-200',
    };

    return <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${classes[color] ?? classes.pink}`}>Achievement</span>;
}

function Toggle({
    label,
    checked,
    disabled,
    onChange,
}: {
    label: string;
    checked: boolean;
    disabled: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex h-11 items-center gap-3 rounded-md border px-3 text-sm">
            <input type="checkbox" disabled={disabled} checked={checked} onChange={(event) => onChange(event.target.checked)} />
            <span>{label}</span>
        </label>
    );
}
