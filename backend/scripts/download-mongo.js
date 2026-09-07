import { MongoBinary } from 'mongodb-memory-server-core';

console.log('[Downloader] Starting MongoDB 6.0.19 download...');
const binaryPath = await MongoBinary.getPath({ version: '6.0.19' });
console.log('[Downloader] MongoDB binary ready at:', binaryPath);
