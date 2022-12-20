import * as React from "react";
import { useSetRecoilState } from "recoil";

import { statsState } from "../data-model";

export const FileInput = React.memo(() => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const setStatsState = useSetRecoilState(statsState);
  const [isLoading, setIsLoading] = React.useState(false);

  const fileOnChange = React.useCallback(async () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      setIsLoading(true);
      const fileContents = await readFilePromise(file);
      setStatsState(JSON.parse(fileContents));
      setIsLoading(false);
    }
  }, [setStatsState]);
  return (
    <label>
      Upload file:
      <input onChange={fileOnChange} ref={fileInputRef} type="file" />
      {isLoading ? "Loading..." : null}
    </label>
  );
});

function readFilePromise(file: File): Promise<string> {
  const reader = new FileReader();

  reader.readAsText(file);

  return new Promise((resolve, reject) => {
    reader.onload = function () {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(
          new Error(`expected type string got type ${typeof reader.result}`),
        );
      }
    };

    reader.onerror = function () {
      reject(reader.error);
    };
  });
}
