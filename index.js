import * as packetSerialization from "./packetSerialization.js";
import { createCircularBuffer } from "./circularBuffer.js";
import { Link } from "./Link.js";
import { OSAP } from "./OSAP.js";


// console.log({ packet, deserialized: packetSerialization.deserialize(packet) })

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
connect(device1, device2);

let utf8Encode = new TextEncoder();
const buf = utf8Encode.encode("hello world");

const test = buf;

device0.send([0, 1], "hello", test);

device2.on("hello", (payload, source) => {
  console.log(source, "sent", payload);
  const decoded = new TextDecoder().decode(payload);
  console.log(decoded);
});

console.log({
  device0,
  device1,
  device2
})

for (let i = 0; i < 1000; i++) {
  device0.loop(0);
  device1.loop(1);
  device2.loop(2);
}


// const packet = packetSerialization.serialize({
//   destination: [0, 2, 3],
//   source: [3, 4, 2],
//   payload: test
// })

// console.log({ packet, test, deserialized: packetSerialization.deserialize(packet) })

