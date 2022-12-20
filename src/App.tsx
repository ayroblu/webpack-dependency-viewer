import * as React from "react";
import { RecoilRoot } from "recoil";
import { ChunkSearch } from "./components/ChunkSearch";
import { ChunkSelector } from "./components/ChunkSelector";
import { ChunksViewer } from "./components/ChunksViewer";
import { FileInput } from "./components/FileInput";
import { ModuleSearch } from "./components/ModuleSearch";

const isDev = false;
function App() {
  return (
    <RecoilRoot>
      <React.Suspense fallback={<div>Loading</div>}>
        {isDev ? <Content /> : <Layout />}
      </React.Suspense>
    </RecoilRoot>
  );
}
function Content() {
  return (
    <div>
      <ul>
        <li>
          Import stats.json
          <FileInput />
        </li>
        <li>
          Traverse chunks
          <ChunksViewer />
        </li>
        <ChunkSearch />
        <li>Traverse modules inside a chunk</li>
        <li>Bonus: Module references across chunks</li>
        <li>Recoil?</li>
        <li>Urls, save search?</li>
      </ul>
    </div>
  );
}
function Layout() {
  return (
    <div>
      <FileInput />
      <ChunkSelector />
      <ModuleSearch />
    </div>
  );
}

export default App;
