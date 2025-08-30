import { useState, useRef, useLayoutEffect, useEffect } from "react";
import seikanLogo from "./assets/seikan.svg";
import seikanOnlyLogo from "./assets/seikan-only.svg";
import seikanTextLogo from "./assets/seikan-text.svg";
import "./App.css";

const ACCPETED_VERSION = "1";

async function checkForSeikanServer(host: string) {
  try {
    let res = await fetch(`http://${host}/seikan-api`, { method: "GET" });
    if (res.status === 200) {
      const result = await res.json();

      if (
        result &&
        result.version.substring(result.version.indexOf(".")) ===
          ACCPETED_VERSION
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
}

function UsingServerNotice({ serverHost }: { serverHost: string }) {
  return (
    <p className="text-sm">
      Using server{" "}
      <span className="font-mono border-2 rounded-sm p-1 bg-zinc-700 border-zinc-500">
        {serverHost}
      </span>
      .{" "}
      <a
        className="text-base"
        onClick={() => {
          alert("Not implemented");
        }}
      >
        Change server
      </a>
    </p>
  );
}

function StartMenu({
  setCurrentMenu,
  serverHost,
}: {
  setCurrentMenu: (
    menu: "start" | "waiting-a" | "waiting-b" | "verifying" | "send"
  ) => void;

  serverHost: string;
}) {
  return (
    <div className="rounded-lg border-4 border-[#ffffff70] bg-[#ffffff30] h-9/10 aspect-1/1 p-10 flex flex-col items-center justify-center gap-4">
      <img src={seikanLogo} alt="Seikan Logo" className="w-[500px] h-[auto]" />
      <p>Bluntly simple file transfer.</p>

      <button
        className="w-1/2 text-2xl mt-9"
        onClick={() => setCurrentMenu("waiting-a")}
      >
        Send files
      </button>

      <UsingServerNotice serverHost={serverHost} />
    </div>
  );
}

function WaitingMenuA({ serverHost }: { serverHost: string }) {
  const linkRef = useRef<HTMLInputElement>(null);

  function copyLink() {
    let copyText = linkRef.current;

    if (!copyText) return;

    copyText.select();
    copyText.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(copyText.value);
  }

  return (
    <div className="rounded-lg border-4 border-[#ffffff70] bg-[#ffffff30] h-9/10 aspect-1/1 p-5 flex flex-col">
      <div className="flex justify-between items-center">
        <img
          src={seikanOnlyLogo}
          alt="Seikan Logo"
          className="w-[100px] h-[auto]"
        />

        <img
          src={seikanTextLogo}
          alt="Seikan Logo"
          className="w-[300px] h-[auto]"
        />
      </div>
      <div className="flex pt-10 justify-center h-full flex-col gap-4 text-2xl">
        <h1>Open this link on the other device.</h1>
        <input
          ref={linkRef}
          type={"text"}
          value={`http://${serverHost}/?tunnel-id=123-456-789`}
          readOnly
          className="bg-transparent border-2 border-white p-2 text-2xl w-full"
        />
        <button onClick={copyLink}>Click here to copy link</button>

        <p>Waiting for the other device...</p>
        <UsingServerNotice serverHost={serverHost} />
      </div>
    </div>
  );
}

function WaitingMenuB({ serverHost }: { serverHost: string }) {
  return (
    <div className="rounded-lg border-4 border-[#ffffff70] bg-[#ffffff30] h-9/10 aspect-1/1 p-5 flex flex-col">
      <div className="flex justify-between items-center">
        <img
          src={seikanOnlyLogo}
          alt="Seikan Logo"
          className="w-[100px] h-[auto]"
        />

        <img
          src={seikanTextLogo}
          alt="Seikan Logo"
          className="w-[300px] h-[auto]"
        />
      </div>
      <div className="flex pt-10 justify-center h-full flex-col gap-4 text-2xl">
        <h1>Connecting to the other device...</h1>
        <UsingServerNotice serverHost={serverHost} />
      </div>
    </div>
  );
}

function VerifyMenu({ serverHost }: { serverHost: string }) {
  return (
    <div className="rounded-lg border-4 border-[#ffffff70] bg-[#ffffff30] h-9/10 aspect-1/1 p-5 flex flex-col">
      <div className="flex justify-between items-center">
        <img
          src={seikanOnlyLogo}
          alt="Seikan Logo"
          className="w-[100px] h-[auto]"
        />

        <img
          src={seikanTextLogo}
          alt="Seikan Logo"
          className="w-[300px] h-[auto]"
        />
      </div>

      <div className="flex pt-10 justify-center h-full flex-col gap-4 text-2xl">
        <h1>Connected. Verifying tunnel.</h1>
      </div>
    </div>
  );
}

function SendMenu({ serverHost }: { serverHost: string }) {
  return (
    <div className="rounded-lg border-4 border-[#ffffff70] bg-[#ffffff30] h-9/10 aspect-1/1 p-5 flex flex-col">
      <div className="flex justify-between items-center">
        <img
          src={seikanOnlyLogo}
          alt="Seikan Logo"
          className="w-[100px] h-[auto]"
        />

        <img
          src={seikanTextLogo}
          alt="Seikan Logo"
          className="w-[300px] h-[auto]"
        />
      </div>

      <div className="flex pt-10 justify-center h-full flex-col gap-4 text-2xl">
        <h1>Connected! Attach files to send.</h1>
      </div>
    </div>
  );
}

function App() {
  const [currentMenu, setCurrentMenu] = useState<
    "start" | "waiting-a" | "waiting-b" | "verifying" | "send"
  >("start");

  const [serverHost, setServerHost] = useState(window.location.host);

  useEffect(() => {
    const effectMain = async () => {
      let savedServerHost = localStorage.getItem("serverHost");
      if (savedServerHost && (await checkForSeikanServer(savedServerHost))) {
        setServerHost(savedServerHost);
      } else if (
        (await checkForSeikanServer(window.location.host)) ||
        true //TODO: remove "|| true"
      ) {
        setServerHost(window.location.host);
      } else if (await checkForSeikanServer("seikan.baconerie.com")) {
        setServerHost("seikan.baconerie.com");
      }
    };

    effectMain();
  }, []);

  useLayoutEffect(() => {
    let params = new URLSearchParams(document.location.search);
    if (params.get("tunnel-id")) {
      setCurrentMenu("waiting-b");
    }
  }, []);

  if (currentMenu === "start") {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <StartMenu setCurrentMenu={setCurrentMenu} serverHost={serverHost} />
      </div>
    );
  } else if (currentMenu === "waiting-a") {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <WaitingMenuA serverHost={serverHost} />
      </div>
    );
  } else if (currentMenu === "waiting-b") {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <WaitingMenuB serverHost={serverHost} />
      </div>
    );
  } else if (currentMenu === "verifying") {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <VerifyMenu serverHost={serverHost} />
      </div>
    );
  } else {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <SendMenu serverHost={serverHost} />
      </div>
    );
  }
}

export default App;
