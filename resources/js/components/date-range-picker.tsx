import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type FormEvent, useState } from 'react';

type DateRangePickerProps = {
    start: string;
    end: string;
    onApply: (range: { start: string; end: string }) => void;
};

export function DateRangePicker({ start, end, onApply }: DateRangePickerProps) {
    const [range, setRange] = useState({ start, end });

    const apply = (event: FormEvent) => {
        event.preventDefault();
        onApply(range);
    };

    return (
        <form onSubmit={apply} className="flex flex-wrap items-end gap-2">
            <DateField label="Start" value={range.start} onChange={(value) => setRange((current) => ({ ...current, start: value }))} />
            <DateField label="End" value={range.end} onChange={(value) => setRange((current) => ({ ...current, end: value }))} />
            <Button type="submit" variant="outline">
                Apply
            </Button>
        </form>
    );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Input type="date" value={value} onChange={(event) => onChange(event.target.value)} />
        </div>
    );
}
