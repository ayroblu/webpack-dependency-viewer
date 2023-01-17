import React from "react";
import { useRecoilValue } from "recoil";

import { duplicateModulesState } from "../data-model";

export function DuplicateModules() {
  const duplicateModules = useRecoilValue(duplicateModulesState);
  return (
    <ul>
      {duplicateModules.map(([key, { bytes, duplicateBytes, names }]) => (
        <DuplicateModule
          bytes={bytes}
          chunks={names}
          duplicateBytes={duplicateBytes}
          id={key}
          key={key}
        />
      ))}
    </ul>
  );
}
function DuplicateModule({
  bytes,
  chunks,
  duplicateBytes,
  id,
}: {
  id: string;
  chunks: string[];
  bytes: number;
  duplicateBytes: number;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  return (
    <li>
      <span onClick={() => setIsExpanded((v) => !v)}>
        {id}:{" "}
        {isExpanded
          ? chunks.join(", ")
          : `in: ${
              chunks.length
            } chunks, totaling ${duplicateBytes.toLocaleString()} duplicated bytes`}
      </span>
    </li>
  );
}
