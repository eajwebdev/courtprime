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

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Products', href: '/products' }];

export default function Products({ products, categories, metrics }: { products: any; categories: any[]; metrics: Record<string, number> }) {
    const form = useForm({
        product_category_id: categories[0]?.id ?? '',
        sku: '',
        barcode: '',
        name: '',
        unit: 'each',
        price: 0,
        cost: 0,
        stock_on_hand: 0,
        reorder_point: 5,
        track_inventory: true,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/products', { preserveScroll: true, onSuccess: () => form.reset('sku', 'barcode', 'name', 'price', 'cost', 'stock_on_hand') });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.8fr_1.6fr]">
                <div className="space-y-4">
                    <Card>
                        <CardContent className="grid grid-cols-3 gap-3 p-4">
                            <Metric label="Products" value={metrics.total} />
                            <Metric label="Low Stock" value={metrics.lowStock} />
                            <Metric label="Value" value={currency(metrics.inventoryValue)} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">New Product</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <Field
                                    label="Name"
                                    value={form.data.name}
                                    onChange={(value) => form.setData('name', value)}
                                    error={form.errors.name}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="SKU" value={form.data.sku} onChange={(value) => form.setData('sku', value)} />
                                    <Field label="Unit" value={form.data.unit} onChange={(value) => form.setData('unit', value)} />
                                    <Field
                                        label="Price"
                                        type="number"
                                        value={form.data.price}
                                        onChange={(value) => form.setData('price', Number(value))}
                                    />
                                    <Field
                                        label="Cost"
                                        type="number"
                                        value={form.data.cost}
                                        onChange={(value) => form.setData('cost', Number(value))}
                                    />
                                    <Field
                                        label="Stock"
                                        type="number"
                                        value={form.data.stock_on_hand}
                                        onChange={(value) => form.setData('stock_on_hand', Number(value))}
                                    />
                                    <Field
                                        label="Reorder"
                                        type="number"
                                        value={form.data.reorder_point}
                                        onChange={(value) => form.setData('reorder_point', Number(value))}
                                    />
                                </div>
                                <Button disabled={form.processing} className="w-full">
                                    Save Product
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Catalog</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {products.data.map((product: any) => (
                            <div key={product.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                                <div>
                                    <p className="font-semibold">{product.name}</p>
                                    <p className="text-muted-foreground text-sm">
                                        {product.sku ?? 'No SKU'} - {product.category?.name ?? 'Uncategorized'}
                                    </p>
                                </div>
                                <StatusBadge status={product.stock_on_hand <= product.reorder_point ? 'pending' : 'active'} />
                                <div className="text-right text-sm">
                                    <p className="font-semibold">{currency(product.price)}</p>
                                    <p className="text-muted-foreground">Stock {product.stock_on_hand}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
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
