import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import clsx from "clsx";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Registro de Abordados",
    description: "Gestão de abordados da empresa",
    manifest: "/manifest.json",
};

export const viewport: Viewport = {
    themeColor: "#ffffff",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Prevent zoom on inputs
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body className={clsx(inter.className, "antialiased bg-gray-50 min-h-screen")}>
                {children}
            </body>
        </html>
    );
}
