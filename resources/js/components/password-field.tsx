import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { useId, useState } from 'react';

type PasswordFieldProps = {
    id?: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    autoComplete?: string;
    tabIndex?: number;
    required?: boolean;
    disabled?: boolean;
    autoFocus?: boolean;
    placeholder?: string;
    /** Renders a strength meter beneath the field. */
    showStrength?: boolean;
    action?: React.ReactNode;
};

export function PasswordField({
    id,
    label,
    value,
    onChange,
    error,
    autoComplete = 'current-password',
    tabIndex,
    required,
    disabled,
    autoFocus,
    placeholder,
    showStrength = false,
    action,
}: PasswordFieldProps) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const [visible, setVisible] = useState(false);

    return (
        <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
                <Label htmlFor={fieldId}>{label}</Label>
                {action}
            </div>

            <div className="relative">
                <Input
                    id={fieldId}
                    type={visible ? 'text' : 'password'}
                    required={required}
                    autoFocus={autoFocus}
                    tabIndex={tabIndex}
                    autoComplete={autoComplete}
                    value={value}
                    disabled={disabled}
                    placeholder={placeholder}
                    onChange={(event) => onChange(event.target.value)}
                    className="pr-11"
                    aria-invalid={Boolean(error) || undefined}
                    aria-describedby={showStrength ? `${fieldId}-strength` : undefined}
                />
                <button
                    type="button"
                    onClick={() => setVisible((current) => !current)}
                    tabIndex={-1}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    aria-pressed={visible}
                    className="text-muted hover:text-foreground absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md transition-colors"
                >
                    {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
            </div>

            {showStrength && value.length > 0 && <StrengthMeter id={`${fieldId}-strength`} value={value} />}
            <InputError message={error} />
        </div>
    );
}

const LEVELS = [
    { label: 'Weak', className: 'bg-danger', text: 'text-danger' },
    { label: 'Fair', className: 'bg-warning', text: 'text-warning' },
    { label: 'Good', className: 'bg-info', text: 'text-info' },
    { label: 'Strong', className: 'bg-success', text: 'text-success' },
];

function scorePassword(value: string) {
    let score = 0;
    if (value.length >= 8) score += 1;
    if (value.length >= 12) score += 1;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
    if (/\d/.test(value) && /[^\w\s]/.test(value)) score += 1;
    return Math.min(3, Math.max(0, score - 1));
}

function StrengthMeter({ value, id }: { value: string; id: string }) {
    const score = scorePassword(value);
    const level = LEVELS[score];

    return (
        <div id={id} className="flex items-center gap-2" aria-live="polite">
            <div className="flex flex-1 gap-1">
                {LEVELS.map((_, index) => (
                    <span
                        key={index}
                        className={cn('h-1 flex-1 rounded-full transition-colors duration-200', index <= score ? level.className : 'bg-border')}
                    />
                ))}
            </div>
            {/* Strength is stated in words, never by bar colour alone. */}
            <span className={cn('text-meta w-12 text-right font-medium', level.text)}>{level.label}</span>
        </div>
    );
}
