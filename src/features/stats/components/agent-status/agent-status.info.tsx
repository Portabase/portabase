import { CircleAlert, CircleCheck, CircleX, type LucideIcon } from "lucide-react";

type StatusLegend = {
  icon: LucideIcon;
  className: string;
  label: string;
  detail: string;
};

const STATUS_LEGEND: StatusLegend[] = [
  {
    icon: CircleCheck,
    className: "text-emerald-500",
    label: "Online",
    detail: "seen in the last 10 minutes",
  },
  {
    icon: CircleAlert,
    className: "text-emerald-700",
    label: "Degraded",
    detail: "last seen 10 to 30 minutes ago",
  },
  {
    icon: CircleX,
    className: "text-red-500",
    label: "Offline",
    detail: "no contact for over 30 minutes",
  },
];

export function AgentStatusInfo() {
  return (
    <div className="space-y-2 text-xs">
      <div className="space-y-1">
        <p className="font-medium">Agent Status</p>
        <p className="opacity-80">
          Each tile is one agent. Select a tile to see its health over the last
          12 hours.
        </p>
      </div>
      <ul className="space-y-1.5">
        {STATUS_LEGEND.map(({ icon: Icon, className, label, detail }) => (
          <li key={label} className="flex items-center gap-2">
            <Icon size={13} className={`shrink-0 ${className}`} />
            <span className="font-medium">{label}</span>
            <span className="opacity-70">{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
