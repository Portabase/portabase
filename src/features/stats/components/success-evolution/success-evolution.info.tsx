export function SuccessEvolutionInfo() {
  return (
    <div className="text-xs space-y-1">
      <p className="font-medium">Backup Success Rate</p>
      <p>
        Share of backups that completed successfully each day over the selected
        range, out of every backup that finished (successful or failed).
      </p>
      <p>
        Backups still running are ignored, and backups already removed by a
        retention policy still count, so the rate reflects what happened that day
        and does not drift as old backups are pruned.
      </p>
      <p>Days without any finished backup are left blank rather than shown as 0%.</p>
    </div>
  );
}
