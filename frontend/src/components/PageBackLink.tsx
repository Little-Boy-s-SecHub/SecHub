import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PageBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="page-back-link">
      <ArrowLeft size={16} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
