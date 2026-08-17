import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Megaphone } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Announcements', href: '/announcements' }];

export default function Announcements({ announcements, branches }: { announcements: any; branches: any[] }) {
    const form = useForm({
        branch_id: '',
        title: '',
        body: '',
        audience: 'all_players',
        status: 'draft',
        scheduled_at: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/announcements', { preserveScroll: true, onSuccess: () => form.reset('title', 'body', 'scheduled_at') });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Announcements" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.85fr_1.45fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Megaphone className="size-4 text-pink-600" />
                            New Announcement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <Field
                                label="Title"
                                value={form.data.title}
                                onChange={(value) => form.setData('title', value)}
                                error={form.errors.title}
                            />
                            <div className="grid gap-3 md:grid-cols-2">
                                <Select
                                    label="Audience"
                                    value={form.data.audience}
                                    options={['all_players', 'branch', 'members', 'tournament_participants', 'open_play_participants', 'staff']}
                                    onChange={(value) => form.setData('audience', value)}
                                />
                                <Select
                                    label="Status"
                                    value={form.data.status}
                                    options={['draft', 'scheduled', 'published', 'archived']}
                                    onChange={(value) => form.setData('status', value)}
                                />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Branch</Label>
                                    <select
                                        className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                                        value={form.data.branch_id}
                                        onChange={(event) => form.setData('branch_id', event.target.value)}
                                    >
                                        <option value="">All branches</option>
                                        {branches.map((branch) => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.code} - {branch.name}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.branch_id && <p className="text-xs text-red-600">{form.errors.branch_id}</p>}
                                </div>
                                <Field
                                    label="Scheduled"
                                    type="datetime-local"
                                    value={form.data.scheduled_at}
                                    onChange={(value) => form.setData('scheduled_at', value)}
                                    error={form.errors.scheduled_at}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Message</Label>
                                <textarea
                                    className="bg-background min-h-36 w-full rounded-md border px-3 py-2 text-sm"
                                    value={form.data.body}
                                    onChange={(event) => form.setData('body', event.target.value)}
                                />
                                {form.errors.body && <p className="text-xs text-red-600">{form.errors.body}</p>}
                            </div>
                            <Button disabled={form.processing} className="w-full">
                                Save Announcement
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Announcement Board</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {announcements.data.map((announcement: any) => (
                            <div key={announcement.id} className="rounded-lg border p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold">{announcement.title}</p>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            {announcement.branch?.name ?? 'All branches'} - {announcement.audience?.replaceAll('_', ' ')}
                                        </p>
                                    </div>
                                    <StatusBadge status={announcement.status} />
                                </div>
                                <p className="mt-3 text-sm">{announcement.body}</p>
                                {(announcement.scheduled_at || announcement.published_at) && (
                                    <p className="text-muted-foreground mt-3 text-xs">
                                        {announcement.published_at
                                            ? `Published ${announcement.published_at}`
                                            : `Scheduled ${announcement.scheduled_at}`}
                                    </p>
                                )}
                            </div>
                        ))}
                        {announcements.data.length === 0 && (
                            <p className="text-muted-foreground rounded-lg border p-4 text-sm">No announcements have been created yet.</p>
                        )}
                    </CardContent>
                </Card>
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
