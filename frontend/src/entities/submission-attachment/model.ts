// A file attached to a submission, as listed for the admin inquiry detail. Bytes are not
// included — only metadata (the design renders a file-chip per attachment, grouped by field).
export interface SubmissionAttachment {
  id: number;
  fieldName: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
}

export interface SubmissionAttachmentList {
  items: SubmissionAttachment[];
}
