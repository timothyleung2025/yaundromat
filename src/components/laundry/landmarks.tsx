import { ShoppingBag, Box, ArrowDown } from "lucide-react";
export function FoldingTable() {
  return (
    <div className="landmark-table" role="img" aria-label="Folding table">
      <ShoppingBag size={21} strokeWidth={1.5} />
      <i aria-hidden="true" />
    </div>
  );
}
export function Cubbies({
  onClick,
  ownedCubbies,
}: {
  onClick: () => void;
  ownedCubbies: string[];
}) {
  return (
    <button
      className="landmark-cubbies"
      onClick={onClick}
      aria-label="View cubbies"
      aria-description={
        ownedCubbies.length
          ? `Your laundry is in ${Array.from(new Set(ownedCubbies)).join(", ")}`
          : undefined
      }
      aria-haspopup="dialog"
    >
      <Box size={21} strokeWidth={1.5} />
      <span>Cubbies</span>
      <span className="cubby-letters" aria-label="Cubbies A, B and C">
        {["A", "B", "C"].map((letter) => (
          <i
            key={letter}
            className={
              ownedCubbies.includes(`Cubby ${letter}`) ? "has-your-load" : ""
            }
          >
            {letter}
          </i>
        ))}
      </span>
    </button>
  );
}
export function Entrance() {
  return (
    <div className="landmark-entrance">
      <span className="door-swing" aria-hidden="true" />
      <span>
        Entrance <ArrowDown size={14} />
      </span>
    </div>
  );
}
export function RoomNote() {
  return (
    <div className="room-note" aria-hidden="true">
      <svg className="laundry-buddy" viewBox="0 0 80 88" fill="none">
        <circle cx="66" cy="15" r="7" fill="#fff8f3" />
        <circle cx="12" cy="23" r="4" fill="#fff8f3" />
        <path
          d="M19 33Q19 19 32 19H51Q62 19 62 33V66Q62 74 54 74H25Q17 74 17 65Z"
          fill="#FFF8F3"
        />
        <path d="M22 36H59" stroke="#EADFD5" strokeWidth="2" />
        <rect x="25" y="26" width="12" height="3" rx="1.5" fill="#AFCFEA" />
        <circle cx="53" cy="28" r="2" fill="#729BC1" />
        <circle cx="40" cy="53" r="14" fill="#C4DEF1" />
        <path
          d="M31 57Q40 65 49 57"
          stroke="#43688E"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="34" cy="50" r="1.5" fill="#43688E" />
        <circle cx="46" cy="50" r="1.5" fill="#43688E" />
        <ellipse cx="29" cy="55" rx="3" ry="2" fill="#EAAE9D" />
        <ellipse cx="51" cy="55" rx="3" ry="2" fill="#EAAE9D" />
        <path
          d="M15 51L8 46M64 51L70 44M29 75L25 80M51 75L55 80"
          stroke="#729BC1"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M57 5V11M54 8H60"
          stroke="#E4B76C"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
export function Plant() {
  return (
    <div className="room-plant" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
      <span />
    </div>
  );
}
