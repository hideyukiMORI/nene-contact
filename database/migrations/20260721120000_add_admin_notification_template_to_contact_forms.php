<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Per-form admin-notification email template (email-wording wave c). Nullable subject/body;
 * null resolves to the (Japanese) default at send time. Variables like {form_name}/{email}/
 * {message} are interpolated when the notification is sent (admin recipient only).
 */
final class AddAdminNotificationTemplateToContactForms extends AbstractMigration
{
    public function change(): void
    {
        $this->table('contact_forms')
            ->addColumn('admin_notification_subject', 'string', ['limit' => 255, 'null' => true, 'default' => null, 'after' => 'autoreply_json'])
            ->addColumn('admin_notification_body', 'text', ['null' => true, 'default' => null, 'after' => 'admin_notification_subject'])
            ->update();
    }
}
