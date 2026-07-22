export function BackupEvolutionInfo() {
  return (
    <div className="text-xs space-y-1">
      <p className="font-medium">Backup History</p>
      <p>
        Daily count and total size of successful backups over the last 90 days.
        Backups deleted by retention policies are excluded.
      </p>
    </div>
  );
}
