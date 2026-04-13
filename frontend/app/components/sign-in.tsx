import { Dispatch, SetStateAction } from "react";

export function SignUpModal({ open = true, onClose,activeModal }: { open?: boolean; onClose?: () => void ,activeModal:Dispatch<SetStateAction<"signup" | "signin">>}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center  px-4 py-4 sm:items-center">
      <div
        onClick={onClose} className="absolute w-screen h-screen bg-black/30 z-20 "></div>
      <div className="relative w-full max-w-[800px] z-50  rounded-[6px] bg-white px-6 shadow-2xl sm:px-12 sm:py-10 md:px-16 ">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-4xl leading-none text-black/50 transition hover:text-black"
          aria-label="Close modal"
        >
          ×
        </button>

        <div className="mx-auto flex max-w-[450px] flex-col items-center text-center">
          <div className="mb-8 text-black">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-10 w-10"
            >
              <path d="M22 6 12 13 2 6" />
              <path d="M4 19h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" />
              <path d="m2 8 7.2 5.4a4.8 4.8 0 0 0 5.6 0L22 8" />
            </svg>
          </div>

          <h2 className="font-serif text-[34px] leading-tight tracking-[-0.03em] text-black sm:text-[48px]">
            Sign up with email
          </h2>

          <form className="mt-4 w-full text-left">
            <div>
              <label className="mb-3 block text-[18px] font-medium text-black" htmlFor="fullName">
                Your full name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                className="h-14 w-full rounded-[4px] border border-black/60 px-4 text-[16px] text-black outline-none transition placeholder:text-black/45 focus:border-black"
              />
            </div>

            <div className="mt-6">
              <label className="mb-3 block text-[18px] font-medium text-black" htmlFor="email">
                Your email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                className="h-14 w-full rounded-[4px] border border-black/60 px-4 text-[16px] text-black outline-none transition placeholder:text-black/45 focus:border-black"
              />
            </div>
            <div className="mt-6">
              <label className="mb-3 block text-[18px] font-medium text-black" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="text"
                placeholder="Enter your password"
                className="h-14 w-full rounded-[4px] border border-black/60 px-4 text-[16px] text-black outline-none transition placeholder:text-black/45 focus:border-black"
              />
            </div>
            {/* <label className="mt-8 flex items-center justify-center gap-3 text-[17px] text-black sm:text-[18px]">
              <input type="checkbox" defaultChecked className="h-5 w-5 accent-black" />
              <span>Remember me for faster sign in</span>
            </label> */}

            <div className="mt-8 flex justify-center">
              <button className="rounded-xl bg-[#2f6bff] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
                Create Account
              </button>
            </div>

            <p className="mt-8 text-center text-[18px] text-black">
              Already have an account?{' '}
              <a href="#" onClick={()=>activeModal("signin")} className="underline underline-offset-2">
                Sign in
              </a>
            </p>


          </form>
        </div>
      </div>
    </div>
  );
}

export function SignInModal({ open = true, onClose,activeModal }: { open?: boolean; onClose?: () => void,activeModal:Dispatch<SetStateAction<"signup" | "signin">>}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center  px-4 py-4 sm:items-center">
      <div onClick={onClose} className="absolute w-screen h-screen bg-black/30 z-20 "></div>
      <div className="relative w-full max-w-[800px] z-30  rounded-[6px] bg-white px-6 shadow-2xl sm:px-12 sm:py-10 md:px-16 ">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-4xl leading-none text-black/50 transition hover:text-black"
          aria-label="Close modal"
        >
          ×
        </button>

        <div className="mx-auto flex max-w-[450px] flex-col items-center text-center">
          <div className="mb-8 text-black">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-10 w-10"
            >
              <path d="M22 6 12 13 2 6" />
              <path d="M4 19h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" />
              <path d="m2 8 7.2 5.4a4.8 4.8 0 0 0 5.6 0L22 8" />
            </svg>
          </div>

          <h2 className="font-serif text-[34px] leading-tight tracking-[-0.03em] text-black sm:text-[48px]">
            Sign up with email
          </h2>

          <form className="mt-4 w-full text-left">

            <div className="mt-6">
              <label className="mb-3 block text-[18px] font-medium text-black" htmlFor="email">
                Your email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                className="h-14 w-full rounded-[4px] border border-black/60 px-4 text-[16px] text-black outline-none transition placeholder:text-black/45 focus:border-black"
              />
            </div>
            <div className="mt-6">
              <label className="mb-3 block text-[18px] font-medium text-black" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="text"
                placeholder="Enter your password"
                className="h-14 w-full rounded-[4px] border border-black/60 px-4 text-[16px] text-black outline-none transition placeholder:text-black/45 focus:border-black"
              />
            </div>
            {/* <label className="mt-8 flex items-center justify-center gap-3 text-[17px] text-black sm:text-[18px]">
              <input type="checkbox" defaultChecked className="h-5 w-5 accent-black" />
              <span>Remember me for faster sign in</span>
            </label> */}

            <div className="mt-12 flex justify-center">
              <button className="rounded-xl bg-[#2f6bff] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
               Continue
              </button>
            </div>

            <p className="mt-8 text-center text-[18px] text-black">
             Create a new account?{' '}
              <a href="#" onClick={()=>{activeModal("signup")}} className="underline underline-offset-2">
                Sign up
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

