<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

use InvalidArgumentException;

/**
 * Merges a partial contact-form body over the form's current body, producing the full body
 * {@see ContactFormBodyValidator} expects. Used by the update CLI (`tools/update-contact-form.php`)
 * for server-side edits where the admin API is out of reach.
 *
 * {@see UpdateContactFormUseCase} replaces every editable field, so a hand-written partial body
 * applied straight to it would erase whatever it omits — `fields` and `appearance` above all.
 * Patching over the current body removes that failure mode: an operator states only what changes.
 *
 * The merge is **shallow by design**: a supplied top-level key replaces that key wholly. Deep
 * merging would make removing one entry from `fields` or one locale from `autoreply.body`
 * impossible to express, and "did my nested key merge or replace?" is exactly the ambiguity an
 * operator editing a live form cannot afford.
 *
 * Unknown and identity keys are rejected rather than ignored: a typo (`autoreplay`) that silently
 * did nothing would read as a successful edit, and identity (`public_form_key` and friends) is
 * preserved by the use case, so accepting it would be a lie about what the tool did.
 */
final readonly class ContactFormBodyPatch
{
    /**
     * Keys a patch may set — exactly the editable body keys {@see ContactFormBodyValidator} reads.
     *
     * @var list<string>
     */
    private const EDITABLE_KEYS = [
        'name',
        'description',
        'default_locale',
        'locales',
        'allowed_origins',
        'consent_required',
        'consent_label',
        'retention_days',
        'appearance',
        'submit_label',
        'post_submit',
        'success_message',
        'redirect_url',
        'autoreply',
        'fields',
    ];

    /**
     * Identity and server-owned keys: present in the current body, never patchable.
     * `public_form_key` is immutable after create (terminology §2) so live embeds keep working.
     *
     * @var list<string>
     */
    private const IDENTITY_KEYS = [
        'id',
        'public_form_key',
        'organization_id',
        'status',
        'created_at',
        'updated_at',
    ];

    /**
     * @param array<string, mixed> $current the form's present body ({@see ContactFormResponse::toArray})
     * @param array<string, mixed> $patch   the operator's partial body
     *
     * @return array<string, mixed> the full body to validate and apply
     *
     * @throws InvalidArgumentException when the patch is empty or names a key it may not set
     */
    public static function apply(array $current, array $patch): array
    {
        if ($patch === []) {
            throw new InvalidArgumentException('The patch is empty; nothing to update.');
        }

        foreach (array_keys($patch) as $key) {
            if (in_array($key, self::IDENTITY_KEYS, true)) {
                throw new InvalidArgumentException("'{$key}' is set at create time and cannot be updated.");
            }

            if (!in_array($key, self::EDITABLE_KEYS, true)) {
                throw new InvalidArgumentException("Unknown contact-form key '{$key}'.");
            }
        }

        $merged = array_replace($current, $patch);

        foreach (self::IDENTITY_KEYS as $key) {
            unset($merged[$key]);
        }

        return $merged;
    }

    /**
     * The keys a patch may set, for CLI usage output.
     *
     * @return list<string>
     */
    public static function editableKeys(): array
    {
        return self::EDITABLE_KEYS;
    }
}
