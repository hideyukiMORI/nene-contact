<?php

declare(strict_types=1);

namespace NeneContact\Tests\ContactForm;

use InvalidArgumentException;
use NeneContact\ContactForm\Appearance;
use NeneContact\ContactForm\AutoReply;
use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\ContactFormBodyPatch;
use NeneContact\ContactForm\ContactFormBodyValidator;
use NeneContact\ContactForm\ContactFormResponse;
use NeneContact\ContactForm\FormField;
use PHPUnit\Framework\TestCase;

final class ContactFormBodyPatchTest extends TestCase
{
    /** @return array<string, mixed> */
    private static function currentBody(): array
    {
        return [
            'id' => 1,
            'name' => 'AYANE お問い合わせ',
            'description' => 'プライバシーポリシー（https://example.test/privacy）',
            'public_form_key' => 'ayane-contact',
            'default_locale' => 'ja',
            'locales' => ['ja'],
            'allowed_origins' => ['https://example.test'],
            'status' => 'active',
            'consent_required' => false,
            'consent_label' => null,
            'retention_days' => null,
            'appearance' => ['mode' => 'modal', 'colors' => ['accent' => '#dc5b34']],
            'submit_label' => ['ja' => '送信する'],
            'post_submit' => 'message',
            'success_message' => ['ja' => '送信しました。'],
            'redirect_url' => null,
            'autoreply' => ['enabled' => true, 'subject' => ['ja' => '自動返信'], 'body' => ['ja' => '資料: https://example.test/old.pdf']],
            'fields' => [
                ['field_type' => 'text', 'name' => 'name', 'label' => ['ja' => 'お名前'], 'required' => true],
                ['field_type' => 'email', 'name' => 'email', 'label' => ['ja' => 'メール'], 'required' => true],
            ],
            'created_at' => '2026-07-12 00:40:52',
            'updated_at' => '2026-07-12 00:40:52',
        ];
    }

    public function test_unpatched_keys_are_carried_over_untouched(): void
    {
        $body = ContactFormBodyPatch::apply(self::currentBody(), ['description' => 'new']);

        self::assertSame('new', $body['description']);
        // The whole point of patching: a one-key edit must not disturb the rest of the form.
        self::assertSame('AYANE お問い合わせ', $body['name']);
        self::assertSame(['ja'], $body['locales']);
        self::assertSame(['https://example.test'], $body['allowed_origins']);
        self::assertSame(['mode' => 'modal', 'colors' => ['accent' => '#dc5b34']], $body['appearance']);
        self::assertSame(['ja' => '送信する'], $body['submit_label']);
        self::assertCount(2, $body['fields']);
        self::assertSame('email', $body['fields'][1]['name']);
        self::assertTrue($body['autoreply']['enabled']);
    }

    public function test_a_patched_key_is_replaced_wholly_not_deep_merged(): void
    {
        $body = ContactFormBodyPatch::apply(self::currentBody(), [
            'autoreply' => ['enabled' => true, 'subject' => ['ja' => '自動返信'], 'body' => ['ja' => '資料: https://example.test/new.pdf']],
        ]);

        self::assertSame(['ja' => '資料: https://example.test/new.pdf'], $body['autoreply']['body']);
    }

    public function test_identity_keys_are_stripped_from_the_merged_body(): void
    {
        $body = ContactFormBodyPatch::apply(self::currentBody(), ['name' => 'renamed']);

        foreach (['id', 'public_form_key', 'organization_id', 'status', 'created_at', 'updated_at'] as $key) {
            self::assertArrayNotHasKey($key, $body);
        }
    }

    public function test_patching_an_identity_key_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage("'public_form_key' is set at create time and cannot be updated.");

        ContactFormBodyPatch::apply(self::currentBody(), ['public_form_key' => 'renamed-key']);
    }

    public function test_an_unknown_key_is_rejected_rather_than_silently_ignored(): void
    {
        // A typo that no-ops would read to the operator as a successful edit.
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage("Unknown contact-form key 'autoreplay'.");

        ContactFormBodyPatch::apply(self::currentBody(), ['autoreplay' => ['enabled' => false]]);
    }

    public function test_an_empty_patch_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('The patch is empty; nothing to update.');

        ContactFormBodyPatch::apply(self::currentBody(), []);
    }

    public function test_every_editable_key_is_accepted(): void
    {
        $current = self::currentBody();

        foreach (ContactFormBodyPatch::editableKeys() as $key) {
            $body = ContactFormBodyPatch::apply($current, [$key => $current[$key]]);
            self::assertArrayHasKey($key, $body);
        }
    }

    public function test_every_key_a_real_form_body_carries_is_classified(): void
    {
        // Guards the pairing with ContactFormResponse::toArray — the actual source of the body
        // the CLI patches. A key added there and classified in neither list would be stripped
        // from the merged body, silently resetting that setting on the live form.
        $classified = array_merge(ContactFormBodyPatch::editableKeys(), [
            'id', 'public_form_key', 'organization_id', 'status', 'created_at', 'updated_at',
        ]);

        self::assertSame([], array_diff(array_keys(ContactFormResponse::toArray(self::form())), $classified));
    }

    public function test_a_real_form_body_survives_the_patch_and_validate_round_trip(): void
    {
        // The round trip the CLI rests on: response shape → patch → validator input. Asserted on
        // a real form because a response key the validator cannot read back would drop the
        // setting on every update.
        $current = ContactFormResponse::toArray(self::form());

        $input = ContactFormBodyValidator::parse(
            ContactFormBodyPatch::apply($current, ['description' => 'patched'])
        );

        self::assertSame('patched', $input->description);
        self::assertSame('AYANE お問い合わせ', $input->name);
        self::assertSame(['ja'], $input->locales);
        self::assertSame(['https://example.test'], $input->allowedOrigins);
        self::assertSame(['ja' => '送信する'], $input->submitLabel);
        self::assertSame('#dc5b34', $input->appearance?->toArray()['colors']['accent']);
        self::assertNotNull($input->autoReply);
        self::assertTrue($input->autoReply->isEnabled());
        self::assertSame('資料: https://example.test/old.pdf', $input->autoReply->bodyFor('ja', 'ja'));
        self::assertCount(2, $input->fields);
        self::assertSame('email', $input->fields[1]->name);
    }

    private static function form(): ContactForm
    {
        [$appearance] = Appearance::parse(['mode' => 'modal', 'colors' => ['accent' => '#dc5b34']]);
        [$autoReply] = AutoReply::parse([
            'enabled' => true,
            'subject' => ['ja' => '自動返信'],
            'body' => ['ja' => '資料: https://example.test/old.pdf'],
        ]);

        return new ContactForm(
            organizationId: 1,
            name: 'AYANE お問い合わせ',
            publicFormKey: 'ayane-contact',
            defaultLocale: 'ja',
            locales: ['ja'],
            allowedOrigins: ['https://example.test'],
            fields: [
                new FormField(fieldType: 'text', name: 'name', label: ['ja' => 'お名前'], required: true, sortOrder: 0),
                new FormField(fieldType: 'email', name: 'email', label: ['ja' => 'メール'], required: true, sortOrder: 1),
            ],
            description: 'プライバシーポリシー（https://example.test/privacy）',
            appearance: $appearance,
            submitLabel: ['ja' => '送信する'],
            successMessage: ['ja' => '送信しました。'],
            autoReply: $autoReply,
            id: 1,
            createdAt: '2026-07-12 00:40:52',
            updatedAt: '2026-07-12 00:40:52',
        );
    }
}
