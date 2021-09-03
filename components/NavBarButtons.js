import Link from 'next/link';

export default function NavBarButtons() {
  return (
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <Link href="/">
          <button type="button" className="relative inline-flex items-center mr-2 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500">
            <span>Connect Wallet</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
