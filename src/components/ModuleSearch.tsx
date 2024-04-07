import * as React from "react";
import ReactJson from "react-json-view";
import { useRecoilState, useRecoilValue } from "recoil";

import {
  childrenByModuleId,
  dependentSizeByModuleId,
  filterLowWidthState,
  isShowChildrenState,
  isSortByDependentSizeState,
  isWithMissingModuleIdState,
  maxReasonsUpByModuleId,
  moduleByChunkIdAndIdState,
  reasonsByModuleId,
  searchModulesByChunkIdState,
  selectedChunkIdWithDefaultState,
} from "../data-model";
import type { ReasonDetails } from "../data-model";

import styles from "./ModuleSearch.module.css";

export const ModuleSearch = React.memo(() => {
  const chunkId = useRecoilValue(selectedChunkIdWithDefaultState);
  return chunkId ? <ModuleSearchContent chunkId={chunkId} /> : null;
});

type ContentProps = {
  chunkId: string;
};
const ModuleSearchContent = React.memo(({ chunkId }: ContentProps) => {
  const [searchText, setSearchText] = React.useState("");
  const modules = useRecoilValue(
    searchModulesByChunkIdState([chunkId, searchText]),
  );

  const setSearchTextChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
    },
    [],
  );
  return (
    <div>
      <div className={styles.row}>
        <input
          autoFocus
          onChange={setSearchTextChange}
          placeholder="Module Search"
          value={searchText}
        />
        <WithMissingModuleIdCheckbox />
        <FilterLowWidthCheckbox />
        <SortByDependentSizeCheckbox />
        <ShowChildrenCheckbox />
      </div>
      {modules.map((moduleId) => (
        <ModuleLink chunkId={chunkId} key={moduleId} moduleId={moduleId} />
      ))}
    </div>
  );
});
const SortByDependentSizeCheckbox = React.memo(() => {
  // Note that dependent size is not the same as size that would be removed if it was removed
  const [isTrue, setIsTrue] = useRecoilState(isSortByDependentSizeState);
  const changeHandler = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsTrue(e.target.checked);
    },
    [setIsTrue],
  );
  return (
    <label>
      Sort by dependent size
      <input checked={isTrue} onChange={changeHandler} type="checkbox" />
    </label>
  );
});
const ShowChildrenCheckbox = React.memo(() => {
  const [isTrue, setIsTrue] = useRecoilState(isShowChildrenState);
  const changeHandler = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsTrue(e.target.checked);
    },
    [setIsTrue],
  );
  return (
    <label>
      Show children rather than parents
      <input checked={isTrue} onChange={changeHandler} type="checkbox" />
    </label>
  );
});
const WithMissingModuleIdCheckbox = React.memo(() => {
  const [isTrue, setIsTrue] = useRecoilState(isWithMissingModuleIdState);
  const changeHandler = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsTrue(e.target.checked);
    },
    [setIsTrue],
  );
  return (
    <label>
      With missing modules reasons
      <input checked={isTrue} onChange={changeHandler} type="checkbox" />
    </label>
  );
});
const FilterLowWidthCheckbox = React.memo(() => {
  const [isTrue, setIsTrue] = useRecoilState(filterLowWidthState);
  const changeHandler = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsTrue(e.target.checked);
    },
    [setIsTrue],
  );
  return (
    <label>
      Filter low width reasons
      <input checked={isTrue} onChange={changeHandler} type="checkbox" />
    </label>
  );
});

