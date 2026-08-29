import { useEffect, useMemo, useState } from 'react';
import { X, Search, Download, Check, Package, AlertTriangle, Loader2 } from 'lucide-react';
import type { ModItem, ModLoader, ServerType } from '../types/server';
import { filterMods } from '../data/modCatalog';
import { Button, Card } from './ui';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'optimization', label: 'Optimización' },
  { id: 'utility', label: 'Utilidad' },
  { id: 'tech', label: 'Tech' },
  { id: 'magic', label: 'Magia' },
  { id: 'adventure', label: 'Aventura' },
  { id: 'gameplay', label: 'Gameplay' },
  { id: 'cosmetic', label: 'Cosmético' },
  { id: 'map', label: 'Mapas' },
];

const LOADERS: { id: ModLoader; label: string; only?: ServerType }[] = [
  { id: 'vanilla', label: 'Vanilla / Paper', only: 'java' },
  { id: 'paper', label: 'Paper', only: 'java' },
  { id: 'fabric', label: 'Fabric', only: 'java' },
  { id: 'forge', label: 'Forge', only: 'java' },
  { id: 'quilt', label: 'Quilt', only: 'java' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  platform: ServerType;
  mcVersion: string;
  loader?: ModLoader;
  onLoaderChange?: (loader: ModLoader) => void;
  selectedIds: string[];
  onChangeSelected: (ids: string[]) => void;
}

function mapCategory(cats: string[]): ModItem['category'] {
  const c = cats.map(x => x.toLowerCase());
  if (c.some(x => x.includes('optim'))) return 'optimization';
  if (c.some(x => x.includes('magic') || x.includes('magic'))) return 'magic';
  if (c.some(x => x.includes('tech') || x.includes('technology'))) return 'tech';
  if (c.some(x => x.includes('adventure'))) return 'adventure';
  if (c.some(x => x.includes('decoration') || x.includes('cosmetic'))) return 'cosmetic';
  if (c.some(x => x.includes('world') || x.includes('map'))) return 'map';
  if (c.some(x => x.includes('utility') || x.includes('library'))) return 'utility';
  return 'gameplay';
}

async function searchModrinth(query: string, loader: ModLoader, version: string): Promise<ModItem[]> {
  const facets: string[][] = [['project_type:mod']];
  if (loader && loader !== 'vanilla' && loader !== 'paper') {
    facets.push([`categories:${loader}`]);
  }
  const ver = version.split('.').slice(0, 2).join('.');
  if (ver) facets.push([`versions:${version}`, `versions:${ver}`]);

  const url =
    'https://api.modrinth.com/v2/search?' +
    new URLSearchParams({
      query: query || 'fabric',
      limit: '24',
      index: 'downloads',
      facets: JSON.stringify(facets),
    });

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Modrinth HTTP ' + res.status);
  const data = await res.json();
  const hits = Array.isArray(data.hits) ? data.hits : [];
  return hits.map((h: any) => ({
    id: String(h.slug || h.project_id),
    name: String(h.title || h.slug),
    description: String(h.description || ''),
    author: String(h.author || 'Modrinth'),
    platform: 'java' as const,
    loaders: (h.categories || []).filter((c: string) =>
      ['fabric', 'forge', 'quilt', 'neoforge'].includes(c)
    ),
    versions: Array.isArray(h.versions) ? h.versions.slice(0, 8) : [version],
    category: mapCategory(h.categories || []),
    sizeMb: 1,
    badge: h.downloads > 10_000_000 ? 'Popular' : undefined,
    iconUrl: h.icon_url || undefined,
    downloads: h.downloads,
  }));
}

function ModCover({ mod }: { mod: ModItem }) {
  const [failed, setFailed] = useState(false);
  if (mod.iconUrl && !failed) {
    return (
      <img
        src={mod.iconUrl}
        alt=""
        className="w-12 h-12 rounded-xl object-cover bg-slate-800 shrink-0"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
      <Package className="w-6 h-6 text-emerald-400" />
    </div>
  );
}

export function ModStore({
  open,
  onClose,
  platform,
  mcVersion,
  loader = 'vanilla',
  onLoaderChange,
  selectedIds,
  onChangeSelected,
}: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [remote, setRemote] = useState<ModItem[] | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || platform !== 'java') return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoadingRemote(true);
      setRemoteError(null);
      try {
        const list = await searchModrinth(query, loader, mcVersion);
        if (!cancelled) setRemote(list);
      } catch (e: any) {
        if (!cancelled) {
          setRemote(null);
          setRemoteError('Sin conexión a Modrinth. Mostrando catálogo local.');
        }
      } finally {
        if (!cancelled) setLoadingRemote(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, platform, query, loader, mcVersion]);

  const localMods = useMemo(
    () => filterMods(platform, mcVersion, platform === 'java' ? loader : undefined, query, category),
    [platform, mcVersion, loader, query, category]
  );

  const mods = useMemo(() => {
    if (platform !== 'java') return localMods;
    const list = remote && remote.length > 0 ? remote : localMods;
    if (category === 'all') return list;
    return list.filter(m => m.category === category);
  }, [platform, remote, localMods, category]);

  if (!open) return null;

  const toggle = (mod: ModItem) => {
    if (selectedIds.includes(mod.id)) {
      onChangeSelected(selectedIds.filter(id => id !== mod.id));
    } else {
      onChangeSelected([...selectedIds, mod.id]);
    }
  };

  const title = platform === 'java' ? 'Tienda de mods' : 'Tienda de addons';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <Card className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-b-none sm:rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-700 shrink-0">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              {title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {platform === 'java' ? 'Java · Modrinth' : 'Bedrock'} · {mcVersion}
              {platform === 'java' ? ` · ${loader}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {platform === 'java' && onLoaderChange && (
          <div className="px-4 pt-3 flex gap-1.5 overflow-x-auto shrink-0">
            {LOADERS.filter(l => !l.only || l.only === 'java').map(l => (
              <button
                key={l.id}
                type="button"
                onClick={() => onLoaderChange(l.id)}
                className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap border transition-colors ${
                  loader === l.id
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}

        <div className="px-4 py-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar en Modrinth..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:outline-none text-sm"
            />
          </div>
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap border transition-colors ${
                  category === c.id
                    ? 'bg-slate-100 text-slate-900 border-slate-100'
                    : 'border-slate-600 text-slate-400'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          {remoteError && <p className="text-[11px] text-amber-400 mt-2">{remoteError}</p>}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-2">
          {loadingRemote && (
            <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Buscando mods reales...
            </div>
          )}
          {!loadingRemote && mods.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No hay mods compatibles con esta versión
              {platform === 'java' ? ` / ${loader}` : ''}.
            </div>
          ) : (
            mods.map(mod => {
              const selected = selectedIds.includes(mod.id);
              return (
                <div
                  key={mod.id}
                  className={`p-3 rounded-xl border transition-colors ${
                    selected
                      ? 'border-emerald-500 bg-emerald-950/30'
                      : 'border-slate-700 bg-slate-900/40'
                  }`}
                >
                  <div className="flex gap-3">
                    <ModCover mod={mod} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm">{mod.name}</span>
                        {mod.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                            {mod.badge}
                          </span>
                        )}
                        {mod.heavy && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300 flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> Pesado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{mod.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>{mod.author}</span>
                        {mod.downloads ? (
                          <>
                            <span>·</span>
                            <span>{mod.downloads > 1000000 ? `${(mod.downloads / 1000000).toFixed(1)}M` : `${Math.round(mod.downloads / 1000)}k`} descargas</span>
                          </>
                        ) : (
                          <>
                            <span>·</span>
                            <span>~{mod.sizeMb} MB</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggle(mod)}
                      className={`shrink-0 self-center px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                        selected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                      }`}
                    >
                      {selected ? (
                        <><Check className="w-3.5 h-3.5" /> Añadido</>
                      ) : (
                        <><Download className="w-3.5 h-3.5" /> Añadir</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-slate-700 flex items-center justify-between gap-3 shrink-0">
          <div className="text-sm text-slate-400">
            {selectedIds.length === 0
              ? 'Ningún mod seleccionado'
              : `${selectedIds.length} seleccionado${selectedIds.length > 1 ? 's' : ''}`}
          </div>
          <Button onClick={onClose}>Listo</Button>
        </div>
      </Card>
    </div>
  );
}

