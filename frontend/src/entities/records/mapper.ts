import type { RecordsOption, RecordsOptionsDto } from '@/entities/records/model';

export function toRecordsOptions(dto: RecordsOptionsDto): RecordsOption[] {
  return (dto.items ?? []).map((item) => ({ value: item.value, label: item.label }));
}
