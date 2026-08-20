<?php

namespace Database\Seeders\Concerns;

use Illuminate\Support\Str;

/**
 * Credentials for seeded logins.
 *
 * The seeders exist to make a working install: a platform operator, a demo
 * club, staff to sign in as. On a laptop that means a memorable password and
 * nobody minds. On a public server it means every one of those accounts has
 * the password `password`, which is the whole login.
 *
 * So production never gets that default. SEED_PASSWORD is still the way to say
 * what the password should be; when it is missing the seed does not stop, it
 * mints a strong random one and prints it once, where it is created. The
 * install completes either way, and the accounts an attacker would try first
 * are never created.
 *
 * The generated password is resolved once per process and shared by every
 * seeder, so the operator and the club staff all land on the same one.
 */
trait UsesSeedCredentials
{
    /** Container key for the password, so seeders in one run agree on it. */
    private const PASSWORD_KEY = 'courtprime.seed.password';

    /** Container key for the announcement, so it is printed once, not per seeder. */
    private const ANNOUNCED_KEY = 'courtprime.seed.password_announced';

    protected function seedPassword(): string
    {
        if (app()->bound(self::PASSWORD_KEY)) {
            return app(self::PASSWORD_KEY);
        }

        $password = trim((string) env('SEED_PASSWORD', ''));

        if ($password === '') {
            $password = app()->environment('production')
                ? Str::password(20, symbols: false)
                : 'password';

            $this->announceGeneratedPassword($password);
        }

        app()->instance(self::PASSWORD_KEY, $password);

        return $password;
    }

    /** The platform operator's login, so production is not stuck with a .test address. */
    protected function seedSuperadminEmail(): string
    {
        return (string) env('SEED_SUPERADMIN_EMAIL', 'superadmin@eaj.test');
    }

    /**
     * A password nobody chose is a password nobody knows. Say it loudly, once,
     * and say why it happened — on a deployed server the usual cause is not a
     * forgotten .env line but a cached config, which stops .env being read at
     * all.
     */
    private function announceGeneratedPassword(string $password): void
    {
        if (! app()->environment('production') || app()->bound(self::ANNOUNCED_KEY)) {
            return;
        }

        app()->instance(self::ANNOUNCED_KEY, true);

        if (! isset($this->command)) {
            return;
        }

        $this->command->getOutput()->writeln([
            '',
            '  <bg=yellow;fg=black> SEED_PASSWORD was not set </>',
            '',
            '  Every account this seed creates was given the password below.',
            '  It is shown once. Copy it now, sign in, and change it.',
            '',
            '      Superadmin  <options=bold>'.$this->seedSuperadminEmail().'</>',
            '      Password    <options=bold>'.$password.'</>',
            '',
            '  <fg=gray>If you did set SEED_PASSWORD in .env, the config cache is hiding it.</>',
            '  <fg=gray>Run `php artisan config:clear`, then seed again.</>',
            '',
        ]);
    }
}
