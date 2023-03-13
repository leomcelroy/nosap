import * as cobs from "./cobs.js";

export function serialize({ destination, source, msg, payload }) {
  const buf = [];
  
  buf.push(destination.length);
  destination.forEach(gateway => buf.push(gateway))

  buf.push(source.length);
  source.forEach(gateway => buf.push(gateway))

  buf.push(msg.length);
  msg.forEach(gateway => buf.push(gateway))

  buf.push(payload.length);
  payload.forEach(byte => buf.push(byte))

  return cobs.encode(buf);
}

export function deserialize(buf) {
  const packet = {
    destination: [],
    source: [],
    msg: null,
    payload: null
  }

  const arr = cobs.decode(buf);

  const routeLength = arr[0];

  let i = 1;
  while (i < 1 + routeLength) {
    packet.destination.push(arr[i]);
    i++;
  }

  const srcLength = arr[i];
  i++;
  const maxSrc = i + srcLength;
  while (i < maxSrc) {
    packet.source.push(arr[i]);
    i++;
  }

  const msgLength = arr[i];
  i++;
  const maxMsg = i + msgLength;
  packet.msg = arr.slice(i, maxMsg);
  i = maxMsg;

  i++;
  packet.payload = arr.slice(i, -1);

  return packet;
}

/*
type packet
{
  destination: [0, 0], // gateway index
  payload: [] // datagram, bytes[]
}
*/