import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Printer } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'POS', href: '/pos' },
    { title: 'Receipt', href: '#' },
];

export default function PosReceipt({ transaction, payment, branding }: { transaction: any; payment: any; branding: any }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${transaction.reference} Receipt`} />
            <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
                <div className="flex items-center justify-between gap-3 print:hidden">
                    <Button asChild variant="outline">
                        <Link href="/pos">Back to POS</Link>
                    </Button>
                    <Button type="button" onClick={() => window.print()}>
                        <Printer className="size-4" />
                        Print
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-6">
                        <div className="border-b pb-5 text-center">
                            <img src={branding.logo_url || '/cp2.png'} alt="EAJ CourtPrime" className="mx-auto h-12 w-auto object-contain" />
                            <p className="text-muted-foreground mt-3 text-sm">{transaction.branch?.name}</p>
                            <p className="text-muted-foreground text-sm">Official POS Receipt</p>
                            {!branding.allow_white_label && <p className="text-muted-foreground mt-1 text-xs">Powered by EAJ CourtPrime</p>}
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                            <Info label="Receipt" value={transaction.reference} />
                            <Info label="Payment" value={payment?.reference ?? '-'} />
                            <Info label="Method" value={transaction.payment_method} />
                            <Info label="Status" value={transaction.status} />
                        </div>

                        <div className="mt-6 space-y-3">
                            {transaction.items.map((item: any) => (
                                <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 border-b pb-3 text-sm">
                                    <div>
                                        <p className="font-medium">{item.description}</p>
                                        <p className="text-muted-foreground">
                                            {item.quantity} x {currency(item.unit_price)}
                                        </p>
                                    </div>
                                    <strong>{currency(item.line_total)}</strong>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 space-y-2 text-sm">
                            <Row label="Subtotal" value={currency(transaction.subtotal)} />
                            <Row label="Discount" value={currency(transaction.discount_amount)} />
                            <Row label="Tax" value={currency(transaction.tax_amount)} />
                            <Row label="Total" value={currency(transaction.total_amount)} strong />
                            <Row label="Tendered" value={currency(transaction.amount_tendered)} />
                            <Row label="Change" value={currency(transaction.change_due)} />
                        </div>

                        <p className="text-muted-foreground mt-8 text-center text-xs">{branding.receipt_footer}</p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
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

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className={`flex justify-between ${strong ? 'border-t pt-3 text-base font-semibold' : ''}`}>
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}
