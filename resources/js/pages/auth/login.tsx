import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { PasswordField } from '@/components/password-field';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Welcome back" description="Sign in to your CourtPrime account.">
            <Head title="Sign in" />

            {status && (
                <p role="status" className="border-success/25 bg-success-soft text-label text-success mb-6 rounded-lg border px-3 py-2 font-medium">
                    {status}
                </p>
            )}

            <form className="flex flex-col gap-5" onSubmit={submit}>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                        id="email"
                        type="email"
                        required
                        autoFocus
                        tabIndex={1}
                        autoComplete="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="you@club.com"
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
                    autoComplete="current-password"
                    tabIndex={2}
                    required
                    placeholder="Your password"
                    action={
                        canResetPassword ? (
                            <TextLink href={route('password.request')} className="text-meta" tabIndex={5}>
                                Forgot password?
                            </TextLink>
                        ) : undefined
                    }
                />

                <div className="flex items-center gap-3">
                    <Checkbox
                        id="remember"
                        name="remember"
                        tabIndex={3}
                        checked={data.remember}
                        onCheckedChange={(checked) => setData('remember', checked === true)}
                    />
                    <Label htmlFor="remember" className="text-secondary font-normal">
                        Keep me signed in
                    </Label>
                </div>

                <Button type="submit" size="touch" className="mt-1 w-full" tabIndex={4} disabled={processing}>
                    {processing && <LoaderCircle className="size-4 animate-spin" />}
                    Sign in
                </Button>

                <p className="text-label text-secondary text-center">
                    New to CourtPrime?{' '}
                    <TextLink href={route('register')} tabIndex={5}>
                        Create a player account
                    </TextLink>
                </p>

                <p className="border-border text-meta text-muted border-t pt-5 text-center">
                    Running a club?{' '}
                    <TextLink href="/request-demo" className="text-meta">
                        Book a demo
                    </TextLink>
                </p>
            </form>
        </AuthLayout>
    );
}
