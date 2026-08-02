'use client';

import { useState } from 'react';
import { CONTRIBUTORS } from '@/lib/contributors';

export function CommunitySection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-6 mt-12 pt-12 border-t border-zinc-700">
      {/* Vehículos Comunitarios */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">👥</span>
          <h2 className="text-lg font-semibold text-white">Vehículos Comunitarios a Pedido</h2>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg p-4 flex items-center justify-between transition-colors"
        >
          <span className="font-medium">
            {CONTRIBUTORS.length} {CONTRIBUTORS.length === 1 ? 'vehículo' : 'vehículos'} aportado{CONTRIBUTORS.length === 1 ? '' : 's'}
          </span>
          <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {isOpen && (
          <div className="bg-zinc-900 rounded-lg p-6 space-y-4">
            {CONTRIBUTORS.map((contributor, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-purple-500/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-orange-400 flex items-center justify-center text-white font-semibold text-sm">
                  {contributor.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{contributor.vehicle}</p>
                  <p className="text-sm text-zinc-400">
                    {contributor.type} • Aportado por {contributor.name}
                    {contributor.location && ` (${contributor.location})`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Contribuir */}
      <div className="bg-gradient-to-r from-purple-900/40 to-orange-900/40 border border-purple-600/30 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">❤️</span>
          <h3 className="font-semibold text-white">¿Querés aportar tu vehículo?</h3>
        </div>
        <p className="text-zinc-300 text-sm">
          Si tenés un EV o PHEV y querés que lo agregue a la calculadora, invítame un cafecito y comparte los datos de tu modelo.
        </p>
        <a
          href="https://cafecito.app/hibydargentina"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white font-medium px-6 py-2 rounded-lg transition-all transform hover:scale-105"
        >
          ☕ Invítame un Cafecito
        </a>
      </div>

      {/* Colaboradores */}
      <div className="space-y-3">
        <h3 className="font-semibold text-white">🌟 Colaboradores de la comunidad</h3>
        <div className="bg-zinc-900 rounded-lg p-4 space-y-2">
          {CONTRIBUTORS.map((contributor, idx) => (
            <div key={idx} className="text-sm text-zinc-300">
              <span className="font-medium text-white">{contributor.name}</span>
              <span className="text-zinc-500"> • {contributor.vehicle} ({contributor.type})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
