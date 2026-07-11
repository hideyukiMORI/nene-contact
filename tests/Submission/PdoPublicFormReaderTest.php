<?php

declare(strict_types=1);

namespace NeneContact\Tests\Submission;

use Nene2\Database\DatabaseQueryExecutorInterface;
use NeneContact\ContactForm\FieldType;
use NeneContact\Submission\PdoPublicFormReader;
use PHPUnit\Framework\TestCase;

final class PdoPublicFormReaderTest extends TestCase
{
    /**
     * Regression (#364): the public submit path resolves the form through this reader, so it must
     * carry the auto-reply config — otherwise SenderAutoReply (#360) silently no-ops on a real
     * public submit even though the admin repository loads it fine.
     */
    public function test_loads_autoreply_config_for_the_submit_path(): void
    {
        $query = new class () implements DatabaseQueryExecutorInterface {
            public function execute(string $sql, array $parameters = []): int
            {
                return 0;
            }

            public function insert(string $sql, array $parameters = []): int
            {
                return 0;
            }

            public function lastInsertId(): int
            {
                return 0;
            }

            /** @return array<string, mixed>|null */
            public function fetchOne(string $sql, array $parameters = []): ?array
            {
                if (($parameters[0] ?? null) !== 'k') {
                    return null;
                }

                return [
                    'id' => 3,
                    'organization_id' => 7,
                    'name' => 'Contact',
                    'description' => null,
                    'public_form_key' => 'k',
                    'default_locale' => 'ja',
                    'locales_json' => '["ja"]',
                    'allowed_origins_json' => '[]',
                    'status' => 'active',
                    'consent_required' => 0,
                    'consent_label_json' => null,
                    'appearance_json' => null,
                    'autoreply_json' => '{"enabled":true,"subject":{"ja":"件名"},"body":{"ja":"本文"}}',
                    'submit_label_json' => null,
                    'post_submit' => 'message',
                    'success_message_json' => null,
                    'redirect_url' => null,
                    'created_at' => '2026-07-12 00:00:00',
                    'updated_at' => '2026-07-12 00:00:00',
                ];
            }

            /** @return list<array<string, mixed>> */
            public function fetchAll(string $sql, array $parameters = []): array
            {
                return [[
                    'id' => 1,
                    'contact_form_id' => 3,
                    'field_type' => FieldType::Email->value,
                    'name' => 'email',
                    'placeholder' => null,
                    'description' => null,
                    'label_json' => '{"ja":"メール"}',
                    'required' => 1,
                    'options_json' => null,
                    'config_json' => null,
                    'sort_order' => 0,
                ]];
            }
        };

        $form = (new PdoPublicFormReader($query))->findByPublicFormKey('k');

        self::assertNotNull($form);
        self::assertNotNull($form->autoReply);
        self::assertTrue($form->autoReply->isDeliverable('ja'));
        self::assertSame('件名', $form->autoReply->subjectFor('ja', 'ja'));
        self::assertSame('本文', $form->autoReply->bodyFor('ja', 'ja'));
    }
}
