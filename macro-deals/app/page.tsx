'use client';

import React, { useEffect, useState } from 'react';

type Tab = 'home' | 'grocery' | 'deals' | 'search' | 'profile';

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isPro, setIsPro] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'grocery' && <GroceryTab />}
        {activeTab === 'deals' && <DealsTab />}
        {activeTab === 'search' && <SearchTab />}
        {activeTab === 'profile' && (
          <ProfileTab isPro={isPro} onUpgrade={() => setIsPro(true)} />
        )}
      </div>

      <nav className="grid grid-cols-5 border-t bg-white">
        <NavItem icon="🏠" label="Home"    active={activeTab==='home'}    onClick={()=>setActiveTab('home')} />
        <NavItem icon="🛒" label="Grocery" active={activeTab==='grocery'} onClick={()=>setActiveTab('grocery')} />
        <NavItem icon="🏷️" label="Deals"   active={activeTab==='deals'}   onClick={()=>setActiveTab('deals')} />
        <NavItem icon="🔍" label="Search"  active={activeTab==='search'}  onClick={()=>setActiveTab('search')} />
        <NavItem icon="👤" label="Profile" active={activeTab==='profile'} onClick={()=>setActiveTab('profile')} />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }:{ icon:string; label:string; active:boolean; onClick:()=>void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-2 text-sm ${active ? 'text-blue-600' : 'text-gray-500'}`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function HomeTab() {
  const [period, setPeriod] = useState<'day'|'week'|'month'>('week');
  const [value, setValue] = useState<number>(50);

  const toPerDay = (amt:number, from:'day'|'week'|'month') =>
    from==='day' ? amt : from==='week' ? amt/7 : amt/(4.345*7);

  const convert = (amt:number, from:'day'|'week'|'month', to:'day'|'week'|'month') => {
    const d = toPerDay(amt, from);
    return to==='day' ? d : to==='week' ? d*7 : d*7*4.345;
  };

  useEffect(() => {
    const sv = localStorage.getItem('budgetValue');
    const sp = localStorage.getItem('budgetPeriod') as 'day'|'week'|'month'|null;
    if (sv) setValue(Number(sv));
    if (sp) setPeriod(sp);
  }, []);

  useEffect(() => {
    localStorage.setItem('budgetValue', String(value));
    localStorage.setItem('budgetPeriod', period);
  }, [value, period]);

  function togglePeriod() {
    setPeriod(prev => {
      const next = prev==='day' ? 'week' : prev==='week' ? 'month' : 'day';
      setValue(Math.round(convert(value, prev, next)));
      return next;
    });
  }

  const perDay   = convert(value, period, 'day');
  const perWeek  = convert(value, period, 'week');
  const perMonth = convert(value, period, 'month');

  const ranges = ({
    day:   { min:3,   max:50,   step:1  },
    week:  { min:20,  max:300,  step:1  },
    month: { min:80,  max:1200, step:5  },
  } as const)[period];

  const fmt = (n:number) =>
    new Intl.NumberFormat('de-DE', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(n);

  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">v-ZipBuild</div>
      <h1 className="text-xl font-bold mb-2">Budget</h1>
      <p className="text-gray-600 mb-4">Set your budget <span className="font-semibold">per {period}</span>.</p>

      <button onClick={togglePeriod} className="px-4 py-2 bg-blue-600 text-white rounded-md mb-3">
        {period==='day' ? 'Per Day' : period==='week' ? 'Per Week' : 'Per Month'}
      </button>

      <div className="mb-1 flex items-center justify-between">
        <label className="font-medium">
          {period==='day' ? 'Daily Budget' : period==='week' ? 'Weekly Budget' : 'Monthly Budget'}
        </label>
        <span className="text-blue-600 font-semibold">{fmt(value)}</span>
      </div>
      <input type="range" min={ranges.min} max={ranges.max} step={ranges.step} value={Math.round(value)} onChange={(e)=>setValue(Number(e.target.value))} className="w-full" />
      <div className="flex justify-between text-xs text-gray-500 mb-4">
        <span>{fmt(ranges.min)}</span><span>{fmt(ranges.max)}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Per Day" value={fmt(perDay)} />
        <Stat label="Per Week" value={fmt(perWeek)} />
        <Stat label="Per Month" value={fmt(perMonth)} />
      </div>
    </div>
  );
}

function Stat({label, value}:{label:string; value:string}) {
  return (
    <div className="rounded-xl border p-3 text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}

function GroceryTab() {
  const groceries = [
    { name: 'Chicken Breast', qty: '1.4 kg', price: '€9.80' },
    { name: 'Rice',           qty: '2 kg',   price: '€3.50' },
    { name: 'Broccoli',       qty: '500 g',  price: '€2.00' },
  ];
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Grocery List</h1>
      <ul className="space-y-2">
        {groceries.map((g,i)=>(
          <li key={i} className="flex justify-between border p-2 rounded-md bg-gray-50">
            <span>{g.name} – {g.qty}</span>
            <span>{g.price}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DealsTab() {
  const [zip, setZip] = useState('10115');
  const [loading, setLoading] = useState(false);
  const [deals, setDeals] = useState<any[]>([]);

  async function load(nocache=false) {
    setLoading(true);
    try {
      const url = `/api/deals?zip=${encodeURIComponent(zip)}&stores=rewe,lidl,aldi,edeka,kaufland${nocache ? '&nocache=1' : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      setDeals(data.deals || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(true); }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Local Deals</h1>
      <div className="flex gap-2 mb-3">
        <input className="border rounded px-2 py-1" value={zip} onChange={e=>setZip(e.target.value)} placeholder="ZIP e.g. 10115" />
        <button onClick={()=>load(false)} className="px-3 py-1 rounded bg-blue-600 text-white">{loading ? 'Loading...' : 'Refresh'}</button>
        <button onClick={()=>load(true)} className="px-3 py-1 rounded border">Force refresh</button>
      </div>
      <ul className="space-y-2">
        {deals.map((d, i) => (
          <li key={d.id ?? i} className="border p-2 rounded bg-green-50 flex justify-between">
            <span>{d.title} – {String(d.store).toUpperCase()}</span>
            <span>{typeof d.price === 'number' ? d.price.toFixed(2) : d.price} {d.unit ?? ''}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchTab() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Search Products</h1>
      <input type="text" placeholder="Search..." className="w-full border rounded-md p-2" />
    </div>
  );
}

function ProfileTab({ isPro, onUpgrade }:{ isPro:boolean; onUpgrade:()=>void }) {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Profile</h1>
      {isPro ? (
        <p className="text-green-600 font-semibold">✅ You are a Pro subscriber!</p>
      ) : (
        <div>
          <p className="mb-4 text-gray-600">Upgrade to Pro for unlimited meal plans and store integrations.</p>
          <button onClick={onUpgrade} className="bg-blue-500 text-white px-4 py-2 rounded-md">
            Upgrade to Pro (€5/month)
          </button>
        </div>
      )}
    </div>
  );
}
