import React from "react";
import { useRecoilValue } from "recoil";

import { duplicateModulesState } from "../data-model";

export function DuplicateModules() {
  const duplicateModules = useRecoilValue(duplicateModulesState);
  return (
    <ul>
      {duplicateModules.map(([key, chunks]) => (
        <DuplicateModule chunks={chunks} id={key} key={key} />
      ))}
    </ul>
  );
}
function DuplicateModule({ chunks, id }: { id: string; chunks: string[] }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  return (
    <li onClick={() => setIsExpanded((v) => !v)}>
      {id}: {isExpanded ? chunks.join(", ") : chunks.length}
    </li>
  );
}
