<?php

namespace App\Support;

/**
 * How much of a player's name a public screen may show.
 *
 * First name plus a last initial: "Maria Cruz" reads as "Maria C.". This is
 * what a club whiteboard has always said, and it is the same rule on the
 * booking grid and the courtside scoreboard so a player never finds their full
 * surname on one screen after seeing it shortened on another.
 *
 * A single-word name is left alone — there is no surname to protect, and
 * turning it into an initial would leave a lone letter on a wall display.
 */
final class PublicPlayerName
{
    public static function short(?string $name): ?string
    {
        [$first, $initial] = self::parts($name);

        if ($first === null) {
            return null;
        }

        return $initial === null ? $first : $first.' '.$initial;
    }

    /**
     * The two halves separately, for screens that set them at different sizes.
     *
     * @return array{0: string|null, 1: string|null} [first name, "C." or null]
     */
    public static function parts(?string $name): array
    {
        $words = preg_split('/\s+/', trim((string) $name), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        if ($words === []) {
            return [null, null];
        }

        if (count($words) === 1) {
            return [$words[0], null];
        }

        $last = (string) end($words);

        return [$words[0], mb_strtoupper(mb_substr($last, 0, 1)).'.'];
    }
}
