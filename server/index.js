import http from "http";
import { Server } from "socket.io";

var waitingTunnels = {};
var tunnelToSocket = {};
var socketToTunnel = {};
var totalSent = {};
var tunnelStatus = {};

function generateId() {
  let a = Math.floor(Math.random() * 100)
    .toString()
    .padStart(3, "0");
  let b = Math.floor(Math.random() * 100)
    .toString()
    .padStart(3, "0");
  let c = Math.floor(Math.random() * 100)
    .toString()
    .padStart(3, "0");

  return `${a}-${b}-${c}`;
}

const server = http.createServer((req, res) => {
  if (req.url === "/seikan-api") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({ version: "1.0.0" }));
  } else {
    res.end();
  }
});

const io = new Server(server, {
  path: "/seikan-api/",
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("New connection.");

  socket.on("new", () => {
    // Handle new tunnel creation
    // Generate a unique ID for the tunnel
    var tunnelId = generateId();
    while (tunnelId in waitingTunnels) {
      tunnelId = generateId();
    }

    waitingTunnels[tunnelId] = socket;
    socketToTunnel[socket] = tunnelId;

    socket.on("disconnect", () => {
      if (socket in socketToTunnel) {
        let tunnelId = socketToTunnel[socket];
        delete socketToTunnel[socket];
        delete waitingTunnels[tunnelId];
        delete totalSent[tunnelId];
        delete tunnelStatus[tunnelId];

        if (tunnelId in tunnelToSocket) {
          let otherSocket = tunnelToSocket[tunnelId];
          delete tunnelToSocket[tunnelId];
          delete socketToTunnel[otherSocket];

          otherSocket.emit("error", {
            message: "The other side disconnected.",
          });
          otherSocket.disconnect(true);
        }

        socket.disconnect(true);
      }

      console.log("Socket disconnected.");
      console.log(
        "DEBUG. Socket disconnected. waitingTunnels length is now " +
          Object.keys(waitingTunnels).length
      );
    });

    // Send the tunnel ID to the client
    socket.emit("tunnel-id", { tunnelId: tunnelId });

    console.log(
      "DEBUG. New tunnel created. waitingTunnels is now " +
        Object.keys(waitingTunnels).length
    );
  });

  socket.on("connect", async (data) => {
    // Handle connection to an existing tunnel

    var tunnelId = data.tunnelId;
    if (!(tunnelId in waitingTunnels)) {
      socket.emit("error", { message: "Invalid tunnel ID" });
      socket.disconnect(true);
    }

    const A = waitingTunnels[tunnelId];
    const B = socket;

    delete waitingTunnels[tunnelId];

    const readyResponse = await socket
      .timeout(300000)
      .emitWithAck("ready", {}, 10000);

    if (readyResponse["privateKey"] == undefined) {
      A.emit("error", {
        message: 'Initializer provided invalid response to "ready"',
      });
      A.disconnect(true);
      B.emit("error", {
        message: 'Initializer provided invalid response to "ready"',
      });
      B.disconnect(true);
    }

    const bIdentifierResponse = await B.emitWithAck("private-key", {
      privateKey: readyResponse.privateKey,
    });

    if (bIdentifierResponse["identifier"] == undefined) {
      A.emit("error", {
        message: 'Connector provided invalid response to "private-key"',
      });
      A.disconnect(true);
      B.emit("error", {
        message: 'Connector provided invalid response to "private-key"',
      });
      B.disconnect(true);
    }

    A.emit("b-identifier", { identifier: bIdentifierResponse.identifier });

    socketToTunnel[A] = [tunnelId, "A"];
    socketToTunnel[B] = [tunnelId, "B"];
    tunnelToSocket[tunnelId] = [A, B];
    tunnelStatus[tunnelId] = "waiting";
  });

  socket.on("accept", (data) => {
    if (!(socket in socketToTunnel)) {
      return;
    }

    let [tunnelId, side] = socketToTunnel[socket];

    const otherSide = side === "A" ? "B" : "A";

    if (tunnelStatus[tunnelId] === "waiting") {
      tunnelStatus[tunnelId] = `waiting-${otherSide}`;
    } else if (tunnelStatus[tunnelId] === `waiting-${side}`) {
      tunnelStatus[tunnelId] = "connected";
      let [A, B] = tunnelToSocket[tunnelId];
      A.emit("connected", {});
      B.emit("connected", {});
    }
  });

  socket.on("data", (data) => {
    if (!(socket in socketToTunnel)) {
      socket.emit("error", { message: "Not connected to any tunnel" });
      socket.disconnect(true);
      return;
    }

    if (!("chunk" in data)) {
      socket.emit("error", { message: 'Malformed request, missing "data"' });
      socket.disconnect(true);
      return;
    }

    let [tunnelId, side] = socketToTunnel[socket];
    const otherTunnel = tunnelToSocket[tunnelId][side === "A" ? 1 : 0];

    otherTunnel.emit("data", { chunk: data.chunk });
  });
});

server.listen(9087, () => {
  console.log(`Server running at http://localhost:9087/`);
});
