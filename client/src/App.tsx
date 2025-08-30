import { useState, useRef } from "react";
import seikanLogo from "./assets/seikan.svg";
import seikanOnlyLogo from "./assets/seikan-only.svg";
import seikanTextLogo from "./assets/seikan-text.svg";
import "./App.css";

function StartMenu({
  setCurrentMenu,
}: {
  setCurrentMenu: (menu: "start" | "send" | "receive") => void;
}) {
  return (
    <div className="rounded-lg border-4 border-[#ffffff70] bg-[#ffffff30] h-9/10 aspect-1/1 p-10 flex flex-col items-center justify-center gap-4">
      <img src={seikanLogo} alt="Seikan Logo" className="w-[500px] h-[auto]" />
      <p>Bluntly simple file transfer.</p>

      <button
        className="w-1/2 text-2xl mt-9"
        onClick={() => setCurrentMenu("send")}
      >
        Send files
      </button>

      <p>
        Using server{" "}
        <span className="font-mono border-2 rounded-sm p-1 bg-zinc-700 border-zinc-500">
          seikan.baconerie.com
        </span>
      </p>
    </div>
  );
}

function WaitingMenu() {
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
          value={"https://seikan.baconerie.com/?tunnel-id=123-456-789"}
          readOnly
          className="bg-transparent border-2 border-white p-2 text-2xl w-full"
        />
        <button onClick={copyLink}>Click here to copy link</button>

        <p>Waiting for the other device...</p>
        <p className="text-sm">
          Using server{" "}
          <span className="font-mono border-2 rounded-sm p-1 bg-zinc-700 border-zinc-500">
            seikan.baconerie.com
          </span>
        </p>
      </div>
    </div>
  );
}

function App() {
  const [currentMenu, setCurrentMenu] = useState<"start" | "send" | "receive">(
    "start"
  );

  if (currentMenu === "start") {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <StartMenu setCurrentMenu={setCurrentMenu} />
      </div>
    );
  } else {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <WaitingMenu />
      </div>
    );
  }
}

export default App;
