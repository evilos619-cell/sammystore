import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/sections/PageHero";
import { Loader2, ShoppingCart } from "lucide-react";

type Product = { id: string; title: string; price: number; stock: number; description: string | null; image_url: string | null; slug: string; currency: string };

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    if (!categorySlug) return;
    supabase
      .from("product_categories")
      .select("id, name")
      .eq("slug", categorySlug)
      .single()
      .then(({ data: cat }) => {
        if (!cat) return;
        setCategoryName(cat.name);
        supabase
          .from("products")
          .select("id, title, price, stock, description, image_url, slug, currency")
          .eq("published", true)
          .eq("category_id", cat.id)
          .order("price")
          .then(({ data }) => {
            setProducts((data as Product[]) ?? []);
            setLoading(false);
          });
      });
  }, [categorySlug]);

  return (
    <>
      <PageHero
        title={categoryName || "Category"}
        subtitle="Browse available products"
        breadcrumbs={[{ name: "Products", href: "/products" }, { name: categoryName }]}
      />
      <section className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
          </div>
        ) : products.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No products in this category yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <Card key={p.id} className="hover:shadow-lg transition-all border hover:border-brand-orange/30">
                <CardContent className="p-5 flex flex-col h-full">
                  {p.image_url && (
                    <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-muted">
                      <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-brand-navy text-sm">{p.title}</h4>
                      <Badge className={p.stock > 0 ? "bg-green-100 text-green-700 text-xs" : "bg-red-100 text-red-500 text-xs"}>
                        {p.stock > 0 ? `${p.stock} left` : "Sold out"}
                      </Badge>
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.description}</p>}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="text-lg font-bold text-brand-navy">₦{Number(p.price).toLocaleString()}</div>
                    <Button
                      size="sm"
                      disabled={p.stock === 0}
                      onClick={() => {
                        if (!user) { navigate("/auth?redirect=/products/" + categorySlug); return; }
                      }}
                      className="bg-brand-orange hover:bg-brand-orange-hover text-white text-xs"
                    >
                      {p.stock === 0 ? "Out of stock" : "Buy Now"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
