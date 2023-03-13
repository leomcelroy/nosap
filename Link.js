export class Link {
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