export interface OrganizationSettings {
  id: number;
  name: string;
  senderDisplayName: string | null;
  emailSignature: string | null;
}

export interface OrganizationSettingsUpdate {
  // null (or blank) clears the display name — email From falls back to the organization name.
  senderDisplayName: string | null;
  // null (or blank) clears the signature.
  emailSignature: string | null;
}
