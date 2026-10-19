// 自定义 SVG logo —— 一只温暖的炒锅 + 升腾的饭粒/蒸气
// 使用 currentColor 以适配深浅色模式。

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="今天吃什么 logo"
      className={className}
    >
      {/* 蒸汽 */}
      <path d="M18 7c0 2 2 2 2 4s-2 2-2 4" strokeWidth="1.6" opacity="0.7" />
      <path d="M24 5c0 2 2 2 2 4s-2 2-2 4" strokeWidth="1.6" opacity="0.9" />
      <path d="M30 7c0 2 2 2 2 4s-2 2-2 4" strokeWidth="1.6" opacity="0.7" />
      {/* 锅身 */}
      <path
        d="M7 22h34v3a14 14 0 0 1-14 14h-6a14 14 0 0 1-14-14v-3z"
        strokeWidth="2.2"
        fill="currentColor"
        fillOpacity="0.08"
      />
      {/* 锅把手 */}
      <path d="M41 22l5-2" strokeWidth="2.2" />
      <path d="M7 22l-5-2" strokeWidth="2.2" />
      {/* 锅内饭粒 */}
      <circle cx="20" cy="29" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="26" cy="31" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="30" cy="28" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <span className="text-primary">
        <Logo size={28} />
      </span>
      <span className="font-display text-[1.05rem] tracking-tight">
        今天吃<span className="text-primary">什么</span>
      </span>
    </div>
  );
}
