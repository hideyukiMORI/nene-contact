<?php

declare(strict_types=1);

namespace NeneContact\Tests\Tag;

use Nene2\Validation\ValidationException;
use NeneContact\Tag\TagColor;
use NeneContact\Tag\TagField;
use PHPUnit\Framework\TestCase;

final class TagFieldTest extends TestCase
{
    public function test_create_defaults_color_to_slate(): void
    {
        $input = TagField::parseCreate(['label' => ' 見積 ']);
        self::assertSame('見積', $input->label);
        self::assertSame(TagColor::DEFAULT->value, $input->color);
    }

    public function test_create_requires_label(): void
    {
        $this->expectException(ValidationException::class);
        TagField::parseCreate(['label' => '  ']);
    }

    public function test_create_rejects_unknown_color(): void
    {
        $this->expectException(ValidationException::class);
        TagField::parseCreate(['label' => 'x', 'color' => 'chartreuse']);
    }

    public function test_create_rejects_overlong_label(): void
    {
        $this->expectException(ValidationException::class);
        TagField::parseCreate(['label' => str_repeat('あ', TagField::MAX_LABEL + 1)]);
    }

    public function test_update_is_partial(): void
    {
        $input = TagField::parseUpdate(['color' => 'teal']);
        self::assertNull($input->label);
        self::assertSame('teal', $input->color);
        self::assertNull($input->sortOrder);
    }

    public function test_update_rejects_negative_sort_order(): void
    {
        $this->expectException(ValidationException::class);
        TagField::parseUpdate(['sort_order' => -1]);
    }
}
