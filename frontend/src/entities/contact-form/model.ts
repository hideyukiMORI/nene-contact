export interface ContactForm {
  id: number;
  name: string;
  publicFormKey: string;
  defaultLocale: string;
  locales: string[];
  status: string;
  consentRequired: boolean;
}

export interface ContactFormList {
  items: ContactForm[];
  total: number;
}
