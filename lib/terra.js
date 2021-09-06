import { v4 as uuidv4 } from 'uuid';
import { LocalTerra, LCDClient, MsgExecuteContract, StdFee} from "@terra-money/terra.js";
import { CreateTxFailed, Timeout, TxFailed, TxUnspecifiedError, UserDenied } from '@terra-money/wallet-provider';
import { sleep } from '../lib/helper';

const LICIUM_CW721_ADDR = process.env.NEXT_PUBLIC_LICIUM_CW721_ADDR;
const NODE_ENV = process.env.NODE_ENV;
let client;

function getClient() {
   if (!client) {
     if (NODE_ENV === 'development') {
        client = new LocalTerra();
     } else {
        client = new LCDClient({
          chainID: "bombay-10",
          URL: "https://bombay-lcd.terra.dev"
        });
     }
   } 
   return client;
}

export async function resolveNft(isccCode) {
  const client = getClient();
  const queryMsg = {
    get_by_iscc_code: {
      iscc_code: isccCode
    }
  };
  return await client.wasm.contractQuery(LICIUM_CW721_ADDR, queryMsg);
}
 
export async function mintNft(connectedWallet, isccCode, tophash, name, description, image, licenseUrl, price ) {
  if (!connectedWallet) {
    return;
  }
  const tokenId = uuidv4();
  const amount = Math.trunc(price * Math.pow(10, 6)).toString();
  const licensePrice = {
    denom: "uusd",
    amount,
  }
  const mintMsg = new MsgExecuteContract(connectedWallet.walletAddress, LICIUM_CW721_ADDR, {
    mint: {
      token_id: tokenId,
      iscc_code: isccCode,
      tophash,
      owner: connectedWallet.walletAddress,
      name,
      description,
      image,
      license_url: licenseUrl,
      license_price: licensePrice
    },
  });
  try {
    const result = await connectedWallet.post({
      fee: new StdFee(1000000, '200000uusd'),
      msgs: [mintMsg],
    });
    const client = getClient();
    await sleep(1000);
    const txInfo = await client.tx.txInfo(result.result.txhash)
    if (!txInfo.code) {
      return { 
        result: 'OK',
        mintTx: result.result.txhash,
        tokenId
      }
    } else {
      return {
        result: 'ERR',
        errorMsg: 'Error minting NFT token! Probably someone have already minted a token using this image!'
      }
    }
  } catch (error) {
    let errorMsg;
    if (error instanceof UserDenied) {
      errorMsg = 'User Denied';
    } else if (error instanceof CreateTxFailed) {
      errorMsg = 'Create Tx Failed: ' + error.message;
    } else if (error instanceof TxFailed) {
      errorMsg = 'Tx Failed: ' + error.message;
    } else if (error instanceof Timeout) {
      errorMsg = 'Timeout';
    } else if (error instanceof TxUnspecifiedError) {
      errorMsg = 'Unspecified Error: ' + error.message;
    } else {
      errorMsg = 'Unknown Error: ' + (error instanceof Error ? error.message : String(error));
    }
    return { result: 'ERR', errorMsg };
  }
}

export async function licenseNft(connectedWallet, tokenId, price) {
  if (!connectedWallet) {
    return;
  }
  // TODO adding this to cover eventual fees. Fix to calculate fees properly
  price += 2;
  const amount = Math.trunc(price * Math.pow(10, 6)).toString();
  const licenseMsg = new MsgExecuteContract(
    connectedWallet.walletAddress, 
    LICIUM_CW721_ADDR, 
    { license: { token_id: tokenId } },
    {
      uusd: amount,
    }
  );
  try {
    const result = await connectedWallet.post({
      fee: new StdFee(1000000, '1000000uusd'),
      msgs: [licenseMsg],
    })
    const client = getClient();
    await sleep(1000);
    const txInfo = await client.tx.txInfo(result.result.txhash)
    if (!txInfo.code) {
      return { 
        result: 'OK',
        licenseTx: result.result.txhash,
      }
    } else {
      return {
        result: 'ERR',
        errorMsg: 'Error minting NFT token! Probably someone have already minted a token using this image!',
      }
    }
  } catch (error) {
    let errorMsg;
    if (error instanceof UserDenied) {
      errorMsg = 'User Denied';
    } else if (error instanceof CreateTxFailed) {
      errorMsg = 'Create Tx Failed: ' + error.message;
    } else if (error instanceof TxFailed) {
      errorMsg = 'Tx Failed: ' + error.message;
    } else if (error instanceof Timeout) {
      errorMsg = 'Timeout';
    } else if (error instanceof TxUnspecifiedError) {
      errorMsg = 'Unspecified Error: ' + error.message;
    } else {
      errorMsg = 'Unknown Error: ' + (error instanceof Error ? error.message : String(error));
    }
    return { result: 'ERR', errorMsg };
  }
}
