import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import clsx from "clsx";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Registro de Abordados",
    description: "Registro de abordados com foto, documentos e endereço",
    manifest: "/manifest.json",
    applicationName: "Registro de Abordados",
    appleWebApp: {
        capable: true,
        title: "Abordados",
        statusBarStyle: "default",
    },
    icons: {
        icon: "/icons/icon-192x192.png",
        apple: "/icons/apple-touch-icon.png",
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#2563eb" },
        { media: "(prefers-color-scheme: dark)", color: "#111827" },
    ],
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body className={clsx(inter.className, "antialiased bg-page text-fg min-h-screen")}>
                <ToastProvider>{children}</ToastProvider>
            </body>
        </html>
    );
}
