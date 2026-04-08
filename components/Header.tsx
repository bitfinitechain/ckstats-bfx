'use client';

import { useState, useRef } from 'react';

import { useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import ThemeController from './ThemeController';
import { validateBitFiniteAddress } from '../utils/validateBitFiniteAddress';

export default function Header() {
  const [address, setAddress] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const modalRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  const addUserMutation = useMutation({
    mutationFn: async (address: string) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add address');
      }
      return response.json();
    },
    onSuccess: (response) => {
      if (response?.message === 'Already in database') {
        setAddress('');
        setModalMessage('');
        setIsError(false);
        router.push(`/users/${address}`);
      } else {
        setAddress('');
        setModalMessage('Address added successfully!');
        setIsError(false);
        modalRef.current?.showModal();
        setTimeout(() => {
          router.push(`/users/${address}`);
        }, 1500);
      }
    },
    onError: (error: Error) => {
      if (error.message === 'Bitcoin address already exists') {
        router.push(`/users/${address}`);
      } else {
        setModalMessage(error.message);
        setIsError(true);
        modalRef.current?.showModal();
      }
    },
  });

  const handleAddAddress = async () => {
    const trimmedAddress = address.trim();
    if (!validateBitFiniteAddress(trimmedAddress)) {
      setModalMessage('Invalid BitFinite address');
      setIsError(true);
      modalRef.current?.showModal();
      return;
    }

    addUserMutation.mutate(trimmedAddress);
  };

  return (
    <header className="navbar sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex-1 hidden md:inline-flex">
        <Link
          href="/"
          className="btn btn-ghost normal-case text-xl flex items-center gap-2"
        >
          <div className="relative w-8 h-8">
            <Image
              src="/icon.png"
              alt="BitFinite Logo"
              fill
              className="object-contain"
            />
          </div>
          BitFinite Solo Pool
        </Link>
      </div>
      <div className="flex-none gap-1 sm:gap-2 flex-grow md:flex-grow-0">
        <div className="form-control flex-grow md:flex-grow-0">
          <input
            type="text"
            placeholder="Enter BitFinite address"
            className="input input-bordered w-full md:w-96 text-sm"
            value={address}
            onChange={(e) => setAddress(e.target.value.trim())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddAddress();
              }
            }}
          />
        </div>
        <button className="btn btn-primary" onClick={handleAddAddress}>
          Add
        </button>
        <ThemeController />
      </div>

      {/* DaisyUI Modal */}
      <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
        <form method="dialog" className="modal-box">
          <h3
            className={`font-bold text-lg ${
              isError ? 'text-error' : 'text-success'
            }`}
          >
            {isError ? 'Error' : 'Success'}
          </h3>
          <p className="py-4">{modalMessage}</p>
          <div className="modal-action">
            <button className="btn">Close</button>
          </div>
        </form>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </header>
  );
}
