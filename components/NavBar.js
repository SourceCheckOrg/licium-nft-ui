import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { IconMenu, IconX } from './Icons';
import NavBarButtons from './NavBarButtons';
import Image from 'next/image';
import logo from '../public/logo.png'

const CLASSES_TEXT_SELECTED = 'bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium';
const CLASSES_TEXT_NORMAL = 'text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium';

const CLASSES_MOBILE_TEXT_SELECTED = 'bg-gray-700 block text-white px-3 py-2 rounded-md text-base font-medium';
const CLASSES_MOBILE_TEXT_NORMAL = 'text-gray-300 block hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium';

const menuItems = [
  {
    label: 'Mint NFT',
    href: '/'
  },
  {
    label: 'License NFT',
    href: '/license'
  }
]

function renderMenuItems(pathname, isMobile) {
  return menuItems.map((item) => {
    const isSelected = item.href === pathname;
    let className;
    if (isMobile) {
      className = isSelected ? CLASSES_MOBILE_TEXT_SELECTED : CLASSES_MOBILE_TEXT_NORMAL;
    } else {
      className = isSelected ? CLASSES_TEXT_SELECTED : CLASSES_TEXT_NORMAL;
    }
    return (
      <Link href={item.href} key={item.href}>
        <a className={className}>{item.label}</a>
      </Link>
    );
  });
}

export default function NavBar() {
  const [menuOpened, setMenuOpened ] = useState(false);
  const router = useRouter();

  return (
    <nav className="bg-gray-800 w-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="-ml-2 mr-2 flex items-center md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-controls="mobile-menu"
                aria-expanded="false"
                onClick={() => setMenuOpened(!menuOpened)}
              >
                <span className="sr-only">Open main menu</span>
                <span className={ menuOpened ? 'hidden': 'inline'}><IconMenu /></span>
                <span className={ menuOpened ? 'inline': 'hidden'}><IconX /></span>
              </button>
            </div>
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <a>
                  <Image width="50" height="50" src={logo} alt="Licium Logo" />
                </a>
              </Link>
              <span className="text-white text-2xl font-thin widest mr-8">
                <Link href="/">Licium Protocol</Link>
              </span>
            </div>
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              { renderMenuItems(router.pathname, false) }
            </div>
          </div>
          <NavBarButtons />
        </div>
      </div>
      <div className={ `${ menuOpened ? 'block': 'hidden' } md:hidden` }>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          { renderMenuItems(router.pathname, true) }
        </div>
      </div>
    </nav>
  );
}