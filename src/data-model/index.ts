import { get as idbGet, set as idbSet } from "idb-keyval";
import { atom, DefaultValue, selector, selectorFamily } from "recoil";
import type { AtomEffect } from "recoil";
import type {
  StatsChunk,
  StatsCompilation,
  StatsModule,
  StatsModuleReason,
} from "webpack";

import { orderBy } from "../utils";

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

const chunksByIdState = selectorFamily<StatsChunk, string>({
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

// export const selectedChunkState = atom<string | void>({
//   key: "selectedChunkState",
//   default: undefined,
// });

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

// type ModuleDetails = { statsModule: StatsModule; chunks: string[] };
// type ModulesMap = Record<string, ModuleDetails>;
// const modulesMapState = selector<ModulesMap>({
//   key: "modulesMapState",
//   get: ({ get }) => {
//     const stats = get(statsState);
//     const chunks = stats?.chunks ?? [];
//     return chunks.reduce<ModulesMap>((map, chunk) => {
//       if (chunk.id) {
//         for (const mod of chunk.modules ?? []) {
//           if (mod.id) {
//             if (!map[mod.id]) {
//               map[mod.id] = { statsModule: mod, chunks: [] };
//             }
//             map[mod.id].chunks.push(`${chunk.id}`);
//           }
//         }
//       }
//       return map;
//     }, {});
//   },
// });

// const modulesByIdState = selectorFamily<ModuleDetails, string>({
//   key: "modulesByIdState",
//   get:
//     (moduleId) =>
//     ({ get }) => {
//       const modulesMap = get(modulesMapState);
//       return modulesMap[moduleId];
//     },
// });

// const modulesSearchIndexState = selector<SearchIndex[]>({
//   key: "modulesSearchIndexState",
//   get: ({ get }) => {
//     const stats = get(statsState);
//     const chunks = stats?.chunks ?? [];
//     return chunks.flatMap(
//       ({ modules }) =>
//         modules
//           ?.filter(({ id }) => id)
//           .map(({ id, identifier, nameForCondition }) => ({
//             key: `${nameForCondition ?? identifier ?? ""}`.toLowerCase(),
//             valueId: `${id ?? ""}`,
//           })) ?? [],
//     );
//   },
// });
// const searchModulesState = selectorFamily<string[], string>({
//   key: "searchModulesState",
//   get:
//     (searchTerm) =>
//     ({ get }) => {
//       const searchIndex = get(modulesSearchIndexState);
//       const normalisedSearchTerm = searchTerm.toLowerCase();
//       return [
//         ...new Set(
//           searchIndex
//             .filter(({ key }) => key.includes(normalisedSearchTerm))
//             .map(({ valueId }) => valueId),
//         ),
//       ];
//     },
// });
const modulesSearchIndexByChunkIdState = selectorFamily<SearchIndex[], string>({
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
      const isFilterLowWidth = get(filterLowWidthState);
      const isSortByDependentSize = get(isSortByDependentSizeState);
      const searchIndex = get(modulesSearchIndexByChunkIdState(chunkId));
      const normalisedSearchTerm = searchTerm.toLowerCase();
      const foundItems = [
        ...new Set(
          searchIndex
            .filter(({ key }) => key.includes(normalisedSearchTerm))
            .map(({ valueId }) => valueId),
        ),
      ];
      if (isSortByDependentSize) {
        foundItems.sort(
          orderBy(
            [(moduleId) => get(dependentSizeByModuleId([chunkId, moduleId]))],
            ["desc"],
          ),
        );
      }
      if (isFilterLowWidth) {
        return foundItems.filter(
          (moduleId) => get(maxReasonsUpByModuleId([chunkId, moduleId])) <= 2,
        );
        // .filter((moduleId) =>
        //   get(isCustomFilterInByModuleId([chunkId, moduleId])),
        // );
      } else {
        return foundItems;
      }
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
  key: "reasonsByModuleId",
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
export const isSortByDependentSizeState = atom<boolean>({
  key: "isSortByDependentSizeState",
  default: false,
});
const maxReasonsMapByChunkId = selectorFamily<Record<string, number>, string>({
  key: "maxReasonsMapByChunkId",
  get:
    (chunkId) =>
    ({ get }) => {
      const chunk = get(chunksByIdState(chunkId));
      const modules = chunk.modules ?? [];
      const seenIds = new Set<string>();
      const widthsByModuleId: Record<string, number> = {};

      function getWidth(moduleId: string) {
        if (widthsByModuleId[moduleId] !== undefined)
          return widthsByModuleId[moduleId];
        // seenIds.add(moduleId);
        const reasons = get(reasonsByModuleId([chunkId, moduleId]));
        if (seenIds.has(moduleId)) return reasons.length;
        seenIds.add(moduleId); // cut off any cycles, we assume that we've traversed all the elements of the cycle, so not getting any new info

        const reasonModuleIds = [
          ...new Set(
            reasons
              .map(({ moduleId }) => moduleId)
              .filter((moduleId) => moduleId)
              .map((moduleId) => `${moduleId}`),
          ),
        ];
        const result = Math.max(
          reasonModuleIds.length,
          ...reasonModuleIds.map((moduleId) => getWidth(moduleId)),
        );
        widthsByModuleId[moduleId] = result;
        return result;
      }
      for (const m of modules) {
        if (m.id === undefined) continue;
        const moduleId = `${m.id}`;
        getWidth(moduleId);
      }
      return widthsByModuleId;
    },
});
export const maxReasonsUpByModuleId = selectorFamily<number, [string, string]>({
  key: "maxReasonsUpByModuleId",
  get:
    ([chunkId, moduleId]) =>
    ({ get }) => {
      const maxReasonsMap = get(maxReasonsMapByChunkId(chunkId));
      return maxReasonsMap[moduleId];
    },
});
const dependentGraphMapByChunkId = selectorFamily<
  Map<string, Set<string>>,
  string
>({
  key: "dependentGraphMapByChunkId",
  get:
    (chunkId) =>
    ({ get }) => {
      const chunk = get(chunksByIdState(chunkId));
      const modules = chunk.modules ?? [];
      const seenIds = new Set<string>();

      const graph = new Map<string, Set<string>>();
      function buildGraph(moduleId: string) {
        if (seenIds.has(moduleId)) return;
        seenIds.add(moduleId);
        const reasons = get(reasonsByModuleId([chunkId, moduleId]));

        const reasonModuleIds = [
          ...new Set(
            reasons
              .map(({ moduleId }) => moduleId)
              .filter((moduleId) => moduleId)
              .map((moduleId) => `${moduleId}`),
          ),
        ];
        for (const reasonModuleId of reasonModuleIds) {
          const set =
            graph.get(reasonModuleId) ??
            (() => {
              const newSet = new Set<string>();
              graph.set(reasonModuleId, newSet);
              return newSet;
            })();
          set.add(moduleId);
        }
      }
      // Don't have "children", so reasons gives parents, build the graph, then traverse down
      for (const m of modules) {
        if (m.id === undefined) continue;
        const moduleId = `${m.id}`;
        buildGraph(moduleId);
      }
      return graph;
    },
});
export const childrenByModuleId = selectorFamily<string[], [string, string]>({
  key: "childrenByModuleId",
  get:
    ([chunkId, moduleId]) =>
    ({ get }) => {
      const graph = get(dependentGraphMapByChunkId(chunkId));
      const isSort = get(isSortByDependentSizeState);
      const children = [...(graph.get(moduleId) ?? new Set())];
      if (isSort) {
        children.sort(
          orderBy(
            [(moduleId) => get(dependentSizeByModuleId([chunkId, moduleId]))],
            ["desc"],
          ),
        );
      }
      return children;
    },
});
const dependentSizeMapByChunkId = selectorFamily<
  Record<string, number>,
  string
>({
  key: "dependentSizeMapByChunkId",
  get:
    (chunkId) =>
    ({ get }) => {
      const chunk = get(chunksByIdState(chunkId));
      const modules = chunk.modules ?? [];

      const root = modules[0]?.issuerPath?.[0].id;
      if (!root) {
        return {};
      }
      const graph = get(dependentGraphMapByChunkId(chunkId));

      const seenIds = new Set<string>();
      const dependentSizeByModuleId: Record<string, number> = {};
      function getDependentSize(moduleId: string): number {
        if (dependentSizeByModuleId[moduleId] !== undefined)
          return dependentSizeByModuleId[moduleId];
        // For a cycle, further imports are worth 0
        if (seenIds.has(moduleId)) return 0;
        seenIds.add(moduleId);
        const statsModule = get(moduleByChunkIdAndIdState([chunkId, moduleId]));
        const currentSize = statsModule?.size ?? 0;
        const children = graph.get(moduleId) ?? new Set();
        const childIds = [...children];

        const result =
          currentSize +
          childIds.reduce(
            (sum, moduleId) => sum + getDependentSize(moduleId),
            0,
          );
        dependentSizeByModuleId[moduleId] = result;
        return result;
      }
      getDependentSize(root.toString());
      return dependentSizeByModuleId;
    },
});
export const dependentSizeByModuleId = selectorFamily<number, [string, string]>(
  {
    key: "dependentSizeByModuleId",
    get:
      ([chunkId, moduleId]) =>
      ({ get }) => {
        // const dependentSizeMap = get(dependentSizeMapByChunkId(chunkId));
        // return dependentSizeMap[moduleId] ?? 0;

        const graph = get(dependentGraphMapByChunkId(chunkId));

        const seenIds = new Set<string>();
        function getDependentSize(moduleId: string): number {
          // For a cycle, further imports are worth 0
          if (seenIds.has(moduleId)) return 0;
          seenIds.add(moduleId);
          const statsModule = get(
            moduleByChunkIdAndIdState([chunkId, moduleId]),
          );
          const currentSize = statsModule?.size ?? 0;
          const children = graph.get(moduleId) ?? new Set();
          const childIds = [...children];

          const result =
            currentSize +
            childIds.reduce(
              (sum, moduleId) => sum + getDependentSize(moduleId),
              0,
            );
          return result;
        }
        return getDependentSize(moduleId);
      },
  },
);
export const isShowChildrenState = atom<boolean>({
  key: "isShowChildrenState",
  default: false,
});
// const customFilterExclude = ["initializeHorizonWeb"];
// export const isCustomFilterInByModuleId = selectorFamily<
//   boolean,
//   [string, string]
// >({
//   key: "isCustomFilterInByModuleId",
//   get:
//     ([chunkId, moduleId]) =>
//     ({ get }) => {
//       const seenIds = new Set([moduleId]);
//       let moduleIds = [moduleId];
//       while (moduleIds.length) {
//         const nextModuleIds = [];
//         for (const moduleId of moduleIds) {
//           seenIds.add(moduleId);
//           const reasons = get(reasonsByModuleId([chunkId, moduleId]));
//           if (
//             reasons.some(({ resolvedModule }) =>
//               customFilterExclude.some((t) => resolvedModule.includes(t)),
//             )
//           ) {
//             return false;
//           }
//           nextModuleIds.push(
//             ...reasons
//               .map(({ moduleId }) => moduleId)
//               .filter((moduleId) => moduleId)
//               .map((moduleId) => `${moduleId}`)
//               .filter((moduleId) => !seenIds.has(moduleId)),
//           );
//         }
//         moduleIds = [...new Set(nextModuleIds)];
//       }
//       return true;
//     },
// });
export const filterLowWidthState = atom<boolean>({
  key: "filterLowWidthState",
  default: false,
});

export const isShowDuplicatesState = atom<boolean>({
  key: "isShowDuplicatesState",
  default: true,
});

export const duplicatesSortByBytesState = atom<boolean>({
  key: "duplicatesSortByBytesState",
  default: false,
});

// app -> chunks -> modules
export const duplicateModulesState = selector({
  key: "duplicateModulesState",
  get: ({ get }) => {
    const stats = get(statsState);
    console.log(stats);
    const duplicatesSortByBytes = get(duplicatesSortByBytesState);
    const chunks = stats?.chunks ?? [];
    const containingModules: { [id: string]: string[] } = {};
    const bytesByModuleId: { [id: string]: number } = {};
    for (const chunk of chunks) {
      for (const m of chunk.modules ?? []) {
        if (!m.identifier) continue;
        const id = m.identifier.replace(/.*workspace\/web\//g, "");
        if (!id.endsWith(".js")) continue;
        if (!(id in containingModules)) containingModules[id] = [];
        containingModules[id].push((chunk.id ?? "<unknown chunk>").toString());
        if (bytesByModuleId[id]) {
          if (bytesByModuleId[id] !== m.size) {
            console.log("wrong", id, m.size, bytesByModuleId[id]);
          }
        } else {
          if (m.size) {
            if (!Number.isInteger(m.size)) {
              console.log("fraction", id, m.size);
            }
            bytesByModuleId[id] = m.size;
          }
        }
      }
    }
    const containingModulesList = Object.entries(containingModules);
    console.log(
      containingModulesList
        .map(([id, containingModules]) => [
          id,
          bytesByModuleId[id] * (containingModules.length - 1),
        ])
        .sort(orderBy([([, bytes]) => bytes], ["desc"]))
        .map(([id, num]) => `${id}: ${num.toLocaleString()}`)
        .slice(0, 20),
    );
    const totalDuplicatedBytes = containingModulesList.reduce(
      (total, [id, containingModules]) =>
        total + (bytesByModuleId[id] ?? 0) * (containingModules.length - 1),
      0,
    );
    const totalBytes = containingModulesList.reduce(
      (total, [id, containingModules]) =>
        total + (bytesByModuleId[id] ?? 0) * containingModules.length,
      0,
    );
    const containingModulesListOrdered = containingModulesList
      .map(
        ([id, names]) =>
          [
            id,
            {
              names,
              bytes: bytesByModuleId[id] ?? 0,
              duplicateBytes: (bytesByModuleId[id] ?? 0) * (names.length - 1),
            },
          ] as const,
      )
      .sort(
        orderBy(
          [
            ([, { duplicateBytes, names }]) =>
              !duplicatesSortByBytes ? names.length : duplicateBytes,
          ],
          ["desc"],
        ),
      );
    console.log(
      "duplicated bytes",
      totalDuplicatedBytes.toLocaleString(),
      "out of",
      totalBytes.toLocaleString(),
    );
    return containingModulesListOrdered;
  },
});
