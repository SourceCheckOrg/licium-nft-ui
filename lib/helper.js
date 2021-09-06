export function adjustPrice(amount) {
    let price = parseFloat(amount) / Math.pow(10, 6)
    return price;
}

export function getIsccComponents(isccCode) {
    const components = isccCode.split('-');
    return {
        metaId: components[0],
        contentId: components[1],
        dataId: components[2],
        instanceId: components[3],
    }
}

export function getTxUrl (txhash) {
    if (process.env.NODE_ENV === 'development') {
        return `https://finder.terra.money/localterra/tx/${txhash}`;
    } else {
        return `https://finder.terra.money/bombay-10/tx/${txhash}`;
    }
}

export async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
