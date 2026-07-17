import { useState, type ReactNode } from 'react';
import {
  SERVICE_SCOPES,
  type IssuedServiceToken,
  type ServiceToken,
} from '@/entities/service-token';
import { useI18n } from '@/shared/i18n';
import { Icon, Modal } from '@/shared/ui';
import { useServiceTokens } from '@/features/manage-service-tokens/hooks/use-service-tokens';

export function ManageServiceTokens(): ReactNode {
  const { t } = useI18n();
  const { tokens, isLoading, error, issueToken, isIssuing, issueError, revokeToken, revokeError } =
    useServiceTokens();

  const [issueOpen, setIssueOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [issued, setIssued] = useState<IssuedServiceToken | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ServiceToken | null>(null);

  const onIssue = (): void => {
    void issueToken({ label, scopes: [...SERVICE_SCOPES] }).then((result) => {
      setIssued(result);
      setLabel('');
      setIssueOpen(false);
      setCopied(false);
    });
  };

  const onCopy = (): void => {
    if (issued === null) {
      return;
    }
    void navigator.clipboard.writeText(issued.token).then(() => {
      setCopied(true);
    });
  };

  return (
    <div className="fm-body">
      <div className="fm-head">
        <h1>{t('serviceTokens.title')}</h1>
        <span className="c">{t('serviceTokens.count', { n: String(tokens.length) })}</span>
        <span className="sp" />
        <button
          type="button"
          className="ex-btn"
          onClick={() => {
            setIssueOpen(true);
          }}
        >
          <Icon name="plus" size={14} />
          {t('serviceTokens.issue')}
        </button>
      </div>

      <p className="fm-lede">{t('serviceTokens.lede')}</p>

      {isLoading ? <div className="fm-card fm-state">{t('common.loading')}</div> : null}
      {error !== null ? (
        <div className="au-note" role="alert">
          {t('serviceTokens.error')}
        </div>
      ) : null}
      {revokeError !== null ? (
        <div className="au-note" role="alert">
          {t('serviceTokens.revokeError')}
        </div>
      ) : null}

      {!isLoading && error === null && tokens.length === 0 ? (
        <div className="fm-card fm-empty">
          <div className="e-ico">
            <Icon name="link" size={26} />
          </div>
          <h3>{t('serviceTokens.empty')}</h3>
        </div>
      ) : null}

      {tokens.length > 0 ? (
        <div className="fm-card">
          <div className="tbl-wrap">
            <table className="fm-tbl">
              <thead>
                <tr>
                  <th>{t('serviceTokens.column.label')}</th>
                  <th>{t('serviceTokens.column.subject')}</th>
                  <th>{t('serviceTokens.column.scopes')}</th>
                  <th>{t('serviceTokens.column.status')}</th>
                  <th>{t('serviceTokens.column.expires')}</th>
                  <th aria-label={t('serviceTokens.column.actions')} />
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr key={token.id}>
                    <td>{token.label}</td>
                    <td>
                      <code className="st-code">{token.subject}</code>
                    </td>
                    <td>
                      {token.scopes.map((scope) => (
                        <span key={scope} className="st-scope">
                          {scope}
                        </span>
                      ))}
                    </td>
                    <td>
                      <span className={`st-status ${token.status}`}>
                        {t(`serviceTokens.status.${token.status}`)}
                      </span>
                    </td>
                    <td>{token.expiresAt.slice(0, 10)}</td>
                    <td className="st-actions">
                      {token.status === 'active' ? (
                        <button
                          type="button"
                          className="ex-btn ghost danger"
                          onClick={() => {
                            setRevokeTarget(token);
                          }}
                        >
                          <Icon name="trash" size={13} />
                          {t('serviceTokens.revoke')}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {issueOpen ? (
        <Modal
          title={t('serviceTokens.issue')}
          subtitle={t('serviceTokens.issueSub')}
          icon={<Icon name="link" size={19} />}
          onClose={() => {
            setIssueOpen(false);
          }}
          foot={
            <>
              <button
                type="button"
                className="ex-btn ghost"
                onClick={() => {
                  setIssueOpen(false);
                }}
              >
                {t('common.close')}
              </button>
              <button
                type="button"
                className="ex-btn"
                disabled={isIssuing || label.trim() === ''}
                onClick={onIssue}
              >
                <Icon name="send" size={14} />
                {isIssuing ? t('serviceTokens.issuing') : t('serviceTokens.issue')}
              </button>
            </>
          }
        >
          {issueError !== null ? (
            <div className="au-note" role="alert">
              {t('serviceTokens.issueError')}
            </div>
          ) : null}
          <div className="md-field">
            <label className="l" htmlFor="st-label">
              {t('serviceTokens.label')}
            </label>
            <input
              id="st-label"
              type="text"
              value={label}
              placeholder={t('serviceTokens.labelPlaceholder')}
              onChange={(e) => {
                setLabel(e.target.value);
              }}
            />
          </div>
          <div className="md-field">
            <span className="l">{t('serviceTokens.column.scopes')}</span>
            <span className="st-scope">{SERVICE_SCOPES[0]}</span>
            <p className="md-hint">{t('serviceTokens.scopeHint')}</p>
          </div>
        </Modal>
      ) : null}

      {issued !== null ? (
        <Modal
          title={t('serviceTokens.issuedTitle')}
          subtitle={t('serviceTokens.issuedSub')}
          icon={<Icon name="check" size={19} />}
          onClose={() => {
            setIssued(null);
          }}
          foot={
            <button
              type="button"
              className="ex-btn"
              onClick={() => {
                setIssued(null);
              }}
            >
              {t('common.close')}
            </button>
          }
        >
          <div className="au-note" role="status">
            {t('serviceTokens.issuedWarning')}
          </div>
          <div className="st-token">
            <code>{issued.token}</code>
            <button type="button" className="ex-btn ghost" onClick={onCopy}>
              <Icon name={copied ? 'check' : 'copy'} size={14} />
              {copied ? t('serviceTokens.copied') : t('serviceTokens.copy')}
            </button>
          </div>
        </Modal>
      ) : null}

      {revokeTarget !== null ? (
        <Modal
          title={t('serviceTokens.revokeTitle')}
          subtitle={revokeTarget.label}
          icon={<Icon name="trash" size={19} />}
          onClose={() => {
            setRevokeTarget(null);
          }}
          foot={
            <>
              <button
                type="button"
                className="ex-btn ghost"
                onClick={() => {
                  setRevokeTarget(null);
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="ex-btn danger"
                onClick={() => {
                  revokeToken(revokeTarget.id);
                  setRevokeTarget(null);
                }}
              >
                <Icon name="trash" size={14} />
                {t('serviceTokens.revoke')}
              </button>
            </>
          }
        >
          <p>{t('serviceTokens.revokeConfirm')}</p>
        </Modal>
      ) : null}
    </div>
  );
}