type ModuleLinkProps = {
  chunkId: string;
  moduleId: string;
};
const ModuleLink = React.memo(({ chunkId, moduleId }: ModuleLinkProps) => {
  const statsModule = useRecoilValue(
    moduleByChunkIdAndIdState([chunkId, moduleId]),
  );
  const isShowChildren = useRecoilValue(isShowChildrenState);
  const [isFocused, setIsFocused] = React.useState(false);
  const clickHandler = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setIsFocused((isFocused) => !isFocused);
  }, []);
  const { button, isInspecting } = useInspect();
  const stopPropHandler = useStopPropHandler();
  if (!statsModule) {
    return null;
  }
  return (
    <div>
      <div className={styles.name} onClick={clickHandler}>
        <Triangle direction={isFocused ? "down" : "right"} />
        {statsModule.nameForCondition ?? statsModule.identifier ?? "<unknown>"}
        {button}
        <ReasonsCount chunkId={chunkId} moduleId={moduleId} />
      </div>
      {isInspecting ? (
        <div onClick={stopPropHandler}>
          <ReactJson
            collapsed
            name={`${statsModule.id ?? "<unknown id>"}`}
            src={statsModule}
            theme="monokai"
          />
        </div>
      ) : null}
      {isFocused &&
        (isShowChildren ? (
          <Children chunkId={chunkId} moduleId={moduleId} />
        ) : (
          <Reasons chunkId={chunkId} moduleId={moduleId} />
        ))}
    </div>
  );
});
const useStopPropHandler = () => {
  const handler = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
  }, []);
  return handler;
};
const useInspect = () => {
  const [isInspecting, setIsInspecting] = React.useState(false);
  const inspectHandler = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      setIsInspecting((isInspecting) => !isInspecting);
    },
    [],
  );
  const button = (
    <button className={styles.inspect} onClick={inspectHandler}>
      i
    </button>
  );
  return {
    isInspecting,
    button,
  };
};

const ReasonsCount = React.memo(({ chunkId, moduleId }: ModuleLinkProps) => {
  const reasons = useRecoilValue(reasonsByModuleId([chunkId, moduleId]));
  const maxReasons = useRecoilValue(
    maxReasonsUpByModuleId([chunkId, moduleId]),
  );
  const dependentSize = useRecoilValue(
    dependentSizeByModuleId([chunkId, moduleId]),
  );
  return (
    <>
      <span
        className={styles.reasonsCount}
        title="Number of reasons (non recursive)"
      >
        r: {reasons.length}
      </span>
      |
      <span
        className={styles.reasonsCount}
        title="Max reasons recursive up the heirarchy"
      >
        Max r: {maxReasons}
      </span>
      |
      <span
        className={styles.reasonsCount}
        title="Size of all dependencies of module"
      >
        Dependent size:{" "}
        {dependentSize.toLocaleString(undefined, { compactDisplay: "short" })}
      </span>
    </>
  );
});
const Reasons = React.memo(({ chunkId, moduleId }: ModuleLinkProps) => {
  const reasons = useRecoilValue(reasonsByModuleId([chunkId, moduleId]));
  return (
    <ul>
      {reasons.map((reason, i) => (
        <li key={i}>
          <Reason chunkId={chunkId} reason={reason} />
        </li>
      ))}
    </ul>
  );
});
type ReasonProps = {
  reason: ReasonDetails;
  chunkId: string;
};
const Reason = ({
  chunkId,
  reason: { moduleId, reasons, resolvedModule },
}: ReasonProps) => {
  const { button, isInspecting } = useInspect();
  return (
    <>
      <div className={styles.row}>
        Resolved Module: {resolvedModule} {button}
      </div>
      {isInspecting ? (
        <ReactJson name="reasons" src={reasons} theme="monokai" />
      ) : null}
      {moduleId && <ModuleLink chunkId={chunkId} moduleId={moduleId} />}
    </>
  );
};
type TriangleProps = {
  direction: "down" | "right";
};
const Triangle = React.memo(({ direction }: TriangleProps) => {
  const classes = `${styles.triangle} ${
    direction === "right" ? styles.triangleRight : styles.triangleDown
  }`;
  return (
    <svg className={classes} viewBox="0 0 500 500">
      <polygon points="250,80 100,400 400,400" />
    </svg>
  );
});

const Children = React.memo(({ chunkId, moduleId }: ModuleLinkProps) => {
  const children = useRecoilValue(childrenByModuleId([chunkId, moduleId]));
  return (
    <ul>
      {children.map((moduleId, i) => (
        <li key={i}>
          <ModuleLink chunkId={chunkId} moduleId={moduleId} />
        </li>
      ))}
    </ul>
  );
});
