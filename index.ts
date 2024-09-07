import express, { Request, Response } from 'express';
import lz4 from 'lz4';
import { Readable, PassThrough } from 'stream';

const app = express();
const port = 3002;

app.use(express.json());

const compressData = (data: Buffer): Buffer => {
    const compressedData = Buffer.alloc(lz4.encodeBound(data.length));
    const compressedLength = lz4.encodeBlock(data, compressedData);
    return compressedData.slice(0, compressedLength);
};

const decompressData = (data: Buffer): Buffer => {
    const decompressedData = Buffer.alloc(data.length * 10);
    const decompressedLength = lz4.decodeBlock(data, decompressedData);
    return decompressedData.slice(0, decompressedLength);
};

app.get('/', (req: Request, res: Response) => {
    res.json({ msg: 'Welcome to compress api!' });
})

app.post('/compress', (req: Request, res: Response) => {
    if (!req.headers['content-type']?.startsWith('application/octet-stream')) {
        return res.status(400).send('Content-Type must be application/octet-stream');
    }

    const inputStream = req.pipe(new PassThrough());
    let inputBuffer = Buffer.alloc(0);

    inputStream.on('data', (chunk) => {
        inputBuffer = Buffer.concat([inputBuffer, chunk]);
    });

    inputStream.on('end', () => {
        try {
            const compressedData = compressData(inputBuffer);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.send(compressedData);
        } catch (error) {
            res.status(500).send(`Compression error: ${error}`);
        }
    });
});

app.post('/decompress', (req: Request, res: Response) => {
    if (!req.headers['content-type']?.startsWith('application/octet-stream')) {
        return res.status(400).send('Content-Type must be application/octet-stream');
    }

    const inputStream = req.pipe(new PassThrough());
    let inputBuffer = Buffer.alloc(0);

    inputStream.on('data', (chunk) => {
        inputBuffer = Buffer.concat([inputBuffer, chunk]);
    });

    inputStream.on('end', () => {
        try {
            const decompressedData = decompressData(inputBuffer);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.send(decompressedData);
        } catch (error) {
            res.status(500).send(`Decompression error: ${error}`);
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
