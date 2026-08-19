import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Clock, IdCard, Users } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Staff', href: '/staff' }];
const profileStatuses = ['active', 'on_leave', 'suspended', 'terminated'];
const attendanceStatuses = ['present', 'late', 'absent', 'half_day', 'remote'];

export default function Staff({
    profiles,
    branches,
    users,
    attendance,
    metrics,
    canManageStaff,
}: {
    profiles: any;
    branches: any[];
    users: any[];
    attendance: any[];
    metrics: Record<string, number>;
    canManageStaff: boolean;
}) {
    const profileForm = useForm({
        branch_id: branches.length === 1 ? branches[0].id : '',
        user_id: '',
        employee_id: '',
        name: '',
        position: '',
        contact_email: '',
        contact_mobile: '',
        hire_date: new Date().toISOString().slice(0, 10),
        status: 'active',
        emergency_contact: '',
        notes: '',
    });

    const attendanceForm = useForm({
        staff_profile_id: profiles.data[0]?.id ?? '',
        branch_id: branches.length === 1 ? branches[0].id : '',
        attendance_date: new Date().toISOString().slice(0, 10),
        time_in: '09:00',
        time_out: '',
        status: 'present',
        device: 'Front desk',
        qr_code: '',
        gps_latitude: '',
        gps_longitude: '',
        notes: '',
    });

    const submitProfile = (event: FormEvent) => {
        event.preventDefault();
        profileForm.transform((data) => ({
            ...data,
            branch_id: data.branch_id ? Number(data.branch_id) : null,
            user_id: data.user_id ? Number(data.user_id) : null,
        }));
        profileForm.post('/staff', {
            preserveScroll: true,
            onSuccess: () => profileForm.reset('employee_id', 'name', 'position', 'contact_email', 'contact_mobile', 'emergency_contact', 'notes'),
        });
    };

    const submitAttendance = (event: FormEvent) => {
        event.preventDefault();
        attendanceForm.transform((data) => ({
            ...data,
            staff_profile_id: Number(data.staff_profile_id),
            branch_id: data.branch_id ? Number(data.branch_id) : null,
            gps_latitude: data.gps_latitude === '' ? null : Number(data.gps_latitude),
            gps_longitude: data.gps_longitude === '' ? null : Number(data.gps_longitude),
        }));
        attendanceForm.post('/staff/attendance', {
            preserveScroll: true,
            onSuccess: () => attendanceForm.reset('time_out', 'qr_code', 'gps_latitude', 'gps_longitude', 'notes'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Staff" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.95fr_1.5fr]">
                <div className="space-y-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Metric label="Active" value={metrics.active} />
                        <Metric label="On Leave" value={metrics.onLeave} />
                        <Metric label="Present Today" value={metrics.todayPresent} />
                        <Metric label="Late Today" value={metrics.lateToday} />
                    </div>

                    {canManageStaff && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <IdCard className="size-4 text-pink-600" />
                                    New Staff Profile
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submitProfile} className="space-y-4">
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <Field
                                            label="Employee ID"
                                            value={profileForm.data.employee_id}
                                            onChange={(value) => profileForm.setData('employee_id', value)}
                                            error={profileForm.errors.employee_id}
                                        />
                                        <Field
                                            label="Name"
                                            value={profileForm.data.name}
                                            onChange={(value) => profileForm.setData('name', value)}
                                            error={profileForm.errors.name}
                                        />
                                        <Select
                                            label="Branch"
                                            value={String(profileForm.data.branch_id)}
                                            options={['', ...branches.map((branch) => String(branch.id))]}
                                            labels={Object.fromEntries([
                                                ['', 'All branches'],
                                                ...branches.map((branch) => [String(branch.id), `${branch.code} - ${branch.name}`]),
                                            ])}
                                            onChange={(value) => profileForm.setData('branch_id', value)}
                                        />
                                        <Select
                                            label="Linked User"
                                            value={String(profileForm.data.user_id)}
                                            options={['', ...users.map((user) => String(user.id))]}
                                            labels={Object.fromEntries([
                                                ['', 'No login linked'],
                                                ...users.map((user) => [String(user.id), `${user.name} (${user.role_key})`]),
                                            ])}
                                            onChange={(value) => profileForm.setData('user_id', value)}
                                        />
                                        <Field
                                            label="Position"
                                            value={profileForm.data.position}
                                            onChange={(value) => profileForm.setData('position', value)}
                                            error={profileForm.errors.position}
                                        />
                                        <Select
                                            label="Status"
                                            value={profileForm.data.status}
                                            options={profileStatuses}
                                            onChange={(value) => profileForm.setData('status', value)}
                                        />
                                        <Field
                                            label="Email"
                                            type="email"
                                            value={profileForm.data.contact_email}
                                            onChange={(value) => profileForm.setData('contact_email', value)}
                                            error={profileForm.errors.contact_email}
                                        />
                                        <Field
                                            label="Mobile"
                                            value={profileForm.data.contact_mobile}
                                            onChange={(value) => profileForm.setData('contact_mobile', value)}
                                            error={profileForm.errors.contact_mobile}
                                        />
                                        <Field
                                            label="Hire Date"
                                            type="date"
                                            value={profileForm.data.hire_date}
                                            onChange={(value) => profileForm.setData('hire_date', value)}
                                            error={profileForm.errors.hire_date}
                                        />
                                        <Field
                                            label="Emergency Contact"
                                            value={profileForm.data.emergency_contact}
                                            onChange={(value) => profileForm.setData('emergency_contact', value)}
                                            error={profileForm.errors.emergency_contact}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Notes</Label>
                                        <textarea
                                            className="bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                                            value={profileForm.data.notes}
                                            onChange={(event) => profileForm.setData('notes', event.target.value)}
                                        />
                                    </div>
                                    <Button disabled={profileForm.processing}>Save Staff Profile</Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Clock className="size-4 text-pink-600" />
                                Attendance Entry
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitAttendance} className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Select
                                        label="Staff"
                                        value={String(attendanceForm.data.staff_profile_id)}
                                        options={profiles.data.map((profile: any) => String(profile.id))}
                                        labels={Object.fromEntries(
                                            profiles.data.map((profile: any) => [String(profile.id), `${profile.employee_id} - ${profile.name}`]),
                                        )}
                                        onChange={(value) => attendanceForm.setData('staff_profile_id', value)}
                                    />
                                    <Select
                                        label="Branch"
                                        value={String(attendanceForm.data.branch_id)}
                                        options={['', ...branches.map((branch) => String(branch.id))]}
                                        labels={Object.fromEntries([
                                            ['', 'Profile branch'],
                                            ...branches.map((branch) => [String(branch.id), `${branch.code} - ${branch.name}`]),
                                        ])}
                                        onChange={(value) => attendanceForm.setData('branch_id', value)}
                                    />
                                    <Field
                                        label="Date"
                                        type="date"
                                        value={attendanceForm.data.attendance_date}
                                        onChange={(value) => attendanceForm.setData('attendance_date', value)}
                                        error={attendanceForm.errors.attendance_date}
                                    />
                                    <Select
                                        label="Status"
                                        value={attendanceForm.data.status}
                                        options={attendanceStatuses}
                                        onChange={(value) => attendanceForm.setData('status', value)}
                                    />
                                    <Field
                                        label="Time In"
                                        type="time"
                                        value={attendanceForm.data.time_in}
                                        onChange={(value) => attendanceForm.setData('time_in', value)}
                                        error={attendanceForm.errors.time_in}
                                    />
                                    <Field
                                        label="Time Out"
                                        type="time"
                                        value={attendanceForm.data.time_out}
                                        onChange={(value) => attendanceForm.setData('time_out', value)}
                                        error={attendanceForm.errors.time_out}
                                    />
                                    <Field
                                        label="Device"
                                        value={attendanceForm.data.device}
                                        onChange={(value) => attendanceForm.setData('device', value)}
                                        error={attendanceForm.errors.device}
                                    />
                                    <Field
                                        label="QR"
                                        value={attendanceForm.data.qr_code}
                                        onChange={(value) => attendanceForm.setData('qr_code', value)}
                                        error={attendanceForm.errors.qr_code}
                                    />
                                </div>
                                <Button disabled={attendanceForm.processing || profiles.data.length === 0}>Record Attendance</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Users className="size-4 text-pink-600" />
                                Staff Directory
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {profiles.data.map((profile: any) => (
                                <div key={profile.id} className="rounded-lg border p-3">
                                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                                        <div>
                                            <p className="font-semibold">{profile.name}</p>
                                            <p className="text-muted-foreground text-sm">
                                                {profile.employee_id} - {profile.position ?? 'No position'} - {profile.branch?.name ?? 'All branches'}
                                            </p>
                                        </div>
                                        <StatusBadge status={profile.status} />
                                    </div>
                                    <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                                        <Info label="Email" value={profile.contact_email ?? profile.user?.email ?? '-'} />
                                        <Info label="Mobile" value={profile.contact_mobile ?? '-'} />
                                        <Info label="Hire Date" value={profile.hire_date ?? '-'} />
                                    </div>
                                </div>
                            ))}
                            {profiles.data.length === 0 && (
                                <p className="text-muted-foreground rounded-lg border p-4 text-sm">No staff profiles yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Today&apos;s Attendance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {attendance.map((entry) => (
                                <div key={entry.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_auto] md:items-center">
                                    <div>
                                        <p className="font-semibold">{entry.staff_profile?.name}</p>
                                        <p className="text-muted-foreground text-sm">
                                            {entry.branch?.name ?? 'Branch pending'} - {entry.time_in ?? '--:--'} to {entry.time_out ?? '--:--'}
                                        </p>
                                    </div>
                                    <StatusBadge status={entry.status} />
                                </div>
                            ))}
                            {attendance.length === 0 && (
                                <p className="text-muted-foreground rounded-lg border p-4 text-sm">No attendance entries for today.</p>
                            )}
                        </CardContent>
                    </Card>
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
            <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

function Select({
    label,
    value,
    options,
    labels,
    onChange,
}: {
    label: string;
    value: string;
    options: string[];
    labels?: Record<string, string>;
    onChange: (value: string) => void;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <select
                className="bg-background h-10 w-full rounded-md border px-3 text-sm capitalize"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map((option) => (
                    <option key={option || 'none'} value={option}>
                        {labels?.[option] ?? option.replaceAll('_', ' ')}
                    </option>
                ))}
            </select>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-sm">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
        </div>
    );
}
