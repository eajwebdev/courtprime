import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ArrowRightLeft, PackageCheck } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventory', href: '/inventory' },
    { title: 'Stock Transfers', href: '/stock-transfers' },
];

export default function StockTransfers({ branches, products, transfers }: { branches: any[]; products: any[]; transfers: any }) {
    const form = useForm({
        from_branch_id: branches[0]?.id ?? '',
        to_branch_id: branches[1]?.id ?? branches[0]?.id ?? '',
        product_id: products[0]?.id ?? '',
        quantity: 1,
        notes: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            from_branch_id: data.from_branch_id,
            to_branch_id: data.to_branch_id,
            notes: data.notes,
            items: [{ product_id: data.product_id, quantity: data.quantity }],
        })).post('/stock-transfers', { preserveScroll: true, onSuccess: () => form.reset('quantity', 'notes') });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Transfers" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.85fr_1.6fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ArrowRightLeft className="size-4 text-pink-600" />
                            Draft Transfer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <Select
                                label="From Branch"
                                value={String(form.data.from_branch_id)}
                                options={branches.map((branch) => String(branch.id))}
                                labels={branchLabels(branches)}
                                onChange={(value) => form.setData('from_branch_id', Number(value))}
                                error={form.errors.from_branch_id}
                            />
                            <Select
                                label="To Branch"
                                value={String(form.data.to_branch_id)}
                                options={branches.map((branch) => String(branch.id))}
                                labels={branchLabels(branches)}
                                onChange={(value) => form.setData('to_branch_id', Number(value))}
                                error={form.errors.to_branch_id}
                            />
                            <Select
                                label="Product"
                                value={String(form.data.product_id)}
                                options={products.map((product) => String(product.id))}
                                labels={productLabels(products)}
                                onChange={(value) => form.setData('product_id', Number(value))}
                                error={form.errors.items}
                            />
                            <Field
                                label="Quantity"
                                type="number"
                                value={form.data.quantity}
                                onChange={(value) => form.setData('quantity', Number(value))}
                            />
                            <Field
                                label="Notes"
                                value={form.data.notes}
                                onChange={(value) => form.setData('notes', value)}
                                error={form.errors.notes}
                            />
                            <Button disabled={form.processing || branches.length < 2 || products.length === 0} className="w-full">
                                Save Draft
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Transfer Queue</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {transfers.data.map((transfer: any) => (
                            <TransferRow key={transfer.id} transfer={transfer} />
                        ))}
                        {transfers.data.length === 0 && <p className="text-muted-foreground text-sm">No stock transfers yet.</p>}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function TransferRow({ transfer }: { transfer: any }) {
    const sendForm = useForm({});
    const receiveForm = useForm({});

    return (
        <div className="rounded-lg border p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{transfer.reference}</p>
                        <StatusBadge status={transfer.status} />
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {transfer.from_branch?.name} to {transfer.to_branch?.name}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {transfer.status === 'draft' && (
                        <Button
                            variant="outline"
                            disabled={sendForm.processing}
                            onClick={() => sendForm.post(`/stock-transfers/${transfer.id}/send`, { preserveScroll: true })}
                        >
                            Send
                        </Button>
                    )}
                    {transfer.status === 'sent' && (
                        <Button
                            disabled={receiveForm.processing}
                            onClick={() => receiveForm.post(`/stock-transfers/${transfer.id}/receive`, { preserveScroll: true })}
                        >
                            <PackageCheck className="size-4" />
                            Receive
                        </Button>
                    )}
                </div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
                {(transfer.items ?? []).map((item: any) => (
                    <div key={item.id} className="dark:bg-surface-muted rounded-md bg-slate-50 p-3 text-sm">
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-muted-foreground">
                            {item.quantity} {item.product?.unit ?? 'units'}
                        </p>
                    </div>
                ))}
            </div>
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
    error,
}: {
    label: string;
    value: string;
    options: string[];
    labels: Record<string, string>;
    onChange: (value: string) => void;
    error?: string;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <select
                className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {labels[option] ?? option}
                    </option>
                ))}
            </select>
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

function branchLabels(branches: any[]) {
    return Object.fromEntries(branches.map((branch) => [String(branch.id), `${branch.code} - ${branch.name}`]));
}

function productLabels(products: any[]) {
    return Object.fromEntries(products.map((product) => [String(product.id), `${product.name} (${product.stock_on_hand} ${product.unit})`]));
}
