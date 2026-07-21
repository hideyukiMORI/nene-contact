import { useState, type ReactNode } from 'react';
import type {
  ChannelType,
  NotificationChannel,
  NotificationChannelTestResult,
} from '@/entities/notification-channel';
import {
  CHANNEL_ICON,
  CHANNEL_TYPES,
  normalizeChannelConfig,
  validateChannelConfig,
} from '@/entities/notification-channel';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { useChannels } from '@/features/manage-channels/model/use-channels';
import { ChannelConfigFields } from '@/features/manage-channels/ui/ChannelConfigFields';

function onlyFilled(config: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(config)) {
    if (value !== '') {
      out[key] = value;
    }
  }
  return out;
}

export function ManageChannels({ contactFormId }: { contactFormId: number }): ReactNode {
  const { t } = useI18n();
  const {
    channels,
    isLoading,
    error,
    create,
    isCreating,
    createError,
    update,
    isUpdating,
    updateError,
    remove,
    isRemoving,
    test,
    isTesting,
  } = useChannels(contactFormId);

  // Add form.
  const [channelType, setChannelType] = useState<ChannelType>('email');
  const [config, setConfig] = useState<Record<string, string>>({});
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  // Per-row state.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editConfig, setEditConfig] = useState<Record<string, string>>({});
  const [editEnabled, setEditEnabled] = useState(true);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, NotificationChannelTestResult>>({});
  const [testingId, setTestingId] = useState<number | null>(null);

  const onCreate = (): void => {
    const normalized = normalizeChannelConfig(channelType, config);
    const errs = validateChannelConfig(channelType, normalized, true);
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) {
      return;
    }
    void create({ contactFormId, channelType, config: normalized, isEnabled: true }).then(() => {
      setConfig({});
      setAddErrors({});
    });
  };

  const startEdit = (channel: NotificationChannel): void => {
    setEditingId(channel.id);
    setEditConfig({});
    setEditEnabled(channel.isEnabled);
    setEditErrors({});
    setConfirmDeleteId(null);
  };

  const onSaveEdit = (channel: NotificationChannel): void => {
    const normalized = normalizeChannelConfig(channel.channelType, editConfig);
    const errs = validateChannelConfig(channel.channelType, normalized, false);
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) {
      return;
    }
    const filled = onlyFilled(normalized);
    void update({
      id: channel.id,
      update: {
        ...(Object.keys(filled).length > 0 ? { config: filled } : {}),
        isEnabled: editEnabled,
      },
    }).then(() => {
      setEditingId(null);
      setEditConfig({});
    });
  };

  const onTest = (id: number): void => {
    setTestingId(id);
    void test(id)
      .then((result) => {
        setTestResults((m) => ({ ...m, [id]: result }));
      })
      .finally(() => {
        setTestingId(null);
      });
  };

  return (
    <div className="ch-grid">
      <div className="fm-card">
        <div className="ex-cardhead">
          <Icon name="bell" size={15} />
          <h3>{t('channels.configured')}</h3>
        </div>

        {isLoading ? (
          <div className="fm-state">{t('common.loading')}</div>
        ) : error !== null ? (
          <div className="fm-state">
            <div className="au-note" role="alert">
              {t('channels.error')}
            </div>
          </div>
        ) : channels.length === 0 ? (
          <div className="fm-state">{t('channels.empty')}</div>
        ) : (
          <div className="tbl-wrap">
            <table className="fm-tbl">
              <thead>
                <tr>
                  <th>{t('channels.column.type')}</th>
                  <th>{t('channels.column.enabled')}</th>
                  <th className="act">{t('channels.column.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel) => {
                  const result = testResults[channel.id];
                  return (
                    <ChannelRow
                      key={channel.id}
                      channel={channel}
                      isEditing={editingId === channel.id}
                      editConfig={editConfig}
                      editEnabled={editEnabled}
                      editErrors={editErrors}
                      isUpdating={isUpdating}
                      updateError={updateError}
                      isRemoving={isRemoving}
                      isTesting={isTesting && testingId === channel.id}
                      testResult={result}
                      confirmDelete={confirmDeleteId === channel.id}
                      onStartEdit={() => {
                        startEdit(channel);
                      }}
                      onCancelEdit={() => {
                        setEditingId(null);
                      }}
                      onEditConfigChange={(key, value) => {
                        setEditConfig((c) => ({ ...c, [key]: value }));
                      }}
                      onToggleEnabled={(value) => {
                        setEditEnabled(value);
                      }}
                      onSaveEdit={() => {
                        onSaveEdit(channel);
                      }}
                      onTest={() => {
                        onTest(channel.id);
                      }}
                      onAskDelete={() => {
                        setConfirmDeleteId(channel.id);
                      }}
                      onCancelDelete={() => {
                        setConfirmDeleteId(null);
                      }}
                      onConfirmDelete={() => {
                        void remove(channel.id).then(() => {
                          setConfirmDeleteId(null);
                        });
                      }}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="fm-card">
        <div className="ex-cardhead">
          <Icon name="plus" size={15} />
          <h3>{t('channels.add')}</h3>
        </div>
        <div className="ex-card-pad">
          <div className="bd-frow">
            <span className="l">{t('channels.type')}</span>
            <div className="ch-seg">
              {CHANNEL_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={channelType === type ? 'on' : ''}
                  onClick={() => {
                    setChannelType(type);
                    setConfig({});
                    setAddErrors({});
                  }}
                >
                  <Icon name={CHANNEL_ICON[type]} size={15} />
                  {t(`channel.type.${type}`)}
                </button>
              ))}
            </div>
          </div>

          <ChannelConfigFields
            channelType={channelType}
            config={config}
            errors={addErrors}
            idPrefix="ch-add"
            onChange={(key, value) => {
              setConfig((c) => ({ ...c, [key]: value }));
            }}
          />

          {createError !== null ? (
            <div className="au-note" role="alert">
              {t('channels.createError')}
            </div>
          ) : null}

          <button type="button" className="ex-btn" disabled={isCreating} onClick={onCreate}>
            <Icon name="plus" size={14} />
            {isCreating ? t('channels.creating') : t('channels.create')}
          </button>
        </div>
      </div>
    </div>
  );
}

interface RowProps {
  channel: NotificationChannel;
  isEditing: boolean;
  editConfig: Record<string, string>;
  editEnabled: boolean;
  editErrors: Record<string, string>;
  isUpdating: boolean;
  updateError: unknown;
  isRemoving: boolean;
  isTesting: boolean;
  testResult: NotificationChannelTestResult | undefined;
  confirmDelete: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEditConfigChange: (key: string, value: string) => void;
  onToggleEnabled: (value: boolean) => void;
  onSaveEdit: () => void;
  onTest: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

function ChannelRow(props: RowProps): ReactNode {
  const { t } = useI18n();
  const { channel } = props;

  return (
    <>
      <tr>
        <td>
          <span className="ch-type">
            <Icon name={CHANNEL_ICON[channel.channelType]} size={16} />
            {t(`channel.type.${channel.channelType}`)}
          </span>
        </td>
        <td>
          {channel.isEnabled ? (
            <span className="ex-badge done">
              <span className="dot" />
              {t('channels.on')}
            </span>
          ) : (
            <span className="fm-st ended">
              <span className="d" />
              {t('channels.off')}
            </span>
          )}
        </td>
        <td className="act">
          <div className="ch-actions">
            <button
              type="button"
              className="ex-btn ghost"
              disabled={props.isTesting}
              onClick={props.onTest}
            >
              <Icon name="send" size={13} />
              {props.isTesting ? t('channels.testing') : t('channels.test')}
            </button>
            <button type="button" className="ex-btn ghost" onClick={props.onStartEdit}>
              <Icon name="edit" size={13} />
              {t('channels.edit')}
            </button>
            {props.confirmDelete ? (
              <>
                <button
                  type="button"
                  className="ex-btn danger"
                  disabled={props.isRemoving}
                  onClick={props.onConfirmDelete}
                >
                  <Icon name="trash" size={13} />
                  {props.isRemoving ? t('channels.deleting') : t('channels.delete.confirmYes')}
                </button>
                <button type="button" className="ex-btn ghost" onClick={props.onCancelDelete}>
                  {t('channels.cancel')}
                </button>
              </>
            ) : (
              <button type="button" className="ex-btn danger" onClick={props.onAskDelete}>
                <Icon name="trash" size={13} />
                {t('channels.delete')}
              </button>
            )}
          </div>
          {props.testResult !== undefined ? (
            props.testResult.ok ? (
              <span className="ch-testok" role="status">
                <Icon name="check" size={13} />
                {t('channels.test.ok')}
              </span>
            ) : (
              <span className="ch-fielderr" role="alert">
                {t('channels.test.fail')}
                {props.testResult.error !== null ? ` (${props.testResult.error})` : ''}
              </span>
            )
          ) : null}
        </td>
      </tr>

      {props.isEditing ? (
        <tr className="ch-editrow">
          <td colSpan={3}>
            <p className="ch-edithint">{t('channels.edit.hint')}</p>
            <ChannelConfigFields
              channelType={channel.channelType}
              config={props.editConfig}
              errors={props.editErrors}
              idPrefix={`ch-edit-${String(channel.id)}`}
              editing
              onChange={props.onEditConfigChange}
            />
            <label className="ch-enabled">
              <input
                type="checkbox"
                checked={props.editEnabled}
                onChange={(e) => {
                  props.onToggleEnabled(e.target.checked);
                }}
              />
              {t('channels.enabled')}
            </label>
            {props.updateError !== null && props.updateError !== undefined ? (
              <div className="au-note" role="alert">
                {t('channels.saveError')}
              </div>
            ) : null}
            <div className="ch-actions">
              <button
                type="button"
                className="ex-btn"
                disabled={props.isUpdating}
                onClick={props.onSaveEdit}
              >
                <Icon name="check" size={13} />
                {props.isUpdating ? t('channels.saving') : t('channels.save')}
              </button>
              <button type="button" className="ex-btn ghost" onClick={props.onCancelEdit}>
                {t('channels.cancel')}
              </button>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
