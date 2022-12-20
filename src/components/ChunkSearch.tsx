import * as React from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { searchChunksState, selectedChunkIdState } from '../data-model';

export const ChunkSearch = () => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [searchText, setSearchText] = React.useState('');
  const chunks = useRecoilValue(searchChunksState(searchText));

  const setSearchTextChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
    },
    []
  );
  const clickHandler = React.useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      e.stopPropagation();
    },
    []
  );
  const setFocusHandler = React.useCallback(() => {
    setIsFocused(true);
  }, []);
  const setUnfocusHandler = React.useCallback(() => {
    setIsFocused(false);
  }, []);
  React.useEffect(() => {
    const func = () => {
      setIsFocused(false);
    };
    document.addEventListener('click', func);
    return () => {
      document.removeEventListener('click', func);
    };
  }, []);
  return (
    <div>
      <input
        onChange={setSearchTextChange}
        onClick={clickHandler}
        onFocus={setFocusHandler}
        placeholder="Chunk search"
        value={searchText}
      />
      {isFocused &&
        chunks.map((chunkId) => (
          <ChunkLink
            chunkId={chunkId}
            key={chunkId}
            setUnfocusHandler={setUnfocusHandler}
          />
        ))}
    </div>
  );
};

type ChunkLinkProps = {
  chunkId: string;
  setUnfocusHandler: () => void;
};
export const ChunkLink = React.memo(
  ({ chunkId, setUnfocusHandler }: ChunkLinkProps) => {
    const setSelectedChunkId = useSetRecoilState(selectedChunkIdState);
    const setSelectedChunkHandler = React.useCallback(() => {
      setSelectedChunkId(chunkId);
      setUnfocusHandler();
    }, [chunkId, setSelectedChunkId, setUnfocusHandler]);
    return (
      <div>
        <button onClick={setSelectedChunkHandler}>{chunkId}</button>
      </div>
    );
  }
);
