export function NotificationPanelInfo() {
  return (
    <div className="text-xs space-y-1">
      <p className="font-medium">Critical Alerts</p>
      <p className="text-muted-foreground">
        Last critical notifications sent in the past 24 hours: backup failures,
        restore failures, and agent or database health errors.
      </p>
    </div>
  );
}
