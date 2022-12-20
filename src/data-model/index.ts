import { get as idbGet, set as idbSet } from "idb-keyval";
import { atom, DefaultValue, selector, selectorFamily } from "recoil";
import { orderBy } from "../utils";
import type { AtomEffect } from "recoil";
import type {
  StatsChunk,
  StatsCompilation,
  StatsModule,
  StatsModuleReason,
} from "webpack";

const localStorageEffect =
  <T>(key: string): AtomEffect<T> =>
  ({ onSet, setSelf }) => {
    setSelf(
      idbGet(key).then((savedValue) =>
        savedValue ? JSON.parse(savedValue) : new DefaultValue(),
      ),
    );

    onSet((newValue, _, isReset) => {
      isReset ? idbSet(key, undefined) : idbSet(key, JSON.stringify(newValue));
    });
  };

export const statsState = atom<StatsCompilation | void>({
  key: "chunksState",
  default: undefined,
  effects: [localStorageEffect("stats.json")],
});

const chunksMapState = selector<Record<string, StatsChunk>>({
  key: "chunksMapState",
  get: ({ get }) => {
    const stats = get(statsState);
    const chunks = stats?.chunks ?? [];
    return chunks.reduce<Record<string, StatsChunk>>((map, next) => {
      if (next.id) {
        map[`${next.id}`] = next;
      }
      return map;
    }, {});
  },
});

export const chunksByIdState = selectorFamily<StatsChunk, string>({
  key: "chunksByIdState",
  get:
    (chunkId) =>
    ({ get }) => {
      const chunksMap = get(chunksMapState);
      return chunksMap[chunkId];
    },
});

export const topChunksState = selector<StatsChunk[]>({
  key: "topChunksState",
  get: ({ get }) => {
    const stats = get(statsState);
    const chunks = stats?.chunks ?? [];
    return chunks
      .filter(({ initial }) => initial)
      .sort(orderBy([({ size }) => size], ["desc"]));
  },
});

export const selectedChunkState = atom<string | void>({
  key: "selectedChunkState",
  default: undefined,
});

type SearchIndex = {
  key: string;
  valueId: string;
};
const chunksSearchIndexState = selector<SearchIndex[]>({
  key: "chunksSearchIndexState",
  get: ({ get }) => {
    const stats = get(statsState);
    const chunks = stats?.chunks ?? [];
    return chunks.map(({ id }) => ({
      key: `${id ?? ""}`.toLowerCase(),
      valueId: `${id ?? ""}`,
    }));
  },
});
export const searchChunksState = selectorFamily<string[], string>({
  key: "searchChunksState",
  get:
    (searchTerm) =>
    ({ get }) => {
      const searchIndex = get(chunksSearchIndexState);
      const normalisedSearchTerm = searchTerm.toLowerCase();
      return searchIndex
        .filter(({ key }) => key.includes(normalisedSearchTerm))
        .map(({ valueId }) => valueId);
    },
});

type ModuleDetails = { statsModule: StatsModule; chunks: string[] };
type ModulesMap = Record<string, ModuleDetails>;
export const modulesMapState = selector<ModulesMap>({
  key: "modulesMapState",
  get: ({ get }) => {
    const stats = get(statsState);
    const chunks = stats?.chunks ?? [];
    return chunks.reduce<ModulesMap>((map, chunk) => {
      if (chunk.id) {
        for (const mod of chunk.modules ?? []) {
          if (mod.id) {
            if (!map[mod.id]) {
              map[mod.id] = { statsModule: mod, chunks: [] };
            }
            map[mod.id].chunks.push(`${chunk.id}`);
          }
        }
      }
      return map;
    }, {});
  },
});

export const modulesByIdState = selectorFamily<ModuleDetails, string>({
  key: "modulesByIdState",
  get:
    (moduleId) =>
    ({ get }) => {
      const modulesMap = get(modulesMapState);
      return modulesMap[moduleId];
    },
});

