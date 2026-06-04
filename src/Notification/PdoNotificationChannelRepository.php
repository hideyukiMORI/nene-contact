<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Http\RequestScopedHolder;

final readonly class PdoNotificationChannelRepository implements NotificationChannelRepositoryInterface
{
    private const COLUMNS = 'id, organization_id, contact_form_id, channel_type, config_json, is_enabled, created_at, updated_at';

    /**
     * @param RequestScopedHolder<int> $orgId
     */
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private RequestScopedHolder $orgId,
        private ConfigCipherInterface $cipher,
    ) {
    }

    public function create(NotificationChannel $channel): int
    {
        $now = date('Y-m-d H:i:s');
        $this->query->execute(
            'INSERT INTO notification_channels (organization_id, contact_form_id, channel_type, config_json, is_enabled, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                $channel->organizationId,
                $channel->contactFormId,
                $channel->channelType,
                $this->cipher->encrypt(json_encode($channel->config, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE)),
                $channel->isEnabled ? 1 : 0,
                $now,
                $now,
            ],
        );

        return $this->query->lastInsertId();
    }

    /** @return list<NotificationChannel> */
    public function listByContactForm(int $contactFormId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT ' . self::COLUMNS . ' FROM notification_channels WHERE contact_form_id = ? AND organization_id = ? ORDER BY id ASC',
            [$contactFormId, $this->orgId->get()],
        );

        return array_map(fn (array $row): NotificationChannel => $this->mapRow($row), $rows);
    }

    /** @return list<NotificationChannel> */
    public function findEnabledByContactForm(int $contactFormId, int $organizationId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT ' . self::COLUMNS . ' FROM notification_channels WHERE contact_form_id = ? AND organization_id = ? AND is_enabled = 1 ORDER BY id ASC',
            [$contactFormId, $organizationId],
        );

        return array_map(fn (array $row): NotificationChannel => $this->mapRow($row), $rows);
    }

    /** @param array<string, mixed> $row */
    private function mapRow(array $row): NotificationChannel
    {
        $config = json_decode($this->cipher->decrypt((string) $row['config_json']), true, 512, JSON_THROW_ON_ERROR);

        return new NotificationChannel(
            organizationId: (int) $row['organization_id'],
            contactFormId: (int) $row['contact_form_id'],
            channelType: (string) $row['channel_type'],
            config: is_array($config) ? $config : [],
            isEnabled: (bool) $row['is_enabled'],
            id: (int) $row['id'],
            createdAt: (string) $row['created_at'],
            updatedAt: (string) $row['updated_at'],
        );
    }
}
