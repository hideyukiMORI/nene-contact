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
import type { IconName } from '@/shared/ui';
import { FormSettingsPage } from '@/features/build-contact-form/ui/FormSettingsPage';
import { PublishPage } from '@/features/build-contact-form/ui/PublishPage';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import {
  defaultChoiceConfig,
  type ContactFormDraft,
  type DraftField,
} from '@/entities/contact-form';
import { useFormBuilder } from '@/features/build-contact-form/hooks/use-form-builder';
import { useChoiceField } from '@/features/build-contact-form/hooks/use-choice-field';
import { AppError } from '@/shared/api/errors';
import {
  choiceStateToFieldPatch,
  draftFieldToChoiceState,
} from '@/features/build-contact-form/lib/choice-bridge';
import type { ChoiceState } from '@/features/build-contact-form/lib/choice-core';
import { AppearanceStudio } from '@/features/appearance-studio';
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

type BuilderTab = 'fields' | 'settings' | 'design' | 'publish';

const BUILDER_TABS: { id: BuilderTab; icon: IconName; labelKey: MessageKey }[] = [
  { id: 'fields', icon: 'lines', labelKey: 'builder.tab2.fields' },
  { id: 'settings', icon: 'settings', labelKey: 'builder.tab2.settings' },
  { id: 'design', icon: 'bulb', labelKey: 'builder.tab2.design' },
  { id: 'publish', icon: 'code', labelKey: 'builder.tab2.publish' },
];

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
  // Per-field + form-level server validation errors from the last failed save, mapped to the
  // offending field card (so the operator sees *which* field is wrong, not a generic message).
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  // The serialized draft the errors belong to; if the draft has since changed, they're stale and
  // we hide them (an edit re-checks on the next save) — derived, no effect.
  const [errorsAt, setErrorsAt] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [tab, setTab] = useState<BuilderTab>('fields');
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Honest dirty-state: nothing is auto-saved, so the toolbar reflects the draft vs. the last
  // persisted snapshot. The baseline is the seed the builder opened with (an existing form or an
  // empty new form), so the "unsaved changes" hint only appears after a real edit.
  const serialized = JSON.stringify(draft);
  const [savedSnapshot, setSavedSnapshot] = useState(serialized);
  const dirty = serialized !== savedSnapshot;

  // Warn before a full page unload (reload/close) while there are unsaved changes.
  useEffect(() => {
    if (!dirty) {
      return;
    }
    const onBeforeUnload = (e: BeforeUnloadEvent): void => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [dirty]);

  // Leaving via 戻る discards in-memory edits (there is no draft persistence), so guard it.
  const handleBack = (): void => {
    if (dirty && !window.confirm(t('builder.leaveConfirm'))) {
      return;
    }
    onBack?.();
  };

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
    setFieldErrors({});
    setFormErrors([]);
    setErrorsAt(null);
    if (draft.name.trim() === '' || draft.fields.length === 0) {
      setValidationMessage(t('builder.validation'));
      return;
    }
    // Capture the exact draft being saved so a concurrent edit during the request still reads
    // as dirty afterwards (the snapshot reflects what actually reached the server).
    const savedDraft = JSON.stringify(draft);
    void builder.submit().then(
      () => {
        const now = new Date();
        const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setSavedSnapshot(savedDraft);
        setSavedAt(hhmm);
        // Editing stays in the full-screen builder; a brand-new form returns to the list.
        if (!isEditing) {
          onCreated();
        }
      },
      (err: unknown) => {
        // Map the server's per-field 422 (errors[].field like "fields.0.label") to the offending
        // card so the operator sees which field is wrong, not just a generic failure.
        if (err instanceof AppError && err.validationErrors.length > 0) {
          const fe: Record<string, string> = {};
          const form: string[] = [];
          for (const ve of err.validationErrors) {
            const m = /^fields\.(\d+)\b/.exec(ve.field);
            const field = m !== null ? draft.fields[Number(m[1])] : undefined;
            const msg = ve.message !== '' ? ve.message : t('builder.fieldHasError');
            if (field !== undefined) {
              const prev = fe[field.id];
              fe[field.id] = prev !== undefined ? `${prev} / ${msg}` : msg;
            } else {
              form.push(ve.message !== '' ? ve.message : ve.field);
            }
          }
          setFieldErrors(fe);
          setFormErrors(form);
          setErrorsAt(savedDraft);
          if (Object.keys(fe).length > 0) {
            setTab('fields');
          } else if (form.length > 0) {
            setTab('settings');
          }
        }
        // Otherwise the generic builder.error surfaces via the toolbar alert.
      },
    );
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
  // Hide last save's errors once the draft changes (the edit will be re-checked on the next save).
  const errorsActive = errorsAt !== null && errorsAt === serialized;
  const activeFieldErrors = errorsActive ? fieldErrors : {};
  const activeFormErrors = errorsActive ? formErrors : [];
  const serverErrorCount = Object.keys(activeFieldErrors).length + activeFormErrors.length;
  const alert =
    validationMessage ??
    (serverErrorCount > 0
      ? t('builder.saveErrors', { n: String(serverErrorCount) })
      : builder.error !== null
        ? t('builder.error')
        : null);

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
    <div className="exwrap pr acc-vt1 st-root bd-editor">
      <div className="st-toolbar">
        <button
          type="button"
          className="st-back"
          aria-label={t('builder.backToList')}
          title={t('builder.backToList')}
          onClick={handleBack}
        >
          <Icon name="arrowLeft" size={16} />
        </button>
        <span className="st-crumb">{t('builder.formCrumb')} ›</span>
        <span className="st-name">
          {draft.name.trim() === '' ? t('builder.untitled') : draft.name}
        </span>
        {isEditing ? (
          <span className="st-st">
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
        ) : dirty ? (
          <span className="st-saved st-unsaved">
            <span className="d" />
            {t('builder.unsaved')}
          </span>
        ) : savedAt !== null ? (
          <span className="st-saved">{t('builder.savedAt', { time: savedAt })}</span>
        ) : null}
        <button
          type="button"
          className="st-btn ghost"
          disabled={!isChoiceSelected}
          onClick={() => {
            setPreviewOpen(true);
          }}
        >
          <Icon name="eye" size={14} />
          {t('builder.preview')}
        </button>
        <button type="button" className="st-btn" disabled={builder.isPending} onClick={onSubmit}>
          <Icon name="check" size={14} />
          {builder.isPending ? t('builder.creating') : t('builder.publishBtn')}
        </button>
      </div>

      <div className="st-tabs">
        {BUILDER_TABS.map((bt) => (
          <button
            key={bt.id}
            type="button"
            className={'st-tab' + (tab === bt.id ? ' on' : '')}
            onClick={() => {
              setTab(bt.id);
            }}
          >
            <Icon name={bt.icon} size={15} />
            {t(bt.labelKey)}
          </button>
        ))}
      </div>

      {activeFormErrors.length > 0 ? (
        <div className="bd-formerrs" role="alert">
          {activeFormErrors.map((m, i) => (
            <div key={i} className="fb-ferr">
              <Icon name="warn" size={13} />
              {m}
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'settings' ? <FormSettingsPage builder={builder} readOnlyKey={isEditing} /> : null}
      {tab === 'design' ? (
        <AppearanceStudio value={draft.appearance} onChange={builder.setAppearance} />
      ) : null}
      {tab === 'publish' ? (
        <PublishPage builder={builder} isEditing={isEditing} formId={formId} />
      ) : null}

      {tab === 'fields' ? (
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

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
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
                          error={activeFieldErrors[field.id]}
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
                        error={activeFieldErrors[field.id]}
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
              <button type="button" className="bd-ptab on">
                {t('builder.tab.field')}
              </button>
            </div>

            <div className="cf-panelscroll">
              {selected === null ? (
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
      ) : null}
    </div>
  );
}
