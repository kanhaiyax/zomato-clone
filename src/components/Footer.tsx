import React from 'react';
import { Globe, ChevronDown } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Brand & Language Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-8 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black italic tracking-tighter text-white">
              zomato
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300">
              <Globe className="w-3.5 h-3.5" />
              <span>India</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300">
              <span>English</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">About Zomato</h4>
            <ul className="space-y-2.5">
              <li><a href="#who-we-are" className="hover:text-white transition-colors">Who We Are</a></li>
              <li><a href="#blog" className="hover:text-white transition-colors">Blog &amp; Stories</a></li>
              <li><a href="#careers" className="hover:text-white transition-colors">Work With Us</a></li>
              <li><a href="#investor-relations" className="hover:text-white transition-colors">Investor Relations</a></li>
              <li><a href="#report-fraud" className="hover:text-white transition-colors">Report Fraud</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Zomaverse</h4>
            <ul className="space-y-2.5">
              <li><a href="#zomato" className="hover:text-white transition-colors">Zomato Delivery</a></li>
              <li><a href="#blinkit" className="hover:text-white transition-colors">Blinkit Quick Commerce</a></li>
              <li><a href="#feeding-india" className="hover:text-white transition-colors">Feeding India</a></li>
              <li><a href="#hyperpure" className="hover:text-white transition-colors">Hyperpure Fresh Supplies</a></li>
              <li><a href="#zomaland" className="hover:text-white transition-colors">Zomaland Festival</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">For Restaurants</h4>
            <ul className="space-y-2.5">
              <li><a href="#partner-with-us" className="hover:text-white transition-colors">Partner With Us</a></li>
              <li><a href="#apps-for-you" className="hover:text-white transition-colors">Apps For You</a></li>
              <li><a href="#restaurant-guidelines" className="hover:text-white transition-colors">Restaurant Guidelines</a></li>
              <li><a href="#merchant-support" className="hover:text-white transition-colors">Merchant Support</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Learn More</h4>
            <ul className="space-y-2.5">
              <li><a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">Security &amp; Encryption</a></li>
              <li><a href="#terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#contact-us" className="hover:text-white transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>

        {/* Legal & Disclaimer */}
        <div className="pt-8 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>
            By continuing past this page, you agree to our Terms of Service, Cookie Policy, and Privacy Policy. All trademarks are properties of their respective owners.
          </p>
          <p className="whitespace-nowrap font-medium text-slate-400">
            © 2026 Zomato Clone Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
