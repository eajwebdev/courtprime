<?php

namespace Database\Seeders\Concerns;

use RuntimeException;

/**
 * Credentials for seeded logins.
 *
 * The seeders exist to make a working install: a platform operator, a demo
 * club, staff to sign in as. On a laptop that means a memorable password and
 * nobody minds. On a public server it means every one of those accounts has
 * the password `password`, which is the whole login.
 *
 * So production has to say what the password is. There is no default there —
 * seeding without SEED_PASSWORD set stops rather than quietly creating the
 * accounts an attacker would try first.
 */
trait UsesSeedCredentials
{
    protected function seedPassword(): string
    {
        $password = (string) env('SEED_PASSWORD', '');

        if ($password !== '') {
            return $password;
        }

        if (app()->environment('production')) {
            throw new RuntimeException(
                'Refusing to seed accounts with a default password in production. '
                .'Set SEED_PASSWORD in .env to the password these accounts should have, '
                .'or skip seeding and create the first account by hand.'
            );
        }

        return 'password';
    }

    /** The platform operator's login, so production is not stuck with a .test address. */
    protected function seedSuperadminEmail(): string
    {
        return (string) env('SEED_SUPERADMIN_EMAIL', 'superadmin@eaj.test');
    }
}
