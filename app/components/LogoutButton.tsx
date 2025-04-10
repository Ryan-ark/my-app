'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm font-medium text-gray-700 hover:text-gray-900"
    >
      Logout
    </button>
  );
} 