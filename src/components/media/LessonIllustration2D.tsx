import type { LessonMediaVariant } from "@/types/lessonMedia";

type Props = {
  variant: LessonMediaVariant;
};

/**
 * Schemetic illustrations using SVG paths (quadratic/cubic Bézier), gradients,
 * and dash-offset animation to suggest conventional current flow.
 */
export function LessonIllustration2D({ variant }: Props) {
  const bg = "#020617";
  const caption = {
    electrostatic: "Mô phỏng cọ xát — electron chuyển sang vật nhựa",
    circuit: "Mô phỏng nguồn và dây dẫn (đường cong Bézier)",
    motorThermal: "Cuộn dây — từ trường & dòng điện qua dây",
    meters: "Ampe kế (nối tiếp) · Vôn kế (song song)",
  }[variant];

  return (
    <div className="rounded-3xl bg-slate-950/90 p-4 flex flex-col items-center justify-center min-h-[180px]">
      <svg
        viewBox="0 0 280 160"
        className="w-full max-w-md h-auto drop-shadow-lg"
        role="img"
        aria-label={caption}
      >
        <defs>
          <linearGradient id="wireBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="wireGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#fcd34d" stopOpacity="1" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.35" />
          </linearGradient>
          <filter id="glowBlue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glowGold" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="280" height="160" fill={bg} rx="12" />

        {variant === "electrostatic" && <ElectrostaticLayer />}
        {variant === "circuit" && <CircuitLayer />}
        {variant === "motorThermal" && <MotorThermalLayer />}
        {variant === "meters" && <MetersLayer />}

        <text x="140" y="148" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="system-ui, sans-serif">
          {caption}
        </text>
      </svg>
    </div>
  );
}

function ElectrostaticLayer() {
  return (
    <g>
      <rect x="24" y="36" width="88" height="52" rx="10" fill="#3f2e1f" stroke="#a16207" strokeWidth="2.5" />
      <text x="68" y="68" textAnchor="middle" fontSize="9" fill="#fde68a">
        Vải len
      </text>
      <rect x="140" y="44" width="96" height="18" rx="4" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="2" />
      <text x="188" y="57" textAnchor="middle" fontSize="8" fill="#e2e8f0">
        Thước nhựa
      </text>
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={120 + i * 14} cy="104" r="3.5" fill="#e2e8f0" opacity={0.85} />
      ))}
      <path
        d="M 68 68 Q 100 88 150 52"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2"
        strokeDasharray="4 6"
        opacity={0.85}
      >
        <animate attributeName="stroke-dashoffset" from="0" to="40" dur="2.5s" repeatCount="indefinite" />
      </path>
      <text x="108" y="96" fontSize="8" fill="#7dd3fc">
        e⁻
      </text>
    </g>
  );
}

function CircuitLayer() {
  /* Cubic Bézier wires: P(t) = (1−t)³P₀ + 3(1−t)²t P₁ + 3(1−t)t² P₂ + t³ P₃ */
  return (
    <g>
      <rect x="18" y="38" width="92" height="48" rx="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="3.5" filter="url(#glowBlue)" />
      <circle cx="52" cy="58" r="6" fill="#38bdf8" />
      <circle cx="52" cy="72" r="6" fill="#fbbf24" />
      <text x="64" y="66" fontSize="9" fill="#94a3b8">
        + −
      </text>

      <rect x="178" y="42" width="72" height="40" rx="12" fill="#0f172a" stroke="#fbbf24" strokeWidth="3" filter="url(#glowGold)" />
      <circle cx="214" cy="62" r="5.5" fill="#f8fafc" />
      <circle cx="200" cy="78" r="4" fill="#f8fafc" opacity={0.9} />

      <path
        d="M 110 54 C 132 54 150 40 178 56"
        fill="none"
        stroke="url(#wireBlue)"
        strokeWidth="4"
        strokeLinecap="round"
        filter="url(#glowBlue)"
        strokeDasharray="10 14"
      >
        <animate attributeName="stroke-dashoffset" from="0" to="-96" dur="2.2s" repeatCount="indefinite" />
      </path>

      <path
        d="M 110 76 C 130 96 155 100 178 78"
        fill="none"
        stroke="url(#wireGold)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="8 12"
        opacity={0.95}
      >
        <animate attributeName="stroke-dashoffset" from="0" to="-80" dur="2.8s" repeatCount="indefinite" />
      </path>
    </g>
  );
}

function MotorThermalLayer() {
  return (
    <g>
      <ellipse cx="90" cy="78" rx="38" ry="16" fill="none" stroke="#3b82f6" strokeWidth="2.5" opacity={0.9} />
      <ellipse cx="90" cy="78" rx="28" ry="11" fill="none" stroke="#60a5fa" strokeWidth="1.5" opacity={0.6} />
      <rect x="52" y="110" width="76" height="22" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
      <text x="90" y="124" textAnchor="middle" fontSize="8" fill="#94a3b8">
        Cuộn dây
      </text>
      <circle cx="200" cy="78" r="28" fill="#0f172a" stroke="#475569" strokeWidth="2" />
      <path d="M 200 54 L 208 78 L 200 102 L 192 78 Z" fill="#ef4444" opacity={0.9} />
      <path d="M 200 102 L 200 116" stroke="#e2e8f0" strokeWidth="2" />
      <text x="200" y="52" textAnchor="middle" fontSize="8" fill="#94a3b8">
        La bàn
      </text>
      <path d="M 90 40 Q 140 20 200 50" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 5" opacity={0.7}>
        <animate attributeName="stroke-dashoffset" from="0" to="-36" dur="3s" repeatCount="indefinite" />
      </path>
    </g>
  );
}

function MetersLayer() {
  return (
    <g>
      <rect x="30" y="48" width="56" height="36" rx="6" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
      <text x="58" y="70" textAnchor="middle" fontSize="10" fill="#e2e8f0" fontWeight="bold">
        A
      </text>
      <path d="M 58 76 L 68 62" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />

      <rect x="194" y="48" width="56" height="36" rx="6" fill="#334155" stroke="#22c55e" strokeWidth="1.5" />
      <text x="222" y="70" textAnchor="middle" fontSize="10" fill="#e2e8f0" fontWeight="bold">
        V
      </text>
      <path d="M 222 76 L 232 60" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />

      <rect x="100" y="44" width="48" height="28" rx="5" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="124" y="62" textAnchor="middle" fontSize="8" fill="#fde68a">
        Pin
      </text>

      <circle cx="124" cy="108" r="14" fill="#422006" stroke="#fbbf24" strokeWidth="2" />
      <path d="M 124 108 L 130 98" stroke="#fef3c7" strokeWidth="2" strokeLinecap="round" />

      <path d="M 86 66 L 100 66 L 100 92 L 118 92" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 118 92 L 118 108" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />

      <path d="M 168 66 L 194 66" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="5 4" opacity={0.9} />
      <path d="M 194 66 L 194 92 L 210 92" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="5 4" opacity={0.9} />
    </g>
  );
}
