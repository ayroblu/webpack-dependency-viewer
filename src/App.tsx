import * as React from "react";
import { RecoilRoot, useRecoilState, useRecoilValue } from "recoil";

import { ChunkSelector } from "./components/ChunkSelector";
import { DuplicateModules } from "./components/DuplicateModules";
import { FileInput } from "./components/FileInput";
import { ModuleSearch } from "./components/ModuleSearch";
import {
  duplicatesSortByBytesState,
  isShowDuplicatesState,
} from "./data-model";

function App() {
  return (
    <RecoilRoot>
      <React.Suspense fallback={<div>Loading</div>}>
        <Layout />
      </React.Suspense>
    </RecoilRoot>
  );
}
function Layout() {
  return (
    <div>
      <FileInput />
      <Decision />
    </div>
  );
}
function Decision() {
  const isDuplicates = useRecoilValue(isShowDuplicatesState);
  return (
    <div>
      <DecisionCheckbox />
      {isDuplicates ? (
        <>
          <DuplicatesOrderCheckbox />
          <DuplicateModules />
        </>
      ) : (
        <>
          <ChunkSelector />
          <ModuleSearch />
        </>
      )}
    </div>
  );
}
const DecisionCheckbox = React.memo(() => {
  const [isShowDuplicates, setIsShowDuplicates] = useRecoilState(
    isShowDuplicatesState,
  );
  const changeHandler = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsShowDuplicates(e.target.checked);
    },
    [setIsShowDuplicates],
  );
  return (
    <label>
      Show duplicates modules in multiple chunks
      <input
        checked={isShowDuplicates}
        onChange={changeHandler}
        type="checkbox"
      />
    </label>
  );
});

const DuplicatesOrderCheckbox = React.memo(() => {
  const [, setIsBytesSort] = useRecoilState(duplicatesSortByBytesState);
  return (
    <Checkbox
      label="Order duplicates by duplicated bytes size"
      onChange={setIsBytesSort}
    />
  );
});
const Checkbox = React.memo(
  ({
    label,
    onChange,
  }: {
    label: string;
    onChange: (value: boolean) => void;
  }) => {
    const changeHandler = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.checked);
      },
      [onChange],
    );
    return (
      <label>
        {label}
        <input onChange={changeHandler} type="checkbox" />
      </label>
    );
  },
);

export default App;
