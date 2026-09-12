"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { useOrdenStore } from "../../store/useOrdenStore";
import { ScrollVideoScrubber } from "./ScrollVideoScrubber";
import type { ProductoBuscado } from "../../types";

// Contextual fallback image resolver
function getProductImage(producto: ProductoBuscado): string {
  if (producto.imagen) return producto.imagen;

  const name = producto.nombre.toLowerCase();
  if (name.includes("chair") || name.includes("silla")) {
    return "https://images.unsplash.com/photo-1506898667547-42e22a46e125?w=500&auto=format&fit=crop&q=80";
  }
  if (name.includes("table") || name.includes("mesa")) {
    return "https://images.unsplash.com/photo-1530629013299-6cb10d168419?w=500&auto=format&fit=crop&q=80";
  }
  if (name.includes("cup") || name.includes("vaso")) {
    return "https://images.unsplash.com/photo-1572119865084-43c285814d63?w=500&auto=format&fit=crop&q=80";
  }
  if (name.includes("speaker") || name.includes("audio") || name.includes("sound")) {
    return "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&auto=format&fit=crop&q=80";
  }
  if (name.includes("tent") || name.includes("canopy") || name.includes("toldo")) {
    return "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=500&auto=format&fit=crop&q=80";
  }
  if (name.includes("light") || name.includes("lighting")) {
    return "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80";
  }
  if (name.includes("drink") || name.includes("beverage") || name.includes("water")) {
    return "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80";
  }
  if (name.includes("food") || name.includes("catering") || name.includes("snack")) {
    return "https://images.unsplash.com/photo-1555244162-803834f70033?w=500&auto=format&fit=crop&q=80";
  }

  return "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80";
}

