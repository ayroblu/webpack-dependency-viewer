import ReactJson from 'react-json-view';
import { useRecoilValue } from 'recoil';
import { topChunksState } from '../data-model';

export const ChunksViewer = () => {
  const chunks = useRecoilValue(topChunksState);
  return (
    <div>
      {chunks.map((chunk) => (
        <div key={chunk.id}>
          <ReactJson
            collapsed
            name={`${chunk.id ?? '<unknown name>'}`}
            src={chunk}
            theme="monokai"
          />
        </div>
      ))}
    </div>
  );
};
