import Link from "next/link";
import { BlogImage } from "@/components/BlogImage";
import { blogPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog"
};

export default function BlogPage() {
  const [featured, ...posts] = blogPosts;
  const categories = Array.from(new Set(blogPosts.map((post) => post.category)));
  return (
    <main className="bg-mist py-20">
      <div className="section-shell">
        <h1 className="text-4xl font-bold text-navy md:text-5xl">Business Setup & PRO Service Blog</h1>
        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input className="w-full rounded-md border border-navy/15 bg-white px-4 py-3 md:max-w-md" placeholder="Search articles" />
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => <span key={category} className="rounded-md border border-navy/10 bg-white px-3 py-2 text-sm font-semibold text-navy">{category}</span>)}
          </div>
        </div>
        <Link href={`/blog/${featured.slug}`} className="mt-10 grid overflow-hidden rounded-lg bg-white shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
          <div className="aspect-[2/1] lg:aspect-auto"><BlogImage index={0} title={featured.title} src={featured.image} /></div>
          <article className="p-8">
            <p className="text-sm font-semibold text-gold">{featured.category} · {featured.readTime}</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-navy">{featured.title}</h2>
            <p className="mt-4 leading-7 text-ink/70">{featured.excerpt}</p>
          </article>
        </Link>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="overflow-hidden rounded-lg bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
              <div className="aspect-[2/1]"><BlogImage index={index + 1} title={post.title} src={post.image} /></div>
              <article className="p-6">
                <p className="text-xs font-semibold uppercase text-gold">{post.category} · {post.readTime}</p>
                <h2 className="mt-3 text-xl font-semibold leading-7 text-navy">{post.title}</h2>
                <p className="mt-3 text-sm leading-6 text-ink/65">{post.excerpt}</p>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
