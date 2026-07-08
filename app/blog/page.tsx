import Link from "next/link";
import { BlogImage } from "@/components/BlogImage";
import { blogPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog",
  description: "Guides and updates on UAE business setup, visa types, trade license renewal, document attestation, and PRO services."
};

export default function BlogPage() {
  const [featured, ...posts] = blogPosts;
  const categories = Array.from(new Set(blogPosts.map((post) => post.category)));
  return (
    <main className="bg-panel py-20">
      <div className="section-shell">
        <h1 className="font-heading text-4xl font-bold text-heading md:text-5xl">Business Setup & PRO Service Blog</h1>
        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input className="w-full rounded-md border border-edge bg-surface px-4 py-3 text-heading placeholder:text-muted md:max-w-md" placeholder="Search articles" />
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => <span key={category} className="rounded-md border border-edge bg-surface px-3 py-2 text-sm font-semibold text-heading">{category}</span>)}
          </div>
        </div>
        <Link href={`/blog/${featured.slug}`} className="glass-panel mt-10 grid overflow-hidden rounded-lg shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
          <div className="aspect-[2/1] lg:aspect-auto"><BlogImage index={0} title={featured.title} src={featured.image} /></div>
          <article className="p-8">
            <p className="text-sm font-semibold text-gold">{featured.category} · {featured.readTime}</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold leading-tight text-heading">{featured.title}</h2>
            <p className="mt-4 leading-7 text-body">{featured.excerpt}</p>
          </article>
        </Link>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="glass-panel overflow-hidden rounded-lg transition hover:-translate-y-1 hover:shadow-soft">
              <div className="aspect-[2/1]"><BlogImage index={index + 1} title={post.title} src={post.image} /></div>
              <article className="p-6">
                <p className="text-xs font-semibold uppercase text-gold">{post.category} · {post.readTime}</p>
                <h2 className="mt-3 text-xl font-semibold leading-7 text-heading">{post.title}</h2>
                <p className="mt-3 text-sm leading-6 text-body">{post.excerpt}</p>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
