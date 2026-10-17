export function DatabaseTreemapInfo() {
  return (
    <div className="text-xs space-y-1">
      <p className="font-medium">Data source usage</p>
      <p>
        Total backup size grouped by data source type. Helps identify which
        sources consume the most storage.
      </p>
    </div>
  );
}
