import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about RIO COLLECTION — an independent limited T-shirt brand committed to archival design, premium materials, and uncompromising craftsmanship.'
};

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full h-[50vh] md:h-[65vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&auto=format&fit=crop&q=80"
          alt="RIO COLLECTION studio"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-16 pb-12 md:pb-16">
          <div className="mx-auto max-w-350">
            <h1 className="font-eb-garamond text-[40px] md:text-[64px] font-normal leading-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.3)]">
              About
            </h1>
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section className="mx-auto max-w-350 px-4 md:px-16 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
          <div className="md:col-span-5">
            <h2 className="font-eb-garamond text-[28px] md:text-[40px] font-normal leading-tight text-(--cat-on-surface)">
              Independent.
              <br />
              Archival.
              <br />
              Uncompromising.
            </h2>
          </div>
          <div className="md:col-span-7 flex flex-col justify-center">
            <p className="font-hanken text-[16px] md:text-[17px] leading-[1.8] text-(--cat-on-surface-variant)">
              RIO COLLECTION lahir dari keinginan untuk mengembalikan esensi berpakaian. Di tengah
              industri fast fashion yang mengejar volume, kami memilih untuk bergerak lambat—
              merancang setiap garmen sebagai artefak, bukan komoditas.
            </p>
            <p className="mt-6 font-hanken text-[16px] md:text-[17px] leading-[1.8] text-(--cat-on-surface-variant)">
              Kami percaya bahwa pakaian yang baik adalah pakaian yang diceritakan, bukan sekadar
              dikenakan. Setiap edisi yang kami rilis adalah bab baru dalam narasi panjang tentang
              material, konstruksi, dan komitmen terhadap detail yang tidak pernah berakhir.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-(--cat-surface-container-low)">
        <div className="mx-auto max-w-350 px-4 md:px-16 py-16 md:py-24">
          <h2 className="font-eb-garamond text-[28px] md:text-[36px] font-normal leading-tight text-(--cat-on-surface) text-center mb-14 md:mb-20">
            Nilai Kami
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            {[
              {
                title: 'Slow Design',
                description:
                  'Kami tidak mengejar tren. Setiap desain melalui proses iterasi yang panjang hingga mencapai bentuk finalnya—yang kami yakini akan tetap relevan bertahun-tahun ke depan.'
              },
              {
                title: 'Material First',
                description:
                  'Proses kami selalu dimulai dari material, bukan sketsa. Katun 240gsm yang kami gunakan dipilih setelah menguji puluhan varian dari berbagai pabrik tekstil independen.'
              },
              {
                title: 'Limited Editions',
                description:
                  'Setiap edisi dirilis dalam jumlah terbatas dan tidak pernah diproduksi ulang. Ketika habis, ia menjadi bagian dari arsip—sebuah artefak dari momen tertentu.'
              }
            ].map((value) => (
              <div key={value.title} className="text-center md:text-left">
                <h3 className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-4">
                  {value.title}
                </h3>
                <p className="font-hanken text-[15px] leading-relaxed text-(--cat-on-surface-variant)">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Studio Image */}
      <section className="mx-auto max-w-350 px-4 md:px-16 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div className="relative aspect-4/5 overflow-hidden bg-(--cat-surface-container-low)">
            <Image
              src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop&q=80"
              alt="RIO COLLECTION editorial photography"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <blockquote className="font-eb-garamond text-[24px] md:text-[32px] font-normal leading-snug text-(--cat-on-surface) italic">
              &quot;Kami tidak membuat pakaian. Kami merancang artefak untuk dikenakan.&quot;
            </blockquote>
            <p className="mt-6 font-hanken text-[15px] leading-relaxed text-(--cat-on-surface-variant)">
              Setiap garmen RIO COLLECTION dirancang dengan presisi arsitektural— mempertimbangkan
              jatuhnya kain, proporsi tubuh, dan bagaimana cahaya bermain di permukaan material. Ini
              bukan sekadar t-shirt; ini adalah pernyataan desain.
            </p>
            <div className="mt-8">
              <Link
                href="/catalogue"
                className="inline-flex items-center px-8 py-3 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] hover:opacity-85 transition-opacity duration-150"
              >
                Eksplor Koleksi
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-(--cat-stone)">
        <div className="mx-auto max-w-350 px-4 md:px-16 py-16 md:py-20 text-center">
          <h2 className="font-eb-garamond text-[28px] md:text-[36px] font-normal leading-tight text-(--cat-on-surface)">
            Hubungi Kami
          </h2>
          <p className="mt-4 font-hanken text-[15px] text-(--cat-on-surface-variant) max-w-md mx-auto">
            Untuk pertanyaan, kolaborasi, atau pemesanan khusus, hubungi kami melalui WhatsApp atau
            email.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.me/6285559136040"
              target="_blank"
              rel="noopener noreferrer"
              className="font-hanken text-[14px] text-(--cat-on-surface) underline hover:opacity-70 transition-opacity"
            >
              WhatsApp: +62 855 5913 6040
            </a>
            <span className="hidden sm:inline text-(--cat-stone)">|</span>
            <a
              href="mailto:hello@riocollection.id"
              className="font-hanken text-[14px] text-(--cat-on-surface) underline hover:opacity-70 transition-opacity"
            >
              hello@riocollection.id
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
