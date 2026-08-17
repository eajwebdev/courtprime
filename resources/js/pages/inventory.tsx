import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, Boxes, TrendingDown } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Inventory', href: '/inventory' }];

export default function Inventory({ products, movements, metrics }: { products: any[]; movements: any[]; metrics: Record<string, number> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Inventory Control</h1>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Stock levels, reorder alerts, and inventory movement history from POS and transfers.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium" href="/stock-transfers">
                            Stock Transfers
                        </Link>
                        <Link className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium" href="/products">
                            Manage Products
                        </Link>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <Metric icon={AlertTriangle} label="Low Stock" value={metrics.lowStock} />
                    <Metric icon={TrendingDown} label="Out of Stock" value={metrics.outOfStock} />
                    <Metric icon={Boxes} label="Stock Value" value={currency(metrics.stockValue)} />
                </div>
                <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Stock Health</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {products.map((product) => (
                                <div key={product.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                                    <div>
                                        <p className="font-semibold">{product.name}</p>
                                        <p className="text-muted-foreground text-sm">{product.category?.name ?? 'Uncategorized'}</p>
                                    </div>
                                    <StatusBadge status={product.stock_on_hand <= product.reorder_point ? 'pending' : 'active'} />
                                    <div className="text-right text-sm">
                                        <p className="font-semibold">
                                            {product.stock_on_hand} {product.unit}
                                        </p>
                                        <p className="text-muted-foreground">Reorder at {product.reorder_point}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Movement History</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {movements.map((movement) => (
                                <div key={movement.id} className="rounded-lg border p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold">{movement.product?.name}</p>
                                            <p className="text-muted-foreground text-sm">{movement.notes ?? movement.movement_type}</p>
                                        </div>
                                        <StatusBadge status={movement.movement_type} />
                                    </div>
                                    <p className="mt-3 text-sm">
                                        Quantity {movement.quantity} - Stock after {movement.stock_after}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
    return (
        <Card>
            <CardContent className="p-4">
                <Icon className="size-5 text-pink-600" />
                <p className="text-muted-foreground mt-3 text-sm">{label}</p>
                <p className="text-2xl font-semibold">{value}</p>
            </CardContent>
        </Card>
    );
}
