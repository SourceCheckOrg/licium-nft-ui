import { useCallback, useState } from 'react';
import PulseLoader from "react-spinners/PulseLoader";
import { create } from 'ipfs-http-client';
import { useConnectedWallet } from '@terra-money/wallet-provider';
import api from "../lib/api";
import { getIsccComponents, getTxUrl} from '../lib/helper';
import { mintNft } from "../lib/terra";
import Button from '../components/Button';
import NavBar from '../components/NavBar';
import NotificationPanel from '../components/NotificationPanel';
import SelectField from "../components/SelectField";
import CID from 'cids';

// ISCC API
const ISCC_BASE_URL = process.env.NEXT_PUBLIC_ISCC_BASE_URL;
const ISCC_GENERATE_FROM_FILE_API = process.env.NEXT_PUBLIC_ISCC_GENERATE_FROM_FILE_API;

// ISCC v1.1 beta API
const ISCC_V1_1_BASE_URL = process.env.NEXT_PUBLIC_ISCC_V1_1_BASE_URL;
const ISCC_V1_1_GEN_FROM_FILE_API = process.env.NEXT_PUBLIC_ISCC_V1_1_GENERATE_FROM_FILE_API;

// IPFS API
const IPFS_BASE_URL = process.env.NEXT_PUBLIC_IPFS_BASE_URL;
const IPFS_API = process.env.NEXT_PUBLIC_IPFS_API;
const ipfsClient = create(`${IPFS_BASE_URL}${IPFS_API}`);

// license offer options
const licenseOptions = [
  {
    name: 'Social Sharing License',
    url: 'https://license.sourcecheck.org/social.html'
  },
  {
    name: 'B2C Standard License',
    url: 'https://license.sourcecheck.org/b2c.html'
  },
  {
    name: 'Physical Reproduction License',
    url: 'https://license.sourcecheck.org/physical.html'
  }
]

function visibleUrl(url) {
  return url.substr(0, 30) + ' ... ' + url.substr(url.length - 30);
}


