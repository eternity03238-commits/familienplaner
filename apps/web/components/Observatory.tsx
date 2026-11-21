/**
 * The Observatorium — FamilyOS's single authored scenic motif (V2: one scenic hero per relevant screen).
 * Self-authored SVG ported from design/familyos-orbit-wow; two user-controlled lighting states.
 * Decorative: the hero text carries the meaning, so the drawing is aria-hidden.
 */
export function Observatory({ world }: { world: "dusk" | "night" }) {
  const night = world === "night";
  return (
    <svg className="fo-observatory" viewBox="0 0 360 195" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`fo-sky-${world}`} x1="0" y1="0" x2="1" y2="1">
          {night ? <><stop stopColor="#0E1233" /><stop offset=".6" stopColor="#1E2357" /><stop offset="1" stopColor="#3B3474" /></>
                 : <><stop stopColor="#222457" /><stop offset=".52" stopColor="#775185" /><stop offset="1" stopColor="#E9A67B" /></>}
        </linearGradient>
        <linearGradient id={`fo-mount-${world}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={night ? "#262A55" : "#393669"} /><stop offset="1" stopColor="#151937" /></linearGradient>
      </defs>
      <rect width="360" height="195" fill={`url(#fo-sky-${world})`} />
      <circle cx="281" cy="51" r="37" fill={night ? "#C9D4FF" : "#FFDBB0"} opacity={night ? 0.12 : 0.22} />
      <circle cx="281" cy="51" r="24" fill={night ? "#E6ECFF" : "#FFE7B4"} opacity={night ? 0.5 : 0.34} />
      <path d="M0 155L55 87 98 140 149 66 221 154 274 99 360 172V195H0Z" fill={night ? "#3A3D74" : "#686191"} opacity=".65" />
      <path d="M0 190L69 139 112 167 177 97 236 169 307 128 360 172V195H0Z" fill={`url(#fo-mount-${world})`} />
      <path d="M201 169L229 145 262 150 301 139 336 162 359 195H185Z" fill="#16192D" />
      <rect x="249" y="106" width="54" height="70" rx="5" fill="#23213E" stroke="#FFCF96" strokeWidth="2" />
      <path d="M241 108Q277 62 311 108Z" fill="#4E3C67" stroke="#FFD29A" strokeWidth="3" />
      <path d="M276 77V67M249 98L260 90M304 98L294 90" stroke="#FFC997" strokeWidth="2" />
      <rect x="260" y="126" width="11" height="20" rx="5" fill="#FFC57D" />
      <rect x="279" y="126" width="11" height="20" rx="5" fill="#FFC57D" />
      <path d="M280 176V156" stroke="#FFBB7A" strokeWidth="3" />
      {(night ? [[56, 42], [138, 28], [215, 38], [336, 38], [24, 80], [96, 62], [178, 18], [242, 72], [312, 92], [160, 52]] : [[56, 42], [138, 28], [215, 38], [336, 38]])
        .map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={night ? 1.3 : 1.5} fill="#FFFFFF" opacity={night ? 0.9 : 1} />)}
    </svg>
  );
}
