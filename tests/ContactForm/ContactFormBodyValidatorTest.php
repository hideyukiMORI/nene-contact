<?php

declare(strict_types=1);

namespace NeneContact\Tests\ContactForm;

use Nene2\Validation\ValidationException;
use NeneContact\ContactForm\ContactFormBodyValidator;
use PHPUnit\Framework\TestCase;

final class ContactFormBodyValidatorTest extends TestCase
{
    /**
     * @param list<array<string, mixed>> $fields
     * @return array<string, mixed>
     */
    private function body(array $fields): array
    {
        return [
            'name' => 'Contact us',
            'default_locale' => 'ja',
            'locales' => ['ja'],
            'allowed_origins' => [],
            'fields' => $fields,
        ];
    }

    public function test_honeypot_field_is_exempt_from_the_label_requirement(): void
    {
        $input = ContactFormBodyValidator::parse($this->body([
            ['field_type' => 'text', 'name' => 'name', 'label' => ['ja' => 'お名前'], 'required' => true],
            ['field_type' => 'honeypot', 'name' => 'hp_url', 'label' => ['ja' => '', 'en' => ''], 'required' => false],
        ]));

        self::assertCount(2, $input->fields);
        self::assertSame('honeypot', $input->fields[1]->fieldType);
        self::assertSame('hp_url', $input->fields[1]->name);
    }

    public function test_description_is_parsed_and_blank_collapses_to_null(): void
    {
        $withDesc = ContactFormBodyValidator::parse([
            ...$this->body([['field_type' => 'text', 'name' => 'name', 'label' => ['ja' => 'お名前'], 'required' => true]]),
            'description' => '  ご質問はこちらから。  ',
        ]);
        self::assertSame('ご質問はこちらから。', $withDesc->description);

        $blank = ContactFormBodyValidator::parse([
            ...$this->body([['field_type' => 'text', 'name' => 'name', 'label' => ['ja' => 'お名前'], 'required' => true]]),
            'description' => '   ',
        ]);
        self::assertNull($blank->description);
    }

    public function test_field_placeholder_is_parsed_and_blank_collapses_to_null(): void
    {
        $input = ContactFormBodyValidator::parse($this->body([
            ['field_type' => 'text', 'name' => 'name', 'label' => ['ja' => 'お名前'], 'required' => true, 'placeholder' => ' 例：山田 太郎 '],
            ['field_type' => 'email', 'name' => 'email', 'label' => ['ja' => 'メール'], 'required' => false, 'placeholder' => '   '],
        ]));

        self::assertSame('例：山田 太郎', $input->fields[0]->placeholder);
        self::assertNull($input->fields[1]->placeholder);
    }

    public function test_non_honeypot_field_still_requires_a_default_locale_label(): void
    {
        $this->expectException(ValidationException::class);
        ContactFormBodyValidator::parse($this->body([
            ['field_type' => 'text', 'name' => 'name', 'label' => ['ja' => ''], 'required' => true],
        ]));
    }

    public function test_prohibited_field_type_is_rejected(): void
    {
        $this->expectException(ValidationException::class);
        ContactFormBodyValidator::parse($this->body([
            ['field_type' => 'mynumber', 'name' => 'mn', 'label' => ['ja' => 'マイナンバー'], 'required' => true],
        ]));
    }
}
