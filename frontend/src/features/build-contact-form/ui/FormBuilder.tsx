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
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
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
type PanelTab = 'field' | 'form';

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
  // Only the selected field renders through this slot, so it always carries the marker the
  // selection-follow scroll looks for.
  return (
    <div ref={setNodeRef} style={style} data-selected="true">
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
  const [panelTab, setPanelTab] = useState<PanelTab>('field');
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

  const selectField = (id: string): void => {
    setSelectedId(id);
    setPanelTab('field');
  };

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
    selectField(id);
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
      selectField(newId);
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
  const alert = validationMessage ?? (builder.error !== null ? t('builder.error') : null);

  // Selection-follow: when a field is selected or added, keep it comfortably in view by scrolling
  // the canvas pane (not the page). scrollTop is computed rather than using scrollIntoView, which
  // would disturb the whole app scroll; a timeout guarantees the move where smooth is unsupported.
  const canvasRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sc = canvasRef.current;
    if (sc === null) {
      return;
    }
    const el = sc.querySelector<HTMLElement>('[data-selected="true"]');
    if (el === null) {
      return;
    }
    const fr = el.getBoundingClientRect();
    const cr = sc.getBoundingClientRect();
    if (fr.top < cr.top + 8 || fr.bottom > cr.bottom - 8) {
      const top = sc.scrollTop + (fr.top - cr.top) - 20;
      try {
        sc.scrollTo({ top, behavior: 'smooth' });
      } catch {
        sc.scrollTop = top;
      }
      window.setTimeout(() => {
        if (Math.abs(sc.scrollTop - top) > 4) {
          sc.scrollTop = top;
        }
      }, 360);
    }
  }, [selectedId, draft.fields.length]);

  return (
    <div className="bd-editor">
      <div className="bd-toolbar">
        <button
          type="button"
          className="bd-back"
          aria-label={t('builder.backToList')}
          onClick={onBack}
        >
          <Icon name="arrowLeft" size={16} />
        </button>
        <span className="bd-tcrumb">{t('builder.formCrumb')} ›</span>
        <input
          className="bd-tname"
          aria-label={t('builder.formName')}
          value={draft.name}
          placeholder={t('builder.untitled')}
          onChange={(e) => {
            builder.setName(e.target.value);
          }}
        />
        {isEditing ? (
          <span className="fm-st live">
            <span className="d" />
            {t('contactForms.status.active')}
          </span>
        ) : (
          <span className="fm-st draft">
            <span className="d" />
            {t('builder.statusDraft')}
          </span>
        )}
        <span className="sp" />
        {alert !== null ? (
          <span className="bd-toolbar-alert" role="alert">
            <Icon name="warn" size={14} />
            {alert}
          </span>
        ) : null}
        <button
          type="button"
          className="ex-btn ghost"
          disabled={!isChoiceSelected}
          onClick={() => {
            setPreviewOpen(true);
          }}
        >
          <Icon name="eye" size={14} />
          {t('builder.preview')}
        </button>
        <button type="button" className="ex-btn" disabled={builder.isPending} onClick={onSubmit}>
          <Icon name="check" size={14} />
          {builder.isPending
            ? t('builder.creating')
            : isEditing
              ? t('builder.saveChanges')
              : t('builder.publish')}
        </button>
      </div>

      <div className="bd-wrap" style={{ position: 'relative' }}>
        <div className="bd-canvas" ref={canvasRef}>
          <div className="bd-sheet">
            <div className="bd-sheethead">
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
                        selectField(field.id);
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
              className="bd-add"
              onClick={() => {
                addField('text');
              }}
            >
              <Icon name="plus" size={15} />
              {t('builder.addField')}
            </button>
          </div>
        </div>

        <div className="bd-panel">
          <div className="bd-ptabs">
            <button
              type="button"
              className={'bd-ptab' + (panelTab === 'field' ? ' on' : '')}
              onClick={() => {
                setPanelTab('field');
              }}
            >
              {t('builder.tab.field')}
            </button>
            <button
              type="button"
              className={'bd-ptab' + (panelTab === 'form' ? ' on' : '')}
              onClick={() => {
                setPanelTab('form');
              }}
            >
              {t('builder.tab.form')}
            </button>
          </div>

          <div className="cf-panelscroll">
            {panelTab === 'form' ? (
              <FormSettingsSection builder={builder} readOnlyKey={isEditing} />
            ) : selected === null ? (
              <div className="bd-psec">
                <p className="fb-empty-sel">{t('builder.noSelection')}</p>
              </div>
            ) : (
              <>
                <div className="bd-pinhead">
                  <span className="bd-typechip">
                    <Icon name={FIELD_TYPE_ICON[selected.fieldType] ?? 'text'} size={14} />
                    {t(`builder.type.${selected.fieldType}` as MessageKey)}
                  </span>
                  <span className="nm">{selectedLabel}</span>
                </div>
                {isChoiceSelected ? (
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
                <div className="bd-psec">
                  <button
                    type="button"
                    className="bd-fielddel"
                    onClick={() => {
                      deleteField(selected.id);
                    }}
                  >
                    <Icon name="trash" size={15} />
                    {t('builder.deleteField')}
                  </button>
                </div>
                <div className="bd-psec">
                  <h4>{t('builder.addField')}</h4>
                  <div className="bd-pal">
                    {PALETTE.map((type) => (
                      <button
                        key={type}
                        type="button"
                        className="bd-palitem"
                        onClick={() => {
                          addField(type);
                        }}
                      >
                        <Icon name={FIELD_TYPE_ICON[type] ?? 'text'} size={16} />
                        {t(`builder.type.${type}` as MessageKey)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
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
      className={'cf-switch' + (on ? '' : ' off')}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
    />
  );
}

// Form-level settings (the "フォーム設定" inspector tab): name, public path, consent.
function FormSettingsSection({
  builder,
  readOnlyKey,
}: {
  builder: Builder;
  readOnlyKey: boolean;
}): ReactNode {
  const { t } = useI18n();
  const { draft } = builder;

  return (
    <div className="bd-psec">
      <div className="bd-frow">
        <label className="l" htmlFor="fb-form-name">
          {t('builder.formName')}
        </label>
        <input
          id="fb-form-name"
          className="cf-input"
          value={draft.name}
          onChange={(e) => {
            builder.setName(e.target.value);
          }}
        />
      </div>
      <div className="bd-frow">
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
      <div className="bd-frow">
        <div className="cf-togglerow">
          <div className="tx">
            <div className="tl">{t('builder.consentTitle')}</div>
            <div className="td">{t('builder.consentDesc')}</div>
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
