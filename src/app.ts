import { bytesToHex, hexToBytes, processFile } from './utils';
import { Noble, KeyPair } from '@cmdcode/crypto-utils';
import BTON from '@cmdcode/bton';
import { pushBTCpmt } from './externalDataCalls';

const App = async () => {
  const privkey = bytesToHex(Noble.utils.randomPrivateKey());
  const ec = new TextEncoder();
  const filePath = 'file.txt';
  const hex = await processFile(filePath);
  const data = hexToBytes(hex);
  const seckey = new KeyPair(privkey);
  const pubkey = seckey.pub.rawX;
  const mimetype = ec.encode(sessionStorage['mimetype']);
  const script = [
    pubkey,
    'OP_CHECKSIG',
    'OP_0',
    'OP_IF',
    ec.encode('ord'),
    '01',
    mimetype,
    'OP_0',
    data,
    'OP_ENDIF',
  ];
  const leaf = await BTON.Tap.getLeaf(BTON.Script.encode(script));
  const [tapkey] = await BTON.Tap.getPubkey(pubkey, [leaf]);
  const cblock = await BTON.Tap.getPath(pubkey, leaf);
  const fundingAddress = BTON.Tap.encodeAddress(tapkey, 'bc');
  const toAddress = 'someaddress';
  const decodedToAddress = '5120' + BTON.Tap.decodeAddress(toAddress).hex;
  const txsize = 200 + hex.length / 2;

  const txinfo = {
    txid: 'some txid',
    vout: 0,
    value: 100000,
  };
  var txid = txinfo[0];
  var vout = txinfo[1];
  var amt = txinfo[2];

  let feerate = 30; // change or set dynamically
  var fee = feerate * txsize;

  const redeemtx = {
    version: 2,
    input: [
      {
        txid: txid,
        vout: vout,
        prevout: { value: amt, scriptPubKey: '5120' + tapkey },
        witness: [],
      },
    ],
    output: [
      {
        value: amt - fee,
        scriptPubKey: decodedToAddress,
      },
    ],
    locktime: 0,
  };
  const sec = await BTON.Tap.getSeckey(seckey.raw, [leaf]);
  const sig = await BTON.Sig.taproot.sign(seckey.raw, redeemtx, 0, {
    extension: leaf,
  });
  redeemtx.input[0].witness = [sig, script, cblock];
  console.dir(redeemtx, { depth: null });
  //await BTON.Sig.taproot.verify(redeemtx, 0, {extension: leaf}, true);
  var rawtx = BTON.Tx.encode(redeemtx);
  console.log('Txdata:', rawtx);
  var txid = await pushBTCpmt(rawtx);
};
App();
