class OSAP {
  constructor() {
    this.name = crypto.randomUUID();
    this.links = [];
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
  }

  routeTo(name) { }

  send(route, bytes) { }

  // init() { }

  loop() {
    this.links.forEach(link => {
      console.log(link);
      // read one byte and accumulate
      // if it's 0 then do something
    })
  }

  neighbors() { }

  graph() { }

  on(msg, func) {
    this.msgHandlers[msg] = func;
  }

  callFunc(deviceName, msg, bytes) {
  
  }
}

class Link {
  constructor(name, inBuffer, outBuffer) {
    this.name = name;
    this.inBuffer = inBuffer;
    this.outBuffer = outBuffer;
  }
  
  write(byte) {
    this.outBuffer.write(byte);
  }
  
  read() {
    return this.inBuffer.read();
  }
  
  available() {
    return this.inBuffer.available();
  }
}

function createCircularBuffer(bufferLength) {
  const buf = new Uint8Array(bufferLength);
  let indexWrite = 0;
  let indexRead = 0;

  function length() {
    return indexWrite - indexRead;
  }

  return {
    buf,
    write(byte) {
      if (byte.constructor === Uint8Array) {
        byte.forEach(b => {
          buf[indexWrite] = b;
          indexWrite++;
        })
      } else {
        buf[indexWrite] = byte;
        indexWrite++;
      }
  
      indexWrite = indexWrite % bufferLength;
    },
    read() {
      if (indexRead === indexWrite) return null;
      
      const byte = buf[indexRead];
      indexRead++;
      indexRead = indexRead % bufferLength;

      return byte;
    },
    available() {
      return length() > 0;
    },
    length
  }
}

/*
type packet
{
  destination: [0, 0], // gateway index
  payload: [] // datagram, bytes[]
}
*/

function serializePacketOld({ destination, payload }) {
  const route = destination;
  const routeLength = route.length;
  const payloadLength = payload.length;
  const buf = new Uint8Array(routeLength+payloadLength+1);

  let bufIndex = 0;

  buf[bufIndex] = routeLength;
  bufIndex++;
  route.forEach(gateway => {
    buf[bufIndex] = gateway;
    bufIndex++;
  })
  buf[bufIndex] = payloadLength;
  payload.forEach(byte => {
    buf[bufIndex] = byte;
    bufIndex++;
  })

  return buf;
}

function serializePacket({ destination, payload }) {
  const buf = [];
  
  buf.push(destination.length);
  destination.forEach(gateway => buf.push(gateway))
  buf.push(payload.length);
  payload.forEach(byte => buf.push(byte))

  return cobsEncode(buf);
}

function deserializePacket(buf) {
  const packet = {
    destination: [],
    payload: null
  }

  const arr = cobsDecode(buf);

  const routeLength = arr[0];

  let i = 1;
  while (i < 1 + routeLength) {
    packet.destination.push(arr[i]);
    i++;
  }

  packet.payload = arr.slice(i+1, -1);

  return packet;
}

const test = new Uint8Array([10, 21, 32, 1, 2, 3, 4, 5]);

const packet = serializePacket({
  destination: [0, 3, 1],
  payload: test
})

console.log({ packet, deserialized: deserializePacket(packet) })

function connect(device0, device1) {
  const b0 = createCircularBuffer(1000);
  const b1 = createCircularBuffer(1000);
  
  const link0 = new Link("USB", b0, b1);
  const link1 = new Link("USB", b1, b0);

  device0.addLink(link0);
  device1.addLink(link1);
}

const device0 = new OSAP();
const device1 = new OSAP();
const device2 = new OSAP();

connect(device0, device1);
// connect(device1, device2);

const link0 = device0.links[0];
let utf8Encode = new TextEncoder();
const buf = utf8Encode.encode("hello world");
link0.write(buf);

device1.loop();



function cobsEncode(buf) {
  var dest = [0];
  // vfpt starts @ 1,
  var code_ptr = 0;
  var code = 0x01;

  function finish(incllast) {
    dest[code_ptr] = code;
    code_ptr = dest.length;
    incllast !== false && dest.push(0x00);
    code = 0x01;
  }

  for (var i = 0; i < buf.length; i++) {
    if (buf[i] == 0) {
      finish();
    } else {
      dest.push(buf[i]);
      code += 1;
      if (code == 0xFF) {
        finish();
      }
    }
  }
  finish(false);

  // close w/ zero
  dest.push(0x00)

  return Uint8Array.from(dest);
}

// COBS decode, tailing zero, that was used to delineate this buffer,
// is assumed to already be chopped, thus the end is the end 

function cobsDecode(buf) {
  var dest = [];
  for (var i = 0; i < buf.length;) {
    var code = buf[i++];
    for (var j = 1; j < code; j++) {
      dest.push(buf[i++]);
    }
    if (code < 0xFF && i < buf.length) {
      dest.push(0);
    }
  }
  return Uint8Array.from(dest)
}

