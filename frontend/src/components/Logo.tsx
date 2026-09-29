export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="28" height="28" rx="8" fill="#7C5CFC" />
      {/* Two offset bars suggesting a cut/shortened link, arranged as an abstract S-curve */}
      <path
        d="M8.5 10.5C8.5 9.11929 9.61929 8 11 8H16.5C17.3284 8 18 8.67157 18 9.5C18 10.3284 17.3284 11 16.5 11H11.5C11.2239 11 11 11.2239 11 11.5C11 11.7761 11.2239 12 11.5 12H14"
        stroke="white"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M19.5 17.5C19.5 18.8807 18.3807 20 17 20H11.5C10.6716 20 10 19.3284 10 18.5C10 17.6716 10.6716 17 11.5 17H16.5C16.7761 17 17 16.7761 17 16.5C17 16.2239 16.7761 16 16.5 16H14"
        stroke="white"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Logo({ size = 24, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      {withWordmark && (
        <span className="text-[17px] font-semibold tracking-tight text-text">Snip</span>
      )}
    </span>
  )
}