const modulesSearchIndexState = selector<SearchIndex[]>({
  key: "modulesSearchIndexState",
  get: ({ get }) => {
    const stats = get(statsState);
    const chunks = stats?.chunks ?? [];
    return chunks.flatMap(
      ({ modules }) =>
        modules
          ?.filter(({ id }) => id)
          .map(({ id, identifier, nameForCondition }) => ({
            key: `${nameForCondition ?? identifier ?? ""}`.toLowerCase(),
            valueId: `${id ?? ""}`,
          })) ?? [],
    );
  },
});
export const searchModulesState = selectorFamily<string[], string>({
  key: "searchModulesState",
  get:
    (searchTerm) =>
    ({ get }) => {
      const searchIndex = get(modulesSearchIndexState);
      const normalisedSearchTerm = searchTerm.toLowerCase();
      return [
        ...new Set(
          searchIndex
            .filter(({ key }) => key.includes(normalisedSearchTerm))
            .map(({ valueId }) => valueId),
        ),
      ];
    },
});
export const modulesSearchIndexByChunkIdState = selectorFamily<
  SearchIndex[],
  string
>({
  key: "modulesSearchIndexByChunkIdState",
  get:
    (chunkId) =>
    ({ get }) => {
      const chunk = get(chunksByIdState(chunkId));
      return (
        chunk.modules
          ?.filter(({ id }) => id)
          .map(({ id, identifier, nameForCondition }) => ({
            key: `${nameForCondition ?? identifier ?? ""}`.toLowerCase(),
            valueId: `${id ?? ""}`,
          })) ?? []
      );
    },
});
export const searchModulesByChunkIdState = selectorFamily<
  string[],
  [string, string]
>({
  key: "searchModulesByChunkIdState",
  get:
    ([chunkId, searchTerm]) =>
    ({ get }) => {
      const searchIndex = get(modulesSearchIndexByChunkIdState(chunkId));
      const normalisedSearchTerm = searchTerm.toLowerCase();
      return [
        ...new Set(
          searchIndex
            .filter(({ key }) => key.includes(normalisedSearchTerm))
            .map(({ valueId }) => valueId),
        ),
      ];
    },
});
const modulesMapByChunkIdState = selectorFamily<
  Record<string, StatsModule>,
  string
>({
  key: "modulesMapByChunkId",
  get:
    (chunkId) =>
    ({ get }) => {
      const chunk = get(chunksByIdState(chunkId));
      return (
        chunk.modules?.reduce((map, next) => {
          if (next.id) {
            map[next.id] = next;
          }
          return map;
        }, {}) ?? []
      );
    },
});
export const moduleByChunkIdAndIdState = selectorFamily<
  StatsModule | void,
  [string, string]
>({
  key: "moduleByChunkIdAndIdState",
  get:
    ([chunkId, moduleId]) =>
    ({ get }) => {
      const modulesMap = get(modulesMapByChunkIdState(chunkId));
      return modulesMap[moduleId];
    },
});
export const selectedChunkIdState = atom<string | void>({
  key: "selectedChunkIdState",
  default: undefined,
});
export const selectedChunkIdWithDefaultState = selector<string | void>({
  key: "selectedChunkIdWithDefaultState",
  get: ({ get }) => {
    const selectedChunkId = get(selectedChunkIdState);
    const getTopChunkId = () => {
      const id = get(topChunksState)[0]?.id;
      return id ? `${id}` : undefined;
    };
    return selectedChunkId ?? getTopChunkId();
  },
});
export type ReasonDetails = {
  resolvedModule: string;
  moduleId: string | void;
  reasons: StatsModuleReason[];
};
export const reasonsByModuleId = selectorFamily<
  ReasonDetails[],
  [string, string]
>({
  key: "reasonModuleIdsByModuleId",
  get:
    ([chunkId, moduleId]) =>
    ({ get }) => {
      const statsModule = get(moduleByChunkIdAndIdState([chunkId, moduleId]));
      const reasons = statsModule?.reasons ?? [];
      const groupedReasons = reasons.reduce<
        Record<string, StatsModuleReason[]>
      >((map, next) => {
        if (next.resolvedModule) {
          if (!map[next.resolvedModule]) {
            map[next.resolvedModule] = [];
          }
          map[next.resolvedModule].push(next);
        }
        return map;
      }, {});
      return Object.entries(groupedReasons)
        .map(([resolvedModule, reasons]) => {
          const moduleId = reasons
            .map(({ moduleId }) => moduleId)
            .find((moduleId) => moduleId);
          return {
            resolvedModule,
            moduleId: moduleId ? `${moduleId}` : undefined,
            reasons,
          };
        })
        .filter(
          ({ moduleId }) =>
            (get(isWithMissingModuleIdState) && !moduleId) ||
            (moduleId && get(moduleByChunkIdAndIdState([chunkId, moduleId]))),
        );
    },
});
export const isWithMissingModuleIdState = atom<boolean>({
  key: "isWithMissingModuleIdState",
  default: false,
});
