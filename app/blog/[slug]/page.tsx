import { notFound } from "next/navigation";
import { BlogImage } from "@/components/BlogImage";
import { blogPosts, getBlogPost } from "@/lib/blog";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) return {};
  return {
    title: post.seoTitle,
    description: post.meta
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    author: { "@type": "Organization", name: "Professional Business Services" },
    description: post.meta,
    keywords: [post.primaryKeyword, ...post.secondary].join(", ")
  };
  return (
    <main className="bg-white py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <article className="section-shell max-w-4xl">
        <p className="text-sm font-semibold text-gold">{post.category} · {post.readTime}</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-navy md:text-5xl">{post.title}</h1>
        <p className="mt-5 text-lg leading-8 text-ink/70">{post.excerpt}</p>
        <div className="mt-8 aspect-[2/1] overflow-hidden rounded-lg shadow-soft"><BlogImage index={blogPosts.indexOf(post)} title={post.title} src={post.image} /></div>
        <p className="mt-3 text-sm text-ink/55">Featured image: {post.imageDescription}</p>
        <div className="prose prose-slate mt-10 max-w-none prose-headings:text-navy prose-a:text-gold">
          {post.content.split("\n").map((line, index) => {
            if (line.startsWith("# ")) return <h2 key={index}>{line.replace("# ", "")}</h2>;
            if (line.startsWith("## ")) return <h2 key={index}>{line.replace("## ", "")}</h2>;
            if (line.startsWith("### ")) return <h3 key={index}>{line.replace("### ", "")}</h3>;
            if (!line.trim()) return null;
            return <p key={index}>{line}</p>;
          })}
        </div>
      </article>
    </main>
  );
}
