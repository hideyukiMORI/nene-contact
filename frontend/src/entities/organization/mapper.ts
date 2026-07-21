import type {
  OrganizationSettingsDto,
  UpdateOrganizationDto,
} from '@/entities/organization/api-types';
import type {
  OrganizationSettings,
  OrganizationSettingsUpdate,
} from '@/entities/organization/model';

export function toOrganizationSettings(dto: OrganizationSettingsDto): OrganizationSettings {
  return {
    id: dto.id,
    name: dto.name,
    senderDisplayName: dto.sender_display_name ?? null,
    emailSignature: dto.email_signature ?? null,
  };
}

export function toUpdateOrganizationDto(update: OrganizationSettingsUpdate): UpdateOrganizationDto {
  return {
    sender_display_name: update.senderDisplayName,
    email_signature: update.emailSignature,
  };
}
