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

    public function test_custom_public_form_key_is_lowercased_and_format_validated(): void
    {
        $ok = ContactFormBodyValidator::parse([
            ...$this->body([['field_type' => 'text', 'name' => 'name', 'label' => ['ja' => 'お名前'], 'required' => true]]),
            'public_form_key' => 'My-Form-2',
        ]);
        self::assertSame('my-form-2', $ok->publicFormKey);

        $this->expectException(ValidationException::class);
        ContactFormBodyValidator::parse([
            ...$this->body([['field_type' => 'text', 'name' => 'name', 'label' => ['ja' => 'お名前'], 'required' => true]]),
            'public_form_key' => '-bad-',
        ]);
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

    public function test_choice_field_config_is_normalized_and_persisted(): void
    {
        $input = ContactFormBodyValidator::parse($this->body([
            [
                'field_type' => 'select',
                'name' => 'topic',
                'label' => ['ja' => '種別'],
                'required' => true,
                'options' => [
                    ['value' => 'a', 'label' => ['ja' => 'A'], 'description' => ['ja' => '補足'], 'image' => true],
                    ['value' => 'b', 'label' => ['ja' => 'B']],
                ],
                'config' => [
                    'style' => 'radio',
                    // 'ghost' is not an option value and must be dropped from defaults.
                    'defaults' => ['a', 'ghost'],
                    'other' => true,
                    'other_config' => ['label' => 'その他', 'placeholder' => '自由に', 'required' => true, 'max_len' => 50],
                    'count_rule' => ['min_on' => true, 'min' => 2, 'max_on' => false, 'max' => 3],
                    'image' => ['enabled' => true, 'layout' => 'list', 'cols' => 3, 'ratio' => '16:9'],
                ],
            ],
        ]));

        $field = $input->fields[0];
        self::assertNotNull($field->config);
        self::assertSame('radio', $field->config['style']);
        // defaults filtered to real option values; single-logic style keeps at most one.
        self::assertSame(['a'], $field->config['defaults']);
        self::assertTrue($field->config['image']['enabled']);
        // per-option description/image flow through options_json.
        self::assertNotNull($field->options);
        self::assertSame(['ja' => '補足'], $field->options[0]['description']);
        self::assertTrue($field->options[0]['image']);
    }

    public function test_choice_field_clears_count_rule_for_single_logic(): void
    {
        $input = ContactFormBodyValidator::parse($this->body([
            [
                'field_type' => 'select',
                'name' => 'topic',
                'label' => ['ja' => '種別'],
                'options' => [['value' => 'a', 'label' => ['ja' => 'A']]],
                // count_rule is only meaningful for multiple-logic styles; radio is single.
                'config' => ['style' => 'radio', 'count_rule' => ['min_on' => true, 'min' => 2, 'max_on' => true, 'max' => 4]],
            ],
        ]));

        $config = $input->fields[0]->config;
        self::assertNotNull($config);
        self::assertFalse($config['count_rule']['min_on']);
        self::assertFalse($config['count_rule']['max_on']);
    }

    public function test_unsupported_choice_style_is_rejected(): void
    {
        $this->expectException(ValidationException::class);
        ContactFormBodyValidator::parse($this->body([
            [
                'field_type' => 'select',
                'name' => 'topic',
                'label' => ['ja' => '種別'],
                'options' => [['value' => 'a', 'label' => ['ja' => 'A']]],
                'config' => ['style' => 'carousel'],
            ],
        ]));
    }

    public function test_phone_field_type_is_accepted_with_format_config(): void
    {
        $input = ContactFormBodyValidator::parse($this->body([
            [
                'field_type' => 'phone',
                'name' => 'tel',
                'label' => ['ja' => '電話番号'],
                'description' => '日中つながる番号',
                'config' => ['format' => 'intl'],
            ],
        ]));

        $field = $input->fields[0];
        self::assertSame('phone', $field->fieldType);
        self::assertSame('日中つながる番号', $field->description);
        self::assertNotNull($field->config);
        self::assertSame('intl', $field->config['format']);
    }

    public function test_text_field_config_is_normalized_and_clamped(): void
    {
        $input = ContactFormBodyValidator::parse($this->body([
            [
                'field_type' => 'text',
                'name' => 'name',
                'label' => ['ja' => 'お名前'],
                // 'shouty' is not an allowed format and falls back to 'none'; max is clamped.
                'config' => ['format' => 'shouty', 'max_on' => true, 'max' => 999999, 'counter' => true],
            ],
        ]));

        $config = $input->fields[0]->config;
        self::assertNotNull($config);
        self::assertSame('none', $config['format']);
        self::assertSame(9999, $config['max']);
        self::assertTrue($config['counter']);
    }

    public function test_file_field_config_drops_max_count_when_single(): void
    {
        $input = ContactFormBodyValidator::parse($this->body([
            [
                'field_type' => 'file',
                'name' => 'attach',
                'label' => ['ja' => '添付'],
                'config' => ['fmt_image' => true, 'max_size' => 25, 'multiple' => false, 'max_count' => 9],
            ],
        ]));

        $config = $input->fields[0]->config;
        self::assertNotNull($config);
        self::assertSame(25, $config['max_size']);
        self::assertSame(1, $config['max_count']);
    }

    public function test_checkbox_field_has_no_config(): void
    {
        $input = ContactFormBodyValidator::parse($this->body([
            ['field_type' => 'checkbox', 'name' => 'agree', 'label' => ['ja' => '同意'], 'config' => ['x' => 1]],
        ]));

        self::assertNull($input->fields[0]->config);
    }

    public function test_submit_experience_defaults_when_omitted(): void
    {
        $input = ContactFormBodyValidator::parse($this->body([
            ['field_type' => 'text', 'name' => 'name', 'label' => ['ja' => 'お名前'], 'required' => true],
        ]));

        self::assertNull($input->submitLabel);
        self::assertSame('message', $input->postSubmit);
        self::assertNull($input->successMessage);
        self::assertNull($input->redirectUrl);
    }

    public function test_submit_label_and_success_message_are_locale_maps(): void
    {
        $input = ContactFormBodyValidator::parse([
            ...$this->body([['field_type' => 'text', 'name' => 'name', 'label' => ['ja' => 'お名前'], 'required' => true]]),
            'submit_label' => ['ja' => ' 送信する ', 'en' => ''],
            'success_message' => ['ja' => 'ありがとうございました'],
        ]);

        // Blank locale entries are dropped, surviving entries trimmed.
        self::assertSame(['ja' => '送信する'], $input->submitLabel);
        self::assertSame(['ja' => 'ありがとうございました'], $input->successMessage);
    }

    public function test_unsupported_submit_label_locale_is_rejected(): void
    {
        $this->expectException(ValidationException::class);
        ContactFormBodyValidator::parse([
            ...$this->body([['field_type' => 'text', 'name' => 'name', 'label' => ['ja' => 'お名前'], 'required' => true]]),
            'submit_label' => ['fr' => 'Envoyer'],
        ]);
    }

    public function test_redirect_post_submit_requires_a_valid_http_url(): void
    {
        $input = ContactFormBodyValidator::parse([
            ...$this->body([['field_type' => 'text', 'name' => 'name', 'label' => ['ja' => 'お名前'], 'required' => true]]),
            'post_submit' => 'redirect',
            'redirect_url' => '  https://example.com/thanks  ',
        ]);

        self::assertSame('redirect', $input->postSubmit);
        self::assertSame('https://example.com/thanks', $input->redirectUrl);
    }

    public function test_redirect_without_url_is_rejected(): void
    {
        $this->expectException(ValidationException::class);
        ContactFormBodyValidator::parse([
            ...$this->body([['field_type' => 'text', 'name' => 'name', 'label' => ['ja' => 'お名前'], 'required' => true]]),
            'post_submit' => 'redirect',
        ]);
    }

    public function test_non_http_redirect_url_is_rejected(): void
    {
        $this->expectException(ValidationException::class);
        ContactFormBodyValidator::parse([
            ...$this->body([['field_type' => 'text', 'name' => 'name', 'label' => ['ja' => 'お名前'], 'required' => true]]),
            'post_submit' => 'redirect',
            'redirect_url' => 'javascript:alert(1)',
        ]);
    }
}
