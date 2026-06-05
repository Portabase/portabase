export function HealthRingInfo() {
  return (
    <div className="text-xs space-y-1">
      <p className="font-medium">Global Health Score</p>
      <p>
        Average of three metrics: database availability, agent availability, and
        alert health ratio. Metrics with no data are excluded from the average.
      </p>
      <ul className="mt-1 space-y-0.5">
        <li>
          <span className="text-blue-400">■</span> DB availability — % databases
          reachable
        </li>
        <li>
          <span className="text-green-400">■</span> Agents — % agents online
        </li>
        <li>
          <span className="text-red-400">■</span> Alerts — ratio of non-critical
          notifications
        </li>
      </ul>
    </div>
  );
}
