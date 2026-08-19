import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Cashier Sessions', href: '/cashier-sessions' }];

export default function CashierSessions({ branches, sessions }: { branches: any[]; sessions: any }) {
    const form = useForm({ branch_id: branches[0]?.id ?? '', opening_cash: 2000 });
    const closeForm = useForm({ closing_cash: 0 });

    const open = (event: FormEvent) => {
        event.preventDefault();
        form.post('/cashier-sessions', { preserveScroll: true });
    };

    const close = (id: number) => {
        closeForm.transform((data) => ({ ...data, closing_cash: Number(data.closing_cash) }));
        closeForm.post(`/cashier-sessions/${id}/close`, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cashier Sessions" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.7fr_1.5fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Open Till</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={open} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Branch</Label>
                                <select
                                    className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                                    value={form.data.branch_id}
                                    onChange={(event) => form.setData('branch_id', Number(event.target.value))}
                                >
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Opening Cash</Label>
                                <Input
                                    type="number"
                                    value={form.data.opening_cash}
                                    onChange={(event) => form.setData('opening_cash', Number(event.target.value))}
                                />
                            </div>
                            <Button disabled={form.processing} className="w-full">
                                Open Session
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Till Sessions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {sessions.data.map((session: any) => (
                            <div key={session.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                                <div>
                                    <p className="font-semibold">{session.reference}</p>
                                    <p className="text-muted-foreground text-sm">
                                        {session.branch?.name} - {session.user?.name}
                                    </p>
                                </div>
                                <StatusBadge status={session.status} />
                                <div className="flex items-center gap-2">
                                    {session.status === 'open' && (
                                        <>
                                            <Input
                                                className="w-28"
                                                type="number"
                                                placeholder="Closing"
                                                value={closeForm.data.closing_cash}
                                                onChange={(event) => closeForm.setData('closing_cash', Number(event.target.value))}
                                            />
                                            <Button type="button" variant="outline" onClick={() => close(session.id)}>
                                                Close
                                            </Button>
                                        </>
                                    )}
                                    {session.status === 'closed' && (
                                        <p className="text-sm font-semibold">{currency(session.cash_variance)} variance</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
