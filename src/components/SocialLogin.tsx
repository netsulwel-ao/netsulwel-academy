"use client";

import { GoogleIcon, GithubIcon } from "@/components/ui/AuthIcons";

interface SocialLoginProps {
  loading: boolean;
  handleSocialLogin: (provider: "google" | "github") => void;
  providerLoading: string | null;
  view: string;
}

export default function SocialLogin({ loading, handleSocialLogin, providerLoading, view }: SocialLoginProps) {
  if (view === "forgot") return null;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mt-8 mb-6 flex items-center relative z-10">
        <div className="w-full border-t border-gray-800"></div>
        <div className="px-4 text-xs font-medium text-gray-500 whitespace-nowrap">Ou com Google / GitHub</div>
        <div className="w-full border-t border-gray-800"></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={loading || providerLoading === "Google"}
          onClick={() => handleSocialLogin("google")}
          className="flex items-center justify-center gap-2 py-2.5 border border-gray-700 bg-gray-900/50 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {providerLoading === "Google" ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
          ) : (
            <GoogleIcon className="h-5 w-5" />
          )}
          Google
        </button>
        <button
          type="button"
          disabled={loading || providerLoading === "GitHub"}
          onClick={() => handleSocialLogin("github")}
          className="flex items-center justify-center gap-2 py-2.5 border border-gray-700 bg-gray-900/50 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {providerLoading === "GitHub" ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
          ) : (
            <GithubIcon className="h-5 w-5" />
          )}
          GitHub
        </button>
      </div>
    </div>
  );
}
