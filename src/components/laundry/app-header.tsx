import Image from "next/image";
import { Map, Shirt, Sparkles } from "lucide-react";
export function AppHeader({
  onMap,
  onLoads,
}: {
  onMap: () => void;
  onLoads: () => void;
}) {
  return (
    <header className="map-app-header">
      <a href="/" className="editorial-brand" aria-label="Yaundromat home">
        <Image
          src="/icon.svg"
          alt=""
          className="wordmark-machine"
          width={40}
          height={40}
        />
        <span>
          <span className="brand-title">
            Yaundromat <Sparkles size={15} />
          </span>
          <span className="brand-tagline">CLEANER DAYS AT YALE</span>
        </span>
      </a>
      <div className="header-utilities">
        <button onClick={onMap} aria-label="View laundry room map">
          <Map size={21} />
        </button>
        <button onClick={onLoads} aria-label="See your loads">
          <Shirt size={20} />
        </button>
      </div>
    </header>
  );
}
