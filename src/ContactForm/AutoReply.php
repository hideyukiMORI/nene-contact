<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

use Nene2\Validation\ValidationError;

/**
 * Per-form sender auto-reply configuration (#360). When enabled, a successful public submit
 * sends one acknowledgement email to the address the visitor entered in the form's `email`
 * field (see {@see \NeneContact\Notification\SenderAutoReply}).
 *
 * The subject and body are **operator-authored, per-locale** copy (ADR 0011, ja/en), never
 * interpolated with submission values — the reply is a fixed template so a hostile submission
 * cannot be reflected back into mail to a spoofed address (backscatter mitigation). Carries no
 * PII/secrets, so it travels in the admin form response and the form's audit snapshot; it is
 * **not** exposed in the public schema.
 */
final readonly class AutoReply
{
    /** @var list<string> */
    private const SUPPORTED_LOCALES = ['ja', 'en'];
    private const SUBJECT_MAX = 200;
    private const BODY_MAX = 5000;

    /**
     * @param array<string, string> $subject per-locale subject line (ja/en)
     * @param array<string, string> $body    per-locale plain-text body (ja/en); links are plain URLs
     */
    private function __construct(
        public bool $enabled,
        public array $subject,
        public array $body,
    ) {
    }

    public static function disabled(): self
    {
        return new self(false, [], []);
    }

    /**
     * Validate + normalize a request payload. Non-array input yields the disabled default;
     * subject/body are bounded per-locale maps restricted to {ja, en}. The "enabled requires
     * content for the default locale" rule needs the form's default locale and is enforced by
     * {@see ContactFormBodyValidator}, which has it.
     *
     * @return array{0: self, 1: list<ValidationError>}
     */
    public static function parse(mixed $raw, string $prefix = 'autoreply'): array
    {
        if (!is_array($raw)) {
            return [self::disabled(), []];
        }

        $errors = [];
        $enabled = (bool) ($raw['enabled'] ?? false);
        $subject = self::localeMap($raw['subject'] ?? null, self::SUBJECT_MAX);
        $body = self::localeMap($raw['body'] ?? null, self::BODY_MAX);

        foreach (['subject' => $subject, 'body' => $body] as $key => $map) {
            if ($map !== [] && array_diff(array_keys($map), self::SUPPORTED_LOCALES) !== []) {
                $errors[] = new ValidationError("{$prefix}.{$key}", 'Auto-reply ' . $key . ' locales must be a subset of {ja, en}.', 'invalid');
            }
        }

        return [new self($enabled, $subject, $body), $errors];
    }

    /**
     * Rebuild from a stored/decoded JSON map (trusted, defensively re-normalized). null (legacy
     * rows / no autoreply) yields the disabled default.
     *
     * @param array<string, mixed>|null $raw
     */
    public static function fromStored(?array $raw): self
    {
        [$autoReply] = self::parse($raw ?? []);

        return $autoReply;
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'enabled' => $this->enabled,
            'subject' => $this->subject,
            'body' => $this->body,
        ];
    }

    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    /**
     * True when a send is actually possible: enabled and the default locale has both a subject
     * and a body. A form flagged enabled but missing copy is a no-op, never an error.
     */
    public function isDeliverable(string $defaultLocale): bool
    {
        return $this->enabled
            && $this->subjectFor($defaultLocale, $defaultLocale) !== ''
            && $this->bodyFor($defaultLocale, $defaultLocale) !== '';
    }

    public function subjectFor(string $locale, string $defaultLocale): string
    {
        return $this->localeValue($this->subject, $locale, $defaultLocale);
    }

    public function bodyFor(string $locale, string $defaultLocale): string
    {
        return $this->localeValue($this->body, $locale, $defaultLocale);
    }

    /** @param array<string, string> $map */
    private function localeValue(array $map, string $locale, string $defaultLocale): string
    {
        return $map[$locale] ?? $map[$defaultLocale] ?? '';
    }

    /**
     * Normalize a per-locale text map (ja/en); blank values dropped, each capped.
     *
     * @return array<string, string>
     */
    private static function localeMap(mixed $value, int $max): array
    {
        if (!is_array($value)) {
            return [];
        }

        $out = [];
        foreach ($value as $locale => $text) {
            if (is_string($locale) && is_string($text) && trim($text) !== '') {
                $out[$locale] = mb_substr(trim($text), 0, $max);
            }
        }

        return $out;
    }
}
