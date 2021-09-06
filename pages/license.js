import { useCallback, useState } from 'react';
import Image from 'next/image'
import PulseLoader from "react-spinners/PulseLoader";
import { useConnectedWallet } from '@terra-money/wallet-provider';
import api from "../lib/api";
import { adjustPrice, getIsccComponents ,getTxUrl} from '../lib/helper';
import { licenseNft, resolveNft } from "../lib/terra";
import Button from '../components/Button';
import NavBar from '../components/NavBar';
import NotificationPanel from '../components/NotificationPanel';

// iscc api 
const ISCC_BASE_URL = process.env.NEXT_PUBLIC_ISCC_BASE_URL;
const ISCC_GENERATE_FROM_FILE_API = process.env.NEXT_PUBLIC_ISCC_GENERATE_FROM_FILE_API;

export default function License() {
  const connectedWallet = useConnectedWallet();
  
  // nft state
  const [tokenId, setTokenId] = useState("");
  const [owner, setOwner] = useState("");
  const [mediaFile, setMediaFile] = useState("");
  const [mediaData, setMediaData] = useState("");
  const [mediaPath, setMediaPath] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metaId, setMetaId] = useState("");
  const [contentId, setContentId] = useState("");
  const [dataId, setDataId] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [tophash, setTophash] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("");
  const [price, setPrice] = useState("");
  const [licenseTx, setLicenseTx] = useState("");

  // ui state
  const [resolvingNft, setResolvingNft] = useState(false);
  const [licensingNft, setLicensingNft] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // handle file upload
  async function onFileUpload(evt) {
    const file = evt.target.files[0];
    setResolvingNft(true);
    setMediaFile(file);
    setMediaData({
      name: file.name,
      size: file.size, // TODO format in kB or MB when rendering
    });

    let isccData;
    let components;
   
    try {
      // generate ISCC code
      const url = `${ISCC_BASE_URL}${ISCC_GENERATE_FROM_FILE_API}`;
      const data = { title: name };
      const formData = new FormData();
      formData.append("data", JSON.stringify(data));
      formData.append("file", file);
      const response = await api.request({ method: "POST", url, data: formData, headers: { "Content-Type": "multipart/form-data" }});
      isccData = response.data;
      components = getIsccComponents(isccData.iscc);
      setMetaId(components.metaId);
      setContentId(components.contentId);
      setDataId(components.dataId);
      setInstanceId(components.instanceId);
      setTophash(isccData.tophash);
    } catch (err) {
      console.log('err', err);
    }

    try {
      // resolve NFT
      const result = await resolveNft(components.contentId);
      if (result) {
        setTokenId(result.token_id);
        setOwner(result.owner);
        setName(result.name);
        setDescription(result.description);
        setMediaPath(result.image);
        setLicenseUrl(result.license_url);
        setPrice(adjustPrice(result.license_price.amount))
        setSuccessMsg('NFT found! You can license it!');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg('No NFT found with this image!');
        setTimeout(() => setErrorMsg(null), 5000);
      }
      setResolvingNft(false);
    } catch (err) {
      setResolvingNft(false);
      setErrorMsg('Error resolving NFT!')
      setTimeout(() => setErrorMsg(null), 3000);
    }
  }

  // Handle file remove
  function onFileRemove(evt) {
    evt.preventDefault();
    setTokenId("")
    setMediaFile("");
    setMediaData("");
    setMediaPath("");
    setName("");
    setDescription("");
    setMetaId("");
    setContentId("");
    setDataId("");
    setInstanceId("");
    setTophash("");
    setLicenseUrl("");
    setPrice("");
    setLicenseTx("");
  }

  function canLicense() {
    return connectedWallet && tokenId && licenseUrl && price;
  }

  const onSubmit = useCallback(async () => {
    setLicensingNft(true);
    const result = await licenseNft(connectedWallet, tokenId, price);
    setLicensingNft(false);
    if (result.result === 'OK') {
      setLicenseTx(result.licenseTx);
      setSuccessMsg("NFT Token licensed successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg("Error licensing NFT Token!");
      setTimeout(() => setErrorMsg(null), 3000);
    }

  }, [connectedWallet, tokenId, price])
  
  return (
    <div>
      <NotificationPanel show={!!successMsg} bgColor="bg-green-400" message={successMsg} />
      <NotificationPanel show={!!errorMsg} bgColor="bg-red-400" message={errorMsg} />
      <NavBar />
      <div className="max-w-4xl mx-auto p-6">
        <div className="max-w-7xl mx-auto mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">License NFT</h1>
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
                        <div className="w-48 h-48 relative">
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
                            <label htmlFor="raw_pdf" className="cursor-pointer rounded-md hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                              <span>Replace</span>
                              <input
                                id="raw_pdf"
                                name="raw_pdf"
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
                            <label htmlFor="raw_pdf" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                              <span>Upload a file</span>
                              <input
                                id="raw_pdf"
                                name="raw_pdf"
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
                  <div className="sm:col-span-8">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Token ID</label>
                    <div className="mt-1">
                      <input 
                        id="name"
                        name="name"
                        type="text"
                        value={tokenId}
                        disabled
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div> 
                )}
                { owner && (
                  <div className="sm:col-span-8">
                    <label htmlFor="owner" className="block text-sm font-medium text-gray-700">Owner (Terra Blockchain)</label>
                    <div className="mt-1">
                      <input 
                        id="owner"
                        name="owner"
                        type="text"
                        value={owner}
                        disabled
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div> 
                )}
                { contentId && (
                  <>
                    <div className="sm:col-span-2 text-xs">
                      <label htmlFor="metaId" className="block text-sm font-medium text-gray-700">ISCC Code (Meta-ID)</label>
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
                      <label htmlFor="contentId" className="block text-sm font-medium text-gray-700">Content ID</label>
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
                      <label htmlFor="dataId" className="block text-sm font-medium text-gray-700">Data ID</label>
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
                      <label htmlFor="instanceId" className="block text-sm font-medium text-gray-700">Instance ID</label>
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
                        <a href={mediaPath}>{mediaPath}</a>
                      </div>
                    </div>
                  </div>
                )}
                { name && (
                  <div className="sm:col-span-8">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Name</label>
                    <div className="mt-1">
                      <input 
                        id="name"
                        name="name"
                        type="text"
                        value={name}
                        disabled
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                )}
                { description && (
                  <div className="sm:col-span-8">
                    <label htmlFor="about" className="block text-sm font-medium text-gray-700">Description</label>
                    <div className="mt-1">
                      <textarea
                        id="about"
                        name="about"
                        rows={3}
                        value={description}
                        disabled
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                )}
                { licenseUrl && (
                  <div className="sm:col-span-8">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">License URL</label>
                    <div className="mt-1">
                      <div className="border border-gray-300 rounded-md text-sm text-indigo-500 px-3 py-2">
                        <a target="_blank" href={licenseUrl}>{licenseUrl}</a>
                      </div>
                    </div>
                  </div>
                )}
                { price && (
                  <div className="sm:col-span-8">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">License price</label>
                    <div className="mt-1">
                      <input 
                        id="price"
                        name="price"
                        type="text"
                        value={price}
                        disabled
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                )}
                { licenseTx && (
                  <div className="sm:col-span-6">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">License tx</label>
                    <div className="mt-1">
                      <div className="border border-gray-300 rounded-md text-sm text-indigo-500 px-3 py-2">
                        <a target="_blank" href={getTxUrl(licenseTx)}>{licenseTx}</a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="pt-5">
            <div className="flex justify-center">
            {licensingNft || resolvingNft ? (
              <div className="inline-block text-center py-2 px-2 border border-transparent shadow-sm rounded-md h-10 w-20 bg-indigo-600 hover:bg-indigo-700">
                <PulseLoader color="white" loading={licensingNft || resolvingNft} size={9} />
              </div>
            ) : (
              <Button label="License NFT" color="indigo" onClick={onSubmit} disabled={licenseTx || !canLicense()}/>
            )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
