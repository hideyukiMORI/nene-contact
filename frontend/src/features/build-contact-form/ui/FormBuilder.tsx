import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import {
  defaultChoiceConfig,
  type ContactFormDraft,
  type DraftField,
} from '@/entities/contact-form';
import { useFormBuilder } from '@/features/build-contact-form/hooks/use-form-builder';
import { useChoiceField } from '@/features/build-contact-form/hooks/use-choice-field';
import {
  choiceStateToFieldPatch,
  draftFieldToChoiceState,
} from '@/features/build-contact-form/lib/choice-bridge';
import type { ChoiceState } from '@/features/build-contact-form/lib/choice-core';
import { SortableFieldCard } from '@/features/build-contact-form/ui/SortableFieldCard';
import { FieldConfigPanel } from '@/features/build-contact-form/ui/field-config/FieldConfigPanel';
import { ChoiceCanvasField } from '@/features/build-contact-form/ui/choice/ChoiceCanvasField';
import { ChoicePanel } from '@/features/build-contact-form/ui/choice/ChoicePanel';
import { StyleGallery } from '@/features/build-contact-form/ui/choice/StyleGallery';
import { RespondentForm } from '@/features/build-contact-form/ui/choice/RespondentForm';
import {
  FIELD_DEFAULT_KEYS,
  FIELD_TYPE_ICON,
  PALETTE,
} from '@/features/build-contact-form/lib/field-types';

type Builder = ReturnType<typeof useFormBuilder>;

function newOptionValue(): string {
  return 'opt_' + Math.random().toString(36).slice(2, 10);
}

// A blank editor state for when no choice field is selected (the hook is always mounted).
const EMPTY_CHOICE_STATE: ChoiceState = draftFieldToChoiceState(
  {
    id: '',
    fieldType: 'select',
    name: '',
    label: {},
    description: '',
    placeholder: '',
    required: false,
    options: [],
    choice: defaultChoiceConfig(),
  },
  'ja',
);

// Keeps the selected choice field in the sortable list (so DnD measuring stays consistent)
// while rendering the rich on-canvas editor instead of the compact card.
function SortableChoiceSlot({ id, children }: { id: string; children: ReactNode }): ReactNode {
  const { setNodeRef, transform, transition } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
}

