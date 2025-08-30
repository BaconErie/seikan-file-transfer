import { useState, useRef, useLayoutEffect, useEffect } from "react";
import seikanLogo from "./assets/seikan.svg";
import seikanOnlyLogo from "./assets/seikan-only.svg";
import seikanTextLogo from "./assets/seikan-text.svg";
import "./App.css";
import { io } from "socket.io-client";

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

function Modal({
  message,
  callback,
}: {
  message: string;
  callback: (inputContents: string | undefined) => any;
}) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="w-screen h-screen z-10 fixed bg-[#ffffff60] flex justify-center items-center">
      <div className="rounded-lg border-4 border-[#ffffff70] bg-[#587d40] p-5 flex flex-col gap-4">
        <p className="text-2xl">{message}</p>
        <input type={"text"} ref={input}></input>
        <button
          className="text-2xl"
          onClick={() => {
            callback(input.current?.value);
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

function UsingServerNotice({
  serverHost,
  setIsChangeServerHostVisible,
}: {
  serverHost: string;
  setIsChangeServerHostVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) {
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
          setIsChangeServerHostVisible(true);
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
  setIsChangeServerHostVisible,
}: {
  setCurrentMenu: (
    menu: "start" | "waiting-a" | "waiting-b" | "verifying" | "send"
  ) => void;

  serverHost: string;

  setIsChangeServerHostVisible: React.Dispatch<React.SetStateAction<boolean>>;
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

      <UsingServerNotice
        serverHost={serverHost}
        setIsChangeServerHostVisible={setIsChangeServerHostVisible}
      />
    </div>
  );
}

function WaitingMenuA({
  serverHost,
  setIsChangeServerHostVisible,
  setSocket,
}: {
  serverHost: string;
  setIsChangeServerHostVisible: React.Dispatch<React.SetStateAction<boolean>>;
  socket: any;
  setSocket: React.Dispatch<React.SetStateAction<any>>;
}) {
  const linkRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const socket = io(serverHost, {
      path: "/seikan-api/",
      reconnection: false,
    });

    setSocket(socket);

    socket.on("connect", () => {
      console.log("Connected.");
    });
  }, []);

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
        />
        <button onClick={copyLink}>Click here to copy link</button>

        <p>Waiting for the other device...</p>
        <UsingServerNotice
          serverHost={serverHost}
          setIsChangeServerHostVisible={setIsChangeServerHostVisible}
        />
      </div>
    </div>
  );
}

function WaitingMenuB({
  serverHost,
  setIsChangeServerHostVisible,
}: {
  serverHost: string;
  setIsChangeServerHostVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) {
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
        <UsingServerNotice
          serverHost={serverHost}
          setIsChangeServerHostVisible={setIsChangeServerHostVisible}
        />
      </div>
    </div>
  );
}

function VerifyMenu() {
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

function SendMenu({
  serverHost,
  setIsChangeServerHostVisible,
}: {
  serverHost: string;
  setIsChangeServerHostVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) {
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

      <UsingServerNotice
        serverHost={serverHost}
        setIsChangeServerHostVisible={setIsChangeServerHostVisible}
      />
    </div>
  );
}

function App() {
  const [currentMenu, setCurrentMenu] = useState<
    "start" | "waiting-a" | "waiting-b" | "verifying" | "send"
  >("start");

  const [isChangeServerHostVisible, setIsChangeServerHostVisible] =
    useState<boolean>(false);

  const [serverHost, setServerHost] = useState(window.location.host);

  const [socket, setSocket] = useState<any>(null);

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

  return (
    <>
      {isChangeServerHostVisible && (
        <Modal
          message={"Enter a server domain."}
          callback={(text) => {
            if (text == undefined) return;
            setServerHost(text);
            setIsChangeServerHostVisible(false);
          }}
        />
      )}

      <div className="w-screen h-screen flex items-center justify-center">
        {currentMenu === "start" && (
          <StartMenu
            setCurrentMenu={setCurrentMenu}
            serverHost={serverHost}
            setIsChangeServerHostVisible={setIsChangeServerHostVisible}
          />
        )}

        {currentMenu === "waiting-a" && (
          <WaitingMenuA
            serverHost={serverHost}
            setIsChangeServerHostVisible={setIsChangeServerHostVisible}
            socket={socket}
            setSocket={setSocket}
          />
        )}

        {currentMenu === "waiting-b" && (
          <WaitingMenuB
            serverHost={serverHost}
            setIsChangeServerHostVisible={setIsChangeServerHostVisible}
          />
        )}

        {currentMenu === "send" && (
          <SendMenu
            serverHost={serverHost}
            setIsChangeServerHostVisible={setIsChangeServerHostVisible}
          />
        )}

        {currentMenu === "verifying" && <VerifyMenu />}
      </div>
    </>
  );
}

export default App;
