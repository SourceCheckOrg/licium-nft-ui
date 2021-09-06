import { useCallback, useState } from 'react';
import Image from 'next/image'
import PulseLoader from "react-spinners/PulseLoader";
import { create } from 'ipfs-http-client';
import { useConnectedWallet } from '@terra-money/wallet-provider';
import api from "../lib/api";
import { getTxUrl} from '../lib/helper';
import { mintNft } from "../lib/terra";
import Button from '../components/Button';
import NavBar from '../components/NavBar';
import NotificationPanel from '../components/NotificationPanel';
import SelectField from "../components/SelectField";

// ISCC api 
const ISCC_BASE_URL = process.env.NEXT_PUBLIC_ISCC_BASE_URL;
const ISCC_GENERATE_FROM_FILE_API = process.env.NEXT_PUBLIC_ISCC_GENERATE_FROM_FILE_API;

// IPFS api
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

export default function Home() {
  const connectedWallet = useConnectedWallet();
  
  // NFT state
  const [tokenId, setTokenId] = useState();
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaData, setMediaData] = useState(null);
  const [mediaPath, setMediaPath] = useState("");
  const [name, setName] = useState("");
  const [isccCode, setIsccCode] = useState("");
  const [tophash, setTophash] = useState("");
  const [description, setDescription] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("");
  const [price, setPrice] = useState("");
  const [mintTx, setMintTx] = useState(null);

  // UI state
  const [mintingNft, setMintingNft] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Handle file upload
  async function onFileUpload(evt) {
    const file = evt.target.files[0];
    setMediaFile(file);
    setMediaData({
      name: file.name,
      size: file.size,
    });
    
    try {
      // generate ISCC code
      const url = `${ISCC_BASE_URL}${ISCC_GENERATE_FROM_FILE_API}`;
      const data = { title: name };
      const formData = new FormData();
      formData.append("data", JSON.stringify(data));
      formData.append("file", file);
      const response = await api.request({ method: "POST", url, data: formData, headers: { "Content-Type": "multipart/form-data" }});
      const isccData = response.data;
      setIsccCode(isccData.iscc);
      setTophash(isccData.tophash);
    } catch (err) {
      console.log(err);
    }

    try {
      // upload file to IPFS
      const uploadedFile = await ipfsClient.add(file)
      const uploadedPath = `https://ipfs.infura.io/ipfs/${uploadedFile.path}`;
      setMediaPath(uploadedPath);
    } catch (err) {
      console.log(err);
    }
  }

  // Handle file remove
  function onFileRemove(evt) {
    evt.preventDefault();
    setMediaFile(null);
    setMediaData(null);
    setMediaPath("");
    setIsccCode("");
    setTophash("");
  }

  function canMint() {
    return connectedWallet && isccCode && tophash && name && description && mediaPath && licenseUrl && price;
  }

  const onSubmit = useCallback(async () => {
    try {
      setMintingNft(true);
      const result = await mintNft(connectedWallet, isccCode, tophash, name, description, mediaPath, licenseUrl, price);
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
  }, [connectedWallet, isccCode, tophash, name, description, mediaPath, licenseUrl, price]);

  return (
    <div>
      <NotificationPanel show={!!successMsg} bgColor="bg-green-400" message={successMsg} />
      <NotificationPanel show={!!errorMsg} bgColor="bg-red-400" message={errorMsg} />
      <NavBar />
      <div className="max-w-4xl mx-auto p-6">
        <div className="max-w-7xl mx-auto mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Mint NFT</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-8 divide-y divide-gray-200">
          <div className="space-y-8 divide-y divide-gray-200">
            <div>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label htmlFor="cover-photo" className="block text-sm font-medium text-gray-700">NFT Image</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      { mediaPath ? (
                        <div className="w-80 h-80 relative">
                          <Image layout="fill" objectFit="contain" src={mediaPath} />
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
                { tokenId && (
                  <div className="sm:col-span-6">
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
                { isccCode && (
                  <div className="sm:col-span-6">
                    <label htmlFor="isccCode" className="block text-sm font-medium text-gray-700">ISCC Code</label>
                    <div className="mt-1">
                      <input 
                        id="isccCode"
                        name="isccCode"
                        type="text"
                        value={isccCode}
                        disabled
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div> 
                )}
                { mediaPath && (
                  <div className="sm:col-span-6">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Media URL (IPFS)</label>
                  <div className="mt-1">
                    <div className="border border-gray-300 rounded-md text-sm text-indigo-500 px-3 py-2">
                      <a href={mediaPath}>{mediaPath}</a>
                    </div>
                  </div>
                </div>
                )}
                { isccCode && (
                  <>
                    <div className="sm:col-span-6">
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
                    <div className="sm:col-span-6">
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
                    <div className="sm:col-span-6">
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
                    <div className="sm:col-span-6">
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
                      <div className="sm:col-span-6">
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
            {mintingNft ? (
              <div className="inline-block text-center py-2 px-2 border border-transparent shadow-sm rounded-md h-10 w-20 bg-indigo-600 hover:bg-indigo-700">
                <PulseLoader color="white" loading={mintingNft} size={9} />
              </div>
            ) : (
              <Button label="Mint NFT" color="indigo" onClick={onSubmit} disabled={mintTx || !canMint()}/>
            )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
