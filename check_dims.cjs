
const fs = require('fs');
const path = require('path');

const dir = 'src/assets/design-collections/street';

function readPngInfo(filePath) {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(30); // Need up to byte 28
    fs.readSync(fd, buffer, 0, 30, 0);
    fs.closeSync(fd);

    if (buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
        return null;
    }

    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    const interlace = buffer.readUInt8(28); // 0=None, 1=Adam7

    return { width, height, interlace: interlace === 1 ? 'Interlaced' : 'None' };
}

try {
    const files = fs.readdirSync(dir);
    console.log('Checking interlace for ' + dir);
    files.forEach(file => {
        if (file.endsWith('.png')) {
            const info = readPngInfo(path.join(dir, file));
            if (info) {
                console.log(`${file}: ${info.interlace}`);
            }
        }
    });
} catch (e) {
    console.error(e);
}
