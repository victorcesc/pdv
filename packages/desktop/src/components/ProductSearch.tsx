import { useState, useEffect } from "react";
import { searchProducts } from "../services/api";
import type { Product, ProductSearchProps } from "../types";
import "../styles/components.css";

export default function ProductSearch({ onSelectProduct }: ProductSearchProps) {
  const [query, setQuery] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (query.length >= 2) {
      setLoading(true);
      searchProducts(query)
        .then((results: Product[]) => {
          setProducts(results);
          setLoading(false);
        })
        .catch((error: unknown) => {
          console.error("Error searching products:", error);
          setLoading(false);
        });
    } else {
      setProducts([]);
    }
  }, [query]);

  return (
    <div className="search-container">
      <input
        type="text"
        className="search-input"
        placeholder="Buscar produto por nome ou código..."
        value={query}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setQuery(e.target.value)
        }
      />
      {loading && <p className="loading-text">Buscando...</p>}
      <div className="search-results">
        {products.map((product: Product) => (
          <div
            key={product.id}
            onClick={() => onSelectProduct(product)}
            className="search-result-item"
          >
            <strong>{product.name}</strong> - R$ {product.price.toFixed(2)}
            <br />
            <small>Código: {product.code}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
