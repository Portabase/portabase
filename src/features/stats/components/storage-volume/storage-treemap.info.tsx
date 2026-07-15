export function StorageTreemapInfo() {
  return (
    <div className="text-xs space-y-1">
      <p className="font-medium">Storage capacity</p>
      <p>
        Total size of backup files grouped by storage provider. Reflects the
        actual disk space used on each storage backend.
      </p>
    </div>
  );
}
