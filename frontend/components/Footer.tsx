import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid page-shell">
        <div><h4>Support</h4><a href="#">Help Centre</a><a href="#">Cancellation options</a><a href="#">Safety information</a></div>
        <div><h4>Hosting</h4><Link href="/host">Manage your homes</Link><a href="#">Hosting resources</a><a href="#">Community forum</a></div>
        <div><h4>Stayly</h4><a href="#">About</a><a href="#">Careers</a><a href="#">Gift cards</a></div>
      </div>
      <div className="footer-bottom page-shell"><span>© 2026 Stayly, Inc.</span><span>Privacy · Terms · Sitemap</span><span>English (IN) · $ USD</span></div>
    </footer>
  );
}

