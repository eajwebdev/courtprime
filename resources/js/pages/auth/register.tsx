import { Head, useForm } from '@inertiajs/react';
import { Check, LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { PasswordField } from '@/components/password-field';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface RegisterForm {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

const benefits = [
    'One CourtPrime ID across every connected club',
    'Your rating and match history follow you',
    'Book courts and join open play from one account',
];

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const mismatch = data.password_confirmation.length > 0 && data.password !== data.password_confirmation;

    return (
        <AuthLayout title="Create your CourtPrime ID" description="One account. Every connected court.">
            <Head title="Create account" />

            <ul className="mb-7 space-y-2">
                {benefits.map((benefit) => (
                    <li key={benefit} className="text-meta text-secondary flex items-start gap-2.5">
                        <Check className="text-success mt-0.5 size-3.5 shrink-0" />
                        {benefit}
                    </li>
                ))}
            </ul>

            <form className="flex flex-col gap-5" onSubmit={submit}>
                <div className="grid gap-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                        id="name"
                        type="text"
                        required
                        autoFocus
                        tabIndex={1}
                        autoComplete="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        disabled={processing}
                        placeholder="Juan Dela Cruz"
                        aria-invalid={Boolean(errors.name) || undefined}
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                        id="email"
                        type="email"
                        required
                        tabIndex={2}
                        autoComplete="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        disabled={processing}
                        placeholder="you@example.com"
                        aria-invalid={Boolean(errors.email) || undefined}
                    />
                    <InputError message={errors.email} />
                </div>

                <PasswordField
                    id="password"
                    label="Password"
                    value={data.password}
                    onChange={(value) => setData('password', value)}
                    error={errors.password}
                    autoComplete="new-password"
                    tabIndex={3}
                    required
                    disabled={processing}
                    placeholder="At least 8 characters"
                    showStrength
                />

                <PasswordField
                    id="password_confirmation"
                    label="Confirm password"
                    value={data.password_confirmation}
                    onChange={(value) => setData('password_confirmation', value)}
                    error={errors.password_confirmation ?? (mismatch ? 'Passwords do not match.' : undefined)}
                    autoComplete="new-password"
                    tabIndex={4}
                    required
                    disabled={processing}
                    placeholder="Re-enter your password"
                />

                <Button type="submit" size="touch" className="mt-1 w-full" tabIndex={5} disabled={processing}>
                    {processing && <LoaderCircle className="size-4 animate-spin" />}
                    Create account
                </Button>

                <p className="text-label text-secondary text-center">
                    Already have an account?{' '}
                    <TextLink href={route('login')} tabIndex={6}>
                        Sign in
                    </TextLink>
                </p>
            </form>
        </AuthLayout>
    );
}
