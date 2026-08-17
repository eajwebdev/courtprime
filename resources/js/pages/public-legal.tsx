import { BrandWordmark } from '@/components/marketing-artwork';
import { Head, Link } from '@inertiajs/react';

type LegalSection = {
    title: string;
    body: string;
};

export default function PublicLegal({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) {
    return (
        <>
            <Head title={`${title} | EAJ CourtPrime`} />
            <main className="min-h-screen bg-slate-50 text-slate-950">
                <header className="border-b bg-[#07132F] px-4 py-4">
                    <div className="mx-auto flex max-w-5xl items-center justify-between">
                        <Link href="/">
                            <BrandWordmark variant="onDark" height={10 * 4} className="h-10" priority />
                        </Link>
                        <Link href="/request-demo" className="text-sm font-semibold text-white/80 hover:text-white">
                            Request Demo
                        </Link>
                    </div>
                </header>
                <section className="mx-auto max-w-5xl px-4 py-12">
                    <p className="text-sm font-semibold text-pink-600 uppercase">EAJ CourtPrime</p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-normal">{title}</h1>
                    <p className="mt-2 text-sm text-slate-500">Last updated {updated}</p>
                    <div className="mt-8 space-y-4">
                        {sections.map((section) => (
                            <article key={section.title} className="rounded-lg border bg-white p-5">
                                <h2 className="text-lg font-semibold">{section.title}</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p>
                            </article>
                        ))}
                    </div>
                </section>
            </main>
        </>
    );
}
