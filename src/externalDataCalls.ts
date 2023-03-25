import { getData, postData } from './utils';

export async function getAllFeeRates() {
  var fees = await getData('https://mempool.space/api/v1/fees/recommended');
  fees = JSON.parse(fees as string);
  return fees;
}

export async function pushBTCpmt(rawtx) {
  var txid = await postData('https://mempool.space/api/tx', rawtx);
  return txid;
}

export async function getBitcoinPrice() {
  var prices = [];
  var cbprice = await getBitcoinPriceFromCoinbase();
  var kprice = await getBitcoinPriceFromKraken();
  var cdprice = await getBitcoinPriceFromCoindesk();
  var gprice = await getBitcoinPriceFromGemini();
  var bprice = await getBitcoinPriceFromBybit();
  prices.push(
    Number(cbprice),
    Number(kprice),
    Number(cdprice),
    Number(gprice),
    Number(bprice)
  );
  prices.sort();
  return prices[2];
}
export async function getBitcoinPriceFromCoinbase(): Promise<number> {
  const data = await getData('https://api.coinbase.com/v2/prices/BTC-USD/spot');
  const json = JSON.parse(data as string);
  const price = json.data.amount;
  return price;
}

export async function getBitcoinPriceFromBybit(): Promise<number> {
  const data = await getData(
    'https://api-testnet.bybit.com/derivatives/v3/public/order-book/L2?category=linear&symbol=BTCUSDT'
  );
  const json = JSON.parse(data as string);
  const price = json.result.b[0][0];
  return price;
}

export async function getBitcoinPriceFromKraken(): Promise<number> {
  const data = await getData(
    'https://api.kraken.com/0/public/Ticker?pair=XBTUSD'
  );
  const json = JSON.parse(data as string);
  const price = json.result.XXBTZUSD.a[0];
  return price;
}

export async function getBitcoinPriceFromCoindesk(): Promise<number> {
  const data = await getData(
    'https://api.coindesk.com/v1/bpi/currentprice.json'
  );
  const json = JSON.parse(data as string);
  const price = json.bpi.USD.rate_float;
  return price;
}

export async function getBitcoinPriceFromGemini(): Promise<number> {
  const data = await getData('https://api.gemini.com/v2/ticker/BTCUSD');
  const json = JSON.parse(data as string);
  const price = json.bid;
  return price;
}
