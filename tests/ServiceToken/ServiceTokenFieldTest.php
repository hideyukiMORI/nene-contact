<?php

declare(strict_types=1);

namespace NeneContact\Tests\ServiceToken;

use Nene2\Validation\ValidationException;
use NeneContact\ServiceToken\ServiceTokenField;
use PHPUnit\Framework\TestCase;

final class ServiceTokenFieldTest extends TestCase
{
    public function test_parses_valid_payload(): void
    {
        $input = ServiceTokenField::parse([
            'label' => 'NeNe Records',
            'scopes' => ['ingest:submissions'],
            'ttl_seconds' => 3600,
        ]);

        self::assertSame('NeNe Records', $input->label);
        self::assertSame(['ingest:submissions'], $input->scopes);
        self::assertSame('service:records', $input->subject, 'default subject');
        self::assertSame(3600, $input->ttlSeconds);
    }

    public function test_defaults_ttl_to_one_year(): void
    {
        $input = ServiceTokenField::parse(['label' => 'x', 'scopes' => ['ingest:submissions']]);

        self::assertSame(ServiceTokenField::MAX_TTL_SECONDS, $input->ttlSeconds);
        self::assertSame(31_536_000, $input->ttlSeconds);
    }

    public function test_missing_label_is_rejected(): void
    {
        $this->expectException(ValidationException::class);
        ServiceTokenField::parse(['scopes' => ['ingest:submissions']]);
    }

    public function test_empty_scopes_is_rejected(): void
    {
        $this->expectException(ValidationException::class);
        ServiceTokenField::parse(['label' => 'x', 'scopes' => []]);
    }

    public function test_unknown_scope_is_rejected(): void
    {
        $this->expectException(ValidationException::class);
        ServiceTokenField::parse(['label' => 'x', 'scopes' => ['write:everything']]);
    }

    public function test_ttl_below_minimum_is_rejected(): void
    {
        $this->expectException(ValidationException::class);
        ServiceTokenField::parse(['label' => 'x', 'scopes' => ['ingest:submissions'], 'ttl_seconds' => 60]);
    }

    public function test_ttl_above_maximum_is_rejected(): void
    {
        $this->expectException(ValidationException::class);
        ServiceTokenField::parse(['label' => 'x', 'scopes' => ['ingest:submissions'], 'ttl_seconds' => 31_536_001]);
    }
}
