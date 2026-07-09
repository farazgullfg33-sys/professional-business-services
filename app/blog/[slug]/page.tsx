import { notFound } from "next/navigation";
import { BlogImage } from "@/components/BlogImage";
import { Reveal } from "@/components/motion/MotionScenes";
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
    <main className="bg-base py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <article className="section-shell max-w-4xl">
        <Reveal>
          <p className="text-sm font-semibold text-gold">{post.category} · {post.readTime}</p>
          <h1 className="mt-3 font-heading text-4xl font-bold leading-tight text-heading md:text-5xl">{post.title}</h1>
          <p className="mt-5 text-lg leading-8 text-body">{post.excerpt}</p>
        </Reveal>
        <Reveal delay={0.1} className="mt-8 aspect-[2/1] overflow-hidden rounded-lg shadow-soft">
          <BlogImage index={blogPosts.indexOf(post)} title={post.title} src={post.image} />
        </Reveal>
        <p className="mt-3 text-sm text-muted">Featured image: {post.imageDescription}</p>
        <Reveal delay={0.15} className="prose prose-invert mt-10 max-w-none prose-headings:font-heading prose-headings:text-heading prose-p:text-body prose-a:text-gold">
          {post.content.split("\n").map((line, index) => {
            if (line.startsWith("# ")) return <h2 key={index}>{line.replace("# ", "")}</h2>;
            if (line.startsWith("## ")) return <h2 key={index}>{line.replace("## ", "")}</h2>;
            if (line.startsWith("### ")) return <h3 key={index}>{line.replace("### ", "")}</h3>;
            if (!line.trim()) return null;
            return <p key={index}>{line}</p>;
          })}
        </Reveal>
      </article>
    </main>
  );
}
