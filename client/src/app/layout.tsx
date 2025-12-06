import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AskMyPDF - AI Document Q&A',
  description: 'Ask questions about your PDF documents using AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

