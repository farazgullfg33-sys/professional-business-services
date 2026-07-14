import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog";

const baseUrl = "https://professionalbusines.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/about",
    "/services",
    "/ceo-message",
    "/contact",
    "/quote",
    "/faq",
    "/blog",
    "/privacy-policy",
    "/terms-and-conditions"
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7
  }));

  const blogRoutes = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6
  }));

  return [...staticRoutes, ...blogRoutes];
}
