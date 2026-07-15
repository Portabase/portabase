export function DatabaseTreemapInfo() {
  return (
    <div className="text-xs space-y-1">
      <p className="font-medium">Database usage</p>
      <p>
        Total backup size grouped by database engine (DBMS). Helps identify
        which engines consume the most storage.
      </p>
    </div>
  );
}
