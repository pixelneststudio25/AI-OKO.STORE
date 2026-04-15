// src/_data/products.js
const fs = require("fs");
const path = require("path");

// Where Decap stores the product markdown files
const productsDir = path.join(__dirname, "products");

// Helper to read and parse all .md files
function getAllProducts() {
  // If the products folder doesn't exist yet, return an empty array
  if (!fs.existsSync(productsDir)) return [];
  
  const files = fs.readdirSync(productsDir).filter(f => f.endsWith(".md"));
  const products = [];
  
  for (const file of files) {
    const filePath = path.join(productsDir, file);
    const content = fs.readFileSync(filePath, "utf8");
    
    // Simple front-matter parser (you can use `gray-matter` npm package for a more robust solution)
    const match = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
    if (!match) continue;
    
    const frontMatter = match[1];
    const data = {};
    frontMatter.split("\n").forEach(line => {
      const [key, ...val] = line.split(":");
      if (key && val.length) data[key.trim()] = val.join(":").trim();
    });
    
    // Convert colors from YAML list (if it's a string like "- red\n- blue")
    if (typeof data.colors === "string") {
      data.colors = data.colors.split("\n").map(c => c.replace(/^- /, "").trim());
    }
    
    // Use the filename (without .md) as the product ID
    const id = path.basename(file, ".md");
    
    products.push({
      id: id,
      sku: "", // We'll generate this later
      name: data.name,
      price: parseInt(data.price, 10),
      image: data.image,
      category: data.category,
      subcategory: data.subcategory || "",
      colors: data.colors || [],
      description: data.description || "",
      size: data.size || "6 yards"
    });
  }
  
  // Sort products by ID to have a stable order, then generate SKUs
  products.sort((a, b) => a.id.localeCompare(b.id));
  products.forEach((p, idx) => {
    // Generate SKU: category prefix + 4-digit number
    const catPrefix = p.category.substring(0, 3).toUpperCase();
    p.sku = `${catPrefix}-${String(idx + 1).padStart(4, "0")}`;
  });
  
  return products;
}

module.exports = getAllProducts();
