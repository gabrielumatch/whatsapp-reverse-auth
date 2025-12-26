import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IconBrandGithub, IconMessage2 } from "@tabler/icons-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <IconMessage2 className="h-6 w-6 mr-2" />
          <span className="font-bold">WhatsApp Auth</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/auth/login">
            Login
          </Link>
          <Button asChild variant="outline" size="sm">
            <a href="https://github.com/gabrielumatch/whatsapp-reverse-auth" target="_blank" rel="noopener noreferrer">
              <IconBrandGithub className="h-4 w-4 mr-2" />
              Github
            </a>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Secure Phone Verification via WhatsApp
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  The free, open-source alternative to expensive SMS OTP. High reliability, zero per-message cost, and global reach.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild size="lg">
                  <Link href="/auth/login">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/api-docs">API Documentation</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2025 WhatsApp Reverse Auth. MIT License.
        </p>
      </footer>
    </div>
  );
}