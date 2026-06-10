import { useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { SubmissionList } from '@/features/list-submissions';
import { SubmissionDetail } from '@/features/view-submission';

// The inbox is the 確定版 two-pane: a conversation list on the left and the selected
// submission's detail on the right. /submissions and /submissions/:id render the same
// screen; the :id (when present) selects the row and loads the (audited) detail pane.
export function SubmissionsPage(): ReactNode {
  const { t } = useI18n();
  const { id } = useParams();
  const parsed = id !== undefined ? Number(id) : null;
  const selectedId = parsed !== null && !Number.isNaN(parsed) ? parsed : null;

  return (
    <div className="ib-wrap">
      <SubmissionList selectedId={selectedId} />
      {selectedId !== null ? (
        <SubmissionDetail submissionId={selectedId} />
      ) : (
        <div className="ib-nodetail">
          <div className="ic">
            <Icon name="inbox" size={30} />
            {t('inbox.selectHint')}
          </div>
        </div>
      )}
    </div>
  );
}