export function FormBuilder({
  onCreated,
  onBack,
  initialDraft,
  formId,
}: {
  onCreated: () => void;
  onBack?: () => void;
  initialDraft?: ContactFormDraft;
  formId?: number;
}): ReactNode {
  const { t } = useI18n();
  const builder = useFormBuilder(initialDraft, formId);
  const isEditing = formId !== undefined;
  const { draft } = builder;
  const locale = draft.defaultLocale;

  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (over !== null && active.id !== over.id) {
      builder.moveField(String(active.id), String(over.id));
    }
  };

  const selected = draft.fields.find((f) => f.id === selectedId) ?? null;
  const isChoiceSelected = selected?.fieldType === 'select';

  // The single choice-state source. Seeded from the selected select field; re-seeds on selection
  // change. Every edit mirrors back into the draft so the draft stays the persisted truth.
  const choiceSeed = isChoiceSelected
    ? draftFieldToChoiceState(selected, locale)
    : EMPTY_CHOICE_STATE;
  const choice = useChoiceField(
    choiceSeed,
    isChoiceSelected ? selected.id : '__none__',
    (state) => {
      if (selected === null || selected.fieldType !== 'select') {
        return;
      }
      const patch = choiceStateToFieldPatch(state, locale, selected.options);
      builder.updateField(selected.id, {
        required: patch.required,
        options: patch.options,
        choice: patch.choice,
      });
    },
  );

  const addField = (fieldType: string): void => {
    const id = builder.addField(fieldType);
    const keys = FIELD_DEFAULT_KEYS[fieldType];
    if (keys !== undefined) {
      builder.setFieldLabel(id, locale, t(keys.label));
      builder.updateField(id, { placeholder: t(keys.placeholder) });
    }
    if (fieldType === 'select') {
      // Seed a few starter options so a new choice field is immediately previewable and valid.
      builder.updateField(id, {
        options: [
          { value: newOptionValue(), label: { [locale]: t('choice.starter.opt1') } },
          { value: newOptionValue(), label: { [locale]: t('choice.starter.opt2') } },
          { value: newOptionValue(), label: { [locale]: t('choice.starter.opt3') } },
        ],
        choice: defaultChoiceConfig(),
      });
    }
    setSelectedId(id);
  };

  const deleteField = (id: string): void => {
    const remaining = draft.fields.filter((f) => f.id !== id);
    builder.removeField(id);
    if (selectedId === id) {
      setSelectedId(remaining[0]?.id ?? null);
    }
  };

  const duplicateField = (id: string): void => {
    const newId = builder.duplicateField(id);
    if (newId !== null) {
      setSelectedId(newId);
    }
  };

  const onSubmit = (): void => {
    setValidationMessage(null);
    if (draft.name.trim() === '' || draft.fields.length === 0) {
      setValidationMessage(t('builder.validation'));
      return;
    }
    void builder.submit().then(onCreated, () => {
      // Error surfaced via builder.error (AppError).
    });
  };

  const fieldLabel = (field: DraftField): string => {
    const raw = field.label[locale];
    return raw !== undefined && raw.trim() !== ''
      ? raw
      : t(`builder.type.${field.fieldType}` as MessageKey);
  };

  const selectedLabel = selected !== null ? fieldLabel(selected) : '';
  // The label editor binds to the raw value (empty when unset) — not the type-name fallback —
  // so clearing it doesn't seed the placeholder text back into the field.
  const selectedRawLabel = selected !== null ? (selected.label[locale] ?? '') : '';

  return (
    <div className="fb-page">
      <button type="button" className="back-link" onClick={onBack}>
        <Icon name="chevLeft" size={15} />
        {t('builder.backToList')}
      </button>

      <div className="page-head">
        <div style={{ flex: 1, minWidth: '180px' }}>
          <h1>{isEditing ? t('builder.editForm') : t('builder.newForm')}</h1>
          <p className="lead">{t('builder.lead')}</p>
        </div>
        <button type="button" className="ex-btn ghost" onClick={onBack}>
          {t('builder.cancel')}
        </button>
        <button
          type="button"
          className="ex-btn ghost"
          disabled={!isChoiceSelected}
          onClick={() => {
            setPreviewOpen(true);
          }}
        >
          <Icon name="eye" size={15} />
          {t('builder.preview')}
        </button>
        <button type="button" className="ex-btn" disabled={builder.isPending} onClick={onSubmit}>
          <Icon name="check" size={15} />
          {builder.isPending
            ? t('builder.creating')
            : isEditing
              ? t('builder.saveChanges')
              : t('builder.publish')}
        </button>
      </div>

      {validationMessage !== null ? (
        <div className="au-note" role="alert" style={{ marginBottom: '16px' }}>
          {validationMessage}
        </div>
      ) : null}
      {builder.error !== null ? (
        <div className="au-note" role="alert" style={{ marginBottom: '16px' }}>
          {t('builder.error')}
        </div>
      ) : null}

      <div className="fb-grid" style={{ position: 'relative' }}>
        <div className="fb-canvas">
          <div className="fb-sheet">
            <div className="fb-sheet-head">
              <input
                className="fb-title-in"
                aria-label={t('builder.formName')}
                value={draft.name}
                placeholder={t('builder.untitled')}
                onChange={(e) => {
                  builder.setName(e.target.value);
                }}
              />
              <textarea
                className="fb-desc-in"
                rows={1}
                aria-label={t('builder.description')}
                value={draft.description}
                placeholder={t('builder.descPlaceholder')}
                onChange={(e) => {
                  builder.setDescription(e.target.value);
                }}
              />
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext
                items={draft.fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {draft.fields.map((field) =>
                  field.fieldType === 'select' && field.id === selectedId ? (
                    <SortableChoiceSlot key={field.id} id={field.id}>
                      <ChoiceCanvasField
                        choice={choice}
                        label={fieldLabel(field)}
                        onOpenGallery={() => {
                          setGalleryOpen(true);
                        }}
                        onDelete={() => {
                          deleteField(field.id);
                        }}
                        onDuplicate={() => {
                          duplicateField(field.id);
                        }}
                      />
                    </SortableChoiceSlot>
                  ) : (
                    <SortableFieldCard
                      key={field.id}
                      field={field}
                      label={fieldLabel(field)}
                      selected={field.id === selectedId}
                      onSelect={() => {
                        setSelectedId(field.id);
                      }}
                      onDelete={() => {
                        deleteField(field.id);
                      }}
                    />
                  ),
                )}
              </SortableContext>
            </DndContext>

            <button
              type="button"
              className="fb-add"
              onClick={() => {
                addField('text');
              }}
            >
              <Icon name="plus" size={15} />
              {t('builder.addField')}
            </button>
          </div>
        </div>

        <div className="fb-panel">
          <FormSettingsCard builder={builder} readOnlyKey={isEditing} />
          <div className="card card-pad">
            <h4 className="fb-psec-h">
              <Icon name="edit" size={15} />
              {t('builder.selectedField')}
            </h4>
            {selected === null ? (
              <p className="fb-empty-sel">{t('builder.noSelection')}</p>
            ) : isChoiceSelected ? (
              <ChoicePanel
                choice={choice}
                label={selectedRawLabel}
                onLabel={(v) => {
                  builder.setFieldLabel(selected.id, locale, v);
                }}
                onOpenGallery={() => {
                  setGalleryOpen(true);
                }}
              />
            ) : (
              <FieldConfigPanel
                field={selected}
                label={selectedRawLabel}
                typeLabel={t(`builder.type.${selected.fieldType}` as MessageKey)}
                onLabel={(v) => {
                  builder.setFieldLabel(selected.id, locale, v);
                }}
                update={(patch) => {
                  builder.updateField(selected.id, patch);
                }}
              />
            )}
          </div>
          <PaletteCard onAdd={addField} />
        </div>

        {isChoiceSelected && galleryOpen ? (
          <StyleGallery
            choice={choice}
            onClose={() => {
              setGalleryOpen(false);
            }}
          />
        ) : null}
        {isChoiceSelected && previewOpen ? (
          <RespondentForm
            choice={choice}
            formName={draft.name}
            formDescription={draft.description}
            fieldLabel={selectedLabel}
            onClose={() => {
              setPreviewOpen(false);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function Switch({
  on,
  label,
  onToggle,
}: {
  on: boolean;
  label: string;
  onToggle: () => void;
}): ReactNode {
  return (
    <button
      type="button"
      className={'switch' + (on ? '' : ' off')}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
    />
  );
}

function FormSettingsCard({
  builder,
  readOnlyKey,
}: {
  builder: Builder;
  readOnlyKey: boolean;
}): ReactNode {
  const { t } = useI18n();
  const { draft } = builder;

  return (
    <div className="card card-pad">
      <h4 className="fb-psec-h">
        <Icon name="settings" size={15} />
        {t('builder.formSettings')}
      </h4>
      <div className="fb-frow">
        <label className="l" htmlFor="fb-form-name">
          {t('builder.formName')}
        </label>
        <input
          id="fb-form-name"
          className="input"
          value={draft.name}
          onChange={(e) => {
            builder.setName(e.target.value);
          }}
        />
      </div>
      <div className="fb-frow">
        <span className="l">{t('builder.publicPath')}</span>
        <div className="fb-affix">
          <span className="pre">{t('builder.publicPathPrefix')}</span>
          <input
            aria-label={t('builder.publicPath')}
            value={draft.publicFormKey}
            readOnly={readOnlyKey}
            placeholder={t('builder.publicPathAuto')}
            onChange={(e) => {
              builder.setPublicFormKey(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase());
            }}
          />
        </div>
      </div>
      <div className="fb-frow">
        <div className="fb-toggle-row">
          <div className="info">
            <div className="t">{t('builder.consentTitle')}</div>
            <div className="d">{t('builder.consentDesc')}</div>
          </div>
          <Switch
            on={draft.consentRequired}
            label={t('builder.consentTitle')}
            onToggle={builder.toggleConsent}
          />
        </div>
      </div>
    </div>
  );
}

function PaletteCard({ onAdd }: { onAdd: (fieldType: string) => void }): ReactNode {
  const { t } = useI18n();
  return (
    <div className="card card-pad">
      <h4 className="fb-psec-h">
        <Icon name="plus" size={15} />
        {t('builder.addField')}
      </h4>
      <div className="fb-pal">
        {PALETTE.map((type) => (
          <button
            key={type}
            type="button"
            className="fb-palitem"
            onClick={() => {
              onAdd(type);
            }}
          >
            <Icon name={FIELD_TYPE_ICON[type] ?? 'text'} size={16} />
            {t(`builder.type.${type}` as MessageKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
