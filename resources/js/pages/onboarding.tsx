import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, Circle, Rocket, Settings2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Onboarding', href: '/onboarding' }];

type Step = {
    key: string;
    title: string;
    description: string;
    href: string;
    completed: boolean;
    auto_ready: boolean;
};

export default function Onboarding({
    organization,
    steps,
    progress,
    usage,
}: {
    organization: any;
    steps: Step[];
    progress: number;
    usage: Record<string, number>;
}) {
    const toggleStep = (step: Step) => {
        router.post('/onboarding', { step: step.key, completed: !step.completed }, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Onboarding" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
                    <div>
                        <p className="text-sm font-semibold text-pink-600">CourtPrime Tenant Launch</p>
                        <h1 className="mt-2 text-2xl font-semibold">{organization.name} Onboarding</h1>
                        <p className="text-muted-foreground mt-2 text-sm">Track setup from organization details through go-live readiness.</p>
                    </div>
                    <StatusBadge status={progress === 100 ? 'ready' : 'in_progress'} />
                </div>

                <Card className="overflow-hidden">
                    <div className="bg-slate-950 p-5 text-white">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-white/60">Setup Progress</p>
                                <p className="mt-1 text-4xl font-semibold">{progress}%</p>
                            </div>
                            <img src="/cp.png" alt="CourtPrime" className="size-16 rounded-2xl bg-white/10 object-contain p-2" />
                        </div>
                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-pink-600 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                    <CardContent className="grid gap-3 p-4 md:grid-cols-5">
                        <Metric label="Branches" value={usage.branches} />
                        <Metric label="Courts" value={usage.courts} />
                        <Metric label="Staff" value={usage.staff} />
                        <Metric label="Plans" value={usage.membership_plans} />
                        <Metric label="Products" value={usage.products} />
                    </CardContent>
                </Card>

                <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Rocket className="size-4 text-pink-600" />
                                Launch Checklist
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {steps.map((step, index) => (
                                <div key={step.key} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
                                    <button type="button" className="text-left" onClick={() => toggleStep(step)} aria-label={`Toggle ${step.title}`}>
                                        {step.completed ? (
                                            <CheckCircle2 className="size-6 text-emerald-600" />
                                        ) : (
                                            <Circle className="text-muted-foreground size-6" />
                                        )}
                                    </button>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-muted-foreground text-xs font-semibold">{String(index + 1).padStart(2, '0')}</span>
                                            <p className="font-semibold">{step.title}</p>
                                            {step.auto_ready && !step.completed && <StatusBadge status="ready" />}
                                        </div>
                                        <p className="text-muted-foreground mt-1 text-sm">{step.description}</p>
                                    </div>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={step.href}>
                                            <Settings2 className="mr-2 size-4" />
                                            Open
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Go-Live Rules</CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground space-y-3 text-sm">
                                <p>Complete each setup item after reviewing the linked workspace area.</p>
                                <p>
                                    Auto-ready badges appear when CourtPrime detects supporting data, such as at least one branch, court, staff role,
                                    membership plan, or product.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Launch Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-2">
                                <Button asChild variant="outline">
                                    <Link href="/branches">Set Branches</Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href="/courts">Set Courts</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/dashboard">Open Dashboard</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
        </div>
    );
}
