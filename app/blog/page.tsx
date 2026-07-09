import Link from "next/link";
import { BlogImage } from "@/components/BlogImage";
import { Reveal } from "@/components/motion/MotionScenes";
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
        <Reveal>
          <h1 className="font-heading text-4xl font-bold text-heading md:text-5xl">Business Setup & PRO Service Blog</h1>
        </Reveal>
        <Reveal delay={0.08} className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input className="w-full rounded-md border border-edge bg-surface px-4 py-3 text-heading placeholder:text-muted transition-all duration-300 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 md:max-w-md" placeholder="Search articles" />
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => <span key={category} className="rounded-md border border-edge bg-surface px-3 py-2 text-sm font-semibold text-heading transition-colors duration-300 hover:border-gold hover:text-gold">{category}</span>)}
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <Link href={`/blog/${featured.slug}`} className="glass-panel mt-10 grid overflow-hidden rounded-lg shadow-soft transition-shadow duration-300 hover:shadow-gold lg:grid-cols-[1.1fr_0.9fr]">
            <div className="aspect-[2/1] lg:aspect-auto"><BlogImage index={0} title={featured.title} src={featured.image} /></div>
            <article className="p-8">
              <p className="text-sm font-semibold text-gold">{featured.category} · {featured.readTime}</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold leading-tight text-heading">{featured.title}</h2>
              <p className="mt-4 leading-7 text-body">{featured.excerpt}</p>
            </article>
          </Link>
        </Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <Reveal key={post.slug} delay={Math.min(index, 8) * 0.06}>
              <Link href={`/blog/${post.slug}`} className="glass-panel block overflow-hidden rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-gold">
                <div className="aspect-[2/1]"><BlogImage index={index + 1} title={post.title} src={post.image} /></div>
                <article className="p-6">
                  <p className="text-xs font-semibold uppercase text-gold">{post.category} · {post.readTime}</p>
                  <h2 className="mt-3 text-xl font-semibold leading-7 text-heading">{post.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-body">{post.excerpt}</p>
                </article>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </main>
  );
}
