<?php

namespace App\Support;

use App\Models\OpenPlaySession;
use BaconQrCode\Common\ErrorCorrectionLevel;
use BaconQrCode\Encoder\Encoder;

/**
 * QR codes, as inline SVG paths.
 *
 * Rendered on the server rather than in the browser, because the screens that
 * matter here are the courtside display and a tablet propped at the net post:
 * the code has to be on the page the moment it loads, at whatever size the
 * screen is, without a script running first.
 *
 * Only the module matrix is produced. Colour, quiet zone and size are the
 * caller's, expressed in the design tokens like everything else, so a QR on the
 * navy display and a QR on a white surface are the same code drawn twice rather
 * than two different images.
 */
class Qr
{
    /**
     * The QR for a string, as an SVG path `d` attribute over a viewBox of
     * `0 0 $modules $modules`.
     *
     * Medium error correction: a code taped to a wall at a pickleball court
     * gets scuffed, and M tolerates ~15% damage while staying small enough to
     * scan from a couple of metres.
     *
     * @return array{path: string, modules: int}
     */
    public static function path(string $text): array
    {
        /* No ECI prefix: the payload is an ASCII URL, and some phone cameras
           choke on the UTF-8 ECI header that the encoder adds by default. */
        $matrix = Encoder::encode($text, ErrorCorrectionLevel::M(), Encoder::DEFAULT_BYTE_MODE_ENCODING, null, false)
            ->getMatrix();

        $width = $matrix->getWidth();
        $height = $matrix->getHeight();
        $path = [];

        for ($y = 0; $y < $height; $y++) {
            for ($x = 0; $x < $width; $x++) {
                if ($matrix->get($x, $y) === 1) {
                    /* One square per dark module. Runs are not merged: the
                       path is a few kB either way and merging is where QR
                       renderers get subtly wrong. */
                    $path[] = "M{$x} {$y}h1v1h-1z";
                }
            }
        }

        return ['path' => implode('', $path), 'modules' => $width];
    }

    /**
     * The join link a session's QR carries.
     *
     * Absolute, because it is going to be scanned by a phone camera that has no
     * idea what host it came from.
     */
    public static function openPlayJoinUrl(string $code, ?string $key): string
    {
        return route('open-play.join.public', array_filter([
            'code' => $code,
            'key' => $key,
        ]));
    }

    /**
     * A session's scannable join code, ready for the SessionQr component.
     *
     * Both the board and the club's open play screen show this, and they have
     * to show the same thing, so neither builds it itself.
     *
     * @return array{path: string, modules: int, url: string}
     */
    public static function forOpenPlaySession(OpenPlaySession $session): array
    {
        $url = self::openPlayJoinUrl($session->session_code, $session->session_key);

        return array_merge(self::path($url), ['url' => $url]);
    }
}
