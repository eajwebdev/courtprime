import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ReceiptText } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Expenses', href: '/expenses' }];
const categories = ['utilities', 'rent', 'salary', 'equipment', 'maintenance', 'supplies', 'marketing', 'other'];
const methods = ['cash', 'card', 'bank_transfer', 'check', 'wallet', 'other'];
const statuses = ['pending', 'approved', 'paid', 'rejected'];

export default function Expenses({
    expenses,
    branches,
    approvers,
    metrics,
    categoryTotals,
}: {
    expenses: any;
    branches: any[];
    approvers: any[];
    metrics: Record<string, number>;
    categoryTotals: any[];
}) {
    const form = useForm({
        branch_id: branches.length === 1 ? branches[0].id : '',
        category: 'utilities',
        supplier: '',
        amount: 0,
        payment_method: 'cash',
        expense_date: new Date().toISOString().slice(0, 10),
        receipt_reference: '',
        status: 'pending',
        notes: '',
        approved_by: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            branch_id: data.branch_id ? Number(data.branch_id) : null,
            amount: Number(data.amount),
            approved_by: data.approved_by ? Number(data.approved_by) : null,
        }));
        form.post('/expenses', { preserveScroll: true, onSuccess: () => form.reset('supplier', 'amount', 'receipt_reference', 'notes') });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Expenses" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.95fr_1.5fr]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ReceiptText className="size-4 text-pink-600" />
                                New Expense
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Select
                                        label="Branch"
                                        value={String(form.data.branch_id)}
                                        options={['', ...branches.map((branch) => String(branch.id))]}
                                        labels={Object.fromEntries([
                                            ['', 'Organization-wide'],
                                            ...branches.map((branch) => [String(branch.id), `${branch.code} - ${branch.name}`]),
                                        ])}
                                        onChange={(value) => form.setData('branch_id', value)}
                                    />
                                    <Select
                                        label="Category"
                                        value={form.data.category}
                                        options={categories}
                                        onChange={(value) => form.setData('category', value)}
                                    />
                                    <Field
                                        label="Supplier"
                                        value={form.data.supplier}
                                        onChange={(value) => form.setData('supplier', value)}
                                        error={form.errors.supplier}
                                    />
                                    <Field
                                        label="Amount"
                                        type="number"
                                        value={form.data.amount}
                                        onChange={(value) => form.setData('amount', Number(value))}
                                        error={form.errors.amount}
                                    />
                                    <Select
                                        label="Payment Method"
                                        value={form.data.payment_method}
                                        options={methods}
                                        onChange={(value) => form.setData('payment_method', value)}
                                    />
                                    <Field
                                        label="Date"
                                        type="date"
                                        value={form.data.expense_date}
                                        onChange={(value) => form.setData('expense_date', value)}
                                        error={form.errors.expense_date}
                                    />
                                    <Field
                                        label="Receipt"
                                        value={form.data.receipt_reference}
                                        onChange={(value) => form.setData('receipt_reference', value)}
                                        error={form.errors.receipt_reference}
                                    />
                                    <Select
                                        label="Status"
                                        value={form.data.status}
                                        options={statuses}
                                        onChange={(value) => form.setData('status', value)}
                                    />
                                    <Select
                                        label="Approver"
                                        value={String(form.data.approved_by)}
                                        options={['', ...approvers.map((approver) => String(approver.id))]}
                                        labels={Object.fromEntries([
                                            ['', 'Auto / Pending'],
                                            ...approvers.map((approver) => [String(approver.id), `${approver.name} (${approver.role_key})`]),
                                        ])}
                                        onChange={(value) => form.setData('approved_by', value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <textarea
                                        className="bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
                                        value={form.data.notes}
                                        onChange={(event) => form.setData('notes', event.target.value)}
                                    />
                                    {form.errors.notes && <p className="text-xs text-red-600">{form.errors.notes}</p>}
                                </div>
                                <Button disabled={form.processing}>Record Expense</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Expense Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2">
                            <Metric label="This Month" value={currency(metrics.month)} />
                            <Metric label="Pending" value={currency(metrics.pending)} />
                            <Metric label="Approved" value={currency(metrics.approved)} />
                            <Metric label="Paid" value={currency(metrics.paid)} />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Expense Ledger</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {expenses.data.map((expense: any) => (
                                <div key={expense.id} className="rounded-lg border p-3">
                                    <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                                        <div>
                                            <p className="font-semibold capitalize">{expense.category.replaceAll('_', ' ')}</p>
                                            <p className="text-muted-foreground text-sm">
                                                {expense.branch?.name ?? 'Organization-wide'} - {expense.supplier ?? 'No supplier'} -{' '}
                                                {expense.expense_date}
                                            </p>
                                        </div>
                                        <StatusBadge status={expense.status} />
                                        <strong className="text-right">{currency(expense.amount)}</strong>
                                    </div>
                                    <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                                        <Info label="Method" value={expense.payment_method.replaceAll('_', ' ')} />
                                        <Info label="Receipt" value={expense.receipt_reference ?? '-'} />
                                        <Info label="Approver" value={expense.approver?.name ?? '-'} />
                                    </div>
                                    {expense.notes && <p className="mt-3 text-sm">{expense.notes}</p>}
                                </div>
                            ))}
                            {expenses.data.length === 0 && (
                                <p className="text-muted-foreground rounded-lg border p-4 text-sm">No expenses recorded yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">By Category</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {categoryTotals.map((row) => (
                                <div key={row.category} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                                    <span className="font-medium capitalize">{row.category.replaceAll('_', ' ')}</span>
                                    <strong>{currency(row.total)}</strong>
                                </div>
                            ))}
                            {categoryTotals.length === 0 && (
                                <p className="text-muted-foreground rounded-lg border p-4 text-sm">No category data yet.</p>
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
            <Input type={type} step={type === 'number' ? '0.01' : undefined} value={value} onChange={(event) => onChange(event.target.value)} />
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

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-sm">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
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
