import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Team & Roles', href: '/team-roles' }];

type UserOption = {
    id: number;
    name: string;
    email: string;
};

type OrganizationOption = {
    id: number;
    name: string;
};

type BranchOption = {
    id: number;
    organization_id: number;
    name: string;
    code: string;
};

type RoleOption = {
    value: string;
    label: string;
};

export default function TeamRoles({
    assignments,
    users,
    organizations,
    branches,
    roles,
}: {
    assignments: any;
    users: UserOption[];
    organizations: OrganizationOption[];
    branches: BranchOption[];
    roles: RoleOption[];
}) {
    const form = useForm({
        user_id: 'new',
        name: '',
        email: '',
        organization_id: String(organizations[0]?.id ?? ''),
        branch_id: 'none',
        role_key: roles[0]?.value ?? 'front_desk',
        is_primary: true,
    });

    const selectedOrganizationId = Number(form.data.organization_id);
    const availableBranches = branches.filter((branch) => branch.organization_id === selectedOrganizationId);
    const isNewUser = form.data.user_id === 'new';

    const submit = (event: FormEvent) => {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            user_id: data.user_id === 'new' ? null : Number(data.user_id),
            organization_id: data.organization_id ? Number(data.organization_id) : null,
            branch_id: data.branch_id === 'none' ? null : Number(data.branch_id),
        })).post('/team-roles', {
            preserveScroll: true,
            onSuccess: () => form.reset('name', 'email'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Team & Roles" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.85fr_1.5fr]">
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <UserPlus className="size-4 text-pink-600" />
                                Assign CourtPrime Role
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>User</Label>
                                    <Select value={form.data.user_id} onValueChange={(value) => form.setData('user_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="new">Create new user</SelectItem>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={String(user.id)}>
                                                    {user.name} - {user.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {isNewUser && (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <Field
                                            label="Name"
                                            value={form.data.name}
                                            onChange={(value) => form.setData('name', value)}
                                            error={form.errors.name}
                                        />
                                        <Field
                                            label="Email"
                                            type="email"
                                            value={form.data.email}
                                            onChange={(value) => form.setData('email', value)}
                                            error={form.errors.email}
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Organization</Label>
                                    <Select
                                        value={form.data.organization_id}
                                        onValueChange={(value) => {
                                            form.setData('organization_id', value);
                                            form.setData('branch_id', 'none');
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose organization" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {organizations.map((organization) => (
                                                <SelectItem key={organization.id} value={String(organization.id)}>
                                                    {organization.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Branch Scope</Label>
                                        <Select value={form.data.branch_id} onValueChange={(value) => form.setData('branch_id', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose branch" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">All branches</SelectItem>
                                                {availableBranches.map((branch) => (
                                                    <SelectItem key={branch.id} value={String(branch.id)}>
                                                        {branch.code} - {branch.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Select value={form.data.role_key} onValueChange={(value) => form.setData('role_key', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map((role) => (
                                                    <SelectItem key={role.value} value={role.value}>
                                                        {role.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.errors.role_key && <p className="text-xs text-red-600">{form.errors.role_key}</p>}
                                    </div>
                                </div>

                                <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                                    <Checkbox
                                        checked={form.data.is_primary}
                                        onCheckedChange={(checked) => form.setData('is_primary', Boolean(checked))}
                                    />
                                    Make this the user&apos;s primary CourtPrime workspace
                                </label>

                                <Button disabled={form.processing} className="w-full">
                                    Save Role Assignment
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShieldCheck className="size-4 text-pink-600" />
                            Current Assignments
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {assignments.data.map((assignment: any) => (
                            <div key={assignment.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_auto] md:items-center">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold">{assignment.user?.name}</p>
                                        <StatusBadge status={assignment.status} />
                                        {assignment.is_primary && (
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Primary</span>
                                        )}
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-sm">{assignment.user?.email}</p>
                                    <p className="mt-2 text-sm">
                                        <span className="font-medium">{assignment.role_label}</span>
                                        <span className="text-muted-foreground"> at </span>
                                        {assignment.organization?.name}
                                        {assignment.branch ? ` / ${assignment.branch.name}` : ' / All branches'}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={assignment.status === 'inactive'}
                                    onClick={() => router.delete(`/team-roles/${assignment.id}`, { preserveScroll: true })}
                                >
                                    Deactivate
                                </Button>
                            </div>
                        ))}
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
