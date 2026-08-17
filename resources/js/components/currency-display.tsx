import { currency } from '@/lib/format';

type CurrencyDisplayProps = {
    value: number | string | null | undefined;
    code?: string;
};

export function CurrencyDisplay({ value, code = 'PHP' }: CurrencyDisplayProps) {
    return <>{currency(value, code)}</>;
}
