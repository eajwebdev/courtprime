import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';

export default function DemoConfirmation({ demoRequest }: { demoRequest: { reference: string; business_name: string; email: string } }) {
    return (
        <main className="grid min-h-screen place-items-center bg-[#07132F] px-4 text-white">
            <Head title="Demo Request Received" />
            <Card className="max-w-xl border-white/10 bg-white text-[#07132F]">
                <CardContent className="p-8 text-center">
                    <CheckCircle2 className="mx-auto size-12 text-[#E61B5B]" />
                    <h1 className="mt-5 text-3xl font-semibold">Demo request received.</h1>
                    <p className="mt-3 text-slate-600">
                        Thanks, {demoRequest.business_name}. EAJ will contact you at {demoRequest.email} to schedule the next step.
                    </p>
                    <div className="mt-6 rounded-lg bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Lead Reference</p>
                        <p className="mt-1 text-2xl font-semibold">{demoRequest.reference}</p>
                    </div>
                    <Button asChild className="mt-6 bg-[#E61B5B] text-white hover:bg-[#FF1F64]">
                        <Link href="/">Back to Website</Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
}
