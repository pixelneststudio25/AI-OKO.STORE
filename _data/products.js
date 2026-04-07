// _data/products.js
const fs = require("fs");
const path = require("path");

// Where Decap stores the product markdown files
const productsDir = path.join(__dirname, "products");

// Helper to read and parse all .md files
function getAllProducts() {
  if (!fs.existsSync(productsDir)) return [];
  
  const files = fs.readdirSync(productsDir).filter(f => f.endsWith(".md"));
  const products = [];
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(productsDir, file), "utf8");
    // Very simple front‑matter parser (you can use gray-matter npm package)
    const match = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
    if (!match) continue;
    
    const frontMatter = match[1];
    const data = {};
    frontMatter.split("\n").forEach(line => {
      const [key, ...val] = line.split(":");
      if (key && val.length) data[key.trim()] = val.join(":").trim();
    });
    
    // Convert colors from YAML list (if string like "- red\n- blue")
    if (typeof data.colors === "string") {
      data.colors = data.colors.split("\n").map(c => c.replace(/^- /, "").trim());
    }
    
    // Generate ID from filename (without .md)
    const id = path.basename(file, ".md");
    
    // Generate SKU: category prefix + 4‑digit number based on creation order
    // For simplicity, we use the current index as number – you can make it more robust.
    // We'll assign SKU after sorting by creation date (optional)
    
    products.push({
      id,
      sku: "", // we'll fill later
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
  
  // Sort by filename to have a stable order, then assign SKU
  products.sort((a, b) => a.id.localeCompare(b.id));
  products.forEach((p, idx) => {
    // SKU = category prefix (first 3 letters) + 3‑digit number
    const catPrefix = p.category.substring(0, 3).toUpperCase();
    p.sku = `${catPrefix}-${String(idx + 1).padStart(3, "0")}`;
  });
  
  return products;
}

module.exports = getAllProducts();