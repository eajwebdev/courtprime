import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton() {
    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full max-w-xl" />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-28 rounded-lg" />
                ))}
            </div>
            <Skeleton className="h-96 rounded-lg" />
        </div>
    );
}
