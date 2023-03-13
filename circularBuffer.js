export function createCircularBuffer(bufferLength) {
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