"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import showtimesConfig from "@/data/showtimes.json";
import type { ShowtimesConfig, InventoryResponse, InventoryItem } from "@/types/showtimes";

const { theaters, ticketPrice } = showtimesConfig as ShowtimesConfig;

function TicketIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.026a.75.75 0 0 1-.375.65 2.249 2.249 0 0 0 0 3.898.75.75 0 0 1 .375.65v3.026c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 17.625v-3.026a.75.75 0 0 1 .374-.65 2.249 2.249 0 0 0 0-3.898.75.75 0 0 1-.374-.65V6.375Zm15-1.125a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0v.75a.75.75 0 0 0 1.5 0v-.75Zm-.75 3a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0V18a.75.75 0 0 0 1.5 0v-.75ZM6 12a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 12Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path
        fillRule="evenodd"
        d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-8 h-8"
    >
      <path
        fillRule="evenodd"
        d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
    >
      <path
        fillRule="evenodd"
        d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function Home() {
  const [selectedTheater, setSelectedTheater] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryResponse>({});
  const [inventoryLoading, setInventoryLoading] = useState(true);

  // Fetch inventory data on mount
  useEffect(() => {
    const fetchInventory = async () => {
      // Collect all form IDs from the config
      const formIds = theaters.flatMap((theater) =>
        theater.dates.flatMap((date) => date.showtimes)
      );

      if (formIds.length === 0) {
        setInventoryLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/inventory?formIds=${formIds.join(",")}`);
        if (response.ok) {
          const data = await response.json();
          setInventory(data);
        }
      } catch (error) {
        console.error("Failed to fetch inventory:", error);
      } finally {
        setInventoryLoading(false);
      }
    };

    fetchInventory();

    // Refresh inventory every 60 seconds
    const interval = setInterval(fetchInventory, 60000);
    return () => clearInterval(interval);
  }, []);

  const getInventory = (formId: number): InventoryItem | null => {
    return inventory[formId] || null;
  };

  const handleTheaterSelect = (theaterId: string) => {
    if (selectedTheater === theaterId) {
      setSelectedTheater(null);
      setSelectedDate(null);
    } else {
      setSelectedTheater(theaterId);
      setSelectedDate(null);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(selectedDate === date ? null : date);
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[700px] flex flex-col items-center justify-center overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/images/video-poster-bg-main.jpg"
        >
          <source
            src="https://icanonlyimagine.com/images/home-video-loop.mp4"
            type="video/mp4"
          />
        </video>

        {/* Gradient Overlay */}
        <div className="hero-gradient absolute inset-0" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          {/* Bayside Logo */}
          <div className="opacity-0 animate-fade-in animate-delay-100 mb-6">
            <Image
              src="/images/Bayside.svg"
              alt="Bayside Church"
              width={140}
              height={40}
              className="opacity-80"
            />
          </div>

          {/* Presents Text */}
          <p className="opacity-0 animate-fade-in animate-delay-200 text-[var(--color-brand-light)] font-[var(--font-display)] text-sm tracking-[0.3em] uppercase mb-8">
            Presents an Exclusive Screening
          </p>

          {/* Movie Logo */}
          <div className="opacity-0 animate-fade-in-up animate-delay-300 mb-8">
            <Image
              src="/images/logo-wide.png"
              alt="I Can Only Imagine 2"
              width={500}
              height={180}
              className="w-[320px] md:w-[450px] lg:w-[500px] h-auto drop-shadow-2xl"
              priority
            />
          </div>

          {/* Tagline */}
          <p className="opacity-0 animate-fade-in animate-delay-400 font-[var(--font-display)] text-lg md:text-xl text-[var(--color-cream)] italic max-w-md mb-10">
            &ldquo;The inspiring next chapter of faith, family, and finding God in the fire.&rdquo;
          </p>

          {/* CTA Buttons */}
          <div className="opacity-0 animate-fade-in-up animate-delay-500 flex flex-col sm:flex-row gap-4 items-center">
            <a
              href="#tickets"
              className="cta-button flex items-center gap-3 px-8 py-4 rounded-full text-white font-semibold text-lg"
            >
              <TicketIcon />
              Get Tickets - ${ticketPrice}
            </a>
            <a
              href="#trailer"
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 text-white/90 hover:bg-white/10 transition-all hover:border-white/50"
            >
              <PlayIcon />
              Watch Trailer
            </a>
          </div>

          {/* Date Badge */}
          <div className="opacity-0 animate-fade-in animate-delay-600 mt-12">
            <span className="date-pill inline-block px-6 py-2 rounded-full text-white font-semibold text-sm tracking-wide">
              February 14-15, 2026
            </span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in animate-delay-700">
          <a
            href="#about"
            className="flex flex-col items-center text-white/60 hover:text-white/90 transition-colors"
          >
            <span className="text-xs tracking-widest uppercase mb-2">Scroll</span>
            <ChevronDownIcon />
          </a>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="synopsis-section py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Poster */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-[var(--color-brand)]/20 to-transparent rounded-lg blur-2xl" />
              <Image
                src="/images/home-poster.jpg"
                alt="I Can Only Imagine 2 Movie Poster"
                width={500}
                height={750}
                className="relative rounded-lg shadow-2xl w-full max-w-md mx-auto"
              />
            </div>

            {/* Synopsis */}
            <div>
              <div className="gold-line w-20 mb-8" />
              <h2 className="font-[var(--font-display)] text-3xl md:text-4xl text-[var(--color-cream)] mb-6">
                The Story Continues
              </h2>
              <div className="space-y-4 text-[var(--color-cream)]/80 leading-relaxed">
                <p>
                  After the breakout success of the song &ldquo;I Can Only Imagine,&rdquo;
                  MercyMe&apos;s Bart Millard (John Michael Finley) is living the dream—sold-out
                  arenas, a devoted fan base, and a thriving career. But behind the
                  spotlight, Bart&apos;s past threatens the family he&apos;s built, especially the
                  fragile bond with his son, Sam (Sammy Dell).
                </p>
                <p>
                  When hopeful newcomer Tim Timmons (Milo Ventimiglia, &ldquo;This Is Us&rdquo;) joins
                  the band for their biggest tour yet, he unknowingly brings a renewed
                  gratitude to Bart&apos;s life through their unlikely friendship. Bart soon
                  discovers that Tim carries hardships—and secrets—of his own, forcing him
                  to face his past and repair his relationships with Sam and his wife,
                  Shannon (Sophie Skelton), before fame costs him what matters most.
                </p>
                <p className="text-[var(--color-brand-light)] font-medium">
                  Based on the heartfelt true story behind the hit single &ldquo;Even If.&rdquo;
                </p>
              </div>

              {/* Cast */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <p className="text-sm text-[var(--color-cream)]/60 mb-2 uppercase tracking-wider">
                  Starring
                </p>
                <p className="text-[var(--color-cream)]/90">
                  John Michael Finley, Milo Ventimiglia, Sophie Skelton, Arielle Kebbel,
                  Sammy Dell with Trace Adkins and Dennis Quaid
                </p>
              </div>

              {/* Directors */}
              <div className="mt-6">
                <p className="text-sm text-[var(--color-cream)]/60 mb-2 uppercase tracking-wider">
                  Directed By
                </p>
                <p className="text-[var(--color-cream)]/90">
                  Andrew Erwin & Brent McCorkle
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trailer Section */}
      <section id="trailer" className="py-20 bg-[var(--color-warm-black)]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="gold-line w-20 mx-auto mb-8" />
            <h2 className="font-[var(--font-display)] text-3xl md:text-4xl text-[var(--color-cream)] mb-4">
              Watch the Trailer
            </h2>
          </div>

          <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
            <div className="absolute -inset-2 bg-gradient-to-br from-[var(--color-brand)]/30 to-transparent rounded-xl blur-xl" />
            <iframe
              className="relative w-full h-full"
              src="https://www.youtube.com/embed/EYTHwR83Eh0?rel=0"
              title="I Can Only Imagine 2 Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Tickets Section */}
      <section id="tickets" className="py-24 md:py-32 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-warm-black)] via-[#141210] to-[var(--color-warm-black)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--color-brand)]/5 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="gold-line w-20 mx-auto mb-8" />
            <h2 className="font-[var(--font-display)] text-3xl md:text-4xl text-[var(--color-cream)] mb-4">
              Get Your Tickets
            </h2>
            <p className="text-[var(--color-cream)]/70 max-w-lg mx-auto">
              Select a theater and showtime to purchase tickets for this exclusive Bayside Church screening.
            </p>
          </div>

          {/* Info Banner */}
          <div className="mb-12 p-6 rounded-xl bg-gradient-to-r from-[var(--color-brand)]/10 to-transparent border border-[var(--color-brand)]/20">
            <div className="flex flex-wrap gap-x-8 gap-y-3 justify-center text-sm text-[var(--color-cream)]/80">
              <span className="flex items-center gap-2">
                <TicketIcon />
                <strong className="text-[var(--color-brand-light)]">${ticketPrice}</strong> per ticket
              </span>
              <span>General Admission Seating</span>
              <span>No Refunds or Exchanges</span>
              <span>Movie starts promptly (no trailers)</span>
            </div>
          </div>

          {/* Theater Cards */}
          <div className="space-y-6">
            {theaters.map((theater) => (
              <div key={theater.id} className="theater-card rounded-2xl overflow-hidden">
                {/* Theater Header */}
                <button
                  onClick={() => handleTheaterSelect(theater.id)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div>
                    <h3 className="font-[var(--font-display)] text-xl md:text-2xl text-[var(--color-cream)] mb-1">
                      {theater.name}
                    </h3>
                    <p className="flex items-center gap-2 text-[var(--color-cream)]/60 text-sm">
                      <MapPinIcon />
                      {theater.location}
                    </p>
                  </div>
                  <div
                    className={`transform transition-transform duration-300 text-[var(--color-brand)] ${
                      selectedTheater === theater.id ? "rotate-180" : ""
                    }`}
                  >
                    <ChevronDownIcon />
                  </div>
                </button>

                {/* Expanded Content */}
                <div
                  className={`grid transition-all duration-500 ease-in-out ${
                    selectedTheater === theater.id
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-6 pt-2 border-t border-white/5">
                      {/* Date Tabs */}
                      <div className="flex gap-3 mb-6">
                        {theater.dates.map((dateInfo) => (
                          <button
                            key={dateInfo.date}
                            onClick={() => handleDateSelect(dateInfo.date)}
                            className={`px-5 py-3 rounded-lg font-semibold text-sm transition-colors duration-200 ${
                              selectedDate === dateInfo.date
                                ? "bg-[var(--color-brand)] text-white"
                                : "bg-white/5 text-[var(--color-cream)]/70 hover:bg-white/10 hover:text-[var(--color-cream)]"
                            }`}
                          >
                            {dateInfo.label}
                          </button>
                        ))}
                      </div>

                      {/* Showtimes */}
                      {theater.dates.map(
                        (dateInfo) =>
                          selectedDate === dateInfo.date && (
                            <div
                              key={dateInfo.date}
                              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                            >
                              {dateInfo.showtimes.map((formId) => {
                                const inv = getInventory(formId);
                                const isSoldOut = inv?.status === "sold_out";
                                const isLowStock = inv?.status === "low_stock";
                                const ticketUrl = inv?.url || "";
                                const displayTime = inv?.time || "";

                                // Sold out
                                if (isSoldOut) {
                                  return (
                                    <div
                                      key={formId}
                                      className="showtime-btn showtime-btn-sold-out px-4 py-3 rounded-lg text-center cursor-not-allowed"
                                    >
                                      <span className="block text-lg font-bold line-through opacity-50">
                                        {displayTime}
                                      </span>
                                      <span className="block text-xs font-semibold text-red-400 mt-0.5">
                                        Sold Out
                                      </span>
                                    </div>
                                  );
                                }

                                // Available for purchase
                                return (
                                  <a
                                    key={formId}
                                    href={ticketUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`showtime-btn px-4 py-3 rounded-lg text-center ${
                                      isLowStock ? "showtime-btn-low-stock" : ""
                                    }`}
                                  >
                                    <span className="block text-lg font-bold">
                                      {displayTime || "Loading..."}
                                    </span>
                                    {isLowStock && inv ? (
                                      <span className="block text-xs font-semibold text-amber-400 mt-0.5">
                                        Only {inv.available} left!
                                      </span>
                                    ) : inv && !inventoryLoading ? (
                                      <span className="block text-xs opacity-70 mt-0.5">
                                        {inv.available} available
                                      </span>
                                    ) : (
                                      <span className="block text-xs opacity-70 mt-0.5">
                                        Loading...
                                      </span>
                                    )}
                                  </a>
                                );
                              })}
                            </div>
                          )
                      )}

                      {!selectedDate && selectedTheater === theater.id && (
                        <p className="text-center text-[var(--color-cream)]/50 py-4">
                          Select a date to view available showtimes
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Image
            src="/images/Bayside.svg"
            alt="Bayside Church"
            width={120}
            height={35}
            className="mx-auto mb-6 opacity-60"
          />
          <p className="text-[var(--color-cream)]/40 text-sm">
            This is a private screening event hosted by Bayside Church.
            <br />
            Tickets sold through this page are authorized resales for Bayside attendees.
          </p>
          <p className="text-[var(--color-cream)]/30 text-xs mt-6">
            &copy; {new Date().getFullYear()} Bayside Church. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
