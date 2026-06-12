/**
 * Converts between a DraftField (per-locale, persisted shape) and the editor-local ChoiceState
 * (single-locale strings keyed by the default locale). The option `value` doubles as the stable
 * editor id, so ChoiceConfig.defaults survives the round trip.
 */
import { defaultChoiceConfig } from '@/entities/contact-form';
import type { ChoiceConfig, DraftField, DraftFieldOption } from '@/entities/contact-form';
import type { ChoiceState } from '@/features/build-contact-form/lib/choice-core';

export function draftFieldToChoiceState(field: DraftField, locale: string): ChoiceState {
  const choice = field.choice ?? defaultChoiceConfig();
  const options = (field.options ?? []).map((o) => {
    const desc = o.description?.[locale];
    return {
      id: o.value,
      label: o.label[locale] ?? '',
      ...(desc != null && desc !== '' ? { desc } : {}),
      ...(o.image === true ? { img: true } : {}),
    };
  });

  return {
    style: choice.style,
    options,
    defaults: choice.defaults,
    required: field.required,
    other: choice.other,
    otherCfg: choice.otherConfig,
    countRule: choice.countRule,
    imgMode: choice.image.enabled,
    cardLayout: choice.image.layout,
    cols: choice.image.cols,
    ratio: choice.image.ratio,
  };
}

export interface ChoiceFieldPatch {
  required: boolean;
  options: DraftFieldOption[];
  choice: ChoiceConfig;
}

// Serialize editor state back into the draft field's persisted fields (merging single-locale
// edits into the existing per-locale maps so other locales are preserved).
export function choiceStateToFieldPatch(
  state: ChoiceState,
  locale: string,
  prevOptions: DraftFieldOption[] | null,
): ChoiceFieldPatch {
  const prevByValue = new Map((prevOptions ?? []).map((o) => [o.value, o]));

  const options: DraftFieldOption[] = state.options.map((o) => {
    const prev = prevByValue.get(o.id);
    const label = { ...(prev?.label ?? {}), [locale]: o.label };
    const option: DraftFieldOption = { value: o.id, label };
    if (o.desc != null && o.desc !== '') {
      option.description = { ...(prev?.description ?? {}), [locale]: o.desc };
    }
    if (o.img === true) {
      option.image = true;
    }
    return option;
  });

  const choice: ChoiceConfig = {
    style: state.style,
    defaults: state.defaults,
    other: state.other,
    otherConfig: state.otherCfg,
    countRule: state.countRule,
    image: {
      enabled: state.imgMode,
      layout: state.cardLayout,
      cols: state.cols,
      ratio: state.ratio,
    },
  };

  return { required: state.required, options, choice };
}
