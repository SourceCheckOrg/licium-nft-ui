import { useWallet, WalletStatus } from '@terra-money/wallet-provider';
import { useState } from 'react';
import { create } from 'ipfs-http-client';
import api from "../lib/api";
import NavBar from '../components/NavBar';

// ISCC api 
const ISCC_BASE_URL = process.env.NEXT_PUBLIC_ISCC_BASE_URL;
const ISCC_GENERATE_FROM_FILE_API = process.env.NEXT_PUBLIC_ISCC_GENERATE_FROM_FILE_API;

// IPFS api
const IPFS_BASE_URL = process.env.NEXT_PUBLIC_IPFS_BASE_URL;
const IPFS_API = process.env.NEXT_PUBLIC_IPFS_API;
const ipfsClient = create(`${IPFS_BASE_URL}${IPFS_API}`);

export default function Home() {
  const { 
    status, network, wallets, availableConnectTypes, 
    availableInstallTypes, connect, install, disconnect
  } = useWallet();
  
  // NFT state
  const [uuid, setUuid] = useState(); // should be generated as id?
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaData, setMediaData] = useState(null);
  const [mediaPath, setMediaPath] = useState("");
  const [name, setName] = useState("");
  const [isccCode, setIsccCode] = useState("");
  const [tophash, setTophash] = useState("");
  const [description, setDescription] = useState("");

  // UI state
  const [generatingIscc, setGeneratingIscc] = useState(false);
  const [uploadingToIpfs, setUploadingToIpfs] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Handle file upload
  async function onFileUpload(evt) {
    const file = evt.target.files[0];
    setMediaFile(file);
    setMediaData({
      name: file.name,
      size: file.size, // TODO format in kB or MB when rendering
    });
    
    try {
      // generate ISCC code
      const url = `${ISCC_BASE_URL}${ISCC_GENERATE_FROM_FILE_API}`;
      const data = { title: name };
      const formData = new FormData();
      formData.append("data", JSON.stringify(data));
      formData.append("file", file);
      setGeneratingIscc(true);
      const response = await api.request({ method: "POST", url, data: formData, headers: { "Content-Type": "multipart/form-data" }});
      const isccData = response.data;
      setIsccCode(isccData.iscc);
      setTophash(isccData.tophash);
      setGeneratingIscc(false);
      setSuccessMsg('ISCC code generation successful!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setGeneratingIscc(false);
      setErrorMsg('ISCC code generation failed!')
      setTimeout(() => setErrorMsg(null), 3000);
    }

    try {
      // upload file to IPFS
      setUploadingToIpfs(true);
      const uploadedFile = await ipfsClient.add(file)
      const uploadedPath = `https://ipfs.infura.io/ipfs/${uploadedFile.path}`;
      setUploadingToIpfs(false);
      setMediaPath(uploadedPath);
      setSuccessMsg('Upload to IPFS successful!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setUploadingToIpfs(false);
      setErrorMsg('Upload to IPFS failed!')
      setTimeout(() => setErrorMsg(null), 3000);
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

  return (
    <div>
      <NavBar />
      <div className="max-w-4xl mx-auto p-6">
        <form className="space-y-8 divide-y divide-gray-200">
          <div className="space-y-8 divide-y divide-gray-200">
            <div>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label htmlFor="cover-photo" className="block text-sm font-medium text-gray-700">NFT</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
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
                      {mediaData && mediaData.name ? (
                        <>
                          <p className="text-sm text-gray-500">
                            {mediaData.name} ({mediaData.size})
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
                          <p className="text-xs text-gray-500">PDF up to 30MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                { isccCode && (
                  <div className="sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">ISCC Code</label>
                    <div className="mt-1">
                      <input 
                        id="name"
                        name="name"
                        type="text"
                        value={isccCode}
                        disabled
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div> 
                )}
                { tophash && (
                  <div className="sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Tophash</label>
                    <div className="mt-1">
                      <input 
                        id="name"
                        name="name"
                        type="text"
                        value={tophash}
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
                  <label htmlFor="about" className="block text-sm font-medium text-gray-700">Description</label>
                  <div className="mt-1">
                    <textarea
                      id="about"
                      name="about"
                      rows={3}
                      value={description}
                      onChange={(evt) => setDescription(evt.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-5">
            <div className="flex justify-center">
              <button type="submit" className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Mint NFT
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
