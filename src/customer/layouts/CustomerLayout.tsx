import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MobileBottomNav } from '../components/MobileBottomNav';

export const CustomerLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
    <Navbar />
    <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Outlet />
    </main>
    <Footer />
    <MobileBottomNav />
  </div>
);