export function OutBox() {
  const items = useOrdenStore((s) => s.items);
  const presupuesto = useOrdenStore((s) => s.presupuesto);
  const removerItem = useOrdenStore((s) => s.removerItem);
  const actualizarCantidad = useOrdenStore((s) => s.actualizarCantidad);
  const limpiarOrden = useOrdenStore((s) => s.limpiarOrden);
  const total = useOrdenStore((s) => s.total);
  const delta = useOrdenStore((s) => s.delta);
  const eventosPasados = useOrdenStore((s) => s.eventosPasados);
  const agregarItems = useOrdenStore((s) => s.agregarItems);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const orderSectionRef = useRef<HTMLDivElement | null>(null);

  const totalActual = total();
  const saldoDisponible = delta();
  const porcentajeUsado = Math.min((totalActual / presupuesto) * 100, 100);
  const sobrepasado = saldoDisponible < 0;

  const cargarEjemplo = () => {
    if (eventosPasados.length > 0) {
      limpiarOrden();
      agregarItems(eventosPasados[0].items);
    }
  };

  const handleViewOrder = () => {
    if (items.length === 0) {
      cargarEjemplo();
    }
    orderSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full relative space-y-10">
      
      {/* 1. MINIMAL HEADER BAR */}
      <header className="sticky top-4 z-40 w-full max-w-5xl mx-auto px-4">
        <nav className="rounded-full px-4 sm:px-6 py-2 sm:py-2.5 bg-[#111217] shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <Image
              src="/logo-outbox.png"
              alt="OutBox"
              width={1466}
              height={356}
              className="h-7 sm:h-8 md:h-8.5 w-auto object-contain shrink-0"
              priority
            />
            <span className="hidden sm:inline-block text-[11px] sm:text-xs text-zinc-400 font-mono border-l border-zinc-700/60 pl-2 sm:pl-2.5 py-0.5 whitespace-nowrap">
              Procurement Copilot
            </span>
          </div>

          <div className="flex items-center gap-2">
            {items.length === 0 ? (
              <button
                onClick={handleViewOrder}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
              >
                View Order
              </button>
            ) : (
              <button
                onClick={limpiarOrden}
                className="px-4 py-1.5 rounded-full text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* 2. HERO COVER SECTION (Shopping Cart Cover without Video Borders) */}
      <section className="relative w-full min-h-[60vh] sm:min-h-[70vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden rounded-3xl bg-[#090a0f]">
        {/* Cover Canvas Background */}
        <div className="absolute inset-0 z-0">
          <ScrollVideoScrubber />
        </div>

        {/* Hero Editorial Content */}
        <div className="relative z-10 max-w-2xl mx-auto space-y-4 px-4 py-12 pointer-events-none">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Procurement Infrastructure for Live Events
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 max-w-lg mx-auto leading-relaxed">
            Describe your event in a single phrase. The agent scouts real suppliers, estimates quantities, and manages your budget.
          </p>

          <div className="pt-2 pointer-events-auto flex items-center justify-center gap-3">
            <button
              onClick={handleViewOrder}
              className="px-8 py-3 rounded-full text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer shadow-lg inline-flex items-center gap-2"
            >
              <span>View Order</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* 3. PROCUREMENT CONSOLE (ESSENTIAL ONLY: BUDGET & ORDER ITEMS) */}
      <section ref={orderSectionRef} className="w-full max-w-3xl mx-auto space-y-6 px-4 scroll-mt-24">
        
        {/* Budget Overview */}
        <div className="rounded-2xl p-6 bg-[#111217] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Budget Overview
            </span>

            <span
              className={`font-mono text-xs font-bold px-3 py-1 rounded-full ${
                sobrepasado
                  ? "bg-red-950 text-red-400"
                  : "bg-zinc-800 text-zinc-200"
              }`}
            >
              {sobrepasado ? "Over budget by: " : "Available: "}
              S/ {Math.abs(saldoDisponible).toFixed(2)}
            </span>
          </div>

          {/* Solid Flat Progress Bar */}
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                sobrepasado ? "bg-red-500" : "bg-blue-600"
              }`}
              style={{ width: `${porcentajeUsado}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pt-1">
            <span>Spend: <strong className="text-white">S/ {totalActual.toFixed(2)}</strong></span>
            <span>Limit: <strong className="text-white">S/ {presupuesto.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Selected Products List */}
        <div className="rounded-2xl bg-[#111217] overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between text-xs bg-[#16181f]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white uppercase tracking-wider text-xs">
                Selected Items
              </span>
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-mono font-semibold">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </div>

            {items.length > 0 && (
              <div className="font-mono text-sm text-white font-bold">
                Total: <span>S/ {totalActual.toFixed(2)}</span>
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 text-xs space-y-2">
              <p className="font-semibold text-white">No items in the order yet.</p>
              <p className="text-zinc-500 text-xs max-w-sm mx-auto">
                Click &quot;Simulate Order&quot; above to preview items scouted by the agent with real supplier images and prices.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80">
              {items.map((item, index) => {
                const imageUrl = getProductImage(item.producto);
                return (
                  <div
                    key={index}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* PRODUCT IMAGE THUMBNAIL */}
                      <div
                        onClick={() => setPreviewImage(imageUrl)}
                        className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 shrink-0 cursor-pointer"
                        title="Click to view full image"
                      >
                        <Image
                          src={imageUrl}
                          alt={item.producto.nombre}
                          fill
                          sizes="(max-width: 640px) 64px, 64px"
                          className="object-cover hover:opacity-90 transition-opacity"
                          unoptimized
                        />
                      </div>

                      {/* Product Details */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="font-semibold text-white text-sm truncate">
                          {item.producto.nombre}
                        </div>

                        <div className="text-zinc-400 text-xs flex flex-wrap items-center gap-2">
                          <span className="font-medium text-zinc-300">
                            {item.producto.proveedor}
                          </span>
                          <span className="text-zinc-600">·</span>
                          <a
                            href={item.producto.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            Source
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Controls and Pricing */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0">
                      <div className="text-left sm:text-right font-mono">
                        <span className="text-xs font-semibold text-white block">
                          S/ {item.producto.precioAprox.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-zinc-400">each</span>
                      </div>

                      {/* Clean flat quantity toggle */}
                      <div className="flex items-center bg-zinc-800 rounded-full px-1 py-0.5">
                        <button
                          onClick={() => actualizarCantidad(index, item.cantidad - 1)}
                          className="w-6 h-6 flex items-center justify-center text-zinc-300 hover:text-white rounded-full hover:bg-zinc-700 transition text-sm font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono text-white px-2.5 text-xs font-semibold min-w-[28px] text-center">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => actualizarCantidad(index, item.cantidad + 1)}
                          className="w-6 h-6 flex items-center justify-center text-zinc-300 hover:text-white rounded-full hover:bg-zinc-700 transition text-sm font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <div className="font-mono font-bold text-white text-sm w-20 text-right">
                        S/ {(item.producto.precioAprox * item.cantidad).toFixed(2)}
                      </div>

                      <button
                        onClick={() => removerItem(index)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer text-xs"
                        title="Remove item"
                      >
                        x
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </section>

      {/* 4. CLEAN IMAGE PREVIEW LIGHTBOX */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-lg w-full bg-[#111217] rounded-2xl overflow-hidden p-3 space-y-3">
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
              <Image
                src={previewImage}
                alt="Product preview"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-zinc-400 font-medium">
                Supplier product photo
              </span>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-3 py-1 rounded-full bg-zinc-800 text-white text-xs font-medium hover:bg-zinc-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
