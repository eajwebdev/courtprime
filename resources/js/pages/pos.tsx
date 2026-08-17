import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Minus, Plus, ReceiptText } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'POS', href: '/pos' }];

export default function POS({
    branches,
    products,
    openSession,
    transactions,
}: {
    branches: any[];
    products: any[];
    openSession: any;
    transactions: any[];
}) {
    const form = useForm({
        branch_id: openSession?.branch_id ?? branches[0]?.id ?? '',
        payment_method: 'cash',
        amount_tendered: 0,
        discount_amount: 0,
        items: products.slice(0, 2).map((product: any) => ({ product_id: product.id, quantity: 0 })),
    });

    const selected = form.data.items
        .filter((item) => Number(item.quantity) > 0)
        .map((item) => {
            const product = products.find((candidate) => candidate.id === Number(item.product_id));
            return { ...item, product, total: Number(product?.price ?? 0) * Number(item.quantity) };
        });

    const subtotal = selected.reduce((sum, item) => sum + item.total, 0);
    const branch = branches.find((candidate) => candidate.id === Number(form.data.branch_id));
    const tax = Math.max(subtotal - Number(form.data.discount_amount), 0) * (Number(branch?.tax_rate ?? 0) / 100);
    const total = Math.max(subtotal - Number(form.data.discount_amount), 0) + tax;

    const setQty = (productId: number, quantity: number) => {
        const existing = form.data.items.find((item) => Number(item.product_id) === productId);
        const items = existing
            ? form.data.items.map((item) => (Number(item.product_id) === productId ? { ...item, quantity: Math.max(quantity, 0) } : item))
            : [...form.data.items, { product_id: productId, quantity: Math.max(quantity, 0) }];
        form.setData('items', items);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({ ...data, amount_tendered: Number(data.amount_tendered) || total })).post('/pos', { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="POS" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[1.5fr_0.9fr]">
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-semibold">Point of Sale</h1>
                            <p className="text-muted-foreground mt-2 text-sm">
                                Court fees, rentals, drinks, merchandise, memberships, and tournament payments.
                            </p>
                        </div>
                        <StatusBadge status={openSession ? 'open' : 'closed'} />
                    </div>

                    {!openSession && (
                        <Card className="border-amber-200 bg-amber-50">
                            <CardContent className="p-4 text-sm text-amber-800">
                                Open a cashier session before selling.{' '}
                                <Link className="font-semibold underline" href="/cashier-sessions">
                                    Go to Cashier Sessions
                                </Link>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {products.map((product) => {
                            const qty = Number(form.data.items.find((item) => Number(item.product_id) === product.id)?.quantity ?? 0);
                            return (
                                <Card key={product.id}>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between gap-3">
                                            <div>
                                                <p className="font-semibold">{product.name}</p>
                                                <p className="text-muted-foreground text-sm">
                                                    {currency(product.price)} - Stock {product.stock_on_hand}
                                                </p>
                                            </div>
                                            <StatusBadge status={product.stock_on_hand <= product.reorder_point ? 'pending' : 'active'} />
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <Button type="button" variant="outline" size="icon" onClick={() => setQty(product.id, qty - 1)}>
                                                <Minus className="size-4" />
                                            </Button>
                                            <strong>{qty}</strong>
                                            <Button type="button" variant="outline" size="icon" onClick={() => setQty(product.id, qty + 1)}>
                                                <Plus className="size-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ReceiptText className="size-4 text-pink-600" />
                                Checkout
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
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
                                    {selected.map((item) => (
                                        <div key={item.product_id} className="flex justify-between text-sm">
                                            <span>
                                                {item.product?.name} x {item.quantity}
                                            </span>
                                            <strong>{currency(item.total)}</strong>
                                        </div>
                                    ))}
                                </div>
                                <Field
                                    label="Discount"
                                    type="number"
                                    value={form.data.discount_amount}
                                    onChange={(value) => form.setData('discount_amount', Number(value))}
                                />
                                <div className="space-y-2">
                                    <Label>Payment Method</Label>
                                    <select
                                        className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                                        value={form.data.payment_method}
                                        onChange={(event) => form.setData('payment_method', event.target.value)}
                                    >
                                        {['cash', 'gcash', 'card', 'bank_transfer'].map((method) => (
                                            <option key={method} value={method}>
                                                {method}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Field
                                    label="Amount Tendered"
                                    type="number"
                                    value={form.data.amount_tendered}
                                    onChange={(value) => form.setData('amount_tendered', Number(value))}
                                    error={form.errors.amount_tendered}
                                />
                                {form.errors.items && <p className="text-xs text-red-600">{form.errors.items}</p>}
                                {form.errors.cashier_session && <p className="text-xs text-red-600">{form.errors.cashier_session}</p>}
                                <div className="dark:bg-surface-muted rounded-lg bg-slate-50 p-4 text-sm">
                                    <Row label="Subtotal" value={currency(subtotal)} />
                                    <Row label="Tax" value={currency(tax)} />
                                    <Row label="Total" value={currency(total)} strong />
                                </div>
                                <Button disabled={form.processing || !openSession} className="w-full">
                                    Complete Sale
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Recent Transactions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {transactions.map((transaction) => (
                                <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                                    <div>
                                        <p className="font-semibold">{transaction.reference}</p>
                                        <p className="text-muted-foreground">{transaction.payment_method}</p>
                                    </div>
                                    <div className="text-right">
                                        <strong>{currency(transaction.total_amount)}</strong>
                                        <Link href={`/pos/${transaction.id}/receipt`} className="block text-xs font-medium text-pink-600">
                                            Receipt
                                        </Link>
                                    </div>
                                </div>
                            ))}
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

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className={`flex justify-between ${strong ? 'mt-2 border-t pt-2 text-base font-semibold' : ''}`}>
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}
