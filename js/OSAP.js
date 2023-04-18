import * as packetSerialization from "./packetSerialization.js";

const GATEWAY_NUMBER = 2**2;

export class OSAP {
  constructor(name = "") {
    this.name = name === "" ? crypto.randomUUID() : name;
    this.links = [];
    this.linkMessages = [];
    this.msgHandlers = {};

    this.graph = {
      [this.name]: new Array(GATEWAY_NUMBER).fill(null), // gateways
    }

    // this.graph = {
    //   devices: [],
    //   edges: []
    // }
  }

  // setName(name) {
  //   this.name = name;
  // }

  addLink(link) {
    this.links.push(link);
    this.linkMessages.push([]);
  }

  send(route, msg, bytes = new Uint8Array(0), source = []) { 
    if (typeof msg === "string") {
      const utf8Encode = new TextEncoder();
      msg = utf8Encode.encode(msg);
    }

    const [ firstGateway, ...rest ] = route;
    const link = this.links[firstGateway];
    if (!link) {
      console.log("no link on gateway", firstGateway);
      return;
    }

    const packet = packetSerialization.serialize({
      destination: rest,
      source,
      msg,
      payload: bytes
    });

    link.write(packet);
  }

  loop() {
    const specialMessages = {
      "ack": () => {
        console.log("acked");
      },
      "deviceInfoQuery": (payload, source) => {
        this.send(source, "deviceInfoReply", encodeString(this.name));
      },
      "deviceInfoReply": (payload, source) => {
        const name = new TextDecoder().decode(payload);

        this.graph[name] = new Array(GATEWAY_NUMBER).fill(null);

        let cur = this.graph[this.name];
        let failed = false;
        source.slice(0, -1).forEach(gateway => {
          const key = cur[gateway];
          if (!key) {
            console.log("nah man...no thing there");
            failed = true;
            return;
          }

          cur = this.graph[key];
        });

        if (!failed) cur[source.at(-1)] = name;
      },
    }

    this.links.forEach((link, i) => {
      if (!link.available()) return;

      const byte = link.read();
      const linkMsgBytes = this.linkMessages[i];
      linkMsgBytes.push(byte);

      if (byte === 0) {
        const packet = packetSerialization.deserialize(linkMsgBytes);
        this.linkMessages[i] = [];
        const { destination, source, msg } = packet;
        source.unshift(i);

        if (destination.length === 0) {
          const msgString = new TextDecoder().decode(msg);

          if (msgString in specialMessages) {
            specialMessages[msgString](packet.payload, source);
            return;
          } else if (!(msgString in this.msgHandlers)) {
            console.log("unknown message:", msgString);
            return;
          } else {
            this.msgHandlers[msgString](packet.payload, source);
            this.send(source, "ack");
          }     
        } else {
          this.send(destination, msg, packet.payload, source);
        }
      }
    })
  }

  on(msg, func) {
    if (["ack", "deviceInfoQuery", "deviceInfoQuery"].includes(msg)) {
      console.log(`"${msg}" is a special message name.`);
      return;
    }

    this.msgHandlers[msg] = func;
  }

  // TODO

  routeTo(name) { 
    
  }

  neighbors() { // get info, 
    this.links.forEach((link, i) => {
      this.send([i], "deviceInfoQuery");
    })

    for (const key in this.graph) {
      // const gateways = this.graph[key];
      
    }

    console.log(this.graph);
  }

  // graph() { 
  //   return {
  //     devices: [],
  //     edges: []
  //   }
  // }

  // -- NO NEED --

  // init() { }
  // callFunc(deviceName, msg, bytes) { }
}

function encodeString(str) {
  let utf8Encode = new TextEncoder();
  const buf = utf8Encode.encode(str);

  return buf;
}
