import React from 'react';

export const EmptyState = ({
  icon = '📂',
  title = 'No items found',
  message = 'There is currently no data available to display.',
  action,
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{message}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};

export default EmptyState;
