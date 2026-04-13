"use client"
import { SignInModal, SignUpModal } from "@/app/components/sign-in";
import { cards, featuredPosts, latestPosts } from "@/app/lib/data";
import { useState } from "react";

export default function BlogPage() {
  const [open, setIsOpen] = useState(false)
  const [activeModel, setActiveModal] = useState<"signup" | "signin">("signup")
  return (
    <main className="min-h-screen bg-[#f3f3f3] px-2 py-2 text-[#171717] md:px-4 ">
      <div

        className="mx-auto max-w-screen rounded-[28px] border border-black/5 bg-white h-full shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
        <header className="flex flex-col gap-4 border-b border-black/8 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
              <span className="text-[#2f6bff]">∞</span>
              <span>enjooy</span>
            </div>

            <nav className="hidden items-center gap-8 text-[15px] font-medium md:flex">
              <a className="text-[#2f6bff]" href="#">
                Home
              </a>
              <a className="text-black/85 transition hover:text-black" href="#">
                Blog
              </a>
              <a className="text-black/85 transition hover:text-black" href="#">
                Service
              </a>
              <a className="text-black/85 transition hover:text-black" href="#">
                About
              </a>
              <a className="text-black/85 transition hover:text-black" href="#">
                Contact
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setIsOpen(true)
                setActiveModal("signin")
              }}
              className="rounded-xl cursor-pointer bg-[#f3f5fb] px-5 py-2.5 text-sm font-semibold text-[#2f6bff] transition hover:bg-[#e9eefc]">
              Sign in
            </button>
            <button
              onClick={() => { setIsOpen(true)
                setActiveModal("signup")
              }}
              className="rounded-xl cursor-pointer bg-[#2f6bff] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
              Register
            </button>
          </div>
        </header>

        <section className="relative overflow-hidden px-5 py-16 md:px-10 md:py-20 lg:px-16">
          <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_center,rgba(0,0,0,0.04),transparent_60%)]" />

          <div className="relative mx-auto flex max-w-[760px] flex-col items-center text-center">
            <span className="rounded-full border border-black/10 bg-slate-100 px-4 py-1.5 text-sm font-medium">
              Blog
            </span>

            <h1 className="mt-8 text-4xl font-semibold tracking-[-0.04em] text-black md:text-6xl">
              Discover our latest news
            </h1>

            <p className="mt-6 max-w-[780px] text-base leading-7 text-black/70 md:text-[18px]">
              Discover the achievements that set us apart. From groundbreaking projects to
              industry accolades, we take pride in our accomplishments.
            </p>

            <div className="mt-10 flex w-full max-w-[540px] flex-col gap-3 sm:flex-row">
              <div className="flex h-12 flex-1 items-center gap-3 rounded-xl border border-black/10 bg-white px-4 shadow-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-4 text-black/35"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  className="w-full bg-transparent text-sm text-black/80 outline-none placeholder:text-black/30"
                  placeholder="Input Placeholder"
                />
              </div>
              <button className="h-12 rounded-xl bg-[#2f6bff] px-6 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
                Find Now
              </button>
            </div>
          </div>
        </section>

        <section className="px-5 pb-10 md:px-10 lg:px-16 lg:pb-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_270px]">
            <div>
              <div className="mb-6 flex items-center gap-4">
                <h2 className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl md:leading-[1.05]">
                  Whiteboards are remarkable.
                </h2>
                <div className="hidden h-px flex-1 bg-black/10 md:block" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((card, index) => (
                  <article
                    key={index}
                    className="group relative overflow-hidden rounded-[24px] border border-black/6 bg-neutral-100 min-h-[420px]"
                  >
                    <img
                      src={card.image}
                      alt={card.title}
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    <div className="relative flex h-full flex-col justify-end p-5 text-white">
                      <span className="mb-4 inline-flex w-fit rounded-full bg-white px-3 py-1 text-sm font-medium text-black shadow-sm">
                        {card.tag}
                      </span>
                      <h3 className="text-[22px] font-semibold leading-[1.25] tracking-[-0.03em]">
                        {card.title}
                      </h3>
                      <p className="mt-3 line-clamp-4 text-[15px] leading-7 text-white/85">
                        {card.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <aside className="space-y-8">
              <SidebarSection title="Featured" posts={featuredPosts} />
              <SidebarSection title="Latest" posts={latestPosts} />
            </aside>
          </div>
        </section>
      </div>
      <div className="">
        {activeModel == "signup" ?
          <SignUpModal open={open} onClose={() => setIsOpen(false)} activeModal={setActiveModal}/>
          : <SignInModal open={open} onClose={() => setIsOpen(false)} activeModal={setActiveModal} />}
      </div>
    </main>
  );
}

type SidebarPost = {
  title: string;
  date: string;
  image: string;
};

function SidebarSection({
  title,
  posts,
}: {
  title: string;
  posts: SidebarPost[];
}) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-4">
        <h3 className="text-[22px] font-semibold tracking-[-0.03em]">{title}</h3>
        <div className="h-px flex-1 bg-black/10" />
      </div>

      <div className="space-y-5">
        {posts.map((post, index) => (
          <article key={index} className="flex gap-4">
            <img
              src={post.image}
              alt={post.title}
              className="h-24 w-24 shrink-0 rounded-2xl object-cover"
            />
            <div>
              <p className="text-sm text-black/40">{post.date}</p>
              <h4 className="mt-2 text-[18px] font-semibold leading-8 tracking-[-0.03em] text-black/90">
                {post.title}
              </h4>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
