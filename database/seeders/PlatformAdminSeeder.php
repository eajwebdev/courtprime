<?php

namespace Database\Seeders;

use App\Models\User;
use Database\Seeders\Concerns\UsesSeedCredentials;
use Illuminate\Database\Seeder;

/**
 * The EAJ platform operator. This login sits above every club partner: it has
 * no organization_id of its own and picks a workspace through the switcher, so
 * it must exist before any partner is seeded and granted access.
 */
class PlatformAdminSeeder extends Seeder
{
    use UsesSeedCredentials;

    public function run(): void
    {
        $this->superadmin();
    }

    public function superadmin(): User
    {
        return User::query()->updateOrCreate(
            ['email' => $this->seedSuperadminEmail()],
            [
                'organization_id' => null,
                'branch_id' => null,
                'name' => 'CP ADMIN',
                'password' => $this->seedPassword(),
                'role_key' => 'eaj_superadmin',
                'is_superadmin' => true,
                'position' => 'Platform Administrator',
                'email_verified_at' => now(),
            ],
        );
    }
}
