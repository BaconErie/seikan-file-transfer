import { useState, useRef, useLayoutEffect, useEffect } from "react";
import seikanLogo from "./assets/seikan.svg";
import seikanOnlyLogo from "./assets/seikan-only.svg";
import seikanTextLogo from "./assets/seikan-text.svg";
import "./App.css";
import { io } from "socket.io-client";
import { JSEncrypt } from "jsencrypt";

const ACCPETED_VERSION = "1";

const DEBUG = true;

async function checkForSeikanServer(host: string) {
  try {
    let res = await fetch(`http://${host}/seikan-api`, { method: "GET" });
    if (res.status === 200) {
      const result = await res.json();

      if (
        result &&
        result.version.substring(0, result.version.indexOf(".")) ===
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

function generateIdentifier(): string {
  const array = new Uint32Array(12);
  window.crypto.getRandomValues(array);
  let resultString = "";

  for (const num of array) {
    resultString += num.toString(16).padStart(8, "0");
  }

  return resultString;
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
  allowChangeServer,
}: {
  serverHost: string;
  setIsChangeServerHostVisible: React.Dispatch<React.SetStateAction<boolean>>;
  allowChangeServer?: boolean;
}) {
  return (
    <p className="text-sm">
      Using server{" "}
      <span className="font-mono border-2 rounded-sm p-1 bg-zinc-700 border-zinc-500">
        {serverHost}
      </span>
      .{" "}
      {allowChangeServer && (
        <a
          className="text-base"
          onClick={() => {
            setIsChangeServerHostVisible(true);
          }}
        >
          Change server
        </a>
      )}
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
      <img src={seikanLogo} alt="Seikan Logo" className="w-3/4 h-[auto]" />
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
        allowChangeServer={true}
      />
    </div>
  );
}

function WaitingMenuA({
  serverHost,
  setIsChangeServerHostVisible,
  setSocket,
  tunnelId,
  setTunnelId,
  privateKey,
  setPrivateKey,
}: {
  serverHost: string;
  setIsChangeServerHostVisible: React.Dispatch<React.SetStateAction<boolean>>;
  socket: any;
  setSocket: React.Dispatch<React.SetStateAction<any>>;
  tunnelId: string;
  setTunnelId: React.Dispatch<React.SetStateAction<string>>;
  privateKey: string;
  setPrivateKey: React.Dispatch<React.SetStateAction<string>>;
}) {
  const linkRef = useRef<HTMLInputElement>(null);

  const [hasBConnected, setHasBConnected] = useState(false);

  useEffect(() => {
    let localPrivateKey = "";

    const socket = io(serverHost, {
      path: "/seikan-api/",
      reconnection: false,
    });

    setSocket(socket);

    socket.on("connect", () => {
      if (DEBUG) console.log("A: Socket connected as A.");
    });

    socket.on("error", (data) => {
      console.warn(`Error: ${data.message}`);
    });

    socket.on("tunnel-id", (data) => {
      if (DEBUG) console.log(`A: Connected to tunnel with id ${data.tunnelId}`);
      setTunnelId(data.tunnelId);
    });

    socket.on("req-A-publicKey", (callback) => {
      // B joined tunnel, request a publicKey
      // Generate a key pair

      if (DEBUG) {
        console.log(`A: Receieved request for a publicKey.`);
      }

      setHasBConnected(true);

      const crypt = new JSEncrypt({ default_key_size: "1024" });
      const privateKey = crypt.getPrivateKey();
      const publicKey = crypt.getPublicKey();

      setPrivateKey(privateKey);
      localPrivateKey = privateKey;

      if (DEBUG) {
        console.log(`A: Public key is ${publicKey}.`);
      }

      callback({ publicKey: publicKey });
    });

    socket.on("B-identifier", (data) => {
      // Received the encrypted identifier from B, and we need to decrypt it with our private key.
      if (DEBUG) {
        console.log(`A: Receieved encrypted identifier ${data.identifier}`);
        console.log(`A: Private key is ${localPrivateKey}`);
      }

      const crypt = new JSEncrypt();
      crypt.setPrivateKey(localPrivateKey);

      const decryptedIdentifier = crypt.decrypt(data.identifier);

      if (DEBUG)
        console.log(`A: Decrypted identifier is ${decryptedIdentifier}`);

      if (decryptedIdentifier && decryptedIdentifier.length == 96) {
        // Valid identifier, we are now connected!
        if (DEBUG)
          console.log("A: Identifier is valid, waiting for verification.");
      }
    });

    socket.emit("new");

    return () => {
      if (DEBUG)
        console.log("A: Disconnecting socket because component unmounted.");
      socket.disconnect();
      setSocket(null);
    };
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
          className="w-1/8 h-[auto]"
        />

        <img
          src={seikanTextLogo}
          alt="Seikan Logo"
          className="w-1/2 h-[auto]"
        />
      </div>

      <div className="flex pt-10 justify-center h-full flex-col gap-4 text-2xl">
        {!hasBConnected && (
          <>
            <h1>Open this link on the other device.</h1>
            <input
              ref={linkRef}
              type={"text"}
              value={
                tunnelId != undefined && tunnelId.length == 0
                  ? "Getting a link..."
                  : `http://${window.location.host}/?tunnel-id=${tunnelId}` +
                    (serverHost != document.location.host
                      ? `&serverHost=${serverHost}`
                      : "") // Only add server param if it's different from the current host
              }
              readOnly
            />
            <button onClick={copyLink}>Click here to copy link</button>

            <p>Waiting for the other device...</p>
          </>
        )}

        {hasBConnected && <h1>Establishing a secure connection...</h1>}

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
  setSocket,
  tunnelId,
}: {
  serverHost: string;
  setIsChangeServerHostVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setSocket: React.Dispatch<React.SetStateAction<any>>;
  tunnelId: string;
}) {
  useEffect(() => {
    if (DEBUG) console.log(`B: Using server ${serverHost}`);

    if (DEBUG) console.log("B: Attemping connection to " + tunnelId);

    const socket = io(serverHost, {
      path: "/seikan-api/",
      reconnection: false,
    });

    setSocket(socket);

    socket.on("connect", () => {
      if (DEBUG) console.log("B: Socket connected.");
    });

    socket.on("error", (data) => {
      console.warn(`Error: ${data.message}`);
    });

    socket.emit("B-req-join", {
      tunnelId: tunnelId,
    });

    socket.on("req-B-identifier", (data, callback) => {
      // Received the public key from A, and server requests a B-identifier.
      if (DEBUG) console.log(`B: Receieved publicKey ${data.publicKey}`);

      const identifier = generateIdentifier();

      if (DEBUG)
        console.log(
          "B: Identifier is " +
            identifier +
            " and length is " +
            identifier.length
        );

      const crypt = new JSEncrypt();

      crypt.setPublicKey(data.publicKey);

      const encryptedIdentifier = crypt.encrypt(identifier);

      if (DEBUG)
        console.log(`B: Encrypted identifier is ${encryptedIdentifier}`);

      callback({ identifier: encryptedIdentifier }); // TODO: Implement a proper response for callback
    });

    return () => {
      if (DEBUG)
        console.log("B: Disconnecting socket because component unmounted.");
      socket.disconnect();
      setSocket(null);
    };
  }, []);

  return (
    <div className="rounded-lg border-4 border-[#ffffff70] bg-[#ffffff30] h-9/10 aspect-1/1 p-5 flex flex-col">
      <div className="flex justify-between items-center">
        <img
          src={seikanOnlyLogo}
          alt="Seikan Logo"
          className="w-1/8 h-[auto]"
        />

        <img
          src={seikanTextLogo}
          alt="Seikan Logo"
          className="w-1/2 h-[auto]"
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
  const [tunneId, setTunnelId] = useState<string>("");
  const [privateKey, setPrivateKey] = useState<string>("");

  useEffect(() => {
    const automaticSetServerHost = async () => {
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

    let params = new URLSearchParams(document.location.search);
    const tunnelId = params.get("tunnel-id");
    if (tunnelId) {
      setTunnelId(tunnelId as string);
      setCurrentMenu("waiting-b");

      const requestedServerHost = params.get("serverHost");
      if (requestedServerHost) {
        setServerHost(requestedServerHost);
      } else {
        setServerHost(window.location.host);
      }
    } else {
      automaticSetServerHost();
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
            localStorage.setItem("serverHost", text);
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
            tunnelId={tunneId}
            setTunnelId={setTunnelId}
            privateKey={privateKey}
            setPrivateKey={setPrivateKey}
          />
        )}

        {currentMenu === "waiting-b" && (
          <WaitingMenuB
            serverHost={serverHost}
            setIsChangeServerHostVisible={setIsChangeServerHostVisible}
            setSocket={setSocket}
            tunnelId={tunneId}
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
