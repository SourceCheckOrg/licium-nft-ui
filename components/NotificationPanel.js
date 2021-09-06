import { Transition } from '@headlessui/react';

export default function NotificationPanel({show, bgColor, message}) {
  return (
    <Transition
      show={show}
      enter="transition-opacity duration-150"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className={`${bgColor} fixed rounded shadow-md top-20 right-8 sm:right-8 md:right-12 z-10 py-1 px-4 sm:px-6 md:px-8`}>
        <div className={`sm:overflow-hidden text-center`}>
          <span className="text-xs font-medium text-white">
            {message}
          </span>
        </div>
      </div>
    </Transition>
  );
}
