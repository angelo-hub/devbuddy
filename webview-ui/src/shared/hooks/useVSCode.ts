import { useEffect, useCallback, useRef } from "react";

interface VSCodeApi {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

declare function acquireVsCodeApi(): VSCodeApi;

let vscodeApiInstance: VSCodeApi | undefined;

function getVSCodeAPI(): VSCodeApi {
  if (!vscodeApiInstance) {
    vscodeApiInstance = acquireVsCodeApi();
  }
  return vscodeApiInstance;
}

export function useVSCode<TMessageFrom = any, TMessageTo = any>() {
  const api = useRef<VSCodeApi>(getVSCodeAPI());

  const postMessage = useCallback((message: TMessageTo) => {
    api.current.postMessage(message);
  }, []);

  const onMessage = useCallback(
    (handler: (message: TMessageFrom) => void) => {
      const listener = (event: MessageEvent<TMessageFrom>) => {
        handler(event.data);
      };

      window.addEventListener("message", listener);

      return () => {
        window.removeEventListener("message", listener);
      };
    },
    []
  );

  useEffect(() => {
    // Initialize API reference
    api.current = getVSCodeAPI();
  }, []);

  return {
    postMessage,
    onMessage,
    getState: () => api.current.getState(),
    setState: (state: any) => api.current.setState(state),
  };
}

