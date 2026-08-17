<?php

namespace App\Enums;

enum PlatformRole: string
{
    case EajSuperadmin = 'eaj_superadmin';
    case OrganizationOwner = 'organization_owner';
    case BranchManager = 'branch_manager';
    case FrontDesk = 'front_desk';
    case Cashier = 'cashier';
    case Scorekeeper = 'scorekeeper';
    case TournamentDirector = 'tournament_director';
    case Player = 'player';

    public function label(): string
    {
        return match ($this) {
            self::EajSuperadmin => 'EAJ Superadmin',
            self::OrganizationOwner => 'Organization Owner',
            self::BranchManager => 'Branch Manager',
            self::FrontDesk => 'Front Desk',
            self::Cashier => 'Cashier',
            self::Scorekeeper => 'Scorekeeper',
            self::TournamentDirector => 'Tournament Director',
            self::Player => 'Player',
        };
    }

    public function isTenantRole(): bool
    {
        return $this !== self::EajSuperadmin && $this !== self::Player;
    }

    public function canManageTenant(): bool
    {
        return in_array($this, [
            self::EajSuperadmin,
            self::OrganizationOwner,
            self::BranchManager,
        ], true);
    }
}
