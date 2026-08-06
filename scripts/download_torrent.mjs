import WebTorrent from 'webtorrent';

const magnet = 'magnet:?xt=urn:btih:04f852e11ad620435097c26b08c670b9328f79ed&dn=%5BJudas%5D%20Akame%20ga%20Kill%21%20%28Season%201%29%20%5BBD%201080p%5D%5BHEVC%20x265%2010bit%5D%5BDual-Audio%5D';

console.log('Starting torrent download...');
const client = new WebTorrent();

client.add(magnet, { path: '/tmp/akame' }, (torrent) => {
  console.log(`Downloading: ${torrent.name}`);
  console.log(`Files: ${torrent.files.length}`);
  torrent.files.forEach(f => console.log(`  ${f.name} (${Math.round(f.length / 1024 / 1024)}MB)`));

  torrent.on('download', () => {
    console.log(`Progress: ${Math.round(torrent.progress * 100)}% | ${Math.round(torrent.downloadSpeed / 1024)}KB/s | ${torrent.numPeers} peers`);
  });

  torrent.on('done', () => {
    console.log('Download complete!');
    client.destroy();
  });

  torrent.on('error', (err) => {
    console.error('Torrent error:', err.message);
  });
});

setTimeout(() => {
  console.log('15s check — still running...');
}, 15000);
