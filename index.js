import * as packetSerialization from "./packetSerialization.js";
import { OSAP } from "./OSAP.js";
import { connect } from "./connect.js";

const device0 = new OSAP();
const device1 = new OSAP();
const device2 = new OSAP();

connect(device0, device1);
connect(device1, device2);

device1.on("hello", (payload, source) => {
  // console.log({ source, payload });
  const decoded = new TextDecoder().decode(payload);
  console.log("on 1", decoded);
});

device2.on("hello", (payload, source) => {
  // console.log({ source, payload });
  const decoded = new TextDecoder().decode(payload);
  console.log("on 2", decoded);
});

device0.send([0, 1], "hello", encodeString("hey there what's up"));
device0.send([0], "hello", encodeString("hey there, you dig?"));
device0.send([0, 1], "hello", encodeString("hey there what's up"));

console.log({
  device0,
  device1,
  device2
})

for (let i = 0; i < 1000; i++) {
  device0.loop();
  device1.loop();
  device2.loop();
}

// const packet = packetSerialization.serialize({
//   destination: [0, 2, 3],
//   source: [3, 4, 2],
//   payload: test
// })

// console.log({ packet, test, deserialized: packetSerialization.deserialize(packet) })


function encodeString(str) {
  let utf8Encode = new TextEncoder();
  const buf = utf8Encode.encode(str);

  return buf;
}
