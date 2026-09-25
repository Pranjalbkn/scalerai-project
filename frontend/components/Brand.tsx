import Link from "next/link";

export default function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Stayly home">
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M20 5c-3 0-4.9 3.7-6.7 8.3L8.1 26.5C6.7 30 8.2 33 11 33c3.1 0 5.9-3.7 9-8.2 3.1 4.5 5.9 8.2 9 8.2 2.8 0 4.3-3 2.9-6.5l-5.2-13.2C24.9 8.7 23 5 20 5Zm0 19.8c-2-3-3.7-6.1-3.7-8.1 0-2.2 1.5-3.7 3.7-3.7s3.7 1.5 3.7 3.7c0 2-1.7 5.1-3.7 8.1Z" />
      </svg>
      <span>stayly</span>
    </Link>
  );
}

