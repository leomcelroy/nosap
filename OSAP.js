import * as packetSerialization from "./packetSerialization.js";

export class OSAP {
  constructor() {
    this.name = crypto.randomUUID();
    this.links = [];
    this.linkMessages = [];
    this.cached_graph = {
      devices: [],
      edges: []
    };
    this.msgHandlers = {};
  }

  setName(name) {
    this.name = name;
  }

  addLink(link) {
    this.links.push(link);
    this.linkMessages.push([]);
  }

  routeTo(name) { }

  send(route, msg, bytes, source = []) { 
    if (typeof msg === "string") {
      const utf8Encode = new TextEncoder();
      msg = utf8Encode.encode(msg);
    }

    const [ firstGateway, ...rest ] = route;
    const link = this.links[firstGateway];
    const packet = packetSerialization.serialize({
      destination: rest,
      source,
      msg,
      payload: bytes
    });

    link.write(packet);
  }

  // init() { }

  loop(name) {
    this.links.forEach((link, i) => {
      if (!link.available()) return;

      const byte = link.read();
      const linkMsgBytes = this.linkMessages[i];
      linkMsgBytes.push(byte);

      if (byte === 0) {
        const packet = packetSerialization.deserialize(linkMsgBytes);
        const { destination, source, msg } = packet;
        source.push(i);

        if (destination.length === 0) {
          
          const buf = new Uint8Array(msg);
          const msgString = new TextDecoder().decode(buf);

          if (!(msgString in this.msgHandlers)) {
            console.log("unknown message:", msgString);
            return;
          }

          this.msgHandlers[msgString](packet.payload, source);
        } else {
          this.send(destination, msg, packet.payload, source);
        }
      }
    })
  }

  neighbors() { }

  graph() { }

  on(msg, func) {
    this.msgHandlers[msg] = func;
  }

  // callFunc(deviceName, msg, bytes) {
  
  // }
}