export default function Home() {
  const connectedWallet = useConnectedWallet();
  
  // NFT state
  const [mediaFile, setMediaFile] = useState("");
  const [mediaData, setMediaData] = useState("");
  const [mediaPath, setMediaPath] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metaId, setMetaId] = useState("");
  const [contentId, setContentId] = useState("");
  const [dataId, setDataId] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [tophash, setTophash] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("");
  const [price, setPrice] = useState("");
  const [mintTx, setMintTx] = useState("");

  // UI state
  const [useTermsAccepted, setUseTermsAccepted] = useState(false);
  const [mintingNft, setMintingNft] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Handle file upload
  async function onFileUpload(evt) {
    const file = evt.target.files[0];
    setMediaFile("");
    setMediaData("");
    setMediaPath("");
    setMetaId("");
    setContentId("");
    setDataId("");
    setInstanceId("");
    setTophash("");
    setMediaFile(file);
    setMediaData({
      name: file.name,
      size: file.size,
    });
  }

  async function onSend() {
    const file = mediaFile;
    try {
      // generate ISCC code
      const url = `${ISCC_BASE_URL}${ISCC_GENERATE_FROM_FILE_API}`;
      const data = { title: name };
      const formData = new FormData();
      formData.append("data", JSON.stringify(data));
      formData.append("file", file);
      const response = await api.request({ method: "POST", url, data: formData, headers: { "Content-Type": "multipart/form-data" }});
      const isccData = response.data;
      const components = getIsccComponents(isccData.iscc);
      setMetaId(components.metaId);
      setContentId(components.contentId);
      setDataId(components.dataId);
      setInstanceId(components.instanceId);
      setTophash(isccData.tophash);
    } catch (err) {
      setErrorMsg("Error generating ISCC code for the image!");
      setTimeout(() => setErrorMsg(null), 3000);
    }

    let preview;

    try {
      // generate image thumbnail
      const url = `${ISCC_V1_1_BASE_URL}${ISCC_V1_1_GEN_FROM_FILE_API}`;
      const data = { title: name };
      const formData = new FormData();
      formData.append("data", JSON.stringify(data));
      formData.append("file", file);
      const response = await api.request({ method: "POST", url, data: formData, headers: { "Content-Type": "multipart/form-data" }});
      preview = response.data.preview;
    } catch (err) {
      setErrorMsg("Error generating thumbnail of the image!");
      setTimeout(() => setErrorMsg(null), 3000);
    }

    try {
      const fetchedPreview = await fetch(preview);
      const blob = await fetchedPreview.blob();
      const thumbnailFile = new File ([blob], file.name, { type: "image/webp" });
      const uploadedFile = await ipfsClient.add(thumbnailFile);
      let v1Cid = new CID(uploadedFile.path).toV1().toString('base32');
      setMediaPath(`https://${v1Cid}.ipfs.infura-ipfs.io`);
    } catch (err) {
      setErrorMsg("Error storing thumbnail of the image!");
      setTimeout(() => setErrorMsg(null), 3000);
    }
  }

  // Handle file remove
  function onFileRemove(evt) {
    evt.preventDefault();
    setMediaFile("");
    setMediaData("");
    setMediaPath("");
    setMetaId("");
    setContentId("");
    setDataId("");
    setInstanceId("");
    setTophash("");
  }

  function canMint() {
    return  connectedWallet && metaId && contentId && dataId && 
            instanceId && tophash && name && description && 
            mediaPath && licenseUrl && price && !mintTx && 
            useTermsAccepted;
  }

  const onSubmit = useCallback(async () => {
    try {
      setMintingNft(true);
      const result = await mintNft(
        connectedWallet, metaId, contentId, dataId, instanceId, 
        tophash, name, description, mediaPath, licenseUrl, price
      );
      setMintingNft(false);
      if (result.result === 'OK') {
        setTokenId(result.tokenId);
        setMintTx(result.mintTx);
        setSuccessMsg("NFT Token minted successfully!");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg("Error minting NFT Token!");
        setTimeout(() => setErrorMsg(null), 3000);
      }
    } catch (err) {
      console.log('ERROR: ', err);
    }
  }, [connectedWallet, metaId, contentId, dataId, instanceId, tophash, name, description, mediaPath, licenseUrl, price]);

  return (
    <div>
      <NotificationPanel show={!!successMsg} bgColor="bg-green-400" message={successMsg} />
      <NotificationPanel show={!!errorMsg} bgColor="bg-red-400" message={errorMsg} />
      <NavBar />
      <div className="max-w-4xl mx-auto p-8">
        <div className="max-w-7xl mx-auto mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Mint NFT</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-8 divide-y divide-gray-200">
          <div className="space-y-8 divide-y divide-gray-200">
            <div>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-8">
                <div className="sm:col-span-8">
                  <label htmlFor="cover-photo" className="block text-sm font-medium text-gray-700">NFT Image</label>
                  <div className="mt-1 flex justify-center py-1 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      { mediaPath ? (
                        <div className="p-3 relative">
                          <img className="inline-block" src={mediaPath} />
                        </div>
                      ) : (
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      {mediaData && mediaData.name ? (
                        <>
                          <p className="text-sm text-gray-500">
                            {mediaData.name} ({mediaData.size} {'bytes'})
                          </p>
                          <div className="flex justify-center font-medium text-sm text-indigo-600">
                            <label htmlFor="mediaFile" className="cursor-pointer rounded-md hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                              <span>Replace</span>
                              <input
                                id="mediaFile"
                                name="mediaFile"
                                type="file"
                                className="sr-only"
                                onChange={onFileUpload}
                              />
                            </label>
                            <span className="pl-1 hover:text-indigo-500">{" "} /{" "} <button onClick={onFileRemove}>Remove</button></span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex text-sm text-gray-600">
                            <label htmlFor="mediaFile" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                              <span>Upload a file</span>
                              <input
                                id="mediaFile"
                                name="mediaFile"
                                type="file"
                                className="sr-only"
                                onChange={onFileUpload}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">Images up to 30MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-8">
                  <input 
                    type="checkbox"  
                    className="mr-2" 
                    name="useTermsAccepted" 
                    checked={useTermsAccepted}
                    onChange={() => setUseTermsAccepted(!useTermsAccepted)}
                  />
                  <label htmlFor="terms" className="text-xs font-medium text-gray-700">
                      This Licium demo is for testing purposes only and pre-alpha! By using the app you accept the 
                      <a
                        className="ml-1 text-indigo-500 font-bold" 
                        target="_blank" 
                        href="https://github.com/licium/spacecamp/blob/main/how-to-use-the-demo.md#terms--conditions"
                      > 
                        terms and condition
                      </a>
                  </label>
                </div>
                { tokenId && (
                  <div className="sm:col-span-8">
                    <label htmlFor="tokenId" className="block text-sm font-medium text-gray-700">Token ID</label>
                    <div className="mt-1">
                      <input 
                        id="tokenId"
                        name="tokenId"
                        type="text"
                        value={tokenId}
                        disabled
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div> 
                )}
                { contentId && (
                  <>
                    <div className="sm:col-span-8 block text-sm font-bold text-gray-700">
                      <span>ISCC Codes</span>
                    </div>
                    <div className="sm:col-span-2 text-xs">
                      <label htmlFor="metaId" className="block text-sm font-medium text-gray-700">Meta-Code</label>
                      <div className="mt-1">
                        <input 
                          id="metaId"
                          name="metaId"
                          type="text"
                          value={metaId}
                          disabled
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="contentId" className="block text-sm font-medium text-gray-700">Content-Code</label>
                      <div className="mt-1">
                        <input 
                          id="contentId"
                          name="contentId"
                          type="text"
                          value={contentId}
                          disabled
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="dataId" className="block text-sm font-medium text-gray-700">Data-Code</label>
                      <div className="mt-1">
                        <input 
                          id="dataId"
                          name="dataId"
                          type="text"
                          value={dataId}
                          disabled
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="instanceId" className="block text-sm font-medium text-gray-700">Instance-Code</label>
                      <div className="mt-1">
                        <input 
                          id="instanceId"
                          name="instanceId"
                          type="text"
                          value={instanceId}
                          disabled
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </>
                )}
                { mediaPath && (
                  <div className="sm:col-span-8">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Media URL (IPFS)</label>
                  <div className="mt-1">
                    <div className="border border-gray-300 rounded-md text-sm text-indigo-500 px-3 py-2">
                      <a target="_blank" href={mediaPath}>{visibleUrl(mediaPath)}</a>
                    </div>
                  </div>
                </div>
                )}
                { contentId && (
                  <>
                    <div className="sm:col-span-8">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Name</label>
                      <div className="mt-1">
                        <input 
                          id="name"
                          name="name"
                          type="text"
                          value={name}
                          onChange={(evt) => setName(evt.target.value)}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-8">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                      <div className="mt-1">
                        <textarea
                          id="about"
                          name="description"
                          rows={3}
                          value={description}
                          onChange={(evt) => setDescription(evt.target.value)}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-8">
                      <label htmlFor="licenseUrl" className="block text-sm font-medium text-gray-700">License Offer</label>
                      <div className="mt-1">
                          <SelectField
                            options={licenseOptions}
                            valueField="url"
                            labelField="name"
                            selected={licenseUrl ? licenseUrl : null}
                            onChange={(value) => setLicenseUrl(value)}
                          />
                      </div>
                    </div>
                    <div className="sm:col-span-8">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">License price</label>
                      <div className="mt-1">
                        <input 
                          id="price"
                          name="price"
                          type="text"
                          value={price}
                          onChange={(evt) => setPrice(evt.target.value)}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    { mintTx && (
                      <div className="sm:col-span-8">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Mint tx</label>
                        <div className="mt-1">
                          <div className="border border-gray-300 rounded-md text-sm text-indigo-500 px-3 py-2">
                            <a target="_blank" href={getTxUrl(mintTx)}>{mintTx}</a>
                          </div>
                        </div>
                      </div>
                    )}
                   
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="pt-5">
            <div className="flex justify-center">
            { !mediaPath && (
              <div className="sm:col-span-8 flex justify-center">
                <Button label="Send" color="indigo" disabled={!mediaFile || !useTermsAccepted} onClick={() => onSend()}/>  
              </div>
            )}
            { mediaPath && !mintingNft && (
              <Button label="Mint NFT" color="indigo" onClick={onSubmit} disabled={!canMint()}/>
            )}
            { mintingNft && (
              <div className="inline-block text-center py-2 px-2 border border-transparent shadow-sm rounded-md h-10 w-20 bg-indigo-600 hover:bg-indigo-700">
                <PulseLoader color="white" loading={mintingNft} size={9} />
              </div>
            )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
