import { useRecoilValue } from "recoil";

import { selectedChunkIdWithDefaultState } from "../data-model";

import { ChunkSearch } from "./ChunkSearch";
import styles from "./ChunkSelector.module.css";

export const ChunkSelector = () => {
  const chunk = useRecoilValue(selectedChunkIdWithDefaultState);
  return (
    <div>
      {!chunk ? (
        "No chunks available, add a valid stats.json file"
      ) : (
        <div className={styles.container}>
          selected chunk: {chunk}
          <ChunkSearch />
        </div>
      )}
    </div>
  );
};
