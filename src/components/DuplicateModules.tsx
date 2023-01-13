import { useRecoilValue } from "recoil";

import { duplicateModulesState } from "../data-model";

export function DuplicateModules() {
  const duplicateModules = useRecoilValue(duplicateModulesState);
  return (
    <ul>
      {duplicateModules.map(([key, count]) => (
        <li key={key}>
          {key}: {count}
        </li>
      ))}
    </ul>
  );
}
