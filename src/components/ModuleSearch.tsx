import * as React from "react";
import ReactJson from "react-json-view";
import { useRecoilState, useRecoilValue } from "recoil";

import {
  isWithMissingModuleIdState,
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
      </div>
      {modules.map((moduleId) => (
        <ModuleLink chunkId={chunkId} key={moduleId} moduleId={moduleId} />
      ))}
    </div>
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

type ModuleLinkProps = {
  chunkId: string;
  moduleId: string;
};
const ModuleLink = React.memo(({ chunkId, moduleId }: ModuleLinkProps) => {
  const statsModule = useRecoilValue(
    moduleByChunkIdAndIdState([chunkId, moduleId]),
  );
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
      {isFocused && <Reasons chunkId={chunkId} moduleId={moduleId} />}
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

const Reasons = React.memo(({ chunkId, moduleId }: ModuleLinkProps) => {
  const reasons = useRecoilValue(reasonsByModuleId([chunkId, moduleId]));
  const stopPropHandler = useStopPropHandler();
  return (
    <ul onClick={stopPropHandler}>
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
