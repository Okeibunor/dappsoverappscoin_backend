"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const lz4_1 = __importDefault(require("lz4"));
const stream_1 = require("stream");
const app = (0, express_1.default)();
const port = 3002;
app.use(express_1.default.json());
const compressData = (data) => {
    const compressedData = Buffer.alloc(lz4_1.default.encodeBound(data.length));
    const compressedLength = lz4_1.default.encodeBlock(data, compressedData);
    return compressedData.slice(0, compressedLength);
};
const decompressData = (data) => {
    const decompressedData = Buffer.alloc(data.length * 10);
    const decompressedLength = lz4_1.default.decodeBlock(data, decompressedData);
    return decompressedData.slice(0, decompressedLength);
};
app.get('/', (req, res) => {
    res.json({ msg: 'Welcome to compress api!' });
});
app.post('/compress', (req, res) => {
    var _a;
    if (!((_a = req.headers['content-type']) === null || _a === void 0 ? void 0 : _a.startsWith('application/octet-stream'))) {
        return res.status(400).send('Content-Type must be application/octet-stream');
    }
    const inputStream = req.pipe(new stream_1.PassThrough());
    let inputBuffer = Buffer.alloc(0);
    inputStream.on('data', (chunk) => {
        inputBuffer = Buffer.concat([inputBuffer, chunk]);
    });
    inputStream.on('end', () => {
        try {
            const compressedData = compressData(inputBuffer);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.send(compressedData);
        }
        catch (error) {
            res.status(500).send(`Compression error: ${error}`);
        }
    });
});
app.post('/decompress', (req, res) => {
    var _a;
    if (!((_a = req.headers['content-type']) === null || _a === void 0 ? void 0 : _a.startsWith('application/octet-stream'))) {
        return res.status(400).send('Content-Type must be application/octet-stream');
    }
    const inputStream = req.pipe(new stream_1.PassThrough());
    let inputBuffer = Buffer.alloc(0);
    inputStream.on('data', (chunk) => {
        inputBuffer = Buffer.concat([inputBuffer, chunk]);
    });
    inputStream.on('end', () => {
        try {
            const decompressedData = decompressData(inputBuffer);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.send(decompressedData);
        }
        catch (error) {
            res.status(500).send(`Decompression error: ${error}`);
        }
    });
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
