export function AgentStatusInfo() {
  return (
    <div className="text-xs space-y-1">
      <p className="font-medium">Agent Status</p>
      <p>
        Each square represents one agent. Hover a square to see its health graph
        for the last 12 hours.
      </p>
      <ul className="mt-1 space-y-0.5">
        <li>
          <span className="text-emerald-500">■</span> Online — last contact &lt;
          10 min
        </li>
        <li>
          <span className="text-emerald-700">■</span> Degraded — last contact
          10–30 min
        </li>
        <li>
          <span className="text-red-500">■</span> Offline — last contact &gt; 30
          min
        </li>
      </ul>
    </div>
  );
}
