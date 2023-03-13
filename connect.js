import { createCircularBuffer } from "./circularBuffer.js";
import { Link } from "./Link.js";

export function connect(device0, device1) {
  const b0 = createCircularBuffer(1000);
  const b1 = createCircularBuffer(1000);
  
  const link0 = new Link("USB", b0, b1);
  const link1 = new Link("USB", b1, b0);

  device0.addLink(link0);
  device1.addLink(link1);
